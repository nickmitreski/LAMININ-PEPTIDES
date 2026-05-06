// Shared CORS headers for Supabase Edge Functions
// Allow localhost for dev and the production domain.
// Supabase Edge Functions only send the first origin header, so we
// resolve dynamically based on the incoming request origin.

const ALLOWED_ORIGINS = new Set([
  'https://laminpeptides.com.au',
  'https://www.laminpeptides.com.au',
  'https://lamininpeptab.com.au',
  'https://www.lamininpeptab.com.au',
  'http://localhost:5173',
  'http://localhost:3000',
]);

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers?.get('origin') ?? '';
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : '';
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
