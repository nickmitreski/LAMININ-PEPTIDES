import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';

type Props = {
  mode: 'cancel' | 'refund';
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

export default function OrderCancelConfirmModal({ mode, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('');

  return (
    <Modal
      open={true}
      onClose={onClose}
      aria-label={mode === 'refund' ? 'Confirm refund' : 'Confirm cancellation'}
      className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-lg bg-white shadow-xl"
    >
      <div className="border-b border-carbon-200 px-5 py-4">
        <Heading level={4} className="truncate">
          {mode === 'refund' ? 'Refund and cancel' : 'Cancel order'}
        </Heading>
        <Text variant="caption" muted className="mt-1">
          {mode === 'refund'
            ? 'Marks the order cancelled and records refund intent. Refund must still be processed in your payment provider.'
            : 'Marks the order cancelled. Items will not be shipped.'}
        </Text>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <label className="block">
          <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
            Reason (required)
          </Text>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            autoFocus
            placeholder={
              mode === 'refund'
                ? 'e.g. Customer requested refund within 24h; refund issued via bank transfer…'
                : 'e.g. Out of stock; customer asked to cancel before payment…'
            }
            className="input w-full rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <Text variant="caption" muted>
          This reason is appended to the order&apos;s internal notes and logged in the audit trail.
        </Text>
      </div>
      <div className="shrink-0 border-t border-carbon-200 bg-carbon-50 px-5 py-3">
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Back
          </Button>
          <Button
            size="sm"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className={
              mode === 'refund'
                ? 'bg-warning text-white hover:bg-warning-dark'
                : 'bg-error text-white hover:bg-error-dark'
            }
          >
            {mode === 'refund' ? 'Refund & cancel' : 'Cancel order'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
