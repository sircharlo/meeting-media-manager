import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
  fetchJson: vi.fn(),
  throttleWithTrailing: vi.fn(),
}));

vi.mock('countries-and-timezones', () => ({
  getCountriesForTimezone: vi.fn(() => [{ id: 'CN' }]),
}));

vi.mock('electron', () => ({
  app: { getLocaleCountryCode: vi.fn(() => 'US') },
}));

import { getCountriesForTimezone } from 'countries-and-timezones';
import { app } from 'electron';
import { fetchJson } from 'src-electron/main/utils';

import { isDownloadErrorExpected } from '../downloads';

describe('downloads.isDownloadErrorExpected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('true when IP service returns RU', async () => {
    vi.mocked(fetchJson).mockResolvedValue({ country: 'RU' });
    await expect(isDownloadErrorExpected()).resolves.toBe(true);
  });

  it('falls back to timezone -> CN => true', async () => {
    vi.mocked(fetchJson).mockRejectedValue(new Error('network'));
    vi.mocked(getCountriesForTimezone).mockReturnValue([
      { id: 'CN', name: 'China', timezones: ['Asia/Shanghai'] },
    ]);
    await expect(isDownloadErrorExpected()).resolves.toBe(true);
  });

  it('falls back to app locale -> US => false', async () => {
    vi.mocked(fetchJson).mockRejectedValue(new Error('network'));
    vi.mocked(getCountriesForTimezone).mockReturnValue([]);
    vi.mocked(app.getLocaleCountryCode).mockReturnValue('US');
    await expect(isDownloadErrorExpected()).resolves.toBe(false);
  });

  it('on failures returns false and captures error', async () => {
    const { captureElectronError } = await import('src-electron/main/utils');
    vi.mocked(fetchJson).mockImplementation(() => {
      throw new Error('boom');
    });
    await expect(isDownloadErrorExpected()).resolves.toBe(false);
    expect(captureElectronError).toHaveBeenCalled();
  });
});
