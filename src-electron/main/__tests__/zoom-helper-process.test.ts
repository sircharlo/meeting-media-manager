import type { ChildProcessWithoutNullStreams } from 'node:child_process';

import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { isZoomCommand, ZoomHelperProcess } from '../zoom-helper-process';

/** A stand-in for the PowerShell process, scripted line by line. */
class FakeHelper extends EventEmitter {
  exitCode: null | number = null;
  readonly requests: Record<string, unknown>[] = [];
  readonly stderr = new PassThrough();
  readonly stdin = new PassThrough();
  readonly stdout = new PassThrough();

  constructor() {
    super();
    this.stdin.on('data', (chunk: Buffer) => {
      for (const line of chunk.toString().split('\n').filter(Boolean)) {
        this.requests.push(JSON.parse(line) as Record<string, unknown>);
      }
    });
  }

  exit(code: number) {
    this.exitCode = code;
    this.emit('exit', code);
  }

  kill() {
    this.exit(1);
    return true;
  }

  reply(message: Record<string, unknown>) {
    this.stdout.write(`${JSON.stringify(message)}\n`);
  }

  /** Answers the latest request. */
  async replyToLast(result: Record<string, unknown>) {
    await vi.waitFor(() => {
      if (this.requests.length === 0) throw new Error('No request yet');
    });
    this.reply({ ...result, id: this.requests.at(-1)?.id });
  }
}

let fakes: FakeHelper[] = [];

const createHelper = (
  options: Partial<ConstructorParameters<typeof ZoomHelperProcess>[0]> = {},
) => {
  fakes = [];
  const spawn = vi.fn(() => {
    const fake = new FakeHelper();
    fakes.push(fake);
    return fake as unknown as ChildProcessWithoutNullStreams;
  });
  const helper = new ZoomHelperProcess({
    scriptPath: 'C:\\m3\\zoom-helper.ps1',
    spawn: spawn as never,
    ...options,
  });
  return { helper, spawn };
};

const startReady = async (helper: ZoomHelperProcess) => {
  const started = helper.start();
  await vi.waitFor(() => expect(fakes).toHaveLength(1));
  fakes[0]?.reply({ ready: true, version: 1 });
  return started;
};

afterEach(() => {
  vi.useRealTimers();
});

