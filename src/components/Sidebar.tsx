import { useState } from 'react';
import type { ConnectionStatus } from '../hooks/useNotifications';
import type { Chat } from '../types';
import { chatTitle, formatListTime } from '../utils/format';
import { Avatar } from './Avatar';
import { LogoutIcon, PlusIcon } from './Icons';
import { NewChatForm } from './NewChatForm';

interface SidebarProps {
  chats: Chat[];
  activeId: string | null;
  idInstance: string;
  connection: ConnectionStatus;
  onSelect: (id: string) => void;
  onCreate: (phone: string) => void;
  onLogout: () => void;
}

const CONNECTION_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Подключение…',
  online: 'В сети',
  offline: 'Нет соединения, переподключаемся…',
};

function preview(chat: Chat): string {
  const last = chat.messages.at(-1);
  if (!last) return 'Нет сообщений';
  const text = last.unsupported ? 'Неподдерживаемое сообщение' : last.text;
  return last.outgoing ? `Вы: ${text}` : text;
}

export function Sidebar({ chats, activeId, idInstance, connection, onSelect, onCreate, onLogout }: SidebarProps) {
  const [creating, setCreating] = useState(false);

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__account">
          <h1 className="sidebar__title">Чаты</h1>
          <span className={`connection connection--${connection}`}>
            <span className="connection__dot" aria-hidden="true" />
            {CONNECTION_LABEL[connection]} · {idInstance}
          </span>
        </div>
        <button className="icon-button" onClick={() => setCreating(true)} aria-label="Новый чат" title="Новый чат">
          <PlusIcon />
        </button>
        <button className="icon-button" onClick={onLogout} aria-label="Выйти" title="Выйти">
          <LogoutIcon />
        </button>
      </header>

      {creating && (
        <NewChatForm
          onCancel={() => setCreating(false)}
          onCreate={(phone) => {
            onCreate(phone);
            setCreating(false);
          }}
        />
      )}

      {chats.length === 0 ? (
        <div className="sidebar__empty">
          <p>Здесь пока пусто</p>
          {!creating && (
            <button className="button button--primary" onClick={() => setCreating(true)}>
              Написать сообщение
            </button>
          )}
        </div>
      ) : (
        <ul className="chat-list">
          {chats.map((chat) => {
            const title = chatTitle(chat);
            const last = chat.messages.at(-1);
            return (
              <li key={chat.id}>
                <button
                  className={`chat-item${chat.id === activeId ? ' chat-item--active' : ''}`}
                  onClick={() => onSelect(chat.id)}
                  aria-current={chat.id === activeId}
                >
                  <Avatar id={chat.id} title={title} />
                  <span className="chat-item__body">
                    <span className="chat-item__top">
                      <span className="chat-item__title">{title}</span>
                      {last && <span className="chat-item__time">{formatListTime(last.timestamp)}</span>}
                    </span>
                    <span className="chat-item__bottom">
                      <span className="chat-item__preview">{preview(chat)}</span>
                      {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
