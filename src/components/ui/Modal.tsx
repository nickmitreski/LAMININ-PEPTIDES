import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Heading } from './Typography';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** ARIA label for the dialog (required for accessibility when no labelledby). */
  'aria-label'?: string;
  /** ID of the element that labels the dialog. */
  'aria-labelledby'?: string;
  /** Extra classes on the backdrop. */
  backdropClassName?: string;
  /** Extra classes on the dialog container. */
  className?: string;
  /** When true, clicking the backdrop does NOT close — forces an explicit choice. */
  disableBackdropClose?: boolean;
  /** When true, ESC does NOT close. */
  disableEscClose?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Shared modal primitive. Handles:
 * - Portal rendering to document.body
 * - Backdrop with click-outside-to-close
 * - ESC key to close
 * - Body scroll lock while open (with scrollbar-width compensation to avoid layout jump)
 * - Focus trap (Tab + Shift-Tab cycle within the dialog)
 * - Restores focus to the previously-focused element on close
 * - Fade-in animation via animate-fadeIn
 *
 * Low-level — caller renders their own header / body / footer structure.
 * For the canonical sticky-header + scroll-body + sticky-footer pattern,
 * use ModalShell from this same file.
 */
export default function Modal({
  open,
  onClose,
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  backdropClassName = '',
  className = '',
  disableBackdropClose = false,
  disableEscClose = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Body scroll lock + scrollbar compensation
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open || disableEscClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, disableEscClose]);

  // Capture / restore focus
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = (document.activeElement as HTMLElement | null) ?? null;
    const dialog = dialogRef.current;
    if (dialog) {
      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        dialog.focus();
      }
    }
    return () => {
      const target = previouslyFocused.current;
      if (target && typeof target.focus === 'function') {
        setTimeout(() => target.focus(), 0);
      }
    };
  }, [open]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    []
  );

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[110] flex items-center justify-center bg-carbon-900/50 p-3 animate-fadeIn ${backdropClassName}`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !disableBackdropClose) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        className={`outline-none ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// -----------------------------------------------------------------------------
// ModalShell — canonical sticky-header + scroll-body + sticky-footer container
// -----------------------------------------------------------------------------

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  disableBackdropClose?: boolean;
  disableEscClose?: boolean;
  ariaLabel?: string;
  cardClassName?: string;
}

const SIZE_MAP: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

/**
 * Opinionated shell on top of Modal: sticky header (with X), scrolling body,
 * optional sticky footer. Uses `max-h-[calc(100dvh-2rem)]` so iOS Safari's
 * dynamic toolbar doesn't push content off-screen.
 *
 * Migrate ad-hoc admin modals to this — it bakes in:
 *   - title rendered in <Heading level={3}> with stable id for aria-labelledby
 *   - X button focusable + keyboard-friendly
 *   - body is `min-h-0 flex-1 overflow-y-auto` so the only scrolling area is
 *     inside the modal
 *   - footer outside the scroll container, always visible
 */
export function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  headerExtra,
  footer,
  children,
  size = '2xl',
  showCloseButton = true,
  disableBackdropClose = false,
  disableEscClose = false,
  ariaLabel,
  cardClassName = '',
}: ModalShellProps) {
  const titleIdRef = useRef(
    `modal-title-${Math.random().toString(36).slice(2, 9)}`
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby={title ? titleIdRef.current : undefined}
      aria-label={!title ? ariaLabel : undefined}
      disableBackdropClose={disableBackdropClose}
      disableEscClose={disableEscClose}
      className={`flex max-h-[calc(100dvh-2rem)] w-full ${SIZE_MAP[size]} flex-col rounded-lg bg-white shadow-xl ${cardClassName}`}
    >
      {(title || showCloseButton || headerExtra) && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-carbon-200 bg-white px-4 py-3 sm:px-6 sm:py-4 rounded-t-lg">
          <div className="min-w-0 flex-1">
            {title && (
              <Heading level={3} id={titleIdRef.current} className="truncate">
                {title}
              </Heading>
            )}
            {subtitle && (
              <div className="mt-1 hidden truncate text-sm text-carbon-600 sm:block">
                {subtitle}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerExtra}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-sm p-1.5 text-carbon-600 transition-colors hover:bg-carbon-100 hover:text-carbon-900 focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {children}
      </div>

      {footer && (
        <div className="shrink-0 border-t border-carbon-200 bg-carbon-50 px-4 py-3 sm:px-6 sm:py-4 rounded-b-lg">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {footer}
          </div>
        </div>
      )}
    </Modal>
  );
}
