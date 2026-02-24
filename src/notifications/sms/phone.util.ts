export function toE164Iran(phone: string): string {
  const p = (phone || '').trim();

  // already E.164
  if (p.startsWith('+')) return p;

  // 09xxxxxxxxx -> +989xxxxxxxxx
  if (p.startsWith('09') && p.length === 11) {
    return '+98' + p.substring(1);
  }

  // 9xxxxxxxxx -> +989xxxxxxxxx
  if (p.startsWith('9') && p.length === 10) {
    return '+98' + p;
  }

  // 98xxxxxxxxxx -> +98xxxxxxxxxx
  if (p.startsWith('98')) return '+' + p;

  // fallback (می‌تونی سخت‌گیرترش کنی)
  return p;
}
