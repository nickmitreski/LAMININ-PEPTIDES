import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { OrderReferenceRow } from '../../services/orderTypes';
import {
  validateAdminOrderLines,
  type AdminOrderLineDraft,
} from '../../features/admin/orders/orderLineEditor';
import { replaceAdminOrderLines } from '../../services/ordersService';
import { getAdminSupabase } from '../../lib/supabaseAdminClient';
import { formatPrice } from '../../lib/formatCurrency';
import { PEPTIDE_ID_TO_CFG } from '../../data/productMappings';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { ModalShell } from '../ui/Modal';
import { Text } from '../ui/Typography';

type Props = {
  open: boolean;
  order: OrderReferenceRow;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

function draftsFromOrder(order: OrderReferenceRow): AdminOrderLineDraft[] {
  const rawLines = Array.isArray(order.cart_items) ? order.cart_items : [];
  return rawLines.map((raw) => {
    const line = raw as Record<string, unknown>;
    const rawId = String(line.id ?? line.cfg_code ?? '');
    const id = PEPTIDE_ID_TO_CFG[rawId] ?? rawId;
    return {
      id,
      name: String(line.name ?? line.peptide_display_name ?? id),
      quantity: Number(line.quantity ?? 1),
      unitPrice: Number(line.unit_price ?? line.price ?? 0),
      note: String(line.note ?? ''),
      image: typeof line.image === 'string' ? line.image : undefined,
      lineType:
        line.line_type === 'custom' || id.toUpperCase().startsWith('CUSTOM-')
          ? 'custom'
          : 'catalog',
    };
  });
}

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

export default function OrderLineEditor({
  open,
  order,
  onClose,
  onSaved,
}: Props) {
  const [drafts, setDrafts] = useState<AdminOrderLineDraft[]>([]);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial = draftsFromOrder(order);
    setDrafts(initial.length > 0 ? initial : [emptyLine()]);
    setReason('');
    setErrors([]);
  }, [open, order]);

  const validation = useMemo(() => validateAdminOrderLines(drafts), [drafts]);
  const subtotal = validation.ok ? validation.subtotal : 0;

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

  const handleSave = async () => {
    const checked = validateAdminOrderLines(drafts);
    const nextErrors = checked.ok ? [] : checked.errors;
    if (!reason.trim()) {
      nextErrors.push('Explain why the order lines are changing.');
    }
    if (nextErrors.length > 0 || !checked.ok) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setErrors([]);
    const result = await replaceAdminOrderLines(
      order.id,
      checked.lines,
      reason,
      getAdminSupabase()
    );
    setSaving(false);

    if (!result.success) {
      setErrors([result.error ?? 'Could not update order lines.']);
      return;
    }

    await onSaved();
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Edit unpaid order lines"
      subtitle={`Order ${order.peptide_order_id}. Paid and processing orders cannot be rewritten.`}
      size="4xl"
      disableBackdropClose={saving}
      disableEscClose={saving}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="min-h-11 touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="min-h-11 touch-manipulation"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save order lines'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {errors.length > 0 && (
          <div
            role="alert"
            className="rounded-sm border border-error-border bg-error-light p-4 text-sm text-error-text"
          >
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          {drafts.map((draft, index) => (
            <div
              key={`${index}-${draft.id}`}
              className="rounded-sm border border-carbon-200 bg-white p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <Text weight="semibold">Line {index + 1}</Text>
                <button
                  type="button"
                  onClick={() =>
                    setDrafts((current) =>
                      current.filter((_, lineIndex) => lineIndex !== index)
                    )
                  }
                  disabled={drafts.length === 1 || saving}
                  className="flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-sm text-error transition-colors hover:bg-error-light disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Remove line ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`order-line-type-${index}`}
                    className="mb-2 block text-xs font-medium tracking-wide text-carbon-900"
                  >
                    Line type
                  </label>
                  <select
                    id={`order-line-type-${index}`}
                    value={draft.lineType}
                    onChange={(event) =>
                      updateDraft(
                        index,
                        'lineType',
                        event.target.value as 'catalog' | 'custom'
                      )
                    }
                    className="input min-h-11 text-base md:text-sm"
                  >
                    <option value="catalog">Catalog product</option>
                    <option value="custom">Custom line</option>
                  </select>
                </div>
                <Input
                  id={`order-line-id-${index}`}
                  label={draft.lineType === 'catalog' ? 'CFG code' : 'Reference (optional)'}
                  value={draft.id}
                  onChange={(event) => updateDraft(index, 'id', event.target.value)}
                  placeholder={
                    draft.lineType === 'catalog' ? 'CFG-031' : 'CUSTOM-HANDLING'
                  }
                  className="min-h-11 text-base md:text-sm"
                />
                <Input
                  id={`order-line-name-${index}`}
                  label="Description"
                  value={draft.name}
                  onChange={(event) => updateDraft(index, 'name', event.target.value)}
                  className="min-h-11 text-base md:text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id={`order-line-quantity-${index}`}
                    label="Quantity"
                    type="number"
                    min={1}
                    max={999}
                    step={1}
                    value={Number.isFinite(draft.quantity) ? draft.quantity : ''}
                    onChange={(event) =>
                      updateDraft(index, 'quantity', event.target.valueAsNumber)
                    }
                    className="min-h-11 text-base md:text-sm"
                  />
                  <Input
                    id={`order-line-price-${index}`}
                    label="Unit price (AUD)"
                    type="number"
                    min={0}
                    max={1_000_000}
                    step="0.01"
                    value={Number.isFinite(draft.unitPrice) ? draft.unitPrice : ''}
                    onChange={(event) =>
                      updateDraft(index, 'unitPrice', event.target.valueAsNumber)
                    }
                    className="min-h-11 text-base md:text-sm"
                  />
                </div>
                <Input
                  id={`order-line-note-${index}`}
                  label="Internal line note"
                  value={draft.note}
                  onChange={(event) => updateDraft(index, 'note', event.target.value)}
                  maxLength={500}
                  className="min-h-11 text-base md:text-sm sm:col-span-2"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={() => setDrafts((current) => [...current, emptyLine()])}
          disabled={saving || drafts.length >= 100}
          className="min-h-11 touch-manipulation"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add line
        </Button>

        <div className="rounded-sm bg-grey/30 p-4">
          <div className="flex items-center justify-between gap-4">
            <Text weight="medium">New subtotal</Text>
            <Text weight="semibold" className="tabular-nums">
              {formatPrice(subtotal)}
            </Text>
          </div>
          <Text variant="caption" muted className="mt-1 block">
            Shipping, tax and the existing discount are recalculated by the server.
          </Text>
        </div>

        <Textarea
          id="order-lines-change-reason"
          label="Reason for change"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          helperText="Required. This is saved in the immutable audit log."
          className="min-h-24 text-base md:text-sm"
        />
      </div>
    </ModalShell>
  );
}
