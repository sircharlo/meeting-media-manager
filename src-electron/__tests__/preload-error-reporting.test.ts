import {
  Client,
  type ClientOptions,
  createStackParser,
  createTransport,
  type Event,
  eventFromMessage,
  eventFromUnknownInput,
  type EventHint,
  type ParameterizedString,
  resolvedSyncPromise,
  type SeverityLevel,
  type StackFrame,
  withScope,
} from '@sentry/core';
import { fileURLToPath } from 'node:url';
import { capturePreloadErrorReport } from 'src-electron/main/utils';
import { capturePreloadError } from 'src-electron/preload/log';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// End to end: a preload error must become a real Sentry event. In the app,
// the preload runs in an isolated world (contextIsolation) where no Sentry
// client exists - capturing there returned an event id and silently dropped
// the event, so no preload error ever reached Sentry. Here, as in the app,
// the only client is the main process's: it is bound solely while the fake
// IPC bus runs a main-process handler. Reporting from the preload world
// directly therefore produces no event and fails these tests.

const ipcBus = vi.hoisted(() => ({
  toMain: undefined as ((channel: string, args: unknown[]) => void) | undefined,
}));

vi.mock('src-electron/preload/ipc', () => ({
  // Electron IPC structured-clones its arguments on the way to main.
  send: vi.fn((channel: string, ...args: unknown[]) =>
    ipcBus.toMain?.(channel, structuredClone(args)),
  ),
}));

// The main process reports through the SDK's captureException, which
// resolves its client from the current scope like any Sentry SDK.
vi.mock('@sentry/electron/main', async () => {
  const core = await import('@sentry/core');
  return {
    addBreadcrumb: core.addBreadcrumb,
    captureException: core.captureException,
  };
});

// test/vitest/setup/setup.electron.ts stubs both reporters for every
// electron test - this file tests the real ones.
vi.mock('src-electron/preload/log', async (importOriginal) => ({
  ...(await importOriginal<object>()),
}));
vi.mock('src-electron/main/utils', async (importOriginal) => ({
  ...(await importOriginal<object>()),
}));

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => '/mock/app'),
    getPath: vi.fn(),
    getVersion: vi.fn(),
    once: vi.fn(),
  },
}));
vi.mock('#q-app/electron/main', () => ({
  resolveElectronAssetsPath: vi.fn(),
}));
vi.mock('src-electron/main/session', () => ({ urlVariables: {} }));
vi.mock('src-electron/constants', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  IS_DEV: false,
}));

// Minimal V8 stack line parser (`at fn (file:line:col)` / `at file:line:col`).
const V8_FRAME = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/;
const v8LineParser = (line: string): StackFrame | undefined => {
  const match = V8_FRAME.exec(line);
  if (!match) return undefined;
  return {
    colno: Number(match[4]),
    filename: match[2],
    function: match[1] ?? '?',
    in_app: true,
    lineno: Number(match[3]),
  };
};

class MainProcessClient extends Client<ClientOptions> {
  // Client's own constructor is protected.
  public constructor(options: ClientOptions) {
    super(options);
  }

  public eventFromException(exception: unknown, hint?: EventHint) {
    return resolvedSyncPromise(
      eventFromUnknownInput(
        this,
        this.getOptions().stackParser,
        exception,
        hint,
      ),
    );
  }

  public eventFromMessage(
    message: ParameterizedString,
    level: SeverityLevel = 'info',
    hint?: EventHint,
  ) {
    return resolvedSyncPromise(
      eventFromMessage(this.getOptions().stackParser, message, level, hint),
    );
  }
}

const sentEvents: Event[] = [];
const mainClient = new MainProcessClient({
  beforeSend: (event) => {
    sentEvents.push(event);
    return event;
  },
  dsn: 'https://public@sentry.invalid/1',
  integrations: [],
  stackParser: createStackParser([50, v8LineParser]),
  transport: (options) =>
    createTransport(options, async () => ({ statusCode: 200 })),
});
mainClient.init();

// Stands in for ipcMain + the handler src-electron/main/ipc.ts registers.
ipcBus.toMain = (channel, args) => {
  if (channel !== 'capturePreloadError') return;
  withScope((scope) => {
    scope.setClient(mainClient);
    capturePreloadErrorReport(args[0]);
  });
};

const flushSentEvents = async () => {
  await vi.dynamicImportSettled();
  await mainClient.flush(2000);
  return sentEvents;
};

function failingPreloadOperation() {
  return new TypeError('preload operation failed');
}

describe('preload error reporting', () => {
  beforeEach(() => {
    sentEvents.length = 0;
  });

  it('turns a preload error into a Sentry event with its own stack', async () => {
    capturePreloadError(failingPreloadOperation(), {
      contexts: { fn: { name: 'somePreloadFn' } },
    });

    const events = await flushSentEvents();
    expect(events).toHaveLength(1);
    const [event] = events;
    const [exception] = event?.exception?.values ?? [];
    expect(exception).toMatchObject({
      type: 'TypeError',
      value: 'preload operation failed',
    });
    // The preload's frames, not those of the main-process rebuild.
    const functions = (exception?.stacktrace?.frames ?? []).map(
      (frame) => frame.function,
    );
    expect(functions).toContain('failingPreloadOperation');
    expect(functions).not.toContain('rebuildPreloadError');
    expect(event?.contexts?.fn).toEqual({ name: 'somePreloadFn' });
    expect(event?.tags).toMatchObject({ 'event.process': 'preload' });
  });

  it('reports a real preload fs failure, grouped by code and syscall', async () => {
    const { readDirectory } = await import('src-electron/preload/fs');

    // readdir on a file: a genuine Node ENOTDIR error from the preload's
    // own fs code, which catches it and reports it.
    expect(await readDirectory(fileURLToPath(import.meta.url))).toEqual([]);

    const events = await flushSentEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.exception?.values?.[0]?.value).toMatch(
      /^ENOTDIR: not a directory, scandir /,
    );
    expect(events[0]?.fingerprint).toEqual([
      'node-fs-error',
      'ENOTDIR',
      'scandir',
      'unknown',
    ]);
  });
});
