export type ReconItem = {
  name: string;
  qty: number;
  strengthMg: number;
  bacWaterMl: number;
  concentrationMcg: number;
};

/** Default reconstitution presets per peptide strength (mg) */
export function defaultReconstitution(name: string, strengthMg: number) {
  const lower = name.toLowerCase();
  if (
    lower.includes('water') ||
    lower.includes('acetic') ||
    lower.includes('glutathione') ||
    lower.includes('nad')
  ) {
    return null;
  }
  const bacWaterMl = Math.max(0.5, Math.round((strengthMg / 5) * 2) / 2);
  const concentrationMcg = (strengthMg * 1000) / bacWaterMl;
  return {
    bacWaterMl,
    concentrationMcg: Math.round(concentrationMcg),
    strengthMg,
  };
}

export function parseStrengthMg(name: string): number {
  const match = name.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
  return match ? parseFloat(match[1]) : 10;
}

export function buildReconItems(
  peptideItems: Array<Record<string, unknown>>
): ReconItem[] {
  return peptideItems
    .map((rawItem) => {
      const item = rawItem as {
        peptide_display_name?: string;
        name?: string;
        cfg_code?: string;
        quantity?: number | string;
      };
      const name = (item.peptide_display_name || item.name || item.cfg_code || 'Unknown') as string;
      const strengthMg = parseStrengthMg(name);
      const recon = defaultReconstitution(name, strengthMg);
      if (!recon) return null;
      return {
        name,
        qty: Number(item.quantity) || 1,
        strengthMg: recon.strengthMg,
        bacWaterMl: recon.bacWaterMl,
        concentrationMcg: recon.concentrationMcg,
      };
    })
    .filter(Boolean) as ReconItem[];
}

export function exportReconstitutionCsv(
  orderRef: string,
  customerName: string,
  items: ReconItem[]
) {
  const headers = ['Product', 'Quantity', 'Strength (mg)', 'BAC Water (ml)', 'Concentration (mcg/ml)'];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = items.map((item) =>
    [item.name, item.qty, item.strengthMg, item.bacWaterMl, item.concentrationMcg]
      .map(escape)
      .join(',')
  );
  const csv = [
    `Reconstitution Guide — ${orderRef}`,
    `Customer: ${customerName}`,
    '',
    headers.join(','),
    ...rows,
    '',
    'Note: These are recommended starting values. Adjust based on research protocol requirements.',
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reconstitution-${orderRef}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
