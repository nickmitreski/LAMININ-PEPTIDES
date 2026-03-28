interface ProductQuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

export default function ProductQuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: ProductQuantityStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  const btnClass =
    'min-h-11 min-w-11 touch-manipulation px-4 py-3 text-lg font-light leading-none transition-colors hover:bg-grey focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 sm:min-h-0 sm:min-w-0';

  return (
    <div
      className="inline-flex items-stretch overflow-hidden rounded-sm border border-carbon-900/15 bg-white text-carbon-900"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className={btnClass}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="flex min-w-[3rem] items-center justify-center border-x border-carbon-900/10 text-sm font-semibold tabular-nums tracking-wide">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className={btnClass}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
