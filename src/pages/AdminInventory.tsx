import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { allPeptides } from '../data/peptides';
import {
  getInventoryMap,
  setInventoryMap,
  type InventoryMap,
} from '../data/inventoryStore';

export default function AdminInventory() {
  const navigate = useNavigate();
  const sorted = useMemo(
    () => [...allPeptides].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const [draft, setDraft] = useState<InventoryMap>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setDraft(getInventoryMap());
  }, []);

  const handleQtyChange = (id: string, value: string) => {
    const n = parseInt(value, 10);
    setDraft((prev) => {
      const next = { ...prev };
      if (value === '' || Number.isNaN(n) || n < 0) {
        delete next[id];
        return next;
      }
      next[id] = n;
      return next;
    });
  };

  const save = () => {
    const cleaned: InventoryMap = {};
    for (const [k, v] of Object.entries(draft)) {
      if (typeof v === 'number' && v > 0) cleaned[k] = Math.floor(v);
    }
    setInventoryMap(cleaned);
    setDraft(cleaned);
    setSavedAt(new Date().toLocaleString());
  };

  return (
    <div className="min-h-screen bg-platinum pb-16">
      <Section background="white" spacing="lg">
        <Container size="lg">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Heading level={3} className="mb-2">
                Inventory
              </Heading>
              <Text variant="small" muted className="max-w-xl">
                On-hand quantities stored in this browser only (
                <code className="text-xs">localStorage</code>). Hook this screen to your
                database or ERP when you have a backend; export or replace{' '}
                <code className="text-xs">inventoryStore.ts</code>.
              </Text>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary" size="md" onClick={save}>
                Save quantities
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate('/library')}
              >
                View library
              </Button>
            </div>
          </div>

          {savedAt && (
            <Text variant="caption" muted className="mb-4 block">
              Last saved: {savedAt}
            </Text>
          )}

          <div className="overflow-x-auto rounded-xl border border-carbon-900/10 bg-white shadow-sm">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-carbon-900/10 bg-grey/50">
                  <th className="px-4 py-3 font-bold uppercase tracking-wide text-carbon-900">
                    Compound
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wide text-carbon-900">
                    ID
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wide text-carbon-900">
                    In stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-carbon-900/5 last:border-0"
                  >
                    <td className="px-4 py-3 text-neutral-700">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                      {p.id}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        className="w-24 rounded-sm border border-carbon-900/15 bg-white px-2 py-1.5 text-carbon-900"
                        value={draft[p.id] ?? ''}
                        placeholder="0"
                        onChange={(e) => handleQtyChange(p.id, e.target.value)}
                        aria-label={`Stock for ${p.name}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>
    </div>
  );
}
