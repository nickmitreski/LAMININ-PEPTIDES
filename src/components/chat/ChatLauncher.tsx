import { MessageCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';

export default function ChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

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
      {/* Chat launcher button */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          className={`
            fixed bottom-6 right-6 z-[100]
            flex items-center gap-3
            px-5 py-3
            bg-carbon-900 text-white
            rounded-full shadow-lg
            hover:bg-carbon-900/90 active:bg-carbon-900/95
            transition-all duration-200
            touch-manipulation
            ${isMinimized ? 'ring-2 ring-accent ring-offset-2' : ''}
          `}
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2} />
          <span className="font-medium text-sm hidden sm:inline">
            {isMinimized ? 'Chat (1)' : 'Ask about peptides'}
          </span>
          <span className="font-medium text-sm sm:hidden">
            Chat
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
