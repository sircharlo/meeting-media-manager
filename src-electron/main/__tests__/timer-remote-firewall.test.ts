import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FirewallSnapshot } from '../timer-remote-firewall';

const {
  captureElectronErrorMock,
  constants,
  execFileMock,
  readFileMock,
  urls,
} = vi.hoisted(() => ({
  captureElectronErrorMock: vi.fn(),
  constants: {
    APP_STORE: null as null | string,
    PLATFORM: 'win32',
  },
  execFileMock: vi.fn(),
  readFileMock: vi.fn(),
  // The computer's addresses, which change with its networks.
  urls: { value: ['http://192.168.1.2:8787/'] },
}));

vi.mock('node:child_process', () => ({ execFile: execFileMock }));
vi.mock('node:fs/promises', () => ({
  readFile: readFileMock,
  rm: vi.fn(async () => undefined),
}));
vi.mock('src-electron/constants', () => constants);
vi.mock('src-electron/main/timer-remote', () => ({
  getTimerRemoteUrls: () => urls.value,
  isValidTimerRemotePort: (port: unknown) =>
    typeof port === 'number' && port >= 1024 && port <= 65_535,
}));
vi.mock('src-electron/main/utils', () => ({
  captureElectronError: captureElectronErrorMock,
}));
vi.mock('src/shared/vanilla', () => ({ log: vi.fn() }));

const {
  allowTimerRemoteThroughFirewall,
  clearFirewallCheckCache,
  coversPort,
  evaluateFirewall,
  getElevationScript,
  getFirewallAllowScript,
  getTimerRemoteFirewallStatus,
} = await import('../timer-remote-firewall');

const DOMAIN = 1;
const PRIVATE = 2;
const PUBLIC = 4;
const ALL = 2_147_483_647;
const PORT = 8787;

const profiles = (
  overrides: Partial<
    Record<number, { blockAll?: boolean; enabled?: boolean }>
  > = {},
) =>
  [DOMAIN, PRIVATE, PUBLIC].map((type) => ({
    blockAll: false,
    enabled: true,
    type,
    ...overrides[type],
  }));

const programRule = (
  action: number,
  ruleProfiles: number,
  localPorts: null | string = '*',
) => ({
  action,
  forProgram: true,
  localPorts,
  profiles: ruleProfiles,
  protocol: 6,
});

const snapshot = (
  current: number,
  rules: FirewallSnapshot['rules'] = [],
  overrides?: Parameters<typeof profiles>[0],
): FirewallSnapshot => ({ current, profiles: profiles(overrides), rules });

/** The script one PowerShell call ran (`-EncodedCommand`). */
const scriptOf = (args: string[]) =>
  Buffer.from(
    args[args.indexOf('-EncodedCommand') + 1] ?? '',
    'base64',
  ).toString('utf16le');

type ExecFileCallback = (
  error: (Error & { code?: number | string }) | null,
  stdout: string,
  stderr: string,
) => void;

/**
 * Answers each PowerShell call: the firewall check with `checks` in turn, the
 * elevated change with `elevation`.
 */
const answer = ({
  checks = [],
  elevation,
}: {
  checks?: (Error | FirewallSnapshot)[];
  elevation?: { code: number; stderr?: string };
}) => {
  const pending = [...checks];
  execFileMock.mockImplementation(
    (_file: string, args: string[], _options: object, callback) => {
      const done = callback as ExecFileCallback;
      if (scriptOf(args).includes('Process]::Start')) {
        const code = elevation?.code ?? 0;
        done(
          code ? Object.assign(new Error('Command failed'), { code }) : null,
          '',
          elevation?.stderr ?? '',
        );
        return;
      }
      const next = pending.shift();
      if (next instanceof Error) {
        done(Object.assign(next, { code: 1 }), '', next.message);
      } else {
        done(null, JSON.stringify(next ?? snapshot(0)), '');
      }
    },
  );
};

