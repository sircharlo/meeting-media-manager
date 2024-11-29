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
  str.replace(/-./g, (x) => x[1].toUpperCase());
