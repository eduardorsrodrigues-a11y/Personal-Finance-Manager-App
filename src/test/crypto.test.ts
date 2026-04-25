import { describe, it, expect, beforeAll } from 'vitest';

// crypto.ts uses process.env.ENCRYPTION_KEY — set it before importing
beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 64 hex chars = 32 bytes
});

describe('encrypt / decrypt', () => {
  it('round-trips a plain string', async () => {
    const { encrypt, decrypt } = await import('../../api/_lib/crypto.js');
    const plaintext = 'hello-secret-token';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it('produces different ciphertext each call (random IV)', async () => {
    const { encrypt } = await import('../../api/_lib/crypto.js');
    const a = encrypt('same');
    const b = encrypt('same');
    expect(a).not.toBe(b);
  });

  it('throws on tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import('../../api/_lib/crypto.js');
    const cipher = encrypt('secret');
    const parts = cipher.split(':');
    // Flip a bit in the ciphertext part
    parts[2] = parts[2].slice(0, -2) + (parts[2].endsWith('ff') ? '00' : 'ff');
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  it('throws on wrong format', async () => {
    const { decrypt } = await import('../../api/_lib/crypto.js');
    expect(() => decrypt('not:valid')).toThrow('Invalid encrypted value format');
  });
});
