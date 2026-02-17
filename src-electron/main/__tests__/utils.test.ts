import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(),
    getVersion: vi.fn(),
  },
}));

vi.mock('@sentry/electron/main', () => ({
  captureException: vi.fn(),
}));

vi.mock('src-electron/main/session', () => ({
  urlVariables: {},
}));

vi.mock('is-online', () => ({
  default: vi.fn(),
}));

vi.mock('app/package.json', () => ({
  version: '1.0.0',
}));

import {
  fetchJsonFromMainProcess,
  isIgnoredUpdateError,
  utils,
} from '../utils';

describe('isIgnoredUpdateError', () => {
  it('should return true for ERR_NETWORK_CHANGED', () => {
    expect(isIgnoredUpdateError('net::ERR_NETWORK_CHANGED')).toBe(true);
    expect(isIgnoredUpdateError(new Error('net::ERR_NETWORK_CHANGED'))).toBe(
      true,
    );
    expect(
      isIgnoredUpdateError(
        new Error('something else'),
        'Error: net::ERR_NETWORK_CHANGED',
      ),
    ).toBe(true);
  });

  it('should return true for other ignored errors', () => {
    expect(isIgnoredUpdateError('ECONNRESET')).toBe(true);
    expect(isIgnoredUpdateError('HttpError: 404')).toBe(true);
    expect(isIgnoredUpdateError('504 Gateway Time-out')).toBe(true);
    expect(isIgnoredUpdateError('net::ERR_CONNECTION_CLOSED')).toBe(true);
    expect(
      isIgnoredUpdateError(
        "Error: ENOENT: no such file or directory, unlink '/home/test/dir/meeting-media-manager-30.1.4-x86_64.AppImage'",
      ),
    ).toBe(true);
  });

  it('should return false for non-ignored errors', () => {
    expect(isIgnoredUpdateError('Unknown error')).toBe(false);
    expect(isIgnoredUpdateError(new Error('Fatal exception'))).toBe(false);
  });

  it('should handle error objects with codes', () => {
    const error = new Error('Some error');
    (error as { code?: string }).code = 'ECONNRESET';
    expect(isIgnoredUpdateError(error)).toBe(true);
  });

  it('should return true for YAMLException based on error name', () => {
    // Simulate the actual YAMLException from the Sentry report
    const error = new Error(
      'null byte is not allowed in input (1:1)\n\n 1 | \n-----^\n 2 | \n 3 | ',
    );
    error.name = 'YAMLException';
    expect(isIgnoredUpdateError(error)).toBe(true);
  });
});

describe('fetchJsonFromMainProcess', () => {
  const mockUrl = 'https://example.com/api';

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('setTimeout', vi.fn());
    vi.stubGlobal('clearTimeout', vi.fn());
  });

  it('should return null if url is empty', async () => {
    const result = await fetchJsonFromMainProcess('');
    expect(result).toBeNull();
  });

  it('should return json data on 200 OK', async () => {
    const mockData = { foo: 'bar' };
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockData),
      ok: true,
      status: 200,
    } as Response);

    const result = await fetchJsonFromMainProcess(mockUrl);
    expect(result).toEqual(mockData);
  });

  it('should return json data on 304 Not Modified', async () => {
    const mockData = { foo: 'bar' };
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockData),
      ok: false,
      status: 304,
    } as Response);

    const result = await fetchJsonFromMainProcess(mockUrl);
    expect(result).toEqual(mockData);
  });

  it('should return null and not report error for 404', async () => {
    const spy = vi.spyOn(utils, 'captureElectronError');
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const result = await fetchJsonFromMainProcess(mockUrl);
    expect(result).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should report error for 400 Bad Request if not silent', async () => {
    const spy = vi.spyOn(utils, 'captureElectronError');
    vi.mocked(fetch).mockResolvedValue({
      headers: new Headers(),
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      type: 'basic',
      url: mockUrl,
    } as Response);

    await fetchJsonFromMainProcess(mockUrl);
    expect(spy).toHaveBeenCalled();
  });

  it('should not report error if silent option is true', async () => {
    const spy = vi.spyOn(utils, 'captureElectronError');
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await fetchJsonFromMainProcess(mockUrl, undefined, { silent: true });
    expect(spy).not.toHaveBeenCalled();
  });
});
