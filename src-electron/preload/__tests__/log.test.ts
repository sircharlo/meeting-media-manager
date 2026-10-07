import type { PreloadErrorReport } from 'src/types';

import { send } from 'src-electron/preload/ipc';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { capturePreloadError, serializePreloadError } from '../log';

vi.mock('src-electron/preload/ipc', () => ({ send: vi.fn() }));

// The electron test setup mocks src-electron/preload/log (so tests of other
// preload modules don't report anything); restore the real implementation
// here so capturePreloadError itself is what's under test.
vi.mock('src-electron/preload/log', async (importOriginal) => {
  const mod = await importOriginal<object>();
  return { ...mod };
});

// The report is sent after a lazy import of the ipc module.
const sentReports = async () => {
  await vi.dynamicImportSettled();
  return vi
    .mocked(send)
    .mock.calls.map(([channel, report]) => ({ channel, report }));
};

const reportOf = (error: Error, context?: PreloadErrorReport['context']) => ({
  channel: 'capturePreloadError',
  report: {
    ...(context && { context }),
    error: serializePreloadError(error),
  },
});

describe('capturePreloadError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards an error without a cause to the main process once', async () => {
    const error = new Error('outer only');

    capturePreloadError(error);

    expect(await sentReports()).toEqual([reportOf(error)]);
  });

  it('forwards only the cause when an error wraps another error', async () => {
    const cause = new Error('the actual failure');
    const outer = new Error('wrapper', { cause });

    capturePreloadError(outer);

    expect(await sentReports()).toEqual([reportOf(cause)]);
  });

  it('recurses through nested causes without reporting any wrapper', async () => {
    const root = new Error('root cause');
    const middle = new Error('middle', { cause: root });
    const outer = new Error('outer', { cause: middle });

    capturePreloadError(outer);

    expect(await sentReports()).toEqual([reportOf(root)]);
  });

  it('passes the context through to the reported cause', async () => {
    const cause = new Error('the actual failure');
    const outer = new Error('wrapper', { cause });
    const context = { contexts: { fn: { name: 'somePreloadFn' } } };

    capturePreloadError(outer, context);

    expect(await sentReports()).toEqual([reportOf(cause, context)]);
  });

  it('drops raw DOM events', async () => {
    capturePreloadError(new Event('error'));

    expect(await sentReports()).toEqual([]);
  });

  it('drops an event used as a cause', async () => {
    const outer = new Error('wrapper', { cause: new Event('error') });

    capturePreloadError(outer);

    expect(await sentReports()).toEqual([]);
  });

  it('sends a report that survives structured clone with its fs error code', async () => {
    const error = Object.assign(
      new Error("EPERM: operation not permitted, open 'C:/a/b.txt'"),
      { code: 'EPERM', syscall: 'open' },
    );

    capturePreloadError(error, { contexts: { fn: { name: 'x' } } });

    const [sent] = await sentReports();
    // Electron IPC structured-clones its arguments; a raw Error would lose
    // code/syscall here.
    expect(structuredClone(sent?.report)).toEqual({
      context: { contexts: { fn: { name: 'x' } } },
      error: {
        code: 'EPERM',
        message: "EPERM: operation not permitted, open 'C:/a/b.txt'",
        name: 'Error',
        stack: error.stack,
        syscall: 'open',
      },
    });
  });

  it('resends just the error when the context cannot be cloned', async () => {
    vi.mocked(send).mockImplementationOnce(() => {
      throw new Error('An object could not be cloned.');
    });
    const error = new Error('boom');

    capturePreloadError(error, {
      contexts: { fn: { callback: () => undefined, name: 'x' } },
    });

    const reports = await sentReports();
    expect(reports).toHaveLength(2);
    expect(reports[1]).toEqual(reportOf(error));
  });
});

describe('serializePreloadError', () => {
  it('keeps the name, message and stack of an error', () => {
    const error = new TypeError('bad type');

    expect(serializePreloadError(error)).toEqual({
      message: 'bad type',
      name: 'TypeError',
      stack: error.stack,
    });
  });

  it('describes thrown non-error values', () => {
    expect(serializePreloadError('plain string')).toEqual({
      message: 'plain string',
      name: 'Error',
    });
    expect(serializePreloadError({ reason: 'x' })).toEqual({
      message: '{"reason":"x"}',
      name: 'Error',
    });
    expect(serializePreloadError(undefined)).toEqual({
      message: 'undefined',
      name: 'Error',
    });
  });

  it('ignores a non-string error code such as an exit status', () => {
    const error = Object.assign(new Error('Command failed: attrib'), {
      code: 1,
    });

    expect(serializePreloadError(error)).not.toHaveProperty('code');
  });
});
