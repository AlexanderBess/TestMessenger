/** Учётные данные инстанса GREEN-API */
export interface Credentials {
  /** Хост API из личного кабинета, например https://4100.api.green-api.com */
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  /** idMessage из GREEN-API или временный локальный id для неотправленного сообщения */
  id: string;
  text: string;
  outgoing: boolean;
  /** Время в миллисекундах */
  timestamp: number;
  status?: MessageStatus;
  /** Текст ошибки отправки */
  error?: string;
  /** Сообщение не текстовое — показываем заглушку */
  unsupported?: boolean;
}

export interface Chat {
  /** Локальный ключ чата: номер телефона (только цифры) или chatId из Telegram */
  id: string;
  /** chatId, который передаём в sendMessage */
  chatId: string;
  /** Номер телефона (только цифры), если известен */
  phone?: string;
  /** Имя собеседника из уведомлений */
  name?: string;
  /** Другие chatId, под которыми GREEN-API присылает события этого чата */
  aliases: string[];
  messages: ChatMessage[];
  unread: number;
}
