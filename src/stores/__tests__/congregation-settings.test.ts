import { defaultSettings } from 'src/constants/settings';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  backfillQuickStartTourSeen,
  deserializeCongregationSettings,
  serializeCongregationSettings,
  transformObsPasswords,
} from '../congregation-settings';

describe('backfillQuickStartTourSeen', () => {
  it('marks a pre-existing congregation missing from quickStartTourSeen as seen', () => {
    const result = backfillQuickStartTourSeen(
      { abc: { ...defaultSettings } },
      {},
    );

    expect(result.abc).toBe(true);
  });

  it('does not touch a congregation not present in congregations (e.g. created later in the same session, after hydrate already ran)', () => {
    const quickStartTourSeen = {};

    const result = backfillQuickStartTourSeen({}, quickStartTourSeen);

    expect(result).toEqual({});
  });

  it('does not overwrite an existing entry, seen or unseen', () => {
    const result = backfillQuickStartTourSeen(
      { abc: { ...defaultSettings }, def: { ...defaultSettings } },
      { abc: false, def: true },
    );

    expect(result.abc).toBe(false);
    expect(result.def).toBe(true);
  });

  it('mutates and returns the same object that was passed in', () => {
    const quickStartTourSeen = {};

    const result = backfillQuickStartTourSeen(
      { abc: { ...defaultSettings } },
      quickStartTourSeen,
    );

    expect(result).toBe(quickStartTourSeen);
  });
});

describe('transformObsPasswords', () => {
  it('runs the transform on congregations with a non-empty obsPassword', () => {
    const state = {
      announcements: {},
      congregations: {
        abc: { ...defaultSettings, obsPassword: 'hunter2' },
        def: { ...defaultSettings, obsPassword: null },
      },
      quickStartTourSeen: {},
    };

    const result = transformObsPasswords(state, (value) => `T(${value})`);

    expect(result.congregations.abc?.obsPassword).toBe('T(hunter2)');
    expect(result.congregations.def?.obsPassword).toBeNull();
  });

  it('does not mutate the original state', () => {
    const state = {
      announcements: {},
      congregations: { abc: { ...defaultSettings, obsPassword: 'hunter2' } },
      quickStartTourSeen: {},
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
      quickStartTourSeen: {},
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
      quickStartTourSeen: {},
    };

    const serialized = serializeCongregationSettings(state);

    expect(encryptSecretSync).not.toHaveBeenCalled();

    const deserialized = deserializeCongregationSettings(serialized);
    expect(deserialized.congregations.abc?.obsPassword).toBe('');
  });
});
