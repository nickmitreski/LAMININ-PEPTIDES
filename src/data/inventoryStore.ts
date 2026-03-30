/**
 * Client-side inventory counts for the admin dashboard.
 * Replace with API / Supabase when you add a real backend.
 */
const STORAGE_KEY = 'laminin-inventory-v1';

export type InventoryMap = Record<string, number>;

function readRaw(): InventoryMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as InventoryMap;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function getInventoryMap(): InventoryMap {
  if (typeof window === 'undefined') return {};
  return readRaw();
}

export function getStock(peptideId: string): number {
  const v = getInventoryMap()[peptideId];
  return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
}

export function setInventoryMap(map: InventoryMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

export function updateStock(peptideId: string, quantity: number): void {
  const next = { ...getInventoryMap() };
  if (quantity <= 0) delete next[peptideId];
  else next[peptideId] = Math.floor(quantity);
  setInventoryMap(next);
}
