/** Оставляет только цифры; российский формат 8XXXXXXXXXX приводит к 7XXXXXXXXXX. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
  return digits;
}

/** Международный номер без "+": 10–15 цифр, не начинается с 0. */
export function isValidPhone(digits: string): boolean {
  return /^[1-9]\d{9,14}$/.test(digits);
}

/** chatId для отправки по номеру телефона (формат GREEN-API). */
export function phoneToChatId(digits: string): string {
  return `${digits}@c.us`;
}

export function formatPhone(digits: string): string {
  const ru = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(digits);
  if (ru) return `+7 ${ru[1]} ${ru[2]}-${ru[3]}-${ru[4]}`;
  return `+${digits}`;
}
