/**
 * Optional Sentry integration. To enable:
 *   npm i @sentry/react
 *   Set VITE_SENTRY_DSN in production env
 * Then replace the no-op stubs below with real Sentry.init calls.
 */
import { createLogger } from './logger';

const log = createLogger('sentry');

const initialized = false;

export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || initialized || import.meta.env.DEV) return;
  log.info('Sentry DSN set — install @sentry/react and wire initSentry to enable');
}

export async function captureException(
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  if (!initialized) {
    log.error('uncaught', context ? { error, ...context } : error);
  }
}
