import { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Send, Loader2, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';
import { Text } from '../ui/Typography';
import {
  sendChatMessage,
  getChatSessionId,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  type ChatMessage,
} from '../../services/chatService';

interface ChatPanelProps {
  onClose: () => void;
  onMinimize: () => void;
}

const SUGGESTED_PROMPTS = [
  'What peptides help with weight loss?',
  'Tell me about BPC-157 research',
  'What are the differences between Selank and Semax?',
  'How do I order from Laminin?',
];

export default function ChatPanel({ onClose, onMinimize }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPeptides, setSuggestedPeptides] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef(getChatSessionId());

  // Load chat history on mount
  useEffect(() => {
    const history = loadChatHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      // Welcome message
      setMessages([
        {
          role: 'assistant',
          content: 'Hi! I can help you learn about peptides and research compounds. What would you like to know?',
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setSuggestedPeptides([]);

    try {
      const result = await sendChatMessage(newMessages, sessionId.current);

      if (result.success && result.data) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: result.data.message,
          timestamp: Date.now(),
        };

        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        saveChatHistory(updatedMessages);

        // Set suggested peptides if any
        if (result.data.suggestedPeptides && result.data.suggestedPeptides.length > 0) {
          setSuggestedPeptides(result.data.suggestedPeptides);
        }
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${result.error || 'Unknown error'}. Please try again.`,
          timestamp: Date.now(),
        };
        setMessages([...newMessages, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    clearChatHistory();
    sessionId.current = getChatSessionId();
    setMessages([
      {
        role: 'assistant',
        content: 'Hi! I can help you learn about peptides and research compounds. What would you like to know?',
        timestamp: Date.now(),
      },
    ]);
    setSuggestedPeptides([]);
  };

  return (
    <div
      className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[110] flex flex-col bg-white sm:rounded-lg shadow-2xl sm:w-[420px] sm:h-[600px] pt-safe pb-safe"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-carbon-900/10 bg-carbon-900 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
            <span className="text-xs font-bold text-carbon-900">LA</span>
          </div>
          <div className="min-w-0">
            <h2 id="chat-title" className="text-sm font-semibold text-white truncate">
              Peptide Science AI
            </h2>
            <Text variant="caption" className="text-white/70 text-xs">
              Research education
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-sm transition-colors touch-manipulation"
            aria-label="Reset chat"
            title="Start new conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMinimize}
            className="hidden sm:block p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-sm transition-colors touch-manipulation"
            aria-label="Minimize chat"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-sm transition-colors touch-manipulation"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-carbon-900 text-white'
                  : 'bg-neutral-100 text-carbon-900'
              }`}
            >
              <Text variant="caption" className={msg.role === 'user' ? 'text-white' : 'text-carbon-900'}>
                {msg.content}
              </Text>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-carbon-900" />
              <Text variant="caption" className="text-neutral-600">
                Thinking...
              </Text>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested peptides chips */}
      {suggestedPeptides.length > 0 && !isLoading && (
        <div className="border-t border-carbon-900/10 px-4 py-3 bg-neutral-50">
          <Text variant="caption" muted className="mb-2 block text-xs">
            Explore these peptides:
          </Text>
          <div className="flex flex-wrap gap-2">
            {suggestedPeptides.map((peptide, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(`Tell me more about ${peptide}`)}
                className="px-3 py-1.5 bg-carbon-900 text-white text-xs font-medium rounded-full hover:bg-carbon-900/90 transition-colors touch-manipulation"
              >
                {peptide}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested prompts (only show when no messages beyond welcome) */}
      {messages.length === 1 && !isLoading && (
        <div className="border-t border-carbon-900/10 px-4 py-3 bg-neutral-50">
          <Text variant="caption" muted className="mb-2 block text-xs">
            Try asking:
          </Text>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 bg-white text-carbon-900 text-xs font-medium rounded-full border border-carbon-900/20 hover:bg-neutral-100 transition-colors touch-manipulation"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input composer */}
      <div className="border-t border-carbon-900/10 p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about peptides..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-sm border border-carbon-900/20 px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-carbon-900 focus:outline-none focus:ring-1 focus:ring-carbon-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="shrink-0 px-4 touch-manipulation"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Text variant="caption" muted className="mt-2 block text-[10px] leading-snug">
          For education only. Not medical advice. Discuss health decisions with a clinician.
        </Text>
      </div>
    </div>
  );
}
