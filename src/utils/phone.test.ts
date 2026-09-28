import { describe, expect, it } from 'vitest';
import { formatPhone, isValidPhone, normalizePhone, phoneToChatId } from './phone';

describe('phone utils', () => {
  it('normalizes different input formats', () => {
    expect(normalizePhone('+7 (900) 123-45-67')).toBe('79001234567');
    expect(normalizePhone('8 900 123 45 67')).toBe('79001234567');
    expect(normalizePhone('+77011234567')).toBe('77011234567');
  });

  it('validates international numbers', () => {
    expect(isValidPhone('79001234567')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('09001234567')).toBe(false);
  });

  it('builds chatId and formats phone', () => {
    expect(phoneToChatId('79001234567')).toBe('79001234567@c.us');
    expect(formatPhone('79001234567')).toBe('+7 900 123-45-67');
    expect(formatPhone('4915112345678')).toBe('+4915112345678');
  });
});
