import { Loader2, Tag, X } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Heading } from '../ui/Typography';
import { formatPrice } from '../../lib/formatCurrency';
import type { DiscountValidation } from '../../services/discountService';

interface CheckoutDiscountCodeProps {
  appliedDiscount: DiscountValidation | null;
  discountAmount: number;
  discountInput: string;
  discountError: string;
  discountLoading: boolean;
  isSubmitting: boolean;
  onInputChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
}

export default function CheckoutDiscountCode({
  appliedDiscount,
  discountAmount,
  discountInput,
  discountError,
  discountLoading,
  isSubmitting,
  onInputChange,
  onApply,
  onRemove,
}: CheckoutDiscountCodeProps) {
  return (
    <Card padding="lg">
      <Heading level={5} className="mb-4">
        Discount code
      </Heading>
      {appliedDiscount?.valid ? (
        <div className="flex items-center justify-between rounded-sm border border-success-border bg-success-light px-4 py-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-success-dark" />
            <span className="text-sm font-medium text-success-text">
              {appliedDiscount.code}
            </span>
            <span className="text-xs text-success">
              &minus;{formatPrice(discountAmount)}
            </span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-success transition-colors hover:bg-success-muted hover:text-success-text"
            aria-label="Remove discount code"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter code"
            value={discountInput}
            onChange={(event) => onInputChange(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onApply();
              }
            }}
            disabled={isSubmitting || discountLoading}
            className="min-h-11 flex-1 rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm uppercase tracking-wider transition-colors placeholder:normal-case placeholder:tracking-normal focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900 md:min-h-0"
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onApply}
            disabled={!discountInput.trim() || isSubmitting || discountLoading}
          >
            {discountLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Apply'
            )}
          </Button>
        </div>
      )}
      {discountError && (
        <p className="mt-2 text-xs text-error">{discountError}</p>
      )}
    </Card>
  );
}
