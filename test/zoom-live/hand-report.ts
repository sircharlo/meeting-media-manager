import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { env, print, ROOT } from './support';

// A machine-readable record of what the raised-hand live test saw, for the
// person reading its results afterwards: every probe's outcome, the raw
// replies from the Zoom helper (which name Zoom's controls in the user's own
// language, and carry what Zoom had on screen when an action failed), and the
// verdicts drawn from them. Written after every probe, so a run that dies
// halfway still leaves what it had seen; also streamed as NDJSON, for jq.

export interface ProbeOutcome<T> {
  error?: string;
  ok: boolean;
  value?: T;
}

export interface ZoomHandProbe {
  data?: unknown;
  detail?: string;
  error?: string;
  id: string;
  ms: number;
  ok: boolean;
  /** What the probe was trying to find out, in plain words. */
  wants: string;
}

export interface ZoomHandReportMeta {
  [key: string]: unknown;
  /** The raised-hand phrase M³ knew before the run, in Zoom's language. */
  phrase?: null | string;
  /** Zoom's language, as written in .env.zoom-test, if set. */
  zoomLanguage?: null | string;
}

const DIR = join(ROOT, 'reports', 'zoom-live');

/** A command reply's error, or nothing when it worked. */
export const replyError = (reply: { error?: string; ok?: boolean }) =>
  reply.ok ? undefined : (reply.error ?? 'not-ok');

export class ZoomHandReport {
  readonly ndjsonPath: string;
  readonly path: string;
  private readonly json: {
    finishedAt?: string;
    meta: ZoomHandReportMeta;
    probes: ZoomHandProbe[];
    startedAt: string;
    verdicts: Record<string, boolean | null | string>;
    zoom: Record<string, unknown>;
  };
  private readonly startedAt = new Date();

  constructor(meta: ZoomHandReportMeta = {}) {
    const stamp = this.startedAt.toISOString().replaceAll(/[:.]/g, '-');
    this.path = join(DIR, `hand-${stamp}.json`);
    this.ndjsonPath = join(DIR, `hand-${stamp}.ndjson`);
    this.json = {
      meta: { ...meta, host: env.ZOOM_TEST_HOST ?? null },
      probes: [],
      startedAt: this.startedAt.toISOString(),
      verdicts: {},
      zoom: {},
    };
  }

  /** Closes the report with the verdicts, and says where it is. */
  finish(verdicts: Record<string, boolean | null | string>) {
    this.json.verdicts = verdicts;
    this.json.finishedAt = new Date().toISOString();
    this.save();
    print(`  Report: ${this.path}`);
    print(`  Report (one probe per line): ${this.ndjsonPath}`);
  }

  /** Records something noticed along the way (Zoom's version, its buttons). */
  note(key: string, value: unknown) {
    this.json.zoom[key] = value;
    this.save();
  }

  /**
   * Runs one probe: a command, or some checking of its own. A thrown error is
   * recorded instead of ending the run, so a broken step still leaves the rest
   * of the report, and where it first went wrong.
   */
  async probe<T>(
    id: string,
    wants: string,
    run: () => Promise<T>,
    summarize?: (value: T) => Record<string, unknown>,
  ): Promise<ProbeOutcome<T>> {
    return this.run(id, wants, run, summarize, () => true);
  }

  /**
   * A probe that talks to the Zoom helper, whose reply says itself whether
   * the action worked: its `ok` becomes the probe's, and the whole reply
   * (Zoom's own names, and what it had on screen on failure) is kept.
   */
  async reply<T extends { error?: string; ok: boolean }>(
    id: string,
    wants: string,
    run: () => Promise<T>,
  ): Promise<ProbeOutcome<T>> {
    return this.run(id, wants, run, undefined, (reply) => reply.ok);
  }

  private record(entry: ZoomHandProbe) {
    this.json.probes.push(entry);
    this.save();
    const summary = entry.error ? `error=${entry.error}` : (entry.detail ?? '');
    print(
      `  probe ${entry.id} ok=${entry.ok} ${entry.ms}ms ${summary}`.trimEnd(),
    );
  }

  private async run<T>(
    id: string,
    wants: string,
    run: () => Promise<T>,
    summarize: ((value: T) => Record<string, unknown>) | undefined,
    worked: (value: T) => boolean,
  ): Promise<ProbeOutcome<T>> {
    const started = Date.now();
    const entry: ZoomHandProbe = { id, ms: 0, ok: false, wants };
    try {
      const value = await run();
      entry.data = value;
      entry.ok = worked(value);
      if (!entry.ok) {
        entry.error = (value as { error?: string }).error ?? 'not-ok';
      }
      if (summarize) entry.detail = JSON.stringify(summarize(value));
      entry.ms = Date.now() - started;
      this.record(entry);
      return { error: entry.error, ok: entry.ok, value };
    } catch (error) {
      entry.error = error instanceof Error ? error.message : String(error);
      entry.ms = Date.now() - started;
      this.record(entry);
      return { error: entry.error, ok: false };
    }
  }

  // Written on the first finding, so a run that checks nothing (no meeting
  // ID, or not Windows) leaves no file behind.
  private save() {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(this.path, `${JSON.stringify(this.json, null, 2)}\n`, 'utf8');
    writeFileSync(
      this.ndjsonPath,
      this.json.probes.map((probe) => JSON.stringify(probe)).join('\n') +
        (this.json.probes.length ? '\n' : ''),
      'utf8',
    );
  }
}
