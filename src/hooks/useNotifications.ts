import { useEffect, useRef, useState } from 'react';
import { deleteNotification, getStateInstance, receiveNotification } from '../api/greenApi';
import { parseNotification, type ChatEvent } from '../api/notifications';
import type { Credentials } from '../types';

export type ConnectionStatus = 'connecting' | 'online' | 'offline';

const RECEIVE_TIMEOUT_SEC = 20;
const MAX_RETRY_DELAY_MS = 30_000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

/**
 * Получение входящих через HTTP API (long polling):
 * receiveNotification → обработка → deleteNotification → снова receiveNotification.
 * При сетевых ошибках повторяет запросы с экспоненциальной задержкой.
 */
export function useNotifications(credentials: Credentials, onEvent: (event: ChatEvent) => void): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      let retryDelay = 1000;
      let connected = false;
      while (!signal.aborted) {
        try {
          // быстрая проверка соединения, чтобы не ждать первый long poll (до 20 секунд)
          if (!connected) {
            const { stateInstance } = await getStateInstance(credentials, signal);
            if (stateInstance !== 'authorized') throw new Error(`Инстанс не авторизован: ${stateInstance}`);
            connected = true;
            setStatus('online');
          }
          const notification = await receiveNotification(credentials, RECEIVE_TIMEOUT_SEC, signal);
          setStatus('online');
          retryDelay = 1000;
          if (!notification) continue;

          try {
            const event = parseNotification(notification.body);
            if (event) onEventRef.current(event);
          } finally {
            await deleteNotification(credentials, notification.receiptId, signal);
          }
        } catch (error) {
          if (signal.aborted) break;
          console.warn('[GREEN-API] ошибка получения уведомлений:', error);
          connected = false;
          setStatus('offline');
          await sleep(retryDelay, signal);
          retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
        }
      }
    })();

    return () => controller.abort();
  }, [credentials]);

  return status;
}
