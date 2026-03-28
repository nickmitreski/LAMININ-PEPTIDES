import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from '../ui/Button';
import { Text } from '../ui/Typography';

type ProductDescriptionModalProps = {
  open: boolean;
  onClose: () => void;
  /** Shown in the sticky header for context */
  productTitle: string;
  paragraphs: string[];
};

export default function ProductDescriptionModal({
  open,
  onClose,
  productTitle,
  paragraphs,
}: ProductDescriptionModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const hasBody = paragraphs.length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-carbon-900/50 p-3 px-safe pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-description-modal-title"
        className="flex max-h-[min(85dvh,720px)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-xl border border-carbon-900/15 bg-white shadow-xl sm:max-h-[50vh] sm:min-h-[40vh] sm:max-w-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-carbon-900/10 bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p
              id="product-description-modal-title"
              className="truncate text-xs font-bold uppercase tracking-[0.18em] text-carbon-900"
            >
              Description
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-neutral-600">
              {productTitle}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="min-h-10 shrink-0 touch-manipulation uppercase tracking-wider sm:min-h-0"
          >
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {hasBody ? (
            <div className="space-y-4">
              {paragraphs.map((p, i) => (
                <Text
                  key={i}
                  variant="body"
                  className="text-neutral-600 leading-relaxed"
                >
                  {p}
                </Text>
              ))}
            </div>
          ) : (
            <Text variant="body" className="text-neutral-600">
              Coming soon
            </Text>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
