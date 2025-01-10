/**
 * Converts a camelCase string to kebab-case.
 * @param str The camelCase string to convert.
 * @returns The kebab-case string.
 * @example
 * camelToKebabCase('camelCase') // 'camel-case'
 */
export const camelToKebabCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/**
 * Converts a kebab-case string to camelCase.
 * @param str The kebab-case string to convert.
 * @returns The camelCase string.
 * @example
 * kebabToCamelCase('kebab-case') // 'kebabCase'
 */
export const kebabToCamelCase = (str: string) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  str.replace(/-./g, (x) => x[1]!.toUpperCase());

/**
 * Sleeps for a given amount of time.
 * @param ms The time to sleep in milliseconds.
 * @returns The promise that resolves after the sleep.
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Capitalizes the first letter of a string.
 * @param str The string to capitalize.
 * @returns The capitalized string.
 * @example
 * capitalize('hello') // 'Hello'
 */
export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Checks if a value is empty.
 * @param val The value to check.
 * @returns Whether the value is empty.
 */
export const isEmpty = (val: unknown) =>
  val === '' || val === null || val === undefined;

/**
 * Santitizes a string to be used as an html id.
 * @param id The id to sanitize.
 * @returns The sanitized id.
 * @example
 * sanitizeId('Figure_: "2-persons!".') // 'Figure_:__2-persons__.'
 */
export const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9\-_:.]/g, '_');

/**
 * Parses a version string into an object.
 * @param version The version string to parse.
 * @returns The version object.
 * @example
 * parseVersion('1.2.3') // { major: 1, minor: 2, patch: 3 }
 * parseVersion('1.2.3-beta.0') // { major: 1, minor: 2, patch: 3, prerelease: 'beta', prereleaseVersion: 0 }
 */
export const parseVersion = (version: string) => {
  const [versionPart, prerelease] = version.split('-');
  const [major, minor, patch] = versionPart
    ?.split('.')
    .map((v) => parseInt(v)) ?? [0, 0, 0];
  const [prTag, prVersion] = prerelease?.split('.') ?? [];

  return {
    major: major ?? 0,
    minor: minor ?? 0,
    patch: patch ?? 0,
    prerelease: prTag,
    prereleaseVersion: parseInt(prVersion || '0'),
  };
};

/**
 * Gets the previous version of a version.
 * @param version The version to get the previous version of.
 * @returns The previous version.
 * @example
 * getPreviousVersion('1.2.3') // '1.2.3-rc.999'
 * getPreviousVersion('1.2.3-beta.0') // '1.2.3-alpha.999'
 */
export const getPreviousVersion = (version: string) => {
  const { major, minor, patch, prerelease, prereleaseVersion } =
    parseVersion(version);

  if (prerelease && prereleaseVersion > 0) {
    return `${major}.${minor}.${patch}-${prerelease}.${prereleaseVersion - 1}`;
  } else if (prerelease === 'rc' && prereleaseVersion === 0) {
    return `${major}.${minor}.${patch}-beta.999`;
  } else if (prerelease === 'beta' && prereleaseVersion === 0) {
    return `${major}.${minor}.${patch}-alpha.999`;
  } else if (prerelease === 'alpha' && prereleaseVersion === 0) {
    if (patch > 0) return `${major}.${minor}.${patch - 1}`;
    if (minor > 0) return `${major}.${minor - 1}.999`;
    if (major > 0) return `${major - 1}.999.999`;
  } else if (!prerelease) {
    return `${major}.${minor}.${patch}-rc.999`;
  }
  return version;
};

/**
 * Checks if a version is within bounds.
 * @param version The version to check.
 * @param minVersion The minimum version.
 * @param maxVersion The maximum version.
 * @returns Whether the version is within bounds.
 * @example
 * isVersionWithinBounds('1.2.3', '1.0.0', '2.0.0') // true
 * isVersionWithinBounds('1.2.3', '1.3.0', '2.0.0') // false
 */
export const isVersionWithinBounds = (
  version: string,
  minVersion?: string,
  maxVersion?: string,
) => {
  if (!version || (!minVersion && !maxVersion)) return true;

  if (minVersion && sortByVersion(version, minVersion) < 0) return false;
  if (maxVersion && sortByVersion(version, maxVersion) > 0) return false;

  return true;
};

/**
 * Sorts versions in ascending order.
 * @param a The first version.
 * @param b The second version.
 * @returns The sort order.
 */
export const sortByVersion = (a: string, b: string) => {
  const {
    major: aMajor,
    minor: aMinor,
    patch: aPatch,
    prerelease: aPrTag,
    prereleaseVersion: aPrVersion,
  } = parseVersion(a);
  const {
    major: bMajor,
    minor: bMinor,
    patch: bPatch,
    prerelease: bPrTag,
    prereleaseVersion: bPrVersion,
  } = parseVersion(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  if (aPatch !== bPatch) return aPatch - bPatch;
  if (!aPrTag && !bPrTag) return 0;
  if (!!aPrTag && aPrTag === bPrTag) return aPrVersion - bPrVersion;

  // Beta before non-beta
  if (!!aPrTag && !bPrTag) return -1;
  if (!aPrTag && !!bPrTag) return 1;

  // Alpha -> Beta -> RC
  if (aPrTag && bPrTag) return aPrTag.localeCompare(bPrTag);

  return 0;
};

/**
 * Generates a UUID.
 * @returns The generated UUID.
 * @example
 * uuid() // '8e8679e3-02b1-410b-9399-2c1e5606a971'
 */
export const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Adds padding to a string or number.
 * @param v The value to pad.
 * @param length The length of the padding.
 * @param char The character to pad with.
 * @returns The padded value.
 */
export const pad = (v: number | string, length = 2, char = '0') =>
  v.toString().padStart(length, char);

/**
 * Parses a JSON string.
 * @param json The JSON string to parse.
 * @param fallback The fallback value to return if parsing fails.
 * @returns The parsed JSON or the fallback value.
 */
export const parseJsonSafe = <T>(json: null | string | T, fallback: T): T => {
  if (!json) return fallback;
  try {
    return typeof json === 'string' ? (JSON.parse(json) as T) : json;
  } catch {
    return fallback;
  }
};
