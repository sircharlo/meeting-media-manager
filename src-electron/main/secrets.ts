import { safeStorage } from 'electron';

// Bumping this prefix would let a future format change tell old and new
// values apart; keep it stable otherwise.
const ENCRYPTED_PREFIX = 'enc:v1:';

/**
 * Encrypts a secret (e.g. the OBS websocket password) using the OS
 * keychain via Electron's safeStorage, so it is not stored at rest as
 * plain text. Falls back to returning the plain text unchanged if
 * encryption isn't available on this platform, matching Electron's own
 * guidance for safeStorage.
 * @param plainText The secret to encrypt
 * @returns The encrypted, prefixed value, or the original text if
 * encryption isn't available
 */
export const encryptSecret = (plainText: string): string => {
  if (!plainText) return '';
  if (!safeStorage.isEncryptionAvailable()) return plainText;

  try {
    const encrypted = safeStorage.encryptString(plainText);
    return `${ENCRYPTED_PREFIX}${encrypted.toString('base64')}`;
  } catch {
    return plainText;
  }
};

/**
 * Decrypts a secret previously encrypted with {@link encryptSecret}.
 * Values without the expected prefix are treated as legacy plain-text
 * secrets stored before encryption was introduced, and are returned
 * unchanged so existing users aren't forced to re-enter them; the next
 * save transparently re-encrypts them.
 * @param value The stored value to decrypt
 * @returns The decrypted secret, the original value if it was never
 * encrypted, or an empty string if a genuinely encrypted value can no
 * longer be decrypted (e.g. moved to a different machine/OS user)
 */
export const decryptSecret = (value: string): string => {
  if (!value) return '';
  if (!value.startsWith(ENCRYPTED_PREFIX)) return value;

  try {
    const encrypted = Buffer.from(
      value.slice(ENCRYPTED_PREFIX.length),
      'base64',
    );
    return safeStorage.decryptString(encrypted);
  } catch {
    return '';
  }
};
