import { MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ChatPanel from './ChatPanel';

export default function ChatLauncher() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const onProductPage = location.pathname.startsWith('/products/');

  // Restore minimized state on mount
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
      {/* Chat launcher button — lift above sticky ATC on product mobile */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          className={`
            fixed right-4 z-[100]
            flex min-h-11 min-w-11 items-center gap-2
            px-4 py-2 sm:right-6 sm:gap-3 sm:px-6
            bg-accent text-white
            rounded-full shadow-lg
            border-2 border-black
            hover:brightness-110 active:brightness-95
            transition-all duration-200
            touch-manipulation
            ${isMinimized ? 'ring-2 ring-accent ring-offset-2' : ''}
            ${
              onProductPage
                ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-6'
                : 'bottom-6'
            }
          `}
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2.5} />
          <span className="hidden font-bold text-xs sm:inline sm:text-sm">
            {isMinimized ? 'Peptide Science AI (1)' : 'Peptide Science AI'}
          </span>
          <span className="font-bold text-xs sm:hidden">
            {isMinimized ? 'AI (1)' : 'AI'}
          </span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <ChatPanel
          onClose={handleClose}
          onMinimize={handleMinimize}
        />
      )}
    </>
  );
}
