import { spawn } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ZoomHelperProcess } from '../zoom-helper-process';

// Runs the real Zoom helper (Windows PowerShell + the C# it compiles), so a
// compile error, an encoding problem or a protocol slip shows up here rather
// than in a congregation's meeting. None of it needs Zoom: anything that
// depends on Zoom's state is covered by `yarn test:zoom-live`.

const SCRIPT = join(process.cwd(), 'src-electron/zoom-helper/zoom-helper.ps1');
const SOURCE = join(process.cwd(), 'src-electron/zoom-helper/ZoomHelper.cs');
const TIMEOUT = 120_000;

// --- The Participants button's name --------------------------------------
// Zoom's toolbar as MMM-V2-3MJ's reports showed it (Zoom 7.2.1 in French),
// with the panel closed: its Participants button reads "participant·es",
// under a panel heading "Participants (5)", and was moved to Ctrl+4, so
// Zoom's own Alt+U finds nothing.
const MOVED_SHORTCUTS_TOOLBAR = [
  'Couper le son, son actuellement rétabli, Ctrl+5, La suppression du bruit est activée. Couper mon audio (Ctrl+5)',
  'Démarrer ma vidéo, Alt+V',
  'Outils de l’hôte, ouvrir le panneau',
  'Lever la main',
  'participant·es, ouvrir le panneau, 5 participant·es, Ctrl+4',
  'Partager, Ctrl+Z',
  'Fin, Alt+Q',
];
// The same toolbar with Zoom's own shortcuts.
const ZOOM_SHORTCUTS_TOOLBAR = [
  'Couper le son, son actuellement rétabli, Alt+A',
  'Démarrer ma vidéo, Alt+V',
  'participant·es, ouvrir le panneau, 5 participant·es, Alt+U',
  'Chat, ouvrir le panneau, Alt+H',
  'Fin, Alt+Q',
];
const PANEL_HEADING = 'Participants (5)';

/**
 * What came of a request (see ParticipantsRequest): the button's place in
 * the toolbar (-1: not found), the name the helper learned, and the one M³
 * keeps.
 */
interface ParticipantsReply {
  found: null | number;
  learned: null | string;
  saved: null | string;
}

/**
 * One request to the helper, as far as the Participants button goes: with
 * the panel closed, it looks for the button in the toolbar (`toolbar`); once
 * the panel is open, it reads its heading (`heading`). `entry` is the one
 * the user picked in the setup assistant.
 */
interface ParticipantsRequest {
  entry?: string;
  heading?: string;
  toolbar?: string[];
}

// Sends each request as M³ does (see sendCommand and
// tryZoomParticipantsEntry in src/helpers/zoom.ts): with the name kept, or
// the picked entry instead, then keeps what the helper learned, then the
// picked entry once it found the button.
const PARTICIPANTS_PROBE = String.raw`
param([string]$Interop, [string]$Source, [string]$In, [string]$Out)
$ErrorActionPreference = 'Stop'
[Reflection.Assembly]::LoadFrom($Interop) | Out-Null
Add-Type -Path $Source -ReferencedAssemblies $Interop, 'System.Web.Extensions', 'WindowsBase'
Add-Type -AssemblyName System.Web.Extensions
$json = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$scenarios = $json.DeserializeObject([IO.File]::ReadAllText($In, [Text.Encoding]::UTF8))
$replies = New-Object System.Collections.ArrayList
foreach ($scenario in $scenarios) {
  $saved = $scenario['saved']
  $scenarioReplies = New-Object System.Collections.ArrayList
  foreach ($request in $scenario['requests']) {
    $sent = if ($request.ContainsKey('entry')) { $request['entry'] } else { $saved }
    # Deserialized like the helper's own requests: PowerShell would wrap a
    # dictionary built here, which the helper then wouldn't read.
    [M3.ZoomHelper.Known]::Load($json.DeserializeObject($json.Serialize(@{ titles = @{ participants = $sent } })))
    $found = $null
    if ($request.ContainsKey('toolbar')) { $found = [M3.ZoomHelper.Helper]::FindParticipantsButton([string[]]$request['toolbar']) }
    if ($request.ContainsKey('heading')) { [M3.ZoomHelper.Helper]::LearnPanelHeading([string]$request['heading']) }
    $learned = $null
    if ([M3.ZoomHelper.Known]::Learned.ContainsKey('participants')) { $learned = [M3.ZoomHelper.Known]::Learned['participants'] }
    if ($learned) { $saved = $learned }
    if ($request.ContainsKey('entry') -and $found -ge 0) { $saved = $request['entry'] }
    [void]$scenarioReplies.Add(@{ found = $found; learned = $learned; saved = $saved })
  }
  [void]$replies.Add($scenarioReplies)
}
[IO.File]::WriteAllText($Out, $json.Serialize($replies), (New-Object Text.UTF8Encoding $false))
`;

