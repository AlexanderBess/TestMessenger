import type { Chat } from '../types';
import { formatPhone } from './phone';

export function chatTitle(chat: Chat): string {
  return chat.name || (chat.phone ? formatPhone(chat.phone) : chat.id);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/** Время для списка чатов: сегодня — часы, иначе дата. */
export function formatListTime(timestamp: number, now = new Date()): string {
  const date = new Date(timestamp);
  if (isSameDay(date, now)) return formatTime(timestamp);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

/** Подпись разделителя дней в ленте сообщений. */
export function formatDayLabel(timestamp: number, now = new Date()): string {
  const date = new Date(timestamp);
  if (isSameDay(date, now)) return 'Сегодня';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Вчера';
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

export function dayKey(timestamp: number): string {
  return new Date(timestamp).toDateString();
}

/** Стабильный цвет аватара по id чата. */
export function avatarHue(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash) % 360;
}

export function initials(title: string): string {
  const letters = title
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]);
  return (letters.join('') || '#').toUpperCase();
}
