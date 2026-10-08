import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  backfillQuickStartTourSeen,
  clearObsPasswordEncryptionCache,
  deserializeCongregationSettings,
  serializeCongregationSettings,
  transformObsPasswords,
  useCongregationSettingsStore,
} from '../congregation-settings';
import { useJwStore } from '../jw';

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
    clearObsPasswordEncryptionCache();
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

describe('obsPassword encryption caching', () => {
  const makeStore = (obsPassword: string) => ({
    announcements: {},
    congregations: { abc: { ...defaultSettings, obsPassword } },
    quickStartTourSeen: {},
  });

  beforeEach(() => {
    clearObsPasswordEncryptionCache();
  });

  afterEach(() => {
    clearObsPasswordEncryptionCache();
    vi.restoreAllMocks();
  });

  it('encrypts an unchanged obsPassword only once across repeated saves', () => {
    const encryptSecretSync = vi
      .spyOn(globalThis.electronApi, 'encryptSecretSync')
      .mockImplementation((value: string) => `enc:${value}`);

    const state = makeStore('hunter2');

    const first = serializeCongregationSettings(state);
    const second = serializeCongregationSettings(state);

    expect(encryptSecretSync).toHaveBeenCalledTimes(1);
    expect(encryptSecretSync).toHaveBeenCalledWith('hunter2');
    expect(first).toBe(second);
    expect(second).toContain('"obsPassword":"enc:hunter2"');
  });

  it('re-encrypts when the obsPassword value changes', () => {
    const encryptSecretSync = vi
      .spyOn(globalThis.electronApi, 'encryptSecretSync')
      .mockImplementation((value: string) => `enc:${value}`);

    serializeCongregationSettings(makeStore('hunter2'));
    const second = serializeCongregationSettings(makeStore('newpwd'));

    expect(encryptSecretSync).toHaveBeenCalledTimes(2);
    expect(encryptSecretSync).toHaveBeenCalledWith('hunter2');
    expect(encryptSecretSync).toHaveBeenCalledWith('newpwd');
    expect(second).toContain('"obsPassword":"enc:newpwd"');
  });

  it('clears the cached ciphertext when a congregation is deleted', () => {
    setActivePinia(createPinia());
    const store = useCongregationSettingsStore();
    const encryptSecretSync = vi
      .spyOn(globalThis.electronApi, 'encryptSecretSync')
      .mockImplementation((value: string) => `enc:${value}`);

    store.congregations['abc'] = { ...defaultSettings, obsPassword: 'hunter2' };
    serializeCongregationSettings(store.$state);
    expect(encryptSecretSync).toHaveBeenCalledTimes(1);

    store.deleteCongregation('abc');

    store.congregations['def'] = { ...defaultSettings, obsPassword: 'hunter2' };
    serializeCongregationSettings(store.$state);
    expect(encryptSecretSync).toHaveBeenCalledTimes(2);
  });

  it('keeps the cached ciphertext when another congregation still shares the obsPassword', () => {
    setActivePinia(createPinia());
    const store = useCongregationSettingsStore();
    const encryptSecretSync = vi
      .spyOn(globalThis.electronApi, 'encryptSecretSync')
      .mockImplementation((value: string) => `enc:${value}`);

    store.congregations['abc'] = { ...defaultSettings, obsPassword: 'hunter2' };
    store.congregations['def'] = { ...defaultSettings, obsPassword: 'hunter2' };
    serializeCongregationSettings(store.$state);
    expect(encryptSecretSync).toHaveBeenCalledTimes(1);

    store.deleteCongregation('abc');

    serializeCongregationSettings(store.$state);
    expect(encryptSecretSync).toHaveBeenCalledTimes(1);
  });

  it('round-trips decrypt then encrypt without re-encrypting across hydrate + save', () => {
    const encryptSecretSync = vi
      .spyOn(globalThis.electronApi, 'encryptSecretSync')
      .mockImplementation((value: string) => `enc:${value}`);
    const decryptSecretSync = vi
      .spyOn(globalThis.electronApi, 'decryptSecretSync')
      .mockImplementation((value: string) => value.replace(/^enc:/, ''));

    // The ciphertext already persisted to disk from a previous session.
    const onDisk = JSON.stringify({
      announcements: {},
      congregations: {
        abc: { ...defaultSettings, obsPassword: 'enc:hunter2' },
      },
      quickStartTourSeen: {},
    });

    // Hydrate: decrypt the persisted ciphertext back to plaintext in memory.
    const hydrated = deserializeCongregationSettings(onDisk);
    expect(decryptSecretSync).toHaveBeenCalledWith('enc:hunter2');
    expect(hydrated.congregations.abc?.obsPassword).toBe('hunter2');

    // First save of the session encrypts once (the in-memory cache is cold).
    const firstSave = serializeCongregationSettings(hydrated);
    expect(encryptSecretSync).toHaveBeenCalledTimes(1);
    expect(encryptSecretSync).toHaveBeenCalledWith('hunter2');
    expect(firstSave).toContain('"obsPassword":"enc:hunter2"');

    // A later save reuses the cached ciphertext instead of re-encrypting.
    const secondSave = serializeCongregationSettings(hydrated);
    expect(encryptSecretSync).toHaveBeenCalledTimes(1);
    expect(secondSave).toBe(firstSave);
  });
});

// FE-3/FE-4 (full-audit-2026-09-04.md): deleteCongregation() previously only
// removed the congregations map entry - announcements, quickStartTourSeen,
// and the jw store's lookupPeriod entry all persisted indefinitely.
describe('deleteCongregation sibling-record cleanup', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('removes announcements, quickStartTourSeen, and lookupPeriod for the deleted congregation', () => {
    const store = useCongregationSettingsStore();
    const jwStore = useJwStore();

    store.congregations['abc'] = { ...defaultSettings };
    store.announcements['abc'] = ['announcement-1'];
    store.quickStartTourSeen['abc'] = true;
    jwStore.lookupPeriod['abc'] = [];

    store.deleteCongregation('abc');

    expect(store.congregations['abc']).toBeUndefined();
    expect(store.announcements['abc']).toBeUndefined();
    expect(store.quickStartTourSeen['abc']).toBeUndefined();
    expect(jwStore.lookupPeriod['abc']).toBeUndefined();
  });

  it('leaves other congregations untouched', () => {
    const store = useCongregationSettingsStore();
    const jwStore = useJwStore();

    store.congregations['abc'] = { ...defaultSettings };
    store.congregations['def'] = { ...defaultSettings };
    store.announcements['def'] = ['announcement-2'];
    store.quickStartTourSeen['def'] = true;
    jwStore.lookupPeriod['def'] = [];

    store.deleteCongregation('abc');

    expect(store.congregations['def']).toBeDefined();
    expect(store.announcements['def']).toEqual(['announcement-2']);
    expect(store.quickStartTourSeen['def']).toBe(true);
    expect(jwStore.lookupPeriod['def']).toEqual([]);
  });
});
