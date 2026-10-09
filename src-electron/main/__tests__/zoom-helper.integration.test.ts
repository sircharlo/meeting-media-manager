import { spawn } from 'node:child_process';
import { copyFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { afterAll, describe, expect, it } from 'vitest';

import { ZoomHelperProcess } from '../zoom-helper-process';

// Runs the real Zoom helper (Windows PowerShell + the C# it compiles), so a
// compile error, an encoding problem or a protocol slip shows up here rather
// than in a congregation's meeting. None of it needs Zoom: anything that
// depends on Zoom's state is covered by `yarn test:zoom-live`.

const SCRIPT = join(process.cwd(), 'src-electron/zoom-helper/zoom-helper.ps1');
const TIMEOUT = 120_000;

/** Talks to the helper directly, to send what ZoomHelperProcess never would. */
const rawSession = async (cacheDir: string, lines: string[]) => {
  const child = spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      SCRIPT,
      '-CacheDir',
      cacheDir,
    ],
    { windowsHide: true },
  );
  const replies: Record<string, unknown>[] = [];
  const done = new Promise<void>((resolve) => {
    createInterface({ input: child.stdout }).on('line', (line) => {
      replies.push(JSON.parse(line) as Record<string, unknown>);
    });
    child.on('exit', () => resolve());
  });
  for (const line of lines) child.stdin.write(`${line}\n`, 'utf8');
  child.stdin.end();
  await done;
  return replies;
};

describe.runIf(process.platform === 'win32')(
  'Zoom helper (real PowerShell)',
  () => {
    const cacheDir = mkdtempSync(join(tmpdir(), 'm3-zoom-helper-test-'));
    const helpers: ZoomHelperProcess[] = [];

    const newHelper = () => {
      const helper = new ZoomHelperProcess({ cacheDir, scriptPath: SCRIPT });
      helpers.push(helper);
      return helper;
    };

    // Stopped helpers release the interop DLL once they've exited.
    const removeWhenReleased = (dir: string) =>
      rm(dir, {
        force: true,
        maxRetries: 20,
        recursive: true,
        retryDelay: 250,
      });

    afterAll(async () => {
      helpers.forEach((helper) => helper.stop());
      await removeWhenReleased(cacheDir);
    });

    it(
      'starts on a fresh computer, generating its UI Automation interop',
      async () => {
        const helper = newHelper();
        const started = await helper.start();

        expect(started).toEqual({ ok: true });
        const [versionFolder] = readdirSync(cacheDir);
        expect(readdirSync(join(cacheDir, versionFolder ?? ''))).toEqual([
          'Interop.UIAutomationClient.dll',
        ]);
        helper.stop();
      },
      TIMEOUT,
    );

    it(
      'starts again from the cached interop, quickly',
      async () => {
        const helper = newHelper();
        const startedAt = Date.now();
        expect(await helper.start()).toEqual({ ok: true });
        // Compiling the helper itself is all that's left: a couple of seconds.
        expect(Date.now() - startedAt).toBeLessThan(15_000);
        helper.stop();
      },
      TIMEOUT,
    );

    it(
      'keeps accented and non-Latin text intact both ways',
      async () => {
        const helper = newHelper();
        const text = 'Arrêter ma vidéo · Média M³ · Видео · 视频 · ビデオ';

        expect(await helper.request({ echo: text, type: 'ping' })).toEqual({
          echo: text,
          ok: true,
          version: 1,
        });
        helper.stop();
      },
      TIMEOUT,
    );

    it(
      'answers about the meeting whether or not Zoom is open',
      async () => {
        const helper = newHelper();
        const result = await helper.request({ type: 'meeting' });

        expect(result.ok).toBe(true);
        expect(typeof result.meeting?.found).toBe('boolean');
        expect(typeof result.meeting?.sharing).toBe('boolean');
        helper.stop();
      },
      TIMEOUT,
    );

    it(
      'answers unknown commands and malformed lines without stopping',
      async () => {
        const replies = await rawSession(cacheDir, [
          '{"id":1,"type":"format-c-drive"}',
          'this is not JSON',
          '',
          '[1, 2, 3]',
          '{"id":"abc","type":"ping","echo":"still here"}',
        ]);

        expect(replies).toEqual([
          { ready: true, version: 1 },
          { error: 'unknown-command', id: 1, ok: false },
          { error: 'invalid-request', id: null, ok: false },
          { error: 'invalid-request', id: null, ok: false },
          { echo: 'still here', id: 'abc', ok: true, version: 1 },
        ]);
      },
      TIMEOUT,
    );

    it(
      'reports a compile failure instead of hanging',
      async () => {
        const brokenDir = mkdtempSync(join(tmpdir(), 'm3-zoom-helper-broken-'));
        try {
          // The launcher with no C# source next to it can't compile anything.
          const brokenScript = join(brokenDir, 'zoom-helper.ps1');
          copyFileSync(SCRIPT, brokenScript);
          const helper = new ZoomHelperProcess({
            cacheDir,
            scriptPath: brokenScript,
          });
          helpers.push(helper);

          expect(await helper.start()).toMatchObject({
            error: 'helper-not-compiled',
            ok: false,
          });
        } finally {
          await removeWhenReleased(brokenDir);
        }
      },
      TIMEOUT,
    );
  },
);
