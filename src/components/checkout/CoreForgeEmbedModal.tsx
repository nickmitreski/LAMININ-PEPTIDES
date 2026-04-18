import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { getCoreForgePayOrigin } from '../../constants/coreforgePay';
import {
  EMBED_PM,
  EMBED_PM_LEGACY_FROM_CHILD,
} from '../../lib/embedPayPostMessage';
import Button from '../ui/Button';

type EmbedReady = { kind: 'ready' };
type EmbedHeight = { kind: 'height'; height: number };
type EmbedSuccess = { kind: 'success' };
type EmbedError = { kind: 'error'; reason?: string };
type EmbedFromChild = EmbedReady | EmbedHeight | EmbedSuccess | EmbedError;

function parseEmbedMessage(data: unknown): EmbedFromChild | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const t = d.type;
  const isReady = t === EMBED_PM.READY || t === EMBED_PM_LEGACY_FROM_CHILD.READY;
  const isHeight = t === EMBED_PM.HEIGHT || t === EMBED_PM_LEGACY_FROM_CHILD.HEIGHT;
  const isSuccess = t === EMBED_PM.SUCCESS || t === EMBED_PM_LEGACY_FROM_CHILD.SUCCESS;
  const isError = t === EMBED_PM.ERROR || t === EMBED_PM_LEGACY_FROM_CHILD.ERROR;

  if (isReady) return { kind: 'ready' };
  if (isHeight) {
    const h = d.height;
    if (typeof h === 'number' && Number.isFinite(h) && h > 0) {
      return { kind: 'height', height: h };
    }
    return { kind: 'height', height: 480 };
  }
  if (isSuccess) return { kind: 'success' };
  if (isError) {
    return { kind: 'error', reason: typeof d.reason === 'string' ? d.reason : undefined };
  }
  return null;
}

const IFRAME_MIN_HEIGHT_PX = 420;
const IFRAME_MAX_VH = 0.9;

interface CoreForgeEmbedModalProps {
  open: boolean;
  iframeSrc: string;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

/**
 * Full-viewport dialog with CoreForge pay iframe + postMessage handshake.
 * Only trusts messages where event.origin === CoreForge pay origin.
 */
export default function CoreForgeEmbedModal({
  open,
  iframeSrc,
  onClose,
  onPaymentSuccess,
}: CoreForgeEmbedModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(IFRAME_MIN_HEIGHT_PX);
  const expectedOrigin = getCoreForgePayOrigin();

  const sendInit = useCallback(() => {
    if (!expectedOrigin || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({ type: EMBED_PM.INIT }, expectedOrigin);
  }, [expectedOrigin]);

  useEffect(() => {
    if (!open || !expectedOrigin) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== expectedOrigin) return;
      const msg = parseEmbedMessage(event.data);
      if (!msg) return;

      switch (msg.kind) {
        case 'ready':
          sendInit();
          break;
        case 'height': {
          const maxPx = Math.floor(window.innerHeight * IFRAME_MAX_VH);
          const next = Math.min(Math.max(msg.height, IFRAME_MIN_HEIGHT_PX), maxPx);
          setIframeHeight(next);
          break;
        }
        case 'success':
          onPaymentSuccess();
          break;
        case 'error':
          if (msg.reason === 'dismiss') {
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [open, expectedOrigin, sendInit, onPaymentSuccess, onClose]);

  useEffect(() => {
    if (open) {
      setIframeHeight(IFRAME_MIN_HEIGHT_PX);
    }
  }, [open, iframeSrc]);

  if (!open || !expectedOrigin) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-carbon-900/70 pt-safe pb-safe"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coreforge-embed-title"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-carbon-900 px-4 py-3 sm:px-6">
        <h2 id="coreforge-embed-title" className="text-base font-semibold text-white sm:text-sm">
          CoreForge secure payment
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 min-w-11 touch-manipulation border-white/30 text-white hover:bg-white/10"
          onClick={onClose}
          aria-label="Close payment"
        >
          <X className="h-5 w-5" aria-hidden />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-platinum p-3 sm:p-4">
        <iframe
          ref={iframeRef}
          title="Secure payment"
          src={iframeSrc}
          className="w-full max-w-3xl mx-auto rounded-sm border border-carbon-900/15 bg-white shadow-lg"
          style={{ height: `${iframeHeight}px`, minHeight: `${IFRAME_MIN_HEIGHT_PX}px` }}
          allow="payment *; fullscreen"
        />
      </div>
    </div>
  );
}
