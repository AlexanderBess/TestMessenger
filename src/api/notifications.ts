import type { MessageStatus } from '../types';
import { normalizePhone } from '../utils/phone';

/** Формат уведомлений GREEN-API (только нужные нам поля) */
export interface GreenApiNotification {
  receiptId: number;
  body: NotificationBody;
}

export interface NotificationBody {
  typeWebhook: string;
  timestamp?: number;
  idMessage?: string;
  senderData?: {
    chatId: string;
    chatName?: string;
    sender?: string;
    senderName?: string;
    senderContactName?: string;
    senderPhoneNumber?: number | string;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string };
  };
  /** Поля уведомления outgoingMessageStatus */
  chatId?: string;
  status?: string;
}

export type ChatEvent =
  | {
      kind: 'message';
      direction: 'incoming' | 'outgoing';
      idMessage: string;
      chatId: string;
      phone?: string;
      chatName?: string;
      text: string;
      unsupported: boolean;
      timestamp: number;
    }
  | {
      kind: 'status';
      idMessage: string;
      chatId?: string;
      status: MessageStatus;
    };

const MESSAGE_WEBHOOKS: Record<string, 'incoming' | 'outgoing'> = {
  incomingMessageReceived: 'incoming',
  // отправлено с телефона / из другого клиента Telegram
  outgoingMessageReceived: 'outgoing',
  // отправлено через API (в т.ч. этим приложением) — дубликаты отсекаются по idMessage
  outgoingAPIMessageReceived: 'outgoing',
};

function extractText(messageData: NotificationBody['messageData']): string | null {
  if (!messageData) return null;
  switch (messageData.typeMessage) {
    case 'textMessage':
      return messageData.textMessageData?.textMessage ?? '';
    case 'extendedTextMessage':
    case 'quotedMessage':
      return messageData.extendedTextMessageData?.text ?? '';
    default:
      return null;
  }
}

function mapStatus(status: string | undefined): MessageStatus | null {
  switch (status) {
    case 'sent':
    case 'delivered':
    case 'read':
      return status;
    case 'failed':
    case 'noAccount':
    case 'notInGroup':
    case 'yellowCard':
      return 'failed';
    default:
      return null;
  }
}

/** Превращает уведомление GREEN-API в событие чата. Неинтересные уведомления → null. */
export function parseNotification(body: NotificationBody | null | undefined): ChatEvent | null {
  if (!body) return null;

  if (body.typeWebhook === 'outgoingMessageStatus') {
    const status = mapStatus(body.status);
    if (!status || !body.idMessage) return null;
    return { kind: 'status', idMessage: body.idMessage, chatId: body.chatId, status };
  }

  const direction = MESSAGE_WEBHOOKS[body.typeWebhook];
  const sender = body.senderData;
  if (!direction || !sender?.chatId || !body.idMessage) return null;

  const text = extractText(body.messageData);
  const phone =
    direction === 'incoming' && sender.senderPhoneNumber ? normalizePhone(String(sender.senderPhoneNumber)) : undefined;

  return {
    kind: 'message',
    direction,
    idMessage: body.idMessage,
    chatId: sender.chatId,
    phone: phone || undefined,
    chatName: sender.chatName || (direction === 'incoming' ? sender.senderName : undefined) || undefined,
    text: text ?? '',
    unsupported: text === null,
    timestamp: body.timestamp ? body.timestamp * 1000 : Date.now(),
  };
}
