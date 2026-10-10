import type {
  ZoomCommand,
  ZoomCommandResult,
  ZoomCommandType,
  ZoomHelperStartResult,
} from 'src/types';

import {
  type ChildProcessWithoutNullStreams,
  spawn as nodeSpawn,
} from 'node:child_process';
import { createInterface } from 'node:readline';

// Runs the Zoom helper (src-electron/zoom-helper/zoom-helper.ps1) and talks
// to it over stdin/stdout: one JSON request per line, one JSON reply per
// line. Requests go one at a time, since every Zoom action moves focus and
// two at once would close each other's menus.
//
// Kept free of Electron imports: the local live Zoom test (test/zoom-live)
// drives the helper through this same class.

const COMMAND_TYPES = new Set<ZoomCommandType>([
  'admit',
  'ask-all-to-unmute',
  'diagnose',
  'join-audio',
  'learn-hand-raised',
  'leave-audio',
  'meeting',
  'mic-title',
  'mute-all',
  'participants',
  'ping',
  'press-participant-mic',
  'raised-hands',
  'set-mic',
  'set-video',
  'share-entries',
  'start-share',
  'stop-share',
  'test-share-picker',
  'toggle-mic',
  'toggle-video',
  'video-title',
]);

export const isZoomCommand = (value: unknown): value is ZoomCommand =>
  !!value &&
  typeof value === 'object' &&
  'type' in value &&
  typeof value.type === 'string' &&
  COMMAND_TYPES.has(value.type as ZoomCommandType);

export interface ZoomHelperProcessOptions {
  /** Where the helper keeps the UI Automation interop it generates. */
  cacheDir?: string;
  onExit?: (code: null | number) => void;
  /** The helper's log lines (its stderr). */
  onLog?: (line: string) => void;
  /** The helper started and is ready for commands. */
  onReady?: () => void;
  /** How long one action may take before the helper counts as stuck. */
  requestTimeoutMs?: number;
  scriptPath: string;
  spawn?: typeof nodeSpawn;
  /** The first start compiles the helper, which takes a few seconds. */
  startTimeoutMs?: number;
}

interface PendingRequest {
  id: number;
  resolve: (result: ZoomCommandResult) => void;
  timer: ReturnType<typeof setTimeout>;
}

const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;
const DEFAULT_START_TIMEOUT_MS = 60_000;

export class ZoomHelperProcess {
  get running() {
    return this.ready && !!this.child;
  }
  private child: ChildProcessWithoutNullStreams | null = null;
  private nextId = 1;
  private readonly options: ZoomHelperProcessOptions;
  private pending: null | PendingRequest = null;
  private queue: Promise<unknown> = Promise.resolve();
  private ready = false;

  private starting: null | Promise<ZoomHelperStartResult> = null;

  constructor(options: ZoomHelperProcessOptions) {
    this.options = options;
  }

  /** Runs one command, starting the helper first if needed. */
  request(command: ZoomCommand): Promise<ZoomCommandResult> {
    const run = async (): Promise<ZoomCommandResult> => {
      if (!this.running) {
        const started = await this.start();
        if (!started.ok) {
          return { error: started.error ?? 'helper-not-started', ok: false };
        }
      }
      return this.send(command);
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  start(): Promise<ZoomHelperStartResult> {
    if (this.running) return Promise.resolve({ ok: true });
    this.starting ??= this.launch().finally(() => {
      this.starting = null;
    });
    return this.starting;
  }

  stop() {
    const child = this.child;
    this.child = null;
    this.ready = false;
    this.settle({ error: 'helper-stopped', ok: false });
    if (child && child.exitCode === null) {
      child.stdin.end();
      child.kill();
    }
  }

  private launch(): Promise<ZoomHelperStartResult> {
    const {
      cacheDir,
      onExit,
      onLog,
      onReady,
      scriptPath,
      spawn = nodeSpawn,
      startTimeoutMs = DEFAULT_START_TIMEOUT_MS,
    } = this.options;

    return new Promise((resolve) => {
      let startResult: null | ZoomHelperStartResult = null;
      const finishStart = (result: ZoomHelperStartResult) => {
        if (startResult) return;
        startResult = result;
        clearTimeout(startTimer);
        if (!result.ok) this.stop();
        resolve(result);
      };

      let child: ChildProcessWithoutNullStreams;
      try {
        child = spawn(
          'powershell.exe',
          [
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy',
            'Bypass',
            '-File',
            scriptPath,
            ...(cacheDir ? ['-CacheDir', cacheDir] : []),
          ],
          { windowsHide: true },
        );
      } catch (error) {
        resolve({
          detail: String(error),
          error: 'powershell-not-found',
          ok: false,
        });
        return;
      }
      this.child = child;
      this.ready = false;

      // Only ever read by finishStart, which runs once the helper answers.
      const startTimer = setTimeout(
        () => finishStart({ error: 'helper-start-timeout', ok: false }),
        startTimeoutMs,
      );

      createInterface({ input: child.stdout }).on('line', (line) => {
        let message: Record<string, unknown>;
        try {
          message = JSON.parse(line) as Record<string, unknown>;
        } catch {
          onLog?.(line);
          return;
        }
        if (!startResult && 'ready' in message) {
          if (message.ready === true) {
            this.ready = true;
            finishStart({ ok: true });
            onReady?.();
          } else {
            finishStart({
              detail:
                typeof message.detail === 'string' ? message.detail : undefined,
              error:
                typeof message.error === 'string'
                  ? message.error
                  : 'helper-not-started',
              ok: false,
            });
          }
          return;
        }
        if (this.pending && message.id === this.pending.id) {
          const result: Record<string, unknown> = { ...message };
          delete result.id;
          this.settle(result as unknown as ZoomCommandResult);
        }
      });

      createInterface({ input: child.stderr }).on('line', (line) => {
        if (line.trim()) onLog?.(line);
      });

      child.on('error', (error) => {
        finishStart({
          detail: error.message,
          error: 'powershell-not-found',
          ok: false,
        });
      });

      child.on('exit', (code) => {
        if (this.child === child) {
          this.child = null;
          this.ready = false;
          this.settle({ error: 'helper-exited', ok: false });
        }
        finishStart({
          detail: `exit code ${code}`,
          error: 'helper-exited',
          ok: false,
        });
        onExit?.(code);
      });
    });
  }

  private send(command: ZoomCommand): Promise<ZoomCommandResult> {
    const child = this.child;
    if (!child)
      return Promise.resolve({ error: 'helper-not-running', ok: false });
    const { requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS } = this.options;
    const id = this.nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.options.onLog?.(
          `No answer to "${command.type}" in time; restarting`,
        );
        // A stuck UI Automation call would block every later request.
        this.settle({ error: 'helper-timeout', ok: false });
        this.stop();
      }, requestTimeoutMs);
      this.pending = { id, resolve, timer };
      child.stdin.write(`${JSON.stringify({ ...command, id })}\n`, 'utf8');
    });
  }

  private settle(result: ZoomCommandResult) {
    const pending = this.pending;
    if (!pending) return;
    this.pending = null;
    clearTimeout(pending.timer);
    pending.resolve(result);
  }
}
