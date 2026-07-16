type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): LogLevel {
  if (import.meta.env.DEV) return 'debug';
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel()];
}

function write(level: LogLevel, scope: string, message: string, data?: unknown) {
  if (!shouldLog(level)) return;
  const prefix = `[${scope}] ${message}`;
  if (data === undefined) {
    console[level === 'debug' ? 'log' : level](prefix);
    return;
  }
  console[level === 'debug' ? 'log' : level](prefix, data);
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, data?: unknown) => write('debug', scope, message, data),
    info: (message: string, data?: unknown) => write('info', scope, message, data),
    warn: (message: string, data?: unknown) => write('warn', scope, message, data),
    error: (message: string, data?: unknown) => write('error', scope, message, data),
  };
}

export const appLogger = createLogger('app');
