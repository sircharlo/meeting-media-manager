import { errorCatcher } from 'src/helpers/error-catcher';

const { fs, getAppDataPath, join } = globalThis.electronApi;

// The PIN keeps well-meaning people out of the settings: it isn't protection
// against someone determined with access to this computer's files. Only a
// salted hash is stored, in the congregation's settings.

const PBKDF2_ITERATIONS = 100_000;
const PIN_PATTERN = /^\d{4,8}$/;
const RESET_FILE_NAME = 'M3 settings PIN reset code.txt';

export const isValidSettingsPin = (pin: string) => PIN_PATTERN.test(pin);

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string) =>
  Uint8Array.from(hex.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));

const derive = async (
  pin: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { hash: 'SHA-256', iterations, name: 'PBKDF2', salt },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
};

/** A PIN's stored form: `iterations$salt$hash`, the last two in hex. */
export const hashSettingsPin = async (pin: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt, PBKDF2_ITERATIONS);
  return [PBKDF2_ITERATIONS, toHex(salt), hash].join('$');
};

export const verifySettingsPin = async (pin: string, stored: string) => {
  const [iterations, salt, hash] = stored.split('$');
  if (!iterations || !salt || !hash) return false;
  return (await derive(pin, fromHex(salt), Number(iterations))) === hash;
};

export const createSettingsPinResetCode = () => {
  // Every hex digit is equally likely, so the ones left after dropping a-f
  // are too.
  let code = '';
  while (code.length < 6) {
    const random = crypto.getRandomValues(new Uint8Array(8));
    code += toHex(random).replaceAll(/[a-f]/g, '');
  }
  return code.slice(0, 6);
};

const getResetFilePath = async () =>
  join(await getAppDataPath(), RESET_FILE_NAME);

/**
 * A forgotten PIN is reset with a code that M³ writes to a file, whose name
 * is only given in the user guide. Finding it takes some deliberate effort,
 * and needs no setup that could itself be lost by the time the PIN is
 * forgotten.
 * @returns The folder holding the file, as the operating system writes it.
 */
export const writeSettingsPinResetFile = async (
  code: string,
  note: string,
): Promise<string> => {
  await fs.writeFile(await getResetFilePath(), `${note}\n\n${code}\n`, 'utf-8');
  const folder = await getAppDataPath();
  return /^[a-z]:/i.test(folder) ? folder.replaceAll('/', '\\') : folder;
};

export const removeSettingsPinResetFile = async () => {
  try {
    await fs.remove(await getResetFilePath());
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'removeSettingsPinResetFile' } },
    });
  }
};
