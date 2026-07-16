import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { expressShippingAud } from '../lib/shippingPolicy';
import { ArrowLeft } from 'lucide-react';
import Section from '../components/layout/Section';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import BankTransferModal from '../components/checkout/BankTransferModal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  validateDiscountCode,
  type DiscountValidation,
} from '../services/discountService';
import CheckoutContactForm from '../components/checkout/CheckoutContactForm';
import CheckoutShippingForm from '../components/checkout/CheckoutShippingForm';
import CheckoutPaymentMethod from '../components/checkout/CheckoutPaymentMethod';
import CheckoutDiscountCode from '../components/checkout/CheckoutDiscountCode';
import CheckoutOrderSummary from '../components/checkout/CheckoutOrderSummary';
import {
  initialShippingFormData,
  type FieldErrors,
  type ShippingFormData,
} from '../features/checkout/checkoutForm';
import { useCheckoutSubmit } from '../features/checkout/useCheckoutSubmit';

export default function Checkout() {
  useDocumentTitle(
    'Checkout',
    'Securely complete your order. Bank transfer instructions are emailed immediately after order confirmation.'
  );
  const { state, clearCart, addItem } = useCart();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<ShippingFormData>(initialShippingFormData);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [discountInput, setDiscountInput] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidation | null>(null);

  const discountAmount = appliedDiscount?.discount_amount ?? 0;

  const {
    isSubmitting,
    bankTransferModalOpen,
    currentOrderReference,
    currentTotalAmount,
    handleSubmit,
    handleCloseBankTransferModal,
  } = useCheckoutSubmit({
    state,
    formData,
    appliedDiscount,
    discountAmount,
    setFieldErrors,
    showToast,
    clearCart,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof ShippingFormData]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof ShippingFormData];
        return next;
      });
    }
  };

  const handleApplyDiscount = async () => {
    const code = discountInput.trim();
    if (!code) return;
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const result = await validateDiscountCode(code, state.total);
      if (result.valid) {
        setAppliedDiscount(result);
        setDiscountError('');
        showToast(`Discount code "${result.code}" applied!`, 'success');
      } else {
        setDiscountError(result.error || 'Invalid code');
        setAppliedDiscount(null);
      }
    } catch {
      setDiscountError('Could not validate code');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput('');
    setDiscountError('');
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen">
        <Section background="white" spacing="xl">
          <div className="max-w-2xl mx-auto text-center">
            <Heading level={3} className="mb-3">
              Your cart is empty
            </Heading>
            <Text variant="small" muted className="mb-8">
              Add items to your cart before checking out.
            </Text>
            <Link to="/library">
              <Button variant="primary" size="lg">
                Browse library
              </Button>
            </Link>
          </div>
        </Section>
      </div>
    );
  }

  const shipping = expressShippingAud(state.total);

  return (
    <div className="min-h-screen bg-platinum overscroll-contain">
      <Section background="white" spacing="lg">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-sm text-carbon-900 hover:text-carbon-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to cart
            </Link>
            <Heading level={3}>Checkout</Heading>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
              <div className="space-y-6 lg:col-span-2">
                <CheckoutContactForm
                  formData={formData}
                  fieldErrors={fieldErrors}
                  isSubmitting={isSubmitting}
                  onChange={handleChange}
                />
                <CheckoutShippingForm
                  formData={formData}
                  fieldErrors={fieldErrors}
                  isSubmitting={isSubmitting}
                  onChange={handleChange}
                />
                <CheckoutPaymentMethod />
                <CheckoutDiscountCode
                  appliedDiscount={appliedDiscount}
                  discountAmount={discountAmount}
                  discountInput={discountInput}
                  discountError={discountError}
                  discountLoading={discountLoading}
                  isSubmitting={isSubmitting}
                  onInputChange={(value) => {
                    setDiscountInput(value);
                    if (discountError) setDiscountError('');
                  }}
                  onApply={() => void handleApplyDiscount()}
                  onRemove={handleRemoveDiscount}
                />
              </div>

              <div className="lg:col-span-1">
                <CheckoutOrderSummary
                  state={state}
                  shipping={shipping}
                  discountAmount={discountAmount}
                  discountCode={appliedDiscount?.code}
                  onRemoveDiscount={appliedDiscount ? handleRemoveDiscount : undefined}
                  isSubmitting={isSubmitting}
                  addItem={addItem}
                />
              </div>
            </div>
          </form>

          <BankTransferModal
            open={bankTransferModalOpen}
            orderReference={currentOrderReference}
            totalAmount={currentTotalAmount}
            currency="AUD"
            onClose={handleCloseBankTransferModal}
          />
        </div>
      </Section>
    </div>
  );
}
