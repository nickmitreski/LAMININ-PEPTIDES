// Shared CORS headers for Supabase Edge Functions
// Allow localhost / 127.0.0.1 for local Vite, plus production domains.
// Resolve dynamically from the request Origin header.

const ALLOWED_ORIGINS = new Set([
  // Production storefront (canonical + www + AU variants)
  'https://lamininpeplab.com',
  'https://www.lamininpeplab.com',
  'https://lamininpeplab.com.au',
  'https://www.lamininpeplab.com.au',
  'https://laminin-peptides.vercel.app',
  'https://laminin-site.vercel.app',
  'https://laminpeptides.com.au',
  'https://www.laminpeptides.com.au',
  'https://lamininpeptab.com.au',
  'https://www.lamininpeptab.com.au',
  'https://lamininpeptides.com',
  'https://www.lamininpeptides.com',
  // Local Vite
  'http://localhost:5180',
  'http://localhost:5175',
  'http://localhost:4321',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5180',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:4321',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
]);

function isVercelPreviewOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:') return false;
    // Preview / project URLs for this storefront
    return (
      url.hostname.endsWith('.vercel.app') &&
      (url.hostname.includes('laminin') || url.hostname.includes('lamin'))
    );
  } catch {
    return false;
  }
}

function isLocalDevOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:') return false;
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers?.get('origin') ?? '';
  const allowed =
    origin &&
    (ALLOWED_ORIGINS.has(origin) ||
      isLocalDevOrigin(origin) ||
      isVercelPreviewOrigin(origin))
      ? origin
      : '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-checkout-init-secret',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
  // Only emit ACAO when we have a real allow — empty string breaks browsers.
  if (allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

/** @deprecated Use getCorsHeaders(req) for dynamic origin checking. */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-checkout-init-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
