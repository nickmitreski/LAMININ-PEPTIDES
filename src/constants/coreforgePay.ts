/**
 * CoreForge embed pay origin (strict postMessage + iframe base).
 * Set `VITE_COREFORGE_PAY_ORIGIN` to the pay app origin only, e.g. https://pay.example.com
 */
export function getCoreForgePayOrigin(): string | null {
  const raw = import.meta.env.VITE_COREFORGE_PAY_ORIGIN as string | undefined;
  const t = raw?.trim();
  if (!t) return null;
  try {
    return new URL(t).origin;
  } catch {
    return null;
  }
}
