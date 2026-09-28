import { describe, expect, it } from 'vitest';
import { parseNotification, type NotificationBody } from './notifications';

const incomingText: NotificationBody = {
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1763115112,
  idMessage: 'in-1',
  senderData: {
    chatId: '10000000',
    chatName: 'Василиса',
    sender: '10000000',
    senderName: 'Василиса Премудрая',
    senderPhoneNumber: 79876543210,
  },
  messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет!' } },
};

describe('parseNotification', () => {
  it('parses incoming text message', () => {
    expect(parseNotification(incomingText)).toEqual({
      kind: 'message',
      direction: 'incoming',
      idMessage: 'in-1',
      chatId: '10000000',
      phone: '79876543210',
      chatName: 'Василиса',
      text: 'Привет!',
      unsupported: false,
      timestamp: 1763115112000,
    });
  });

  it('parses extended and quoted text messages', () => {
    const body: NotificationBody = {
      ...incomingText,
      messageData: { typeMessage: 'quotedMessage', extendedTextMessageData: { text: 'Ответ' } },
    };
    expect(parseNotification(body)).toMatchObject({ text: 'Ответ', unsupported: false });
  });

  it('marks non-text messages as unsupported', () => {
    const body: NotificationBody = { ...incomingText, messageData: { typeMessage: 'imageMessage' } };
    expect(parseNotification(body)).toMatchObject({ unsupported: true, text: '' });
  });

  it('parses outgoing messages sent from phone', () => {
    const body: NotificationBody = { ...incomingText, typeWebhook: 'outgoingMessageReceived', idMessage: 'out-1' };
    expect(parseNotification(body)).toMatchObject({ direction: 'outgoing', idMessage: 'out-1', phone: undefined });
  });

  it('parses and maps delivery statuses', () => {
    expect(
      parseNotification({ typeWebhook: 'outgoingMessageStatus', idMessage: 'out-1', chatId: '1', status: 'read' }),
    ).toEqual({ kind: 'status', idMessage: 'out-1', chatId: '1', status: 'read' });
    expect(
      parseNotification({ typeWebhook: 'outgoingMessageStatus', idMessage: 'out-1', status: 'noAccount' }),
    ).toMatchObject({ status: 'failed' });
  });

  it('ignores other notifications', () => {
    expect(parseNotification({ typeWebhook: 'stateInstanceChanged' })).toBeNull();
    expect(parseNotification(null)).toBeNull();
  });
});
