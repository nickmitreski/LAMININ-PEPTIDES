import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { expressShippingAud } from '../../lib/shippingPolicy';
import { supabase } from '../../lib/supabase';
import {
  markPaymentInstructionsViewed,
} from '../../services/bankTransferPayment';
import { createCheckoutOrder } from '../../services/checkoutService';
import { sendOrderEmail } from '../../services/emailService';
import { formatPrice } from '../../lib/formatCurrency';
import {
  redeemDiscountCode,
  type DiscountValidation,
} from '../../services/discountService';
import {
  generateOrderReference,
  validateCheckoutForm,
  type FieldErrors,
  type ShippingFormData,
} from './checkoutForm';
import { markCheckoutComplete, resetCheckoutComplete, trackEvent } from '../../lib/analytics';
import { createLogger } from '../../lib/logger';
import type { CartState } from '../../types/cart';
import { toCheckoutCartItems } from './checkoutPayload';

const log = createLogger('checkout');

type ToastFn = (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;

type UseCheckoutSubmitArgs = {
  state: CartState;
  formData: ShippingFormData;
  appliedDiscount: DiscountValidation | null;
  discountAmount: number;
  setFieldErrors: (errors: FieldErrors) => void;
  showToast: ToastFn;
  clearCart: () => void;
};

type UseCheckoutSubmitResult = {
  isSubmitting: boolean;
  bankTransferModalOpen: boolean;
  currentOrderReference: string;
  currentTotalAmount: number;
  handleSubmit: (e: FormEvent) => Promise<void>;
  handleCloseBankTransferModal: () => void;
  clearCart: () => void;
};

export function useCheckoutSubmit({
  state,
  formData,
  appliedDiscount,
  discountAmount,
  setFieldErrors,
  showToast,
  clearCart,
}: UseCheckoutSubmitArgs): UseCheckoutSubmitResult {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentOrderReference, setCurrentOrderReference] = useState('');
  const [currentTotalAmount, setCurrentTotalAmount] = useState(0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting || modalOpen) return;
    resetCheckoutComplete();
    trackEvent({
      event_name: 'checkout_submit',
      cart_item_count: state.itemCount,
      cart_total: state.total,
    });

    const errors = validateCheckoutForm(formData);
    if (Object.keys(errors).length > 0) {
      trackEvent({
        event_name: 'checkout_validation_failed',
        cart_item_count: state.itemCount,
        cart_total: state.total,
        metadata: { fields: Object.keys(errors) },
      });
      setFieldErrors(errors);
      showToast('Please fix the highlighted fields.', 'error', 4000);
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorField);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => el.focus({ preventScroll: true }), 250);
      }
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);

    try {
      const shipping = expressShippingAud(state.total);
      const grandTotal = state.total + shipping - discountAmount;
      const orderRef = generateOrderReference();
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }
      const idempotencyKey = idempotencyKeyRef.current;

      if (appliedDiscount?.valid && appliedDiscount.discount_code_id) {
        const redeemResult = await redeemDiscountCode({
          discountCodeId: appliedDiscount.discount_code_id,
          orderReference: orderRef,
          customerEmail: formData.email.trim() || undefined,
          discountAmount,
        });
        if (!redeemResult.success) {
          throw new Error(
            `Discount code could not be applied: ${redeemResult.error || 'unknown error'}. Please try again or remove the discount.`
          );
        }
      }

      const result = await createCheckoutOrder({
        orderReference: orderRef,
        customerEmail: formData.email.trim() || '',
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerPhone: formData.phone.trim(),
        customerAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
          country: formData.country,
        },
        cartItems: toCheckoutCartItems(state.items),
        subtotal: state.total,
        shipping,
        tax: 0,
        totalAmount: grandTotal,
        currency: 'AUD',
        discountCode: appliedDiscount?.valid ? appliedDiscount.code : null,
        discountAmount: discountAmount > 0 ? discountAmount : 0,
        idempotencyKey,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      const server = result.serverTotals;
      let authoritativeTotal = grandTotal;
      if (server?.available && typeof server.serverTotal === 'number') {
        authoritativeTotal = server.serverTotal;
        if (server.tamperDetected) {
          log.warn('server total differed from client total', {
            client: grandTotal,
            server: server.serverTotal,
          });
          showToast(
            `Your order total was updated to ${formatPrice(server.serverTotal)} based on current pricing.`,
            'info',
            5000
          );
        }
      }

      if (supabase && formData.email.trim()) {
        try {
          const { error } = await supabase.rpc('upsert_checkout_customer', {
            p_email: formData.email.trim(),
            p_first_name: formData.firstName.trim(),
            p_last_name: formData.lastName.trim(),
            p_phone: formData.phone.trim(),
            p_address: formData.address,
            p_city: formData.city,
            p_state: formData.state,
            p_postcode: formData.postcode,
            p_country: formData.country,
            p_order_total: authoritativeTotal,
          });
          if (error) log.error('customer upsert failed', error);
        } catch (err) {
          log.error('customer upsert exception', err);
        }
      }

      markPaymentInstructionsViewed(orderRef).catch((err) =>
        log.error('mark instructions viewed failed', err)
      );

      sendOrderEmail({
        orderReference: orderRef,
        customerEmail: formData.email.trim() || undefined,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerPhone: formData.phone.trim(),
        totalAmount: authoritativeTotal,
        currency: 'AUD',
      }).catch((err) => log.error('post-checkout notifications failed', err));

      setCurrentOrderReference(orderRef);
      setCurrentTotalAmount(authoritativeTotal);
      setModalOpen(true);
      markCheckoutComplete();
      trackEvent({
        event_name: 'checkout_success',
        cart_item_count: state.itemCount,
        cart_total: authoritativeTotal,
        metadata: { order_reference: orderRef },
      });
      idempotencyKeyRef.current = null;

      showToast(
        formData.email.trim()
          ? 'Order created! Check your email for payment instructions.'
          : 'Order created! Save your order reference and complete payment using the instructions below.',
        'success',
        6000
      );
    } catch (err) {
      log.error('checkout failed', err);
      trackEvent({
        event_name: 'checkout_error',
        cart_item_count: state.itemCount,
        cart_total: state.total,
        metadata: {
          message: err instanceof Error ? err.message : 'Unknown checkout error',
        },
      });
      showToast(
        err instanceof Error ? err.message : 'Failed to create order. Please try again.',
        'error',
        6000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseBankTransferModal = () => {
    setModalOpen(false);
    clearCart();
    navigate(`/order-confirmation?ref=${currentOrderReference}&status=pending_payment`);
  };

  return {
    isSubmitting,
    bankTransferModalOpen: modalOpen,
    currentOrderReference,
    currentTotalAmount,
    handleSubmit,
    handleCloseBankTransferModal,
    clearCart,
  };
}
