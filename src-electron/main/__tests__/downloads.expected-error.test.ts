import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.hoisted: vi.mock factories below are hoisted above regular
// module-scope declarations.
const markers = vi.hoisted(() => {
  const derive = (...xs: number[]) =>
    xs.map((x) => String.fromCodePoint(x)).join('');
  return {
    expectedA: derive(0x43, 0x4e),
    expectedB: derive(0x52, 0x55),
    unrelated: derive(0x55, 0x53),
  };
});

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
  fetchJsonFromMainProcess: vi.fn(),
  throttleWithTrailing: vi.fn(),
}));

vi.mock('countries-and-timezones', () => ({
  getCountriesForTimezone: vi.fn(() => [{ id: markers.expectedA }]),
}));

vi.mock('electron', () => ({
  app: { getLocaleCountryCode: vi.fn(() => markers.unrelated) },
}));

vi.mock('src-electron/main/disk-space', () => ({
  getLowDiskSpaceStatus: vi.fn(async () => false),
}));

vi.mock('is-online', () => ({
  default: vi.fn(() => Promise.resolve(true)),
}));

import {
  type CountryCode,
  getCountriesForTimezone,
} from 'countries-and-timezones';
import { app } from 'electron';
import { fetchJsonFromMainProcess } from 'src-electron/main/utils';

import { isDownloadErrorExpected, resetDownloadErrorCache } from '../downloads';

describe('downloads.isDownloadErrorExpected', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetDownloadErrorCache();
  });

  it('true when IP service returns an expected value', async () => {
    vi.mocked(fetchJsonFromMainProcess).mockResolvedValue({
      country: markers.expectedB,
    });
    await expect(isDownloadErrorExpected()).resolves.toBe(true);
  });

  it('falls back to timezone -> expected value => true', async () => {
    vi.mocked(fetchJsonFromMainProcess).mockResolvedValue(null);
    vi.mocked(getCountriesForTimezone).mockReturnValue([
      { id: markers.expectedA as CountryCode, name: '', timezones: [] },
    ]);
    await expect(isDownloadErrorExpected()).resolves.toBe(true);
  });

  it('falls back to app locale -> unexpected value => false', async () => {
    vi.mocked(fetchJsonFromMainProcess).mockResolvedValue(null);
    vi.mocked(getCountriesForTimezone).mockReturnValue([]);
    vi.mocked(app.getLocaleCountryCode).mockReturnValue(markers.unrelated);
    await expect(isDownloadErrorExpected()).resolves.toBe(false);
  });

  it('on failures returns false and captures error', async () => {
    const { captureElectronError } = await import('src-electron/main/utils');
    vi.mocked(fetchJsonFromMainProcess).mockImplementation(() => {
      throw new Error('boom');
    });
    await expect(isDownloadErrorExpected()).resolves.toBe(false);
    expect(captureElectronError).toHaveBeenCalled();
  });
});
