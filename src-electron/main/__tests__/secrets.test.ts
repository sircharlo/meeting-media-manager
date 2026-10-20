import { beforeEach, describe, expect, it, vi } from 'vitest';

const isAsyncEncryptionAvailableMock = vi.fn();
const encryptStringAsyncMock = vi.fn();
const decryptStringAsyncMock = vi.fn();
const addElectronBreadcrumbMock = vi.fn();

vi.mock('electron', () => ({
  safeStorage: {
    decryptStringAsync: decryptStringAsyncMock,
    encryptStringAsync: encryptStringAsyncMock,
    isAsyncEncryptionAvailable: isAsyncEncryptionAvailableMock,
  },
}));

vi.mock('src-electron/main/utils', () => ({
  addElectronBreadcrumb: addElectronBreadcrumbMock,
}));

describe('encryptSecret', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // hasReportedMissingSecretEncryption is a module-level, one-time-per-
    // session latch by design (SEC-5) - reset the module so each test's
    // "unavailable" case starts from a clean, unreported state.
    vi.resetModules();
  });

  it('returns an empty string for an empty input', async () => {
    const { encryptSecret } = await import('../secrets');
    await expect(encryptSecret('')).resolves.toBe('');
    expect(isAsyncEncryptionAvailableMock).not.toHaveBeenCalled();
  });

  it('returns the plain text unchanged when encryption is unavailable', async () => {
    isAsyncEncryptionAvailableMock.mockResolvedValue(false);
    const { encryptSecret } = await import('../secrets');

    await expect(encryptSecret('hunter2')).resolves.toBe('hunter2');
    expect(encryptStringAsyncMock).not.toHaveBeenCalled();
  });

  it('returns the plain text unchanged when the availability check fails', async () => {
    isAsyncEncryptionAvailableMock.mockRejectedValue(new Error('no keyring'));
    const { encryptSecret } = await import('../secrets');

    await expect(encryptSecret('hunter2')).resolves.toBe('hunter2');
    expect(encryptStringAsyncMock).not.toHaveBeenCalled();
  });

  // SEC-5 (full-audit-2026-09-04.md)
  it('adds a breadcrumb only once per session when encryption is unavailable', async () => {
    isAsyncEncryptionAvailableMock.mockResolvedValue(false);
    const { encryptSecret } = await import('../secrets');

    await encryptSecret('hunter2');
    await encryptSecret('hunter3');

    expect(addElectronBreadcrumbMock).toHaveBeenCalledTimes(1);
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'secrets',
        message: 'secret-encryption-unavailable',
      }),
    );
  });

  it('does not add a breadcrumb when encryption is available', async () => {
    isAsyncEncryptionAvailableMock.mockResolvedValue(true);
    encryptStringAsyncMock.mockResolvedValue(Buffer.from('cipher-bytes'));
    const { encryptSecret } = await import('../secrets');

    await encryptSecret('hunter2');

    expect(addElectronBreadcrumbMock).not.toHaveBeenCalled();
  });

  it('returns a prefixed, base64-encoded value when encryption succeeds', async () => {
    isAsyncEncryptionAvailableMock.mockResolvedValue(true);
    encryptStringAsyncMock.mockResolvedValue(Buffer.from('cipher-bytes'));
    const { encryptSecret } = await import('../secrets');

    const result = await encryptSecret('hunter2');

    expect(encryptStringAsyncMock).toHaveBeenCalledWith('hunter2');
    expect(result).toBe(
      `enc:v1:${Buffer.from('cipher-bytes').toString('base64')}`,
    );
  });

  it('falls back to plain text if encryption fails', async () => {
    isAsyncEncryptionAvailableMock.mockResolvedValue(true);
    encryptStringAsyncMock.mockRejectedValue(new Error('keychain unavailable'));
    const { encryptSecret } = await import('../secrets');

    await expect(encryptSecret('hunter2')).resolves.toBe('hunter2');
  });
});

describe('decryptSecret', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty string for an empty input', async () => {
    const { decryptSecret } = await import('../secrets');
    await expect(decryptSecret('')).resolves.toBe('');
    expect(decryptStringAsyncMock).not.toHaveBeenCalled();
  });

  it('treats a value without the encryption prefix as legacy plain text', async () => {
    const { decryptSecret } = await import('../secrets');

    await expect(decryptSecret('hunter2')).resolves.toBe('hunter2');
    expect(decryptStringAsyncMock).not.toHaveBeenCalled();
  });

  it('decrypts a properly prefixed, previously encrypted value', async () => {
    decryptStringAsyncMock.mockResolvedValue({
      result: 'hunter2',
      shouldReEncrypt: false,
    });
    const { decryptSecret } = await import('../secrets');

    const cipherText = `enc:v1:${Buffer.from('cipher-bytes').toString('base64')}`;
    const result = await decryptSecret(cipherText);

    expect(decryptStringAsyncMock).toHaveBeenCalledWith(
      Buffer.from('cipher-bytes'),
    );
    expect(result).toBe('hunter2');
  });

  it('returns the decrypted value even when safeStorage suggests re-encrypting', async () => {
    decryptStringAsyncMock.mockResolvedValue({
      result: 'hunter2',
      shouldReEncrypt: true,
    });
    const { decryptSecret } = await import('../secrets');

    const cipherText = `enc:v1:${Buffer.from('cipher-bytes').toString('base64')}`;
    await expect(decryptSecret(cipherText)).resolves.toBe('hunter2');
  });

  it('returns an empty string if a genuinely encrypted value can no longer be decrypted', async () => {
    decryptStringAsyncMock.mockRejectedValue(new Error('decryption failed'));
    const { decryptSecret } = await import('../secrets');

    const cipherText = `enc:v1:${Buffer.from('cipher-bytes').toString('base64')}`;
    await expect(decryptSecret(cipherText)).resolves.toBe('');
  });
});

// SEC-5 (full-audit-2026-09-04.md): the renderer needs this to warn the user
// when a secret like the OBS password can't actually be encrypted at rest.
describe('isSecretEncryptionAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reflects safeStorage.isAsyncEncryptionAvailable() when true', async () => {
    isAsyncEncryptionAvailableMock.mockResolvedValue(true);
    const { isSecretEncryptionAvailable } = await import('../secrets');

    await expect(isSecretEncryptionAvailable()).resolves.toBe(true);
  });

  it('reflects safeStorage.isAsyncEncryptionAvailable() when false', async () => {
    isAsyncEncryptionAvailableMock.mockResolvedValue(false);
    const { isSecretEncryptionAvailable } = await import('../secrets');

    await expect(isSecretEncryptionAvailable()).resolves.toBe(false);
  });

  it('reports unavailable when the check itself fails', async () => {
    isAsyncEncryptionAvailableMock.mockRejectedValue(new Error('no keyring'));
    const { isSecretEncryptionAvailable } = await import('../secrets');

    await expect(isSecretEncryptionAvailable()).resolves.toBe(false);
  });
});
