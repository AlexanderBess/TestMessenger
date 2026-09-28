import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { errorMessage, sendMessage } from '../api/greenApi';
import type { ChatEvent } from '../api/notifications';
import { useNotifications } from '../hooks/useNotifications';
import { chatsReducer, sortChats } from '../state/chatsReducer';
import type { Chat, ChatMessage, Credentials } from '../types';
import { loadChats, saveChats } from '../utils/storage';
import { ChatView } from './ChatView';
import { Sidebar } from './Sidebar';

interface MessengerProps {
  credentials: Credentials;
  onLogout: () => void;
}

function tempMessageId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Messenger({ credentials, onLogout }: MessengerProps) {
  const [state, dispatch] = useReducer(chatsReducer, credentials.idInstance, (idInstance) => ({
    chats: loadChats(idInstance),
    activeId: null,
  }));

  useEffect(() => {
    saveChats(credentials.idInstance, state.chats);
  }, [credentials.idInstance, state.chats]);

  const handleEvent = useCallback((event: ChatEvent) => dispatch({ type: 'event', event }), []);
  const connection = useNotifications(credentials, handleEvent);

  const chats = useMemo(() => sortChats(state.chats), [state.chats]);
  const activeChat = state.chats.find((chat) => chat.id === state.activeId) ?? null;

  const handleSend = useCallback(
    async (chat: Chat, text: string) => {
      const tempId = tempMessageId();
      dispatch({ type: 'sendStart', chatId: chat.id, tempId, text, timestamp: Date.now() });
      try {
        const { idMessage } = await sendMessage(credentials, chat.chatId, text);
        dispatch({ type: 'sendSuccess', chatId: chat.id, tempId, idMessage });
      } catch (error) {
        dispatch({ type: 'sendFailure', chatId: chat.id, tempId, error: errorMessage(error) });
      }
    },
    [credentials],
  );

  const handleRetry = useCallback(
    (chat: Chat, message: ChatMessage) => {
      dispatch({ type: 'removeMessage', chatId: chat.id, messageId: message.id });
      void handleSend(chat, message.text);
    },
    [handleSend],
  );

  return (
    <div className={`app${activeChat ? ' app--chat-open' : ''}`}>
      <Sidebar
        chats={chats}
        activeId={state.activeId}
        idInstance={credentials.idInstance}
        connection={connection}
        onSelect={(id) => dispatch({ type: 'selectChat', id })}
        onCreate={(phone) => dispatch({ type: 'createChat', phone })}
        onLogout={onLogout}
      />
      <ChatView
        chat={activeChat}
        onSend={handleSend}
        onRetry={handleRetry}
        onBack={() => dispatch({ type: 'selectChat', id: null })}
      />
    </div>
  );
}
