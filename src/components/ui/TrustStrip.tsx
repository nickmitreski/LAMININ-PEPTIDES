import { CheckCircle, Truck, ShieldCheck, FileCheck } from 'lucide-react';
import { Text } from './Typography';

const TRUST_ITEMS = [
  { icon: CheckCircle, label: '99%+ Purity' },
  { icon: FileCheck, label: 'Batch-Verified COAs' },
  { icon: Truck, label: 'Express AU Shipping' },
  { icon: ShieldCheck, label: 'Purity Guarantee' },
] as const;

export default function TrustStrip() {
  return (
    <div className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 md:mb-12">
      {TRUST_ITEMS.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-accent-dark" strokeWidth={2} />
          <Text variant="caption" weight="medium" className="text-carbon-900/70">
            {label}
          </Text>
        </div>
      ))}
    </div>
  );
}