const PARTICIPANTS_SCENARIOS: {
  expected: ParticipantsReply[];
  name: string;
  requests: ParticipantsRequest[];
  saved: null | string;
}[] = [
  {
    expected: [
      { found: -1, learned: null, saved: 'Participants' },
      { found: 4, learned: null, saved: 'participant·es' },
      { found: null, learned: null, saved: 'participant·es' },
      { found: 4, learned: null, saved: 'participant·es' },
    ],
    name: 'opens the panel by the button the setup assistant was shown, for the startup check and the assistant run again, though the panel heading reads otherwise (MMM-V2-3MJ)',
    requests: [
      // The startup check, with the panel closed: the name kept is the
      // heading's, and Alt+U isn't Zoom's shortcut for it any more.
      { toolbar: MOVED_SHORTCUTS_TOOLBAR },
      // The setup assistant: the user picks the button, which opens the panel.
      {
        entry: 'participant·es',
        heading: PANEL_HEADING,
        toolbar: MOVED_SHORTCUTS_TOOLBAR,
      },
      // Its checks, run again with the panel open.
      { heading: PANEL_HEADING },
      // The next startup check, or the assistant run again, with the panel
      // closed again.
      { toolbar: MOVED_SHORTCUTS_TOOLBAR },
    ],
    saved: 'Participants',
  },
  {
    expected: [
      { found: 2, learned: 'participant·es', saved: 'participant·es' },
      { found: null, learned: null, saved: 'participant·es' },
    ],
    name: "goes by Zoom's own shortcut first, keeping the button's own name over the heading's",
    requests: [
      { heading: PANEL_HEADING, toolbar: ZOOM_SHORTCUTS_TOOLBAR },
      { heading: PANEL_HEADING },
    ],
    saved: 'Participants',
  },
  {
    expected: [{ found: null, learned: 'Participants', saved: 'Participants' }],
    name: "learns the heading's title while no name is known for the button (the panel opened by hand)",
    requests: [{ heading: PANEL_HEADING }],
    saved: null,
  },
];

/** Runs PowerShell to the end: its exit code and what it wrote to stderr. */
const runPowerShell = (args: string[]) =>
  new Promise<{ code: null | number; stderr: string }>((resolve) => {
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', ...args],
      { windowsHide: true },
    );
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('exit', (code) => resolve({ code, stderr }));
  });

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
      'peeks at who is in the meeting whether or not Zoom is open, opening nothing',
      async () => {
        const helper = newHelper();
        const result = await helper.request({
          peek: true,
          type: 'participants',
        });

        // Without Zoom's participants panel open, there's nothing to read.
        expect(result.ok).toBe(true);
        expect(
          result.participants === undefined ||
            Array.isArray(result.participants),
        ).toBe(true);
        helper.stop();
      },
      TIMEOUT,
    );

    it(
      'describes what Zoom shows whether or not Zoom is open',
      async () => {
        const helper = newHelper();
        const result = await helper.request({ type: 'snapshot' });

        expect(result.ok).toBe(true);
        expect(result.snapshot?.error).toBeUndefined();
        expect(Array.isArray(result.snapshot?.windows)).toBe(true);
        expect(typeof result.snapshot?.dialogs).toBe('object');
        expect(typeof result.snapshot?.meeting).toBe('boolean');
        expect(typeof result.snapshot?.sharing).toBe('boolean');
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

    describe("the name of Zoom's Participants button", () => {
      let replies: ParticipantsReply[][] = [];

      /** The interop the helper generated, generated now if it isn't yet. */
      const findInterop = async () => {
        const find = () =>
          readdirSync(cacheDir)
            .map((folder) =>
              join(cacheDir, folder, 'Interop.UIAutomationClient.dll'),
            )
            .find((file) => existsSync(file));
        if (!find()) {
          const helper = newHelper();
          await helper.start();
          helper.stop();
        }
        return find();
      };

      // Compiles the helper's C# once for every scenario.
      beforeAll(async () => {
        const interop = await findInterop();
        if (!interop) {
          throw new Error(
            `No UI Automation interop in ${cacheDir}, which holds: ${readdirSync(cacheDir).join(', ') || 'nothing'}`,
          );
        }
        const probeDir = mkdtempSync(join(tmpdir(), 'm3-zoom-helper-names-'));
        try {
          const probe = join(probeDir, 'probe.ps1');
          const input = join(probeDir, 'scenarios.json');
          const output = join(probeDir, 'replies.json');
          writeFileSync(probe, PARTICIPANTS_PROBE, 'utf8');
          writeFileSync(
            input,
            JSON.stringify(
              PARTICIPANTS_SCENARIOS.map(({ requests, saved }) => ({
                requests,
                saved,
              })),
            ),
            'utf8',
          );
          const { code, stderr } = await runPowerShell([
            '-File',
            probe,
            '-Interop',
            interop,
            '-Source',
            SOURCE,
            '-In',
            input,
            '-Out',
            output,
          ]);
          if (code !== 0) {
            throw new Error(`The probe exited with ${code}: ${stderr}`);
          }
          replies = JSON.parse(
            readFileSync(output, 'utf8'),
          ) as ParticipantsReply[][];
        } finally {
          await removeWhenReleased(probeDir);
        }
      }, TIMEOUT);

      it.each(
        PARTICIPANTS_SCENARIOS.map((scenario, index) => ({
          ...scenario,
          index,
        })),
      )('$name', ({ expected, index }) => {
        expect(replies[index]).toEqual(expected);
      });
    });
  },
);
