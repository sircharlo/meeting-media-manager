import { beforeEach, describe, expect, it, vi } from 'vitest';

const isEncryptionAvailableMock = vi.fn();
const encryptStringMock = vi.fn();
const decryptStringMock = vi.fn();
const addElectronBreadcrumbMock = vi.fn();

vi.mock('electron', () => ({
  safeStorage: {
    decryptString: decryptStringMock,
    encryptString: encryptStringMock,
    isEncryptionAvailable: isEncryptionAvailableMock,
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
    expect(encryptSecret('')).toBe('');
    expect(isEncryptionAvailableMock).not.toHaveBeenCalled();
  });

  it('returns the plain text unchanged when encryption is unavailable', async () => {
    isEncryptionAvailableMock.mockReturnValue(false);
    const { encryptSecret } = await import('../secrets');

    expect(encryptSecret('hunter2')).toBe('hunter2');
    expect(encryptStringMock).not.toHaveBeenCalled();
  });

  // SEC-5 (full-audit-2026-09-04.md)
  it('adds a breadcrumb only once per session when encryption is unavailable', async () => {
    isEncryptionAvailableMock.mockReturnValue(false);
    const { encryptSecret } = await import('../secrets');

    encryptSecret('hunter2');
    encryptSecret('hunter3');

    expect(addElectronBreadcrumbMock).toHaveBeenCalledTimes(1);
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'secrets',
        message: 'secret-encryption-unavailable',
      }),
    );
  });

  it('does not add a breadcrumb when encryption is available', async () => {
    isEncryptionAvailableMock.mockReturnValue(true);
    encryptStringMock.mockReturnValue(Buffer.from('cipher-bytes'));
    const { encryptSecret } = await import('../secrets');

    encryptSecret('hunter2');

    expect(addElectronBreadcrumbMock).not.toHaveBeenCalled();
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

// SEC-5 (full-audit-2026-09-04.md): the renderer needs this to warn the user
// when a secret like the OBS password can't actually be encrypted at rest.
describe('isSecretEncryptionAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reflects safeStorage.isEncryptionAvailable() when true', async () => {
    isEncryptionAvailableMock.mockReturnValue(true);
    const { isSecretEncryptionAvailable } = await import('../secrets');

    expect(isSecretEncryptionAvailable()).toBe(true);
  });

  it('reflects safeStorage.isEncryptionAvailable() when false', async () => {
    isEncryptionAvailableMock.mockReturnValue(false);
    const { isSecretEncryptionAvailable } = await import('../secrets');

    expect(isSecretEncryptionAvailable()).toBe(false);
  });
});
