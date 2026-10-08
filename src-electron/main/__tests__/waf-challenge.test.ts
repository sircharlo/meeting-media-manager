import type { EventEmitter as EventEmitterType } from 'node:events';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('node:events') as {
    EventEmitter: typeof EventEmitterType;
  };

  const cookieStore = new Map<string, string>();
  const cookies = Object.assign(new EventEmitter(), {
    get: vi.fn(async ({ name }: { name: string; url: string }) => {
      const value = cookieStore.get(name);
      return value ? [{ name, value }] : [];
    }),
  });

  class FakeWindow extends EventEmitter {
    static instances: FakeWindow[] = [];
    destroyed = false;
    destroy = vi.fn(() => {
      this.destroyed = true;
    });

    loadURL = vi.fn(async () => undefined);
    webContents = Object.assign(new EventEmitter(), {
      id: 100 + FakeWindow.instances.length,
      setAudioMuted: vi.fn(),
      setWindowOpenHandler: vi.fn(),
    });
    constructor(readonly options: unknown) {
      super();
      FakeWindow.instances.push(this);
    }

    isDestroyed = () => this.destroyed;
  }

  return { cookies, cookieStore, FakeWindow };
});

vi.mock('electron', () => ({
  BrowserWindow: mocks.FakeWindow,
  session: { defaultSession: { cookies: mocks.cookies } },
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
}));

vi.mock('src/shared/vanilla', () => ({ log: vi.fn() }));

const loadModule = () => import('../waf-challenge');

// Simulates the challenge page's script setting the token cookie.
const solveChallenge = (value = 'token-1') => {
  mocks.cookieStore.set('aws-waf-token', value);
  mocks.cookies.emit('changed');
};

describe('getChallengeHost', () => {
  it('allows only the configured WOL host over HTTPS', async () => {
    const { getChallengeHost } = await loadModule();

    expect(
      getChallengeHost('https://wol.example.test/wol/finder', 'example.test'),
    ).toBe('wol.example.test');
    expect(
      getChallengeHost('http://wol.example.test/', 'example.test'),
    ).toBeUndefined();
    expect(
      getChallengeHost('https://www.example.test/', 'example.test'),
    ).toBeUndefined();
    expect(
      getChallengeHost('https://wol.other.test/', 'example.test'),
    ).toBeUndefined();
    expect(getChallengeHost('https://wol.example.test/', '')).toBeUndefined();
    expect(getChallengeHost('not a url', 'example.test')).toBeUndefined();
  });
});

describe('passWafChallenge / attachWafToken', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.cookieStore.clear();
    mocks.cookies.removeAllListeners();
    mocks.FakeWindow.instances.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('obtains the token in a hidden, sandboxed window and closes it', async () => {
    const { passWafChallenge } = await loadModule();

    const result = passWafChallenge('wol.example.test');
    await vi.waitFor(() => expect(mocks.FakeWindow.instances).toHaveLength(1));
    solveChallenge();

    await expect(result).resolves.toBe(true);
    const win = mocks.FakeWindow.instances[0];
    expect(win?.options).toEqual(
      expect.objectContaining({
        show: false,
        webPreferences: expect.objectContaining({
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        }),
      }),
    );
    expect(win?.loadURL).toHaveBeenCalledWith('https://wol.example.test/');
    expect(win?.webContents.setWindowOpenHandler).toHaveBeenCalled();
    expect(win?.destroy).toHaveBeenCalled();
  });

  it('attaches the obtained token only to requests for that host', async () => {
    const { attachWafToken, passWafChallenge } = await loadModule();
    const result = passWafChallenge('wol.example.test');
    await vi.waitFor(() => expect(mocks.FakeWindow.instances).toHaveLength(1));
    solveChallenge('abc');
    await result;

    const wolHeaders: Record<string, string> = {};
    attachWafToken('https://wol.example.test/wol/finder', 1, wolHeaders);
    expect(wolHeaders['Cookie']).toBe('aws-waf-token=abc');

    const withCookie: Record<string, string> = { Cookie: 'a=1' };
    attachWafToken('https://wol.example.test/x', 1, withCookie);
    expect(withCookie['Cookie']).toBe('a=1; aws-waf-token=abc');

    const otherHost: Record<string, string> = {};
    attachWafToken('https://www.example.test/', 1, otherHost);
    expect(otherHost['Cookie']).toBeUndefined();
  });

  it("leaves the challenge window's own requests alone", async () => {
    const { attachWafToken, passWafChallenge } = await loadModule();
    const first = passWafChallenge('wol.example.test');
    await vi.waitFor(() => expect(mocks.FakeWindow.instances).toHaveLength(1));
    solveChallenge('abc');
    await first;

    // A second challenge (e.g. after the token expired) is in progress.
    void passWafChallenge('wol.example.test');
    await vi.waitFor(() => expect(mocks.FakeWindow.instances).toHaveLength(2));
    const challengeWindowId = mocks.FakeWindow.instances[1]?.webContents.id;

    const headers: Record<string, string> = {};
    attachWafToken('https://wol.example.test/', challengeWindowId, headers);
    expect(headers['Cookie']).toBeUndefined();
  });

  it('runs one challenge at a time per host', async () => {
    const { passWafChallenge } = await loadModule();

    const a = passWafChallenge('wol.example.test');
    const b = passWafChallenge('wol.example.test');
    await vi.waitFor(() => expect(mocks.FakeWindow.instances).toHaveLength(1));
    solveChallenge();

    await expect(Promise.all([a, b])).resolves.toEqual([true, true]);
    expect(mocks.FakeWindow.instances).toHaveLength(1);
  });

  it('gives up after the timeout and attaches nothing', async () => {
    vi.useFakeTimers();
    const { attachWafToken, passWafChallenge } = await loadModule();

    const result = passWafChallenge('wol.example.test');
    await vi.advanceTimersByTimeAsync(20_000);

    await expect(result).resolves.toBe(false);
    expect(mocks.FakeWindow.instances[0]?.destroy).toHaveBeenCalled();
    const headers: Record<string, string> = {};
    attachWafToken('https://wol.example.test/', 1, headers);
    expect(headers['Cookie']).toBeUndefined();
  });
});
