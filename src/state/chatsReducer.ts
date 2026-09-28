import type { ChatEvent } from '../api/notifications';
import type { Chat, ChatMessage, MessageStatus } from '../types';
import { phoneToChatId } from '../utils/phone';

export interface ChatsState {
  chats: Chat[];
  activeId: string | null;
}

export type ChatsAction =
  | { type: 'createChat'; phone: string }
  | { type: 'selectChat'; id: string | null }
  | { type: 'sendStart'; chatId: string; tempId: string; text: string; timestamp: number }
  | { type: 'sendSuccess'; chatId: string; tempId: string; idMessage: string }
  | { type: 'sendFailure'; chatId: string; tempId: string; error: string }
  | { type: 'removeMessage'; chatId: string; messageId: string }
  | { type: 'event'; event: ChatEvent };

/** Сколько последних сообщений храним в каждом чате */
export const MAX_MESSAGES = 300;

const STATUS_RANK: Record<MessageStatus, number> = { pending: 0, sent: 1, delivered: 2, read: 3, failed: 4 };

export function lastActivity(chat: Chat): number {
  return chat.messages.at(-1)?.timestamp ?? 0;
}

export function sortChats(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => lastActivity(b) - lastActivity(a));
}

function chatHasId(chat: Chat, id: string): boolean {
  return chat.id === id || chat.chatId === id || chat.aliases.includes(id);
}

function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  const seenIds = new Set<string>();
  const uniqueMessages: ChatMessage[] = [];

  for (const message of messages) {
    if (seenIds.has(message.id)) continue;
    seenIds.add(message.id);
    uniqueMessages.push(message);
  }

  return uniqueMessages.sort((a, b) => a.timestamp - b.timestamp).slice(-MAX_MESSAGES);
}

function addAlias(chat: Chat, id: string): Chat {
  return chatHasId(chat, id) ? chat : { ...chat, aliases: [...chat.aliases, id] };
}

function mergeChats(target: Chat, other: Chat): Chat {
  const merged = [other.id, other.chatId, ...other.aliases].reduce(addAlias, target);
  return {
    ...merged,
    phone: target.phone ?? other.phone,
    name: target.name ?? other.name,
    messages: normalizeMessages([...target.messages, ...other.messages]),
    unread: target.unread + other.unread,
  };
}

function updateChat(state: ChatsState, id: string, update: (chat: Chat) => Chat): ChatsState {
  return { ...state, chats: state.chats.map((chat) => (chat.id === id ? update(chat) : chat)) };
}

function updateMessage(chat: Chat, messageId: string, update: (message: ChatMessage) => ChatMessage): Chat {
  return { ...chat, messages: chat.messages.map((m) => (m.id === messageId ? update(m) : m)) };
}

/**
 * Находит чат для события. Один собеседник может приходить под разными chatId:
 * мы пишем на "79001234567@c.us", а ответ приходит от числового id Telegram.
 * Поэтому сопоставляем по chatId/алиасам, номеру телефона и idMessage отправленного сообщения,
 * а найденные дубликаты сливаем в один чат.
 */
