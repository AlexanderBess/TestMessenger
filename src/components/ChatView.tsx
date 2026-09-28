import type { Chat, ChatMessage } from '../types';
import { chatTitle } from '../utils/format';
import { formatPhone } from '../utils/phone';
import { Avatar } from './Avatar';
import { Composer } from './Composer';
import { BackIcon, ChatBubbleIcon } from './Icons';
import { MessageList } from './MessageList';

interface ChatViewProps {
  chat: Chat | null;
  onSend: (chat: Chat, text: string) => void;
  onRetry: (chat: Chat, message: ChatMessage) => void;
  onBack: () => void;
}

export function ChatView({ chat, onSend, onRetry, onBack }: ChatViewProps) {
  if (!chat) {
    return (
      <section className="chat chat--placeholder">
        <ChatBubbleIcon width={56} height={56} strokeWidth={1.5} />
        <p>Выберите чат или создайте новый</p>
      </section>
    );
  }

  const title = chatTitle(chat);
  const subtitle = chat.name && chat.phone ? formatPhone(chat.phone) : 'Telegram';

  return (
    <section className="chat">
      <header className="chat__header">
        <button className="icon-button chat__back" onClick={onBack} aria-label="Назад к списку чатов">
          <BackIcon />
        </button>
        <Avatar id={chat.id} title={title} size={40} />
        <div className="chat__info">
          <h2 className="chat__title">{title}</h2>
          <span className="chat__subtitle">{subtitle}</span>
        </div>
      </header>
      <MessageList messages={chat.messages} onRetry={(message) => onRetry(chat, message)} />
      <Composer key={chat.id} onSend={(text) => onSend(chat, text)} />
    </section>
  );
}
