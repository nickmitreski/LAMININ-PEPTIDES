export type CheckoutFunnel = {
  cartViews: number;
  checkoutStarts: number;
  checkoutSubmits: number;
  checkoutSuccess: number;
  checkoutAbandoned: number;
};

export type FunnelStep = {
  label: string;
  count: number;
  color: string;
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
