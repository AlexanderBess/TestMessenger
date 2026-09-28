import { Fragment, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { dayKey, formatDayLabel, formatTime } from '../utils/format';
import { AlertIcon, CheckIcon, ClockIcon, DoubleCheckIcon } from './Icons';

interface MessageListProps {
  messages: ChatMessage[];
  onRetry: (message: ChatMessage) => void;
}

function StatusMark({ message }: { message: ChatMessage }) {
  // иконки по умолчанию aria-hidden, у статусов оставляем подпись для скринридеров
  const a11y = { role: 'img', 'aria-hidden': false } as const;
  switch (message.status) {
    case 'pending':
      return <ClockIcon {...a11y} className="status" aria-label="Отправляется" />;
    case 'sent':
      return <CheckIcon {...a11y} className="status" aria-label="Отправлено" />;
    case 'delivered':
      return <DoubleCheckIcon {...a11y} className="status" aria-label="Доставлено" />;
    case 'read':
      return <DoubleCheckIcon {...a11y} className="status status--read" aria-label="Прочитано" />;
    case 'failed':
      return <AlertIcon {...a11y} className="status status--failed" aria-label="Не отправлено" />;
    default:
      return null;
  }
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;

  // прокручиваем вниз при появлении нового сообщения
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lastId, messages.length]);

  if (messages.length === 0) {
    return (
      <div className="messages messages--empty">
        <p>Сообщений пока нет. Напишите первым!</p>
      </div>
    );
  }

  return (
    <div className="messages" role="log" aria-live="polite">
      {messages.map((message, index) => {
        const showDay = index === 0 || dayKey(messages[index - 1].timestamp) !== dayKey(message.timestamp);
        return (
          <Fragment key={message.id}>
            {showDay && <div className="day-separator">{formatDayLabel(message.timestamp)}</div>}
            <div className={`message ${message.outgoing ? 'message--out' : 'message--in'}`}>
              <div className={`bubble${message.status === 'failed' ? ' bubble--failed' : ''}`}>
                {message.unsupported ? (
                  <span className="bubble__unsupported">Сообщение этого типа не поддерживается</span>
                ) : (
                  <span className="bubble__text">{message.text}</span>
                )}
                <span className="bubble__meta">
                  {formatTime(message.timestamp)}
                  {message.outgoing && <StatusMark message={message} />}
                </span>
              </div>
              {message.status === 'failed' && (
                <div className="message__error">
                  {message.error ?? 'Не отправлено'} ·{' '}
                  <button className="link-button" onClick={() => onRetry(message)}>
                    Повторить
                  </button>
                </div>
              )}
            </div>
          </Fragment>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
