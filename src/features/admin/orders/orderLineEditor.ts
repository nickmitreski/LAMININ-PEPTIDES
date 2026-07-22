export type AdminOrderLineDraft = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  note: string;
  image?: string;
  lineType?: 'catalog' | 'custom';
};

export type AdminOrderLine = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  line_total: number;
  line_type: 'catalog' | 'custom';
  note: string | null;
  image?: string;
};

export type AdminOrderLineValidation =
  | { ok: true; lines: AdminOrderLine[]; subtotal: number }
  | { ok: false; errors: string[] };

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function validateAdminOrderLines(
  drafts: AdminOrderLineDraft[]
): AdminOrderLineValidation {
  if (drafts.length === 0) {
    return { ok: false, errors: ['Add at least one order line.'] };
  }
  if (drafts.length > 100) {
    return { ok: false, errors: ['Orders can contain at most 100 lines.'] };
  }

  const errors: string[] = [];
  const lines: AdminOrderLine[] = [];

  drafts.forEach((draft, index) => {
    const lineNumber = index + 1;
    const id = draft.id.trim();
    const name = draft.name.trim();
    const quantity = Number(draft.quantity);
    const unitPrice = Number(draft.unitPrice);

    if (!name) {
      errors.push(`Line ${lineNumber}: name is required.`);
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      errors.push(
        `Line ${lineNumber}: quantity must be a whole number between 1 and 999.`
      );
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 1_000_000) {
      errors.push(`Line ${lineNumber}: unit price must be between $0 and $1,000,000.`);
    }

    if (
      name &&
      Number.isInteger(quantity) &&
      quantity >= 1 &&
      quantity <= 999 &&
      Number.isFinite(unitPrice) &&
      unitPrice >= 0 &&
      unitPrice <= 1_000_000
    ) {
      const price = roundCurrency(unitPrice);
      lines.push({
        id: id || `CUSTOM-${lineNumber}`,
        name,
        quantity,
        price,
        line_total: roundCurrency(price * quantity),
        line_type: draft.lineType === 'custom' || !id ? 'custom' : 'catalog',
        note: draft.note.trim() || null,
        ...(draft.image?.trim() ? { image: draft.image.trim() } : {}),
      });
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    lines,
    subtotal: roundCurrency(lines.reduce((sum, line) => sum + line.line_total, 0)),
  };
}