function applyMessageEvent(state: ChatsState, event: Extract<ChatEvent, { kind: 'message' }>): ChatsState {
  const matchingChats = state.chats.filter(
    (chat) =>
      chatHasId(chat, event.chatId) ||
      (event.phone !== undefined && chat.phone === event.phone) ||
      chat.messages.some((m) => m.id === event.idMessage),
  );

  let target: Chat;
  if (matchingChats.length === 0) {
    target = {
      id: event.chatId,
      chatId: event.chatId,
      phone: event.phone,
      aliases: [],
      messages: [],
      unread: 0,
    };
  } else {
    const primaryChat = matchingChats.find((chat) => chat.phone) ?? matchingChats[0];
    target = matchingChats.filter((chat) => chat !== primaryChat).reduce(mergeChats, primaryChat);
  }
  target = addAlias(target, event.chatId);
  if (!target.phone && event.phone) target = { ...target, phone: event.phone };
  if (event.chatName && event.direction === 'incoming') target = { ...target, name: event.chatName };

  const messageAlreadyExists = target.messages.some((message) => message.id === event.idMessage);
  if (!messageAlreadyExists) {
    const message: ChatMessage = {
      id: event.idMessage,
      text: event.text,
      outgoing: event.direction === 'outgoing',
      timestamp: event.timestamp,
      unsupported: event.unsupported || undefined,
      status: event.direction === 'outgoing' ? 'sent' : undefined,
    };
    const matchingChatIds = new Set(matchingChats.map((chat) => chat.id));
    const targetChatIsActive =
      state.activeId !== null && (matchingChatIds.has(state.activeId) || state.activeId === target.id);
    target = {
      ...target,
      messages: normalizeMessages([...target.messages, message]),
      unread: target.unread + (event.direction === 'incoming' && !targetChatIsActive ? 1 : 0),
    };
  }

  const otherChats = state.chats.filter((chat) => !matchingChats.includes(chat));
  const activeChatWasMerged = matchingChats.some((chat) => chat.id === state.activeId);
  return {
    chats: [...otherChats, target],
    activeId: activeChatWasMerged ? target.id : state.activeId,
  };
}

function applyStatusEvent(state: ChatsState, event: Extract<ChatEvent, { kind: 'status' }>): ChatsState {
  const chat = state.chats.find((c) => c.messages.some((m) => m.id === event.idMessage));
  if (!chat) return state;
  return updateChat(state, chat.id, (c) =>
    updateMessage(c, event.idMessage, (m) =>
      STATUS_RANK[event.status] > STATUS_RANK[m.status ?? 'pending'] ? { ...m, status: event.status } : m,
    ),
  );
}

export function chatsReducer(state: ChatsState, action: ChatsAction): ChatsState {
  switch (action.type) {
    case 'createChat': {
      const existing = state.chats.find((chat) => chat.phone === action.phone || chatHasId(chat, action.phone));
      if (existing) return { ...state, activeId: existing.id };
      const chat: Chat = {
        id: action.phone,
        chatId: phoneToChatId(action.phone),
        phone: action.phone,
        aliases: [],
        messages: [],
        unread: 0,
      };
      return { chats: [...state.chats, chat], activeId: chat.id };
    }

    case 'selectChat':
      if (action.id === null) return { ...state, activeId: null };
      return { ...updateChat(state, action.id, (chat) => ({ ...chat, unread: 0 })), activeId: action.id };

    case 'sendStart':
      return updateChat(state, action.chatId, (chat) => ({
        ...chat,
        messages: normalizeMessages([
          ...chat.messages,
          { id: action.tempId, text: action.text, outgoing: true, timestamp: action.timestamp, status: 'pending' },
        ]),
      }));

    case 'sendSuccess':
      return updateChat(state, action.chatId, (chat) => {
        const updated = updateMessage(chat, action.tempId, (m) => ({
          ...m,
          id: action.idMessage,
          status: m.status === 'pending' ? 'sent' : m.status,
        }));
        // если эхо-уведомление outgoingAPIMessageReceived пришло раньше ответа — убираем дубликат
        return { ...updated, messages: normalizeMessages(updated.messages) };
      });

    case 'sendFailure':
      return updateChat(state, action.chatId, (chat) =>
        updateMessage(chat, action.tempId, (m) => ({ ...m, status: 'failed', error: action.error })),
      );

    case 'removeMessage':
      return updateChat(state, action.chatId, (chat) => ({
        ...chat,
        messages: chat.messages.filter((m) => m.id !== action.messageId),
      }));

    case 'event':
      return action.event.kind === 'message'
        ? applyMessageEvent(state, action.event)
        : applyStatusEvent(state, action.event);

    default:
      return state;
  }
}
