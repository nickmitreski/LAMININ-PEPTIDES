/**
 * postMessage `type` strings for CoreForge `/embed/pay/*` ↔ partner parent iframe.
 * Must stay in sync with CoreForge `src/lib/embedMessaging.ts` defaults and VITE_EMBED_PM_* overrides.
 */

function envTrim(name: string): string | undefined {
  const raw = (import.meta.env as Record<string, string | undefined>)[name];
  const s = typeof raw === 'string' ? raw.trim() : '';
  return s || undefined;
}

/** Current protocol (neutral names; override per deploy with VITE_EMBED_PM_*). */
export const EMBED_PM = {
  READY: envTrim('VITE_EMBED_PM_READY') || 'PAY_EMBED_READY',
  INIT: envTrim('VITE_EMBED_PM_INIT') || 'PAY_EMBED_INIT',
  HEIGHT: envTrim('VITE_EMBED_PM_HEIGHT') || 'PAY_EMBED_HEIGHT',
  SUCCESS: envTrim('VITE_EMBED_PM_SUCCESS') || 'PAY_COMPLETED',
  ERROR: envTrim('VITE_EMBED_PM_ERROR') || 'PAY_ERROR',
} as const;

/** Previous names — still accepted from iframe until all CoreForge builds are updated. */
export const EMBED_PM_LEGACY_FROM_CHILD = {
  READY: 'COREFORGE_EMBED_READY',
  HEIGHT: 'COREFORGE_EMBED_HEIGHT',
  SUCCESS: 'COREFORGE_PAYMENT_SUCCESS',
  ERROR: 'COREFORGE_PAYMENT_ERROR',
} as const;
