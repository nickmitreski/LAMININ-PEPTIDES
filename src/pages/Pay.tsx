import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Section from '../components/layout/Section';
import { Heading, Text } from '../components/ui/Typography';
import Button from '../components/ui/Button';
import CoreForgeEmbedModal from '../components/checkout/CoreForgeEmbedModal';
import { coreForgeEmbedIframeSrc, getCoreForgePayOrigin } from '../constants/coreforgePay';
import { useToast } from '../context/ToastContext';

/**
 * CoreForge embedded checkout in a full-screen modal. SMS “parent” links use `/pay?pid=…&ref=…`.
 */
export default function Pay() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const pid = (searchParams.get('pid') ?? '').trim();
  const orderRef = (searchParams.get('ref') ?? '').trim();

  const origin = getCoreForgePayOrigin();
  const iframeSrc = useMemo(() => (pid ? coreForgeEmbedIframeSrc(pid) : null), [pid]);

  const clearQuery = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleClose = useCallback(() => {
    clearQuery();
    navigate('/', { replace: true });
  }, [clearQuery, navigate]);

  const handleSuccess = useCallback(() => {
    clearQuery();
    showToast('Payment completed. Thank you.', 'success', 5000);
    if (orderRef) {
      navigate(`/order-confirmation?order_id=${encodeURIComponent(orderRef)}&pending_payment=1`, {
        replace: true,
      });
    } else {
      navigate('/', { replace: true });
    }
  }, [clearQuery, navigate, orderRef, showToast]);

  if (!origin) {
    return (
      <Section background="white" spacing="lg">
        <div className="mx-auto max-w-lg text-center">
          <Heading level={3} className="mb-3">
            Payment unavailable
          </Heading>
          <Text variant="small" muted className="mb-6">
            This site is not configured for embedded checkout. Set{' '}
            <span className="font-mono text-carbon-900">VITE_COREFORGE_PAY_ORIGIN</span> to your
            CoreForge pay app URL (https only).
          </Text>
          <Button variant="primary" size="lg" className="min-h-12 touch-manipulation" onClick={() => navigate('/')}>
            Back to home
          </Button>
        </div>
      </Section>
    );
  }

  if (!pid || !iframeSrc) {
    return (
      <Section background="white" spacing="lg">
        <div className="mx-auto max-w-lg text-center">
          <Heading level={3} className="mb-3">
            Invalid payment link
          </Heading>
          <Text variant="small" muted className="mb-6">
            Open the payment link from your SMS or email, or return to checkout to try again.
          </Text>
          <Button
            variant="primary"
            size="lg"
            className="min-h-12 touch-manipulation"
            onClick={() => navigate('/checkout')}
          >
            Go to checkout
          </Button>
        </div>
      </Section>
    );
  }

  return <CoreForgeEmbedModal open iframeSrc={iframeSrc} onClose={handleClose} onPaymentSuccess={handleSuccess} />;
}
