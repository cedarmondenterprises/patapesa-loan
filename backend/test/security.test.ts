import {
  blindIndex,
  decryptSensitive,
  digestResetToken,
  encryptSensitive,
  resetToken,
} from '../src/core/security';

describe('sensitive data protection', () => {
  const secret = 'a-test-key-that-is-long-enough-for-use';
  it('uses randomized authenticated encryption for identity values', () => {
    const first = encryptSensitive('12345678', secret),
      second = encryptSensitive('12345678', secret);
    expect(first).not.toBe(second);
    expect(first.split('.')).toHaveLength(3);
    expect(first).not.toContain('12345678');
    expect(decryptSensitive(first, secret)).toBe('12345678');
  });
  it('creates a stable blind index without exposing the value', () => {
    expect(blindIndex('Ab-123', secret)).toBe(blindIndex('ab-123', secret));
    expect(blindIndex('Ab-123', secret)).not.toContain('AB-123');
  });
  it('only stores a digest of reset tokens', () => {
    const token = resetToken();
    expect(token.raw).not.toBe(token.digest);
    expect(token.digest).toBe(digestResetToken(token.raw));
    expect(token.digest).toHaveLength(64);
  });
});
