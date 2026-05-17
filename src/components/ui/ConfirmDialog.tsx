import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { Heading, Text } from './Typography';

interface ConfirmDialogProps {
  open: boolean;
  /** Title of the dialog. */
  title: ReactNode;
  /** Body text or JSX (use for italicised item names, lists, etc.). */
  message: ReactNode;
  /** Text on the confirm button. Default: "Confirm". */
  confirmLabel?: ReactNode;
  /** Text on the cancel button. Default: "Cancel". */
  cancelLabel?: ReactNode;
  /** Visual tone of the confirm button. `danger` is red, `primary` is brand colour. */
  tone?: 'danger' | 'warning' | 'primary';
  /** True while the confirm action is in-flight — disables both buttons and shows a spinner. */
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Modal-based replacement for `window.confirm`. Use everywhere a yes/no
 * decision is needed; never use the native confirm() in this app — it blocks
 * the main thread on mobile and is unstyled.
 *
 * Built on the shared `<Modal>` primitive so it gets focus trap / ESC /
 * scroll lock for free.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const toneClasses: Record<NonNullable<ConfirmDialogProps['tone']>, string> = {
    danger: 'bg-error text-white hover:bg-error-dark',
    warning: 'bg-warning text-white hover:bg-warning-dark',
    primary: 'bg-accent-600 text-white hover:bg-accent-700',
  };
  const iconBg: Record<NonNullable<ConfirmDialogProps['tone']>, string> = {
    danger: 'bg-error-muted text-error',
    warning: 'bg-warning-muted text-warning',
    primary: 'bg-accent-100 text-accent-700',
  };

  return (
    <Modal
      open={open}
      onClose={() => !loading && onCancel()}
      aria-label={typeof title === 'string' ? title : 'Confirm'}
      disableBackdropClose={loading}
      disableEscClose={loading}
      className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconBg[tone]}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <Heading level={3} className="mb-1 break-words">
            {title}
          </Heading>
          <Text variant="small" className="text-carbon-600">
            {message}
          </Text>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <button
          type="button"
          onClick={() => void onConfirm()}
          disabled={loading}
          className={`inline-flex items-center justify-center rounded-sm px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses[tone]}`}
        >
          {loading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
