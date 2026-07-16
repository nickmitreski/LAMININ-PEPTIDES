import { Beaker, Download } from 'lucide-react';
import { buildReconItems, exportReconstitutionCsv } from '../../features/admin/orders/orderReconstitution';
import { Text } from '../ui/Typography';

type Props = {
  orderRef: string;
  customerName: string;
  peptideItems: Array<Record<string, unknown>>;
  expanded: boolean;
  onToggle: () => void;
};

export default function OrderDetailsReconstitution({
  orderRef,
  customerName,
  peptideItems,
  expanded,
  onToggle,
}: Props) {
  if (!peptideItems.length) return null;

  const reconItems = buildReconItems(peptideItems);

  return (
    <div className="px-6 pb-4">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-sm border border-accent-200 bg-accent-50 px-4 py-2 text-sm font-medium text-accent-800 transition-colors hover:bg-accent-100"
      >
        <Beaker className="h-4 w-4" />
        {expanded ? 'Hide' : 'Show'} reconstitution guide
      </button>

      {expanded && reconItems.length > 0 && (
        <div className="mt-3 rounded-lg border border-accent-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <Text variant="small" weight="medium" className="text-accent-900">
              Recommended reconstitution
            </Text>
            <button
              type="button"
              onClick={() => exportReconstitutionCsv(orderRef, customerName, reconItems)}
              className="inline-flex min-h-11 touch-manipulation items-center gap-1.5 rounded-sm bg-carbon-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-carbon-800"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-carbon-200 text-left text-xs text-carbon-500">
                  <th className="pb-2 pr-4">Product</th>
                  <th className="pb-2 pr-4">Qty</th>
                  <th className="pb-2 pr-4">Strength</th>
                  <th className="pb-2 pr-4">BAC water</th>
                  <th className="pb-2">Concentration</th>
                </tr>
              </thead>
              <tbody>
                {reconItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-carbon-100 last:border-0">
                    <td className="py-2 pr-4 font-medium">{item.name}</td>
                    <td className="py-2 pr-4">{item.qty}</td>
                    <td className="py-2 pr-4">{item.strengthMg}mg</td>
                    <td className="py-2 pr-4">{item.bacWaterMl}ml</td>
                    <td className="py-2">{item.concentrationMcg} mcg/ml</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Text variant="caption" className="mt-3 text-carbon-500">
            These are recommended starting values. Adjust based on research protocol requirements.
          </Text>
        </div>
      )}
    </div>
  );
}
