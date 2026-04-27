import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  // Always render the live region container so assistive tech sees it as a
  // stable target. Hide it visually when empty.
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={`pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0 ${
        toasts.length === 0 ? 'sr-only' : ''
      }`}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 flex-shrink-0" strokeWidth={2} />,
    error: <XCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />,
    warning: <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />,
    info: <Info className="w-5 h-5 flex-shrink-0" strokeWidth={2} />,
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  // Use assertive role for errors/warnings so they interrupt a screen reader,
  // and the more polite role="status" for success/info.
  const isAssertive = toast.type === 'error' || toast.type === 'warning';

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-sm border p-4 shadow-lg animate-slideInRight ${styles[toast.type]}`}
      role={isAssertive ? 'alert' : 'status'}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 rounded-sm p-0.5 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}