describe('ZoomHelperProcess', () => {
  it('starts PowerShell on the helper script and waits for it to be ready', async () => {
    const { helper, spawn } = createHelper({ cacheDir: 'C:\\cache' });

    expect(await startReady(helper)).toEqual({ ok: true });
    expect(helper.running).toBe(true);
    expect(spawn).toHaveBeenCalledWith(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        'C:\\m3\\zoom-helper.ps1',
        '-CacheDir',
        'C:\\cache',
      ],
      { windowsHide: true },
    );
  });

  it('reports why the helper could not start', async () => {
    const { helper } = createHelper();
    const started = helper.start();
    await vi.waitFor(() => expect(fakes).toHaveLength(1));
    fakes[0]?.reply({
      detail: 'ConstrainedLanguage',
      error: 'powershell-restricted',
      ready: false,
    });

    expect(await started).toEqual({
      detail: 'ConstrainedLanguage',
      error: 'powershell-restricted',
      ok: false,
    });
    expect(helper.running).toBe(false);
  });

  it('reports a missing PowerShell', async () => {
    const { helper } = createHelper();
    const started = helper.start();
    await vi.waitFor(() => expect(fakes).toHaveLength(1));
    fakes[0]?.emit('error', new Error('spawn powershell.exe ENOENT'));

    expect(await started).toMatchObject({
      error: 'powershell-not-found',
      ok: false,
    });
  });

  it('gives up on a helper that never gets ready', async () => {
    vi.useFakeTimers();
    const { helper } = createHelper({ startTimeoutMs: 1000 });
    const started = helper.start();
    await vi.advanceTimersByTimeAsync(1001);

    expect(await started).toEqual({ error: 'helper-start-timeout', ok: false });
    expect(fakes[0]?.exitCode).not.toBeNull();
  });

  it('sends each command with an id and returns the matching reply', async () => {
    const { helper } = createHelper();
    await startReady(helper);

    const result = helper.request({ allowSelfUnmute: false, type: 'mute-all' });
    await fakes[0]?.replyToLast({ changed: true, ok: true });

    expect(await result).toEqual({ changed: true, ok: true });
    expect(fakes[0]?.requests).toEqual([
      { allowSelfUnmute: false, id: 1, type: 'mute-all' },
    ]);
  });

  it('keeps text intact both ways', async () => {
    const { helper } = createHelper();
    await startReady(helper);

    const result = helper.request({ echo: 'é ³ 中 Ä', type: 'ping' });
    await vi.waitFor(() => expect(fakes[0]?.requests).toHaveLength(1));
    expect(fakes[0]?.requests[0]?.echo).toBe('é ³ 中 Ä');
    fakes[0]?.reply({ echo: 'é ³ 中 Ä', id: 1, ok: true });

    expect(await result).toEqual({ echo: 'é ³ 中 Ä', ok: true });
  });

  it('sends one command at a time, in order', async () => {
    const { helper } = createHelper();
    await startReady(helper);
    const [fake] = fakes;
    if (!fake) throw new Error('The helper was not started');

    const first = helper.request({ type: 'join-audio' });
    const second = helper.request({ type: 'meeting' });
    await vi.waitFor(() => expect(fake.requests).toHaveLength(1));
    // The second waits for the first: Zoom actions must not overlap.
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(fake.requests).toHaveLength(1);

    fake.reply({ changed: true, id: 1, ok: true });
    await vi.waitFor(() => expect(fake.requests).toHaveLength(2));
    fake.reply({ id: 2, meeting: { found: true, sharing: false }, ok: true });

    expect(await first).toEqual({ changed: true, ok: true });
    expect(await second).toEqual({
      meeting: { found: true, sharing: false },
      ok: true,
    });
    expect(fake.requests.map((r) => r.type)).toEqual(['join-audio', 'meeting']);
  });

  it('ignores replies meant for an earlier request', async () => {
    const { helper } = createHelper();
    await startReady(helper);

    const result = helper.request({ type: 'meeting' });
    await vi.waitFor(() => expect(fakes[0]?.requests).toHaveLength(1));
    fakes[0]?.reply({ id: 999, ok: false });
    fakes[0]?.reply({
      id: 1,
      meeting: { found: false, sharing: false },
      ok: true,
    });

    expect(await result).toEqual({
      meeting: { found: false, sharing: false },
      ok: true,
    });
  });

  it('restarts a helper that stops answering', async () => {
    vi.useFakeTimers();
    const onLog = vi.fn();
    const { helper } = createHelper({ onLog, requestTimeoutMs: 5000 });
    const started = helper.start();
    await vi.waitFor(() => expect(fakes).toHaveLength(1));
    fakes[0]?.reply({ ready: true });
    await started;

    const stuck = helper.request({ type: 'stop-share' });
    await vi.advanceTimersByTimeAsync(5001);

    expect(await stuck).toEqual({ error: 'helper-timeout', ok: false });
    expect(fakes[0]?.exitCode).not.toBeNull();
    expect(helper.running).toBe(false);
    expect(onLog).toHaveBeenCalledWith(expect.stringContaining('stop-share'));

    // The next command starts a fresh helper.
    const next = helper.request({ type: 'meeting' });
    await vi.waitFor(() => expect(fakes).toHaveLength(2));
    fakes[1]?.reply({ ready: true });
    await fakes[1]?.replyToLast({
      meeting: { found: true, sharing: false },
      ok: true,
    });
    expect(await next).toMatchObject({ ok: true });
  });

  it('fails the current command when the helper crashes, then recovers', async () => {
    const onExit = vi.fn();
    const { helper } = createHelper({ onExit });
    await startReady(helper);

    const pending = helper.request({ type: 'leave-audio' });
    await vi.waitFor(() => expect(fakes[0]?.requests).toHaveLength(1));
    fakes[0]?.exit(3);

    expect(await pending).toEqual({ error: 'helper-exited', ok: false });
    expect(onExit).toHaveBeenCalledWith(3);

    const next = helper.request({ type: 'meeting' });
    await vi.waitFor(() => expect(fakes).toHaveLength(2));
    fakes[1]?.reply({ ready: true });
    await fakes[1]?.replyToLast({
      meeting: { found: false, sharing: false },
      ok: true,
    });
    expect(await next).toMatchObject({ ok: true });
  });

  it('returns the start failure to commands when the helper cannot start', async () => {
    const { helper } = createHelper();
    const result = helper.request({ type: 'meeting' });
    await vi.waitFor(() => expect(fakes).toHaveLength(1));
    fakes[0]?.reply({ error: 'helper-not-compiled', ready: false });

    expect(await result).toEqual({ error: 'helper-not-compiled', ok: false });
  });

  it("passes the helper's log lines on", async () => {
    const onLog = vi.fn();
    const { helper } = createHelper({ onLog });
    await startReady(helper);

    fakes[0]?.stderr.write('Zoom helper error: something\n');
    fakes[0]?.stdout.write('WARNING: not JSON\n');

    await vi.waitFor(() => {
      expect(onLog).toHaveBeenCalledWith('Zoom helper error: something');
      expect(onLog).toHaveBeenCalledWith('WARNING: not JSON');
    });
  });

  it('stops the helper and fails what was still waiting', async () => {
    const { helper } = createHelper();
    await startReady(helper);

    const pending = helper.request({ type: 'share-entries' });
    await vi.waitFor(() => expect(fakes[0]?.requests).toHaveLength(1));
    helper.stop();

    expect(await pending).toEqual({ error: 'helper-stopped', ok: false });
    expect(fakes[0]?.exitCode).not.toBeNull();
    expect(helper.running).toBe(false);
  });

  it('shares one start between callers', async () => {
    const { helper, spawn } = createHelper();
    const first = helper.start();
    const second = helper.start();
    await vi.waitFor(() => expect(fakes).toHaveLength(1));
    fakes[0]?.reply({ ready: true });

    expect(await Promise.all([first, second])).toEqual([
      { ok: true },
      { ok: true },
    ]);
    expect(spawn).toHaveBeenCalledOnce();
  });
});

describe('isZoomCommand', () => {
  it('accepts known commands and rejects anything else', () => {
    expect(isZoomCommand({ type: 'meeting' })).toBe(true);
    expect(isZoomCommand({ echo: 'x', type: 'ping' })).toBe(true);
    expect(isZoomCommand({ type: 'diagnose' })).toBe(true);
    expect(isZoomCommand({ type: 'toggle-video' })).toBe(true);
    expect(
      isZoomCommand({
        shareButtonTitle: null,
        type: 'test-share-picker',
        windowTitle: 'Media Player - M³',
      }),
    ).toBe(true);
    expect(isZoomCommand({ allowSelfUnmute: true, type: 'mute-all' })).toBe(
      true,
    );
    expect(isZoomCommand({ type: 'format-c-drive' })).toBe(false);
    expect(isZoomCommand({ type: 'toString' })).toBe(false);
    expect(isZoomCommand('meeting')).toBe(false);
    expect(isZoomCommand(null)).toBe(false);
  });
});
