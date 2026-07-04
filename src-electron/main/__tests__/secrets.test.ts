import { beforeEach, describe, expect, it, vi } from 'vitest';

const isEncryptionAvailableMock = vi.fn();
const encryptStringMock = vi.fn();
const decryptStringMock = vi.fn();

vi.mock('electron', () => ({
  safeStorage: {
    decryptString: decryptStringMock,
    encryptString: encryptStringMock,
    isEncryptionAvailable: isEncryptionAvailableMock,
  },
}));

describe('encryptSecret', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty string for an empty input', async () => {
    const { encryptSecret } = await import('../secrets');
    expect(encryptSecret('')).toBe('');
    expect(isEncryptionAvailableMock).not.toHaveBeenCalled();
  });

  it('returns the plain text unchanged when encryption is unavailable', async () => {
    isEncryptionAvailableMock.mockReturnValue(false);
    const { encryptSecret } = await import('../secrets');

    expect(encryptSecret('hunter2')).toBe('hunter2');
    expect(encryptStringMock).not.toHaveBeenCalled();
  });

  it('returns a prefixed, base64-encoded value when encryption succeeds', async () => {
    isEncryptionAvailableMock.mockReturnValue(true);
    encryptStringMock.mockReturnValue(Buffer.from('cipher-bytes'));
    const { encryptSecret } = await import('../secrets');

    const result = encryptSecret('hunter2');

    expect(encryptStringMock).toHaveBeenCalledWith('hunter2');
    expect(result).toBe(
      `enc:v1:${Buffer.from('cipher-bytes').toString('base64')}`,
    );
  });

  it('falls back to plain text if encryption throws', async () => {
    isEncryptionAvailableMock.mockReturnValue(true);
    encryptStringMock.mockImplementation(() => {
      throw new Error('keychain unavailable');
    });
    const { encryptSecret } = await import('../secrets');

    expect(encryptSecret('hunter2')).toBe('hunter2');
  });
});

describe('decryptSecret', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty string for an empty input', async () => {
    const { decryptSecret } = await import('../secrets');
    expect(decryptSecret('')).toBe('');
    expect(decryptStringMock).not.toHaveBeenCalled();
  });

  it('treats a value without the encryption prefix as legacy plain text', async () => {
    const { decryptSecret } = await import('../secrets');

    expect(decryptSecret('hunter2')).toBe('hunter2');
    expect(decryptStringMock).not.toHaveBeenCalled();
  });

  it('decrypts a properly prefixed, previously encrypted value', async () => {
    decryptStringMock.mockReturnValue('hunter2');
    const { decryptSecret } = await import('../secrets');

    const cipherText = `enc:v1:${Buffer.from('cipher-bytes').toString('base64')}`;
    const result = decryptSecret(cipherText);

    expect(decryptStringMock).toHaveBeenCalledWith(Buffer.from('cipher-bytes'));
    expect(result).toBe('hunter2');
  });

  it('returns an empty string if a genuinely encrypted value can no longer be decrypted', async () => {
    decryptStringMock.mockImplementation(() => {
      throw new Error('decryption failed');
    });
    const { decryptSecret } = await import('../secrets');

    const cipherText = `enc:v1:${Buffer.from('cipher-bytes').toString('base64')}`;
    expect(decryptSecret(cipherText)).toBe('');
  });
});
