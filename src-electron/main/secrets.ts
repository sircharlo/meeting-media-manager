import { safeStorage } from 'electron';
import { PLATFORM } from 'src-electron/constants';
import { addElectronBreadcrumb } from 'src-electron/main/utils';

// Bumping this prefix would let a future format change tell old and new
// values apart; keep it stable otherwise.
const ENCRYPTED_PREFIX = 'enc:v1:';

// SEC-5 (full-audit-2026-09-04.md): a one-time (per app session, not per
// call) breadcrumb when a secret is actually written to disk as plain text,
// so real-world prevalence of this fallback is visible in Sentry without
// ever logging the secret itself.
let hasReportedMissingSecretEncryption = false;

// On Linux, Chromium starts what it encrypts with "v11" when the key comes
// from the keyring, and with "v10" when no keyring could be reached: then
// it uses a hardcoded key that anyone can look up, and safeStorage still
// says encryption is available.
const LINUX_HARDCODED_KEY_PREFIX = 'v10';

// Chromium picks its key once, at startup: one check is enough.
let linuxKeyringCheck: Promise<boolean> | undefined;

/**
 * Whether safeStorage's key comes from a keyring on Linux, from what it
 * makes of a throwaway value.
 * @returns False when it encrypts with Chromium's hardcoded key, or can't
 * encrypt at all.
 */
const usesLinuxKeyring = async () => {
  try {
    const probe = await safeStorage.encryptStringAsync('probe');
    return (
      probe
        .subarray(0, LINUX_HARDCODED_KEY_PREFIX.length)
        .toString('latin1') !== LINUX_HARDCODED_KEY_PREFIX
    );
  } catch {
    return false;
  }
};

/**
 * Whether {@link encryptSecret} can actually protect a secret on this
 * machine. `false` on Linux without a keyring it can reach (headless setups,
 * minimal window managers, kiosk-style deployments, or M³'s snap without the
 * password-manager-service interface), a plausible real-world case for an
 * always-on congregation media PC. There, safeStorage still says it's
 * available, but encrypts with Chromium's hardcoded key, which protects
 * nothing. The renderer surfaces this so the user knows a secret like the
 * OBS password is sitting on disk as plain text, instead of that happening
 * silently.
 *
 * Uses safeStorage's asynchronous API: the synchronous methods are
 * deprecated in Electron 45 and removed in 46. Both use the same OS key
 * stores, so values encrypted by earlier versions still decrypt.
 * @returns Whether OS-backed secret encryption is available
 */
export const isSecretEncryptionAvailable = async (): Promise<boolean> => {
  const available = await safeStorage
    .isAsyncEncryptionAvailable()
    .catch(() => false);
  if (!available || PLATFORM !== 'linux') return available;
  linuxKeyringCheck ??= usesLinuxKeyring();
  return linuxKeyringCheck;
};

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
export const encryptSecret = async (plainText: string): Promise<string> => {
  if (!plainText) return '';
  if (!(await isSecretEncryptionAvailable())) {
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
    const encrypted = await safeStorage.encryptStringAsync(plainText);
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
 *
 * `shouldReEncrypt` from safeStorage is not acted on here: the renderer
 * re-encrypts every secret on its first save of each session anyway (its
 * encryption cache starts empty), which picks up the current key.
 * @param value The stored value to decrypt
 * @returns The decrypted secret, the original value if it was never
 * encrypted, or an empty string if a genuinely encrypted value can no
 * longer be decrypted (e.g. moved to a different machine/OS user)
 */
export const decryptSecret = async (value: string): Promise<string> => {
  if (!value) return '';
  if (!value.startsWith(ENCRYPTED_PREFIX)) return value;

  try {
    const encrypted = Buffer.from(
      value.slice(ENCRYPTED_PREFIX.length),
      'base64',
    );
    const { result } = await safeStorage.decryptStringAsync(encrypted);
    return result;
  } catch {
    return '';
  }
};
