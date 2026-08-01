import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Trash2, FileText } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../context/ToastContext';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import {
  validateAdminOrderLines,
  type AdminOrderLineDraft,
} from '../features/admin/orders/orderLineEditor';
import { createAdminInvoice } from '../services/ordersService';
import { sendOrderEmail } from '../services/emailService';
import { formatPrice } from '../lib/formatCurrency';
import AdminNavigation from '../components/admin/AdminNavigation';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { Heading, Text } from '../components/ui/Typography';

function emptyLine(): AdminOrderLineDraft {
  return {
    id: '',
    name: '',
    quantity: 1,
    unitPrice: 0,
    note: '',
    lineType: 'custom',
  };
}

export default function AdminCreateInvoice() {
  useDocumentTitle('Create invoice', 'Invoice a customer for custom or catalogue products.');
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shipping, setShipping] = useState('0');
  const [note, setNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [drafts, setDrafts] = useState<AdminOrderLineDraft[]>([emptyLine()]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const validation = useMemo(() => validateAdminOrderLines(drafts), [drafts]);
  const subtotal = validation.ok ? validation.subtotal : 0;
  const shippingNum = Number(shipping) || 0;
  const estimatedTotal = Math.round((subtotal + shippingNum) * 100) / 100;

  const updateDraft = <K extends keyof AdminOrderLineDraft>(
    index: number,
    key: K,
    value: AdminOrderLineDraft[K]
  ) => {
    setDrafts((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [key]: value } : line
      )
    );
  };

  const handleSubmit = async () => {
    const checked = validateAdminOrderLines(drafts);
    const nextErrors = checked.ok ? [] : [...checked.errors];
    if (!customerName.trim()) nextErrors.push('Customer name is required.');
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      nextErrors.push('A valid customer email is required.');
    }
    if (shippingNum < 0) nextErrors.push('Shipping cannot be negative.');
    if (nextErrors.length > 0 || !checked.ok) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setErrors([]);
    try {
      const client = getAdminSupabase();
      const created = await createAdminInvoice(
        {
          customerEmail: customerEmail.trim(),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          lines: checked.lines,
          shipping: shippingNum,
          note: note.trim() || undefined,
          sendEmail,
        },
        client
      );

      if (!created.success || !created.orderReference) {
        showToast(created.error ?? 'Could not create invoice.', 'error');
        return;
      }

      if (sendEmail) {
        const emailed = await sendOrderEmail({
          orderReference: created.orderReference,
          customerEmail: customerEmail.trim(),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          totalAmount: created.totalAmount ?? estimatedTotal,
          emailType: 'invoice',
        });
        if (!emailed.success) {
          showToast(
            `Invoice ${created.orderReference} created, but email failed: ${emailed.error ?? 'unknown'}`,
            'error'
          );
        } else {
          showToast(`Invoice ${created.orderReference} created and emailed.`, 'success');
        }
      } else {
        showToast(`Invoice ${created.orderReference} created (email not sent).`, 'success');
      }

      navigate('/admin/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create invoice.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page min-h-screen bg-platinum">
      <AdminNavigation onLogout={() => { logout(); navigate('/admin/login'); }} />
      <Section background="white" spacing="lg">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-start gap-3">
            <FileText className="mt-1 h-6 w-6 text-accent" />
            <div>
              <Heading level={3}>Create customer invoice</Heading>
              <Text variant="small" muted className="mt-1 block">
                Charge catalogue products or custom pricing. Email payment instructions optionally.
              </Text>
            </div>
          </div>

          <Card className="mb-5 space-y-4 p-4 sm:p-6">
            <Heading level={5}>Customer</Heading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="min-h-11 text-base md:text-sm"
                autoComplete="name"
              />
              <Input
                label="Email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="min-h-11 text-base md:text-sm"
                autoComplete="email"
              />
              <Input
                label="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="min-h-11 text-base md:text-sm"
                autoComplete="tel"
              />
              <Input
                label="Shipping (AUD)"
                type="number"
                min={0}
                step="0.01"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                className="min-h-11 text-base md:text-sm"
              />
            </div>
            <Textarea
              label="Invoice note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="text-base md:text-sm"
            />
            <label className="flex min-h-11 items-center gap-3 touch-manipulation">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-5 w-5"
              />
              <Text variant="small">Email payment instructions after creating</Text>
            </label>
          </Card>

          <Card className="mb-5 space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <Heading level={5}>Line items</Heading>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 touch-manipulation"
                onClick={() => setDrafts((d) => [...d, emptyLine()])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add line
              </Button>
            </div>

            <div className="space-y-4">
              {drafts.map((draft, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border border-carbon-200 p-3 sm:p-4"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      label="Product / service name"
                      value={draft.name}
                      onChange={(e) => updateDraft(index, 'name', e.target.value)}
                      className="min-h-11 text-base md:text-sm"
                    />
                    <Input
                      label="SKU / CFG (optional)"
                      value={draft.id}
                      onChange={(e) => updateDraft(index, 'id', e.target.value)}
                      placeholder="Leave blank for custom"
                      className="min-h-11 text-base md:text-sm"
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      min={1}
                      max={999}
                      value={draft.quantity}
                      onChange={(e) =>
                        updateDraft(index, 'quantity', Number(e.target.value) || 0)
                      }
                      className="min-h-11 text-base md:text-sm"
                    />
                    <Input
                      label="Unit price (AUD)"
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.unitPrice}
                      onChange={(e) =>
                        updateDraft(index, 'unitPrice', Number(e.target.value) || 0)
                      }
                      className="min-h-11 text-base md:text-sm"
                    />
                  </div>
                  <Input
                    label="Line note (optional)"
                    value={draft.note}
                    onChange={(e) => updateDraft(index, 'note', e.target.value)}
                    className="min-h-11 text-base md:text-sm"
                  />
                  {drafts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-11 touch-manipulation text-error"
                      onClick={() =>
                        setDrafts((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove line
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-carbon-200 pt-4">
              <Text variant="small" muted>
                Subtotal {formatPrice(subtotal)} · Shipping {formatPrice(shippingNum)}
              </Text>
              <Text variant="body" weight="medium">
                Est. total {formatPrice(estimatedTotal)}
              </Text>
            </div>
          </Card>

          {errors.length > 0 && (
            <div className="mb-4 rounded-lg border border-error/30 bg-error-muted px-4 py-3">
              {errors.map((error) => (
                <Text key={error} variant="small" className="block text-error-text">
                  {error}
                </Text>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 touch-manipulation"
              onClick={() => navigate('/admin/dashboard')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11 touch-manipulation sm:ml-auto"
              onClick={() => void handleSubmit()}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create invoice'
              )}
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
