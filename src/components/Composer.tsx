import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { SendIcon } from './Icons';

/** Ограничение GREEN-API на длину текста */
export const MAX_MESSAGE_LENGTH = 4096;

interface ComposerProps {
  onSend: (text: string) => void;
}

export function Composer({ onSend }: ComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();

  // авто-высота поля ввода
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter — отправить, Shift+Enter — перенос строки
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <textarea
        ref={textareaRef}
        className="composer__input"
        rows={1}
        placeholder="Сообщение"
        value={text}
        maxLength={MAX_MESSAGE_LENGTH}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Текст сообщения"
        autoFocus
      />
      <button className="composer__send" type="submit" disabled={!trimmed} aria-label="Отправить" title="Отправить (Enter)">
        <SendIcon />
      </button>
    </form>
  );
}
