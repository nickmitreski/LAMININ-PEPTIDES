import { MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ChatPanel from './ChatPanel';

export default function ChatLauncher() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const onProductPage = location.pathname.startsWith('/products/');

  useEffect(() => {
    const minimized = sessionStorage.getItem('laminin_chat_minimized') === 'true';
    setIsMinimized(minimized);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    sessionStorage.setItem('laminin_chat_minimized', 'false');
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    sessionStorage.setItem('laminin_chat_minimized', 'false');
  };

  const handleMinimize = () => {
    setIsOpen(false);
    setIsMinimized(true);
    sessionStorage.setItem('laminin_chat_minimized', 'true');
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          className={`
            fixed right-4 z-[100] sm:right-6
            inline-flex min-h-11 min-w-11 items-center justify-center gap-2
            rounded-full border border-carbon-900/15 bg-white/95 px-3
            text-carbon-900 shadow-md backdrop-blur-sm
            hover:bg-accent/20 active:bg-accent/30
            transition-colors duration-200
            touch-manipulation
            ${isMinimized ? 'ring-2 ring-accent/60 ring-offset-2' : ''}
            ${
              onProductPage
                ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-6'
                : 'bottom-6'
            }
          `}
          aria-label="Ask about compounds"
          title="Ask about compounds"
        >
          <MessageCircle className="h-5 w-5 text-accent-700" strokeWidth={2} />
          <span className="hidden pr-1 text-xs font-medium text-carbon-900 sm:inline">
            {isMinimized ? 'Ask (1)' : 'Ask about compounds'}
          </span>
        </button>
      )}

      {isOpen && (
        <ChatPanel
          onClose={handleClose}
          onMinimize={handleMinimize}
        />
      )}
    </>
  );
}
