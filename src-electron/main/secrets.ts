import { safeStorage } from 'electron';
import { addElectronBreadcrumb } from 'src-electron/main/utils';

// Bumping this prefix would let a future format change tell old and new
// values apart; keep it stable otherwise.
const ENCRYPTED_PREFIX = 'enc:v1:';

// SEC-5 (full-audit-2026-09-04.md): a one-time (per app session, not per
// call) breadcrumb when a secret is actually written to disk as plain text,
// so real-world prevalence of this fallback is visible in Sentry without
// ever logging the secret itself.
let hasReportedMissingSecretEncryption = false;

/**
 * Whether {@link encryptSecret} can actually encrypt on this machine. `false`
 * on Linux without a compatible keyring/secret-service backend (headless
 * setups, minimal window managers, some kiosk-style deployments) - a
 * plausible real-world case for an always-on congregation media PC. The
 * renderer surfaces this so the user knows a secret like the OBS password is
 * sitting on disk as plain text, instead of that happening silently.
 * @returns Whether OS-backed secret encryption is available
 */
export const isSecretEncryptionAvailable = (): boolean =>
  safeStorage.isEncryptionAvailable();

/**
 * Encrypts a secret (e.g. the OBS websocket password) using the OS
 * keychain via Electron's safeStorage, so it is not stored at rest as
 * plain text. Falls back to returning the plain text unchanged if
 * encryption isn't available on this platform, matching Electron's own
 * guidance for safeStorage - the first time this happens in a session, it
 * also adds a Sentry breadcrumb (never the secret itself) to gauge how
 * often real users hit this fallback.
 * @param plainText The secret to encrypt
 * @returns The encrypted, prefixed value, or the original text if
 * encryption isn't available
 */
export const encryptSecret = (plainText: string): string => {
  if (!plainText) return '';
  if (!safeStorage.isEncryptionAvailable()) {
    if (!hasReportedMissingSecretEncryption) {
      hasReportedMissingSecretEncryption = true;
      addElectronBreadcrumb({
        category: 'secrets',
        level: 'warning',
        message: 'secret-encryption-unavailable',
      });
    }
    return plainText;
  }

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
