import type { Chat, Credentials } from '../types';

const CREDENTIALS_KEY = 'green-chat:credentials';
const chatsKey = (idInstance: string) => `green-chat:chats:${idInstance}`;

// localStorage может быть недоступен (приватный режим, запрет cookies) — тогда просто работаем без сохранения.
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadCredentials(): Credentials | null {
  const value = read<Credentials>(CREDENTIALS_KEY);
  return value?.apiUrl && value.idInstance && value.apiTokenInstance ? value : null;
}

export function saveCredentials(credentials: Credentials): void {
  write(CREDENTIALS_KEY, credentials);
}

export function clearCredentials(): void {
  try {
    localStorage.removeItem(CREDENTIALS_KEY);
  } catch {
    /* ignore */
  }
}

export function loadChats(idInstance: string): Chat[] {
  const chats = read<Chat[]>(chatsKey(idInstance));
  if (!Array.isArray(chats)) return [];
  // незавершённые отправки после перезагрузки страницы считаем неудачными
  return chats.map((chat) => ({
    ...chat,
    aliases: chat.aliases ?? [],
    messages: chat.messages.map((m) =>
      m.status === 'pending' ? { ...m, status: 'failed' as const, error: 'Отправка прервана' } : m,
    ),
  }));
}

export function saveChats(idInstance: string, chats: Chat[]): void {
  write(chatsKey(idInstance), chats);
}
