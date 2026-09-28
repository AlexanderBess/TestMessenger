import { useState, type FormEvent } from 'react';
import { isValidPhone, normalizePhone } from '../utils/phone';
import { CloseIcon } from './Icons';

interface NewChatFormProps {
  onCreate: (phone: string) => void;
  onCancel: () => void;
}

export function NewChatForm({ onCreate, onCancel }: NewChatFormProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const phone = normalizePhone(value);
    if (!isValidPhone(phone)) {
      setError('Введите номер в международном формате, например +7 900 123-45-67');
      return;
    }
    onCreate(phone);
  }

  return (
    <form className="new-chat" onSubmit={handleSubmit} noValidate>
      <div className="new-chat__header">
        <span>Новый чат</span>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Отмена">
          <CloseIcon />
        </button>
      </div>
      <div className="new-chat__row">
        <input
          className="field__input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Номер телефона получателя"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          aria-invalid={error !== null}
          autoFocus
        />
        <button className="button button--primary" type="submit" disabled={!value.trim()}>
          Создать
        </button>
      </div>
      {error && (
        <p className="new-chat__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
