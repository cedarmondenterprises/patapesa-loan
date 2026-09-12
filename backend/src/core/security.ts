import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';

const keyFrom = (secret: string): Buffer => createHash('sha256').update(secret).digest();

export function encryptSensitive(value: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher
    .getAuthTag()
    .toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptSensitive(value: string, secret: string): string {
  const [ivValue, tagValue, encryptedValue] = value.split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Encrypted value is malformed');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    keyFrom(secret),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function blindIndex(value: string, secret: string): string {
  return createHmac('sha256', keyFrom(secret)).update(value.toUpperCase()).digest('hex');
}

export function resetToken(): { raw: string; digest: string } {
  const raw = randomBytes(32).toString('base64url');
  return { raw, digest: createHash('sha256').update(raw).digest('hex') };
}

export const digestResetToken = (raw: string): string =>
  createHash('sha256').update(raw).digest('hex');
