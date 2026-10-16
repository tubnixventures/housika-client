export function generateId(prefix = ''): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 16; i++) {
    rand += chars[bytes[i] % chars.length];
  }
  return prefix ? `${prefix}_${rand}` : rand;
}

export function generateVerifyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export function generateOtpCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}
