import { describe, expect, it } from 'vitest';
import type { ChatEvent } from '../api/notifications';
import { chatsReducer, type ChatsState } from './chatsReducer';

const empty: ChatsState = { chats: [], activeId: null };
const PHONE = '79001234567';

function incoming(overrides: Partial<Extract<ChatEvent, { kind: 'message' }>> = {}): ChatEvent {
  return {
    kind: 'message',
    direction: 'incoming',
    idMessage: 'in-1',
    chatId: '10000000',
    phone: PHONE,
    chatName: 'Иван',
    text: 'Привет',
    unsupported: false,
    timestamp: 2000,
    ...overrides,
  };
}

function withSentMessage(): ChatsState {
  let state = chatsReducer(empty, { type: 'createChat', phone: PHONE });
  state = chatsReducer(state, { type: 'sendStart', chatId: PHONE, tempId: 'tmp', text: 'Hi', timestamp: 1000 });
  return chatsReducer(state, { type: 'sendSuccess', chatId: PHONE, tempId: 'tmp', idMessage: 'out-1' });
}

describe('chatsReducer', () => {
  it('creates a chat by phone and selects it', () => {
    const state = chatsReducer(empty, { type: 'createChat', phone: PHONE });
    expect(state.activeId).toBe(PHONE);
    expect(state.chats[0]).toMatchObject({ id: PHONE, chatId: `${PHONE}@c.us`, phone: PHONE });
  });

  it('does not duplicate an existing chat', () => {
    let state = chatsReducer(empty, { type: 'createChat', phone: PHONE });
    state = chatsReducer(state, { type: 'createChat', phone: PHONE });
    expect(state.chats).toHaveLength(1);
  });

  it('tracks send lifecycle', () => {
    const state = withSentMessage();
    expect(state.chats[0].messages).toEqual([
      { id: 'out-1', text: 'Hi', outgoing: true, timestamp: 1000, status: 'sent' },
    ]);

    const failed = chatsReducer(
      chatsReducer(state, { type: 'sendStart', chatId: PHONE, tempId: 'tmp2', text: 'x', timestamp: 1500 }),
      { type: 'sendFailure', chatId: PHONE, tempId: 'tmp2', error: 'boom' },
    );
    expect(failed.chats[0].messages[1]).toMatchObject({ status: 'failed', error: 'boom' });
  });

  it('puts a reply from Telegram id into the chat created by phone', () => {
    const state = chatsReducer(withSentMessage(), { type: 'event', event: incoming() });
    expect(state.chats).toHaveLength(1);
    const chat = state.chats[0];
    expect(chat.name).toBe('Иван');
    expect(chat.aliases).toContain('10000000');
    expect(chat.messages.map((m) => m.id)).toEqual(['out-1', 'in-1']);
    expect(chat.unread).toBe(0); // чат открыт
  });

  it('counts unread for inactive chats and resets on select', () => {
    let state = chatsReducer(withSentMessage(), { type: 'selectChat', id: null });
    state = chatsReducer(state, { type: 'event', event: incoming() });
    expect(state.chats[0].unread).toBe(1);
    state = chatsReducer(state, { type: 'selectChat', id: PHONE });
    expect(state.chats[0].unread).toBe(0);
  });

  it('ignores duplicate notifications (API echo)', () => {
    const echo: ChatEvent = { ...(incoming() as Extract<ChatEvent, { kind: 'message' }>), direction: 'outgoing', idMessage: 'out-1', chatId: `${PHONE}@c.us`, phone: undefined };
    const state = chatsReducer(withSentMessage(), { type: 'event', event: echo });
    expect(state.chats).toHaveLength(1);
    expect(state.chats[0].messages).toHaveLength(1);
  });

  it('creates a chat for an unknown sender', () => {
    const state = chatsReducer(empty, { type: 'event', event: incoming({ phone: undefined, chatId: '555' }) });
    expect(state.chats[0]).toMatchObject({ id: '555', chatId: '555', name: 'Иван', unread: 1 });
  });

  it('merges a chat created from phone-side messages once the phone becomes known', () => {
    // сначала пришло исходящее с телефона под числовым id, потом входящее с номером
    let state = chatsReducer(empty, { type: 'createChat', phone: PHONE });
    state = chatsReducer(state, {
      type: 'event',
      event: incoming({ direction: 'outgoing', idMessage: 'phone-out', phone: undefined, timestamp: 1500 }),
    });
    expect(state.chats).toHaveLength(2);
    state = chatsReducer(state, { type: 'event', event: incoming() });
    expect(state.chats).toHaveLength(1);
    expect(state.chats[0].id).toBe(PHONE);
    expect(state.chats[0].messages.map((m) => m.id)).toEqual(['phone-out', 'in-1']);
  });

  it('upgrades message status but never downgrades it', () => {
    let state = chatsReducer(withSentMessage(), {
      type: 'event',
      event: { kind: 'status', idMessage: 'out-1', status: 'read' },
    });
    state = chatsReducer(state, { type: 'event', event: { kind: 'status', idMessage: 'out-1', status: 'delivered' } });
    expect(state.chats[0].messages[0].status).toBe('read');
  });
});
