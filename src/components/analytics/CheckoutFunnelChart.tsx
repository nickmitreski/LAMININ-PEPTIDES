type FunnelStep = {
  label: string;
  count: number;
  color: string;
};

type Props = {
  steps: FunnelStep[];
};

export default function CheckoutFunnelChart({ steps }: Props) {
  const max = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className="space-y-3" aria-label="Checkout funnel">
      {steps.map((step) => {
        const width = Math.max(8, (step.count / max) * 100);
        return (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="text-carbon-700">{step.label}</span>
              <span className="shrink-0 font-medium text-carbon-900">{step.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-carbon-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${width}%`, backgroundColor: step.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type CheckoutFunnel = {
  cartViews: number;
  checkoutStarts: number;
  checkoutSubmits: number;
  checkoutSuccess: number;
  checkoutAbandoned: number;
};

export function funnelSteps(funnel: CheckoutFunnel): FunnelStep[] {
  return [
    { label: 'Cart views', count: funnel.cartViews, color: '#94a3b8' },
    { label: 'Checkout started', count: funnel.checkoutStarts, color: '#64748b' },
    { label: 'Submit attempted', count: funnel.checkoutSubmits, color: '#475569' },
    { label: 'Completed', count: funnel.checkoutSuccess, color: '#16a34a' },
    { label: 'Abandoned', count: funnel.checkoutAbandoned, color: '#dc2626' },
  ];
}
