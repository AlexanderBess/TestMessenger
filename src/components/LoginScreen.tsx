import { useState, type FormEvent } from 'react';
import { defaultApiUrl, errorMessage, getStateInstance } from '../api/greenApi';
import type { Credentials } from '../types';

interface LoginScreenProps {
  onLogin: (credentials: Credentials) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // apiUrl подставляется автоматически по idInstance, пока пользователь не изменит его вручную
  const apiUrl = customApiUrl ?? defaultApiUrl(idInstance);
  const canSubmit = /^\d+$/.test(idInstance.trim()) && apiTokenInstance.trim() !== '' && apiUrl.trim() !== '' && !loading;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    const credentials: Credentials = {
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    };

    setLoading(true);
    setError(null);
    try {
      const { stateInstance } = await getStateInstance(credentials);
      if (stateInstance !== 'authorized') {
        setError(`Инстанс не авторизован (статус: ${stateInstance}). Авторизуйте его в личном кабинете GREEN-API.`);
        return;
      }
      onLogin(credentials);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <form className="login__card" onSubmit={handleSubmit} noValidate>
        <div className="login__logo" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="56" height="56">
            <defs>
              <linearGradient id="login-logo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#3d8bff" />
                <stop offset="1" stopColor="#7b4dff" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="18" fill="url(#login-logo)" />
            <path d="M18 22h28a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H30l-9 7v-7h-3a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4z" fill="#fff" />
          </svg>
        </div>
        <h1 className="login__title">Вход в чат</h1>
        <p className="login__subtitle">
          Введите данные инстанса Telegram из{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личного кабинета GREEN-API
          </a>
        </p>

        <label className="field">
          <span className="field__label">idInstance</span>
          <input
            className="field__input"
            inputMode="numeric"
            autoComplete="username"
            placeholder="4100123456"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field__label">apiTokenInstance</span>
          <input
            className="field__input"
            type="password"
            autoComplete="current-password"
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">apiUrl</span>
          <input
            className="field__input"
            type="url"
            placeholder="https://4100.api.green-api.com"
            value={apiUrl}
            onChange={(e) => setCustomApiUrl(e.target.value)}
          />
          <span className="field__hint">Подставляется автоматически, при необходимости скопируйте из личного кабинета</span>
        </label>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button className="button button--primary" type="submit" disabled={!canSubmit}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
