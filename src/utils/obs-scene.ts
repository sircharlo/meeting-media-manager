import type { JsonObject } from 'type-fest';

/**
 * Reads a scene's name or UUID. OBS sends both as strings, but scenes are
 * kept as generic JSON objects, so only string values are returned.
 * @param scene A scene from OBS's scene list
 * @param field The field to read
 * @returns The field's value, or undefined if it isn't a string
 */
export const getObsSceneField = (
  scene: JsonObject,
  field: 'sceneName' | 'sceneUuid',
) => {
  const value = scene[field];
  return typeof value === 'string' ? value : undefined;
};
