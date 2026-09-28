import type { Credentials } from '../types';
import type { GreenApiNotification } from './notifications';

export class GreenApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GreenApiError';
    this.status = status;
  }
}

/** Хост API по умолчанию: первые 4 цифры idInstance — номер сервера (как в личном кабинете). */
export function defaultApiUrl(idInstance: string): string {
  const digits = idInstance.replace(/\D/g, '');
  return digits.length >= 4 ? `https://${digits.slice(0, 4)}.api.green-api.com` : '';
}

function buildUrl({ apiUrl, idInstance, apiTokenInstance }: Credentials, method: string, suffix = ''): string {
  const host = apiUrl.trim().replace(/\/+$/, '');
  return `${host}/waInstance${idInstance.trim()}/${method}/${apiTokenInstance.trim()}${suffix}`;
}

function httpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Некорректный запрос. Проверьте номер телефона и текст сообщения.';
    case 401:
    case 403:
      return 'Неверный idInstance или apiTokenInstance.';
    case 404:
      return 'Инстанс не найден. Проверьте idInstance и apiUrl.';
    case 429:
      return 'Слишком много запросов. Попробуйте чуть позже.';
    case 466:
      return 'Превышен лимит тарифа GREEN-API.';
    default:
      return status >= 500 ? 'Сервер GREEN-API временно недоступен.' : `Ошибка GREEN-API (HTTP ${status}).`;
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new GreenApiError('Не удалось подключиться к GREEN-API. Проверьте apiUrl и интернет-соединение.');
  }
  if (!response.ok) throw new GreenApiError(httpErrorMessage(response.status), response.status);

  const body = await response.text();
  return (body ? JSON.parse(body) : null) as T;
}

/** Состояние инстанса: authorized, notAuthorized, blocked, starting… */
export function getStateInstance(credentials: Credentials, signal?: AbortSignal): Promise<{ stateInstance: string }> {
  return request(buildUrl(credentials, 'getStateInstance'), { signal });
}

/** https://green-api.com/telegram/docs/api/sending/SendMessage/ */
export function sendMessage(credentials: Credentials, chatId: string, message: string): Promise<{ idMessage: string }> {
  return request(buildUrl(credentials, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  });
}

/**
 * Long polling: ждёт уведомление до receiveTimeout секунд (5–60), возвращает null, если очередь пуста.
 * https://green-api.com/telegram/docs/api/receiving/technology-http-api/ReceiveNotification/
 */
export function receiveNotification(
  credentials: Credentials,
  receiveTimeout: number,
  signal?: AbortSignal,
): Promise<GreenApiNotification | null> {
  return request(buildUrl(credentials, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`), { signal });
}

/** Удаляет обработанное уведомление из очереди, иначе оно придёт снова. */
export function deleteNotification(credentials: Credentials, receiptId: number, signal?: AbortSignal): Promise<{ result: boolean }> {
  return request(buildUrl(credentials, 'deleteNotification', `/${receiptId}`), { method: 'DELETE', signal });
}

export function errorMessage(error: unknown): string {
  if (error instanceof GreenApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Неизвестная ошибка';
}
