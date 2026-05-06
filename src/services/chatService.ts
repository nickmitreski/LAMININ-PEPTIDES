import { supabase } from '../lib/supabase';
import type { ChatProductLink } from '../lib/chatPeptideLinks';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** Resolved product links shown under assistant replies (persisted with history). */
  suggestedLinks?: ChatProductLink[];
}

export interface ChatResponse {
  message: string;
  suggestedPeptides?: string[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI chat completions expect alternating user/assistant turns; the first
 * message after `system` must be from the user. Our UI injects a local-only
 * welcome bubble — never forward that to the API.
 */
function toApiMessages(messages: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  const trimmed = messages.filter(
    m =>
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0
  );
  while (trimmed.length > 0 && trimmed[0].role === 'assistant') {
    trimmed.shift();
  }
  return trimmed.map(m => ({ role: m.role, content: m.content.trim() }));
}

/**
 * Send a chat message to the Laminin peptide assistant
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  sessionId?: string
): Promise<{ success: boolean; data?: ChatResponse; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const apiMessages = toApiMessages(messages);
    if (apiMessages.length === 0) {
      return { success: false, error: 'No message to send' };
    }

    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        messages: apiMessages,
        sessionId,
      },
    });

    if (error) {
      console.error('Chat API error:', error);
      return { success: false, error: error.message };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      data: {
        message: data.message,
        suggestedPeptides: data.suggestedPeptides as string[] | undefined,
        usage: data.usage,
      },
    };
  } catch (err) {
    console.error('Chat service exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get or create a session ID for the chat
 */
export function getChatSessionId(): string {
  const stored = sessionStorage.getItem('laminin_chat_session');
  if (stored) return stored;

  const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  sessionStorage.setItem('laminin_chat_session', newId);
  return newId;
}

/**
 * Save chat history to sessionStorage
 */
export function saveChatHistory(messages: ChatMessage[]): void {
  try {
    sessionStorage.setItem('laminin_chat_history', JSON.stringify(messages));
  } catch (err) {
    console.warn('Could not save chat history:', err);
  }
}

/**
 * Load chat history from sessionStorage
 */
export function loadChatHistory(): ChatMessage[] {
  try {
    const stored = sessionStorage.getItem('laminin_chat_history');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (err) {
    console.warn('Could not load chat history:', err);
    return [];
  }
}

/**
 * Clear chat history
 */
export function clearChatHistory(): void {
  sessionStorage.removeItem('laminin_chat_history');
  sessionStorage.removeItem('laminin_chat_session');
}
