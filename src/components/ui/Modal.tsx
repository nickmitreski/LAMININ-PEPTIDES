import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** ARIA label for the dialog (required for accessibility). */
  'aria-label'?: string;
  /** ID of the element that labels the dialog. */
  'aria-labelledby'?: string;
  /** Extra classes on the backdrop. */
  backdropClassName?: string;
  /** Extra classes on the dialog container. */
  className?: string;
}

/**
 * Shared modal primitive. Handles:
 * - Portal rendering to document.body
 * - Backdrop with click-outside-to-close
 * - ESC key to close
 * - Body scroll lock while open
 * - Fade-in animation via animate-fadeIn
 *
 * Usage:
 *   <Modal open={isOpen} onClose={close} aria-label="Confirm delete">
 *     <div className="max-w-md ...">...content...</div>
 *   </Modal>
 */
export default function Modal({
  open,
  onClose,
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  backdropClassName = '',
  className = '',
}: ModalProps) {
  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[110] flex items-center justify-center bg-carbon-900/50 p-3 animate-fadeIn ${backdropClassName}`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={className}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
