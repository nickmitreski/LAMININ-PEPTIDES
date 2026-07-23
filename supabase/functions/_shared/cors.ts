// Shared CORS headers for Supabase Edge Functions
// Allow localhost / 127.0.0.1 for local Vite, plus production domains.
// Resolve dynamically from the request Origin header.

const ALLOWED_ORIGINS = new Set([
  'https://lamininpeplab.com.au',
  'https://www.lamininpeplab.com.au',
  'https://laminpeptides.com.au',
  'https://www.laminpeptides.com.au',
  'https://lamininpeptab.com.au',
  'https://www.lamininpeptab.com.au',
  'https://lamininpeptides.com',
  'https://www.lamininpeptides.com',
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
    origin && (ALLOWED_ORIGINS.has(origin) || isLocalDevOrigin(origin)) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-checkout-init-secret',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}

/** @deprecated Use getCorsHeaders(req) for dynamic origin checking. */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-checkout-init-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
