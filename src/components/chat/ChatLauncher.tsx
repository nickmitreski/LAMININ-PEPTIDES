import { MessageCircle } from 'lucide-react';
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
            flex items-center gap-5
            px-10 py-6
            text-white
            rounded-full shadow-lg
            border-4 border-black
            hover:brightness-110 active:brightness-95
            transition-all duration-200
            touch-manipulation
            ${isMinimized ? 'ring-2 ring-accent ring-offset-2' : ''}
          `}
          style={{ backgroundColor: '#00CED1' }}
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-10 w-10" strokeWidth={2.5} />
          <span className="font-bold text-sm sm:text-lg">
            {isMinimized ? 'Peptide Sciece AI (1)' : 'Peptide Sciece AI'}
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
