import { defaultSettings } from 'src/constants/settings';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  deserializeCongregationSettings,
  serializeCongregationSettings,
  transformObsPasswords,
} from '../congregation-settings';

describe('transformObsPasswords', () => {
  it('runs the transform on congregations with a non-empty obsPassword', () => {
    const state = {
      announcements: {},
      congregations: {
        abc: { ...defaultSettings, obsPassword: 'hunter2' },
        def: { ...defaultSettings, obsPassword: null },
      },
    };

    const result = transformObsPasswords(state, (value) => `T(${value})`);

    expect(result.congregations.abc?.obsPassword).toBe('T(hunter2)');
    expect(result.congregations.def?.obsPassword).toBeNull();
  });

  it('does not mutate the original state', () => {
    const state = {
      announcements: {},
      congregations: { abc: { ...defaultSettings, obsPassword: 'hunter2' } },
    };

    transformObsPasswords(state, (value) => `T(${value})`);

    expect(state.congregations.abc?.obsPassword).toBe('hunter2');
  });
});

describe('serializeCongregationSettings / deserializeCongregationSettings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('encrypts obsPassword on serialize and decrypts it on deserialize', () => {
    const encryptSecretSync = vi
      .spyOn(globalThis.electronApi, 'encryptSecretSync')
      .mockImplementation((value: string) => `enc:${value}`);
    const decryptSecretSync = vi
      .spyOn(globalThis.electronApi, 'decryptSecretSync')
      .mockImplementation((value: string) => value.replace(/^enc:/, ''));

    const state = {
      announcements: {},
      congregations: { abc: { ...defaultSettings, obsPassword: 'hunter2' } },
    };

    const serialized = serializeCongregationSettings(state);

    expect(encryptSecretSync).toHaveBeenCalledWith('hunter2');
    expect(serialized).toContain('"obsPassword":"enc:hunter2"');

    const deserialized = deserializeCongregationSettings(serialized);

    expect(decryptSecretSync).toHaveBeenCalledWith('enc:hunter2');
    expect(deserialized.congregations.abc?.obsPassword).toBe('hunter2');
  });

  it('leaves an empty obsPassword untouched through a round trip', () => {
    const encryptSecretSync = vi.spyOn(
      globalThis.electronApi,
      'encryptSecretSync',
    );

    const state = {
      announcements: {},
      congregations: { abc: { ...defaultSettings, obsPassword: '' } },
    };

    const serialized = serializeCongregationSettings(state);

    expect(encryptSecretSync).not.toHaveBeenCalled();

    const deserialized = deserializeCongregationSettings(serialized);
    expect(deserialized.congregations.abc?.obsPassword).toBe('');
  });
});