beforeEach(() => {
  constants.APP_STORE = null;
  constants.PLATFORM = 'win32';
  urls.value = ['http://192.168.1.2:8787/'];
  clearFirewallCheckCache();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('coversPort', () => {
  it.each([
    [null, true, true],
    [null, false, false],
    ['*', false, true],
    ['8787', false, true],
    ['8000-9000', false, true],
    ['80, 8787', false, true],
    ['80,443', false, false],
    ['9000-9100', true, false],
    ['RPC', true, false],
  ])(
    'ports %s (for M³ itself: %s) cover 8787: %s',
    (ports, forProgram, covers) => {
      expect(coversPort(ports, PORT, forProgram)).toBe(covers);
    },
  );
});

describe('evaluateFirewall', () => {
  it("doesn't know when the computer isn't on a network", () => {
    expect(evaluateFirewall(snapshot(0), PORT)).toBe('unknown');
  });

  it('is allowed by a rule for M³ on the network type', () => {
    expect(
      evaluateFirewall(snapshot(PUBLIC, [programRule(1, PUBLIC)]), PORT),
    ).toBe('allowed');
  });

  it('is not allowed when M³ is only allowed on private networks and the network is public', () => {
    expect(
      evaluateFirewall(snapshot(PUBLIC, [programRule(1, PRIVATE)]), PORT),
    ).toBe('not-allowed');
  });

  it('is not allowed with no rule at all', () => {
    expect(evaluateFirewall(snapshot(PRIVATE), PORT)).toBe('not-allowed');
  });

  it('is blocked by a rule blocking M³, even with a rule allowing the port', () => {
    expect(
      evaluateFirewall(
        snapshot(PUBLIC, [
          programRule(0, ALL),
          {
            action: 1,
            forProgram: false,
            localPorts: '8787',
            profiles: ALL,
            protocol: 6,
          },
        ]),
        PORT,
      ),
    ).toBe('blocked');
  });

  it('is allowed by a TCP rule for the port, with no program', () => {
    expect(
      evaluateFirewall(
        snapshot(PUBLIC, [
          {
            action: 1,
            forProgram: false,
            localPorts: '8787',
            profiles: PUBLIC,
            protocol: 6,
          },
        ]),
        PORT,
      ),
    ).toBe('allowed');
  });

  it("doesn't count a no-program rule for any protocol, as other programs' rules look alike", () => {
    expect(
      evaluateFirewall(
        snapshot(PUBLIC, [
          {
            action: 1,
            forProgram: false,
            localPorts: null,
            profiles: ALL,
            protocol: 256,
          },
        ]),
        PORT,
      ),
    ).toBe('not-allowed');
  });

  it('counts a rule for M³ over any protocol', () => {
    expect(
      evaluateFirewall(
        snapshot(PUBLIC, [{ ...programRule(1, ALL, null), protocol: 256 }]),
        PORT,
      ),
    ).toBe('allowed');
  });

  it('is allowed where the firewall is off', () => {
    expect(
      evaluateFirewall(
        snapshot(PUBLIC, [], { [PUBLIC]: { enabled: false } }),
        PORT,
      ),
    ).toBe('allowed');
  });

  it('says when the firewall blocks every incoming connection', () => {
    expect(
      evaluateFirewall(
        snapshot(PUBLIC, [programRule(1, ALL)], {
          [PUBLIC]: { blockAll: true },
        }),
        PORT,
      ),
    ).toBe('blocks-all');
  });

  it('takes the worst of the network types the computer is on', () => {
    expect(
      evaluateFirewall(
        snapshot(PRIVATE | PUBLIC, [programRule(1, PRIVATE)]),
        PORT,
      ),
    ).toBe('not-allowed');
  });
});

describe('getElevationScript', () => {
  // Tried on Windows 11: turning the question down through Start-Process
  // gave an error with only Windows' message, so it counted as a failure.
  it('starts it elevated through Process.Start, whose error keeps the code of a refusal', () => {
    const script = getElevationScript('Write-Output 1');

    expect(script).toContain('[System.Diagnostics.Process]::Start($start)');
    expect(script).toContain("$start.Verb = 'runas'");
    expect(script).not.toContain('Start-Process');
    expect(script).toContain(
      '$e -is [System.ComponentModel.Win32Exception] -and $e.NativeErrorCode -eq 1223',
    );
    expect(script).toContain(
      Buffer.from('Write-Output 1', 'utf16le').toString('base64'),
    );
  });
});

describe('getFirewallAllowScript', () => {
  it('allows M³ on the port on every network type, quoting its path', () => {
    const script = getFirewallAllowScript(
      String.raw`C:\Program Files\M3's\Meeting Media Manager.exe`,
      PORT,
      String.raw`C:\Temp\result.txt`,
    );

    expect(script).toContain(
      String.raw`$program = 'C:\Program Files\M3''s\Meeting Media Manager.exe'`,
    );
    expect(script).toContain('-LocalPort 8787 -Program $program -Profile Any');
    // Only its own rule of an earlier port is deleted; the rules blocking M³
    // are turned off, so they can be turned back on.
    expect(script.match(/Remove-NetFirewallRule/g)).toHaveLength(1);
    expect(script).toContain(
      "Get-NetFirewallRule -DisplayName 'Meeting Media Manager timer remote' -ErrorAction SilentlyContinue | Remove-NetFirewallRule",
    );
    expect(script).toMatch(
      /\.Action -eq 'Block'[^\n]*\}\s*\|\s*Disable-NetFirewallRule/,
    );
  });
});

describe('getTimerRemoteFirewallStatus', () => {
  it.each([
    ['linux', null],
    ['darwin', null],
    ['win32', 'microsoft-store'],
  ])("isn't checked on %s (%s)", async (platform, appStore) => {
    constants.PLATFORM = platform;
    constants.APP_STORE = appStore;

    await expect(getTimerRemoteFirewallStatus(PORT)).resolves.toEqual({
      state: 'unsupported',
    });
    expect(execFileMock).not.toHaveBeenCalled();
  });

  it("reads Windows Firewall's rules for M³'s own program", async () => {
    answer({ checks: [snapshot(PUBLIC, [programRule(1, ALL)])] });

    await expect(getTimerRemoteFirewallStatus(PORT)).resolves.toEqual({
      state: 'allowed',
    });
    const [file, args] = execFileMock.mock.calls[0] as [string, string[]];
    expect(file).toMatch(/WindowsPowerShell[\\/]v1\.0[\\/]powershell\.exe$/);
    expect(scriptOf(args)).toContain('HNetCfg.FwPolicy2');
    expect(scriptOf(args)).toContain(process.execPath.replaceAll("'", "''"));
  });

  it("doesn't know when PowerShell can't read the firewall", async () => {
    answer({ checks: [new Error('Cannot create the COM object')] });

    await expect(getTimerRemoteFirewallStatus(PORT)).resolves.toEqual({
      state: 'unknown',
    });
  });

  // Each check starts PowerShell for about a second.
  const checkCount = () =>
    execFileMock.mock.calls.filter(
      ([, args]) => !scriptOf(args as string[]).includes('Process]::Start'),
    ).length;

  it('shares a check under way, and its answer for a minute', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    answer({ checks: [snapshot(PUBLIC), snapshot(PUBLIC)] });

    await Promise.all([
      getTimerRemoteFirewallStatus(PORT),
      getTimerRemoteFirewallStatus(PORT),
    ]);
    vi.advanceTimersByTime(59_000);
    await getTimerRemoteFirewallStatus(PORT);
    expect(checkCount()).toBe(1);

    vi.advanceTimersByTime(2000);
    await getTimerRemoteFirewallStatus(PORT);
    expect(checkCount()).toBe(2);
  });

  it('checks again for another port, or on another network', async () => {
    answer({ checks: [snapshot(PUBLIC), snapshot(PUBLIC), snapshot(PUBLIC)] });

    await getTimerRemoteFirewallStatus(PORT);
    await getTimerRemoteFirewallStatus(8788);
    urls.value = ['http://10.0.0.5:8787/'];
    await getTimerRemoteFirewallStatus(PORT);

    expect(checkCount()).toBe(3);
  });
});

