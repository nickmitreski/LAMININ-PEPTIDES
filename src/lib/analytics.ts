const SESSION_KEY = 'laminin-analytics-session-id';
const CHECKOUT_DONE_KEY = 'laminin-checkout-completed';

type AnalyticsPayload = Record<string, unknown> & {
  event_name: string;
};

function getSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function endpoint(): string | null {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return base ? `${base.replace(/\/$/, '')}/functions/v1/analytics-event` : null;
}

export function markCheckoutComplete(): void {
  try {
    window.sessionStorage.setItem(CHECKOUT_DONE_KEY, '1');
  } catch {
    // Ignore storage failures.
  }
}

export function resetCheckoutComplete(): void {
  try {
    window.sessionStorage.removeItem(CHECKOUT_DONE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function hasCheckoutCompleted(): boolean {
  try {
    return window.sessionStorage.getItem(CHECKOUT_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Admin / operator surfaces must never inflate storefront analytics. */
export function isAnalyticsExcludedPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function trackEvent(payload: AnalyticsPayload, keepalive = false): void {
  if (typeof window === 'undefined') return;

  if (isAnalyticsExcludedPath(window.location.pathname)) {
    return;
  }

  const url = endpoint();
  if (!url) {
    if (import.meta.env.DEV) console.info('[analytics]', payload);
    return;
  }

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const body = JSON.stringify({
    session_id: getSessionId(),
    path: window.location.pathname + window.location.search,
    page_title: document.title,
    referrer: document.referrer || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    local_time: new Date().toISOString(),
    ...payload,
  });

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(anonKey
        ? {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          }
        : {}),
    },
    body,
    keepalive,
  }).catch((error) => {
    if (import.meta.env.DEV) console.warn('[analytics] failed', error);
  });
}