describe('allowTimerRemoteThroughFirewall', () => {
  it('allows it, then checks again that it worked', async () => {
    readFileMock.mockResolvedValue('ok\r\n');
    answer({
      checks: [snapshot(PUBLIC), snapshot(PUBLIC, [programRule(1, ALL)])],
    });
    // A check from before, which mustn't stand in for the one after.
    await expect(getTimerRemoteFirewallStatus(PORT)).resolves.toEqual({
      state: 'not-allowed',
    });

    await expect(allowTimerRemoteThroughFirewall(PORT)).resolves.toEqual({
      outcome: 'allowed',
      status: { state: 'allowed' },
    });
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('says so when it still blocked afterwards', async () => {
    readFileMock.mockResolvedValue('ok');
    answer({ checks: [snapshot(PUBLIC, [programRule(0, ALL)])] });

    await expect(allowTimerRemoteThroughFirewall(PORT)).resolves.toEqual({
      outcome: 'still-blocked',
      status: { state: 'blocked' },
    });
  });

  it('says it was cancelled when the permission is refused', async () => {
    answer({ checks: [snapshot(PUBLIC)], elevation: { code: 1223 } });

    await expect(allowTimerRemoteThroughFirewall(PORT)).resolves.toEqual({
      outcome: 'cancelled',
      status: { state: 'not-allowed' },
    });
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('reports what went wrong when the change failed', async () => {
    readFileMock.mockResolvedValue('Access is denied.');
    answer({ checks: [snapshot(PUBLIC)], elevation: { code: 1 } });

    await expect(allowTimerRemoteThroughFirewall(PORT)).resolves.toEqual({
      outcome: 'failed',
      status: { state: 'not-allowed' },
    });
    expect(captureElectronErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Access is denied.' }),
      expect.objectContaining({
        contexts: {
          fn: { name: 'allowTimerRemoteThroughFirewall', port: PORT },
        },
      }),
    );
  });

  it("doesn't run anything outside Windows or for an invalid port", async () => {
    constants.PLATFORM = 'linux';
    await expect(allowTimerRemoteThroughFirewall(PORT)).resolves.toEqual({
      outcome: 'failed',
      status: { state: 'unsupported' },
    });
    constants.PLATFORM = 'win32';
    await expect(allowTimerRemoteThroughFirewall(80)).resolves.toEqual({
      outcome: 'failed',
      status: { state: 'unsupported' },
    });
    expect(execFileMock).not.toHaveBeenCalled();
  });
});
