import type {
  TimerRemoteFirewallAllowResult,
  TimerRemoteFirewallState,
  TimerRemoteFirewallStatus,
} from 'src/types';

import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { APP_STORE, PLATFORM } from 'src-electron/constants';
import {
  getTimerRemoteUrls,
  isValidTimerRemotePort,
} from 'src-electron/main/timer-remote';
import { captureElectronError } from 'src-electron/main/utils';
import { log } from 'src/shared/vanilla';
import { join } from 'upath';

// Windows Firewall and the timer remote. Windows asks once whether M³ may
// accept connections, the first time it listens. When that question was
// dismissed (which saves a rule blocking M³), or M³ was allowed only on
// private networks while the computer's network is public (the default for a
// new network on Windows 11), Windows keeps blocking other devices without
// asking again: the page opens on the computer itself, but not on the
// tablet (discussion #10823).
//
// Reading the rules needs no administrator. Allowing M³ does: it runs one
// elevated PowerShell, so Windows asks for permission first. The Microsoft
// Store build gets its rule from its package (build/appxmanifest.xml), and
// other systems aren't checked.

// NET_FW_PROFILE2_*: the network types, as bits.
const PROFILE_TYPES = [1, 2, 4] as const; // domain, private, public
const ACTION_BLOCK = 0;
const ACTION_ALLOW = 1;
const PROTOCOL_TCP = 6;
const PROTOCOL_ANY = 256;
// What Windows answers when its permission question is turned down.
const ERROR_CANCELLED = 1223;

const RULE_NAME = 'Meeting Media Manager timer remote';
const CHECK_TIMEOUT_MS = 30_000;
// The permission question waits for the user.
const ALLOW_TIMEOUT_MS = 5 * 60_000;

/** What the check reads from Windows Firewall (FIREWALL_CHECK_SCRIPT). */
export interface FirewallSnapshot {
  /** The network types this computer is on now, as profile bits. */
  current: number;
  profiles: { blockAll: boolean; enabled: boolean; type: number }[];
  /**
   * Enabled inbound rules that can apply: M³'s own (TCP or any protocol),
   * and TCP rules for a port with no program.
   */
  rules: {
    action: number;
    forProgram: boolean;
    localPorts: null | string;
    profiles: number;
    protocol: number;
  }[];
}

/**
 * Whether a rule's local ports include the port. A program's rule with no
 * ports, or `*`, covers them all; a rule with no program only counts when it
 * names the port (or `*`), as other programs' rules are left out.
 * @param localPorts The rule's LocalPorts, such as `8787`, `8000-9000,80`.
 * @param port The timer remote's port.
 * @param forProgram Whether the rule is for M³ itself.
 * @returns Whether the rule covers the port.
 */
export const coversPort = (
  localPorts: null | string,
  port: number,
  forProgram: boolean,
) => {
  if (!localPorts) return forProgram;
  return localPorts.split(',').some((part) => {
    const value = part.trim();
    if (value === '*') return true;
    const range = /^(\d+)-(\d+)$/.exec(value);
    if (range) return port >= Number(range[1]) && port <= Number(range[2]);
    return /^\d+$/.test(value) && Number(value) === port;
  });
};

const STATE_ORDER: TimerRemoteFirewallState[] = [
  'allowed',
  'not-allowed',
  'blocked',
  'blocks-all',
];

/**
 * Whether other devices can reach the timer remote through Windows Firewall,
 * on every network type the computer is on now. A block wins over an allow,
 * as in Windows Firewall.
 * @param snapshot What the check read.
 * @param port The timer remote's port.
 * @returns The worst state across those network types, or `unknown` when
 * the computer isn't on a network.
 */
export const evaluateFirewall = (
  snapshot: FirewallSnapshot,
  port: number,
): TimerRemoteFirewallState => {
  const active = PROFILE_TYPES.filter((type) => snapshot.current & type);
  if (!active.length) return 'unknown';

  let worst = 0;
  for (const type of active) {
    const profile = snapshot.profiles.find((p) => p.type === type);
    if (profile && !profile.enabled) continue;
    let state: TimerRemoteFirewallState;
    if (profile?.blockAll) {
      state = 'blocks-all';
    } else {
      const rules = snapshot.rules.filter(
        (rule) =>
          rule.profiles & type &&
          (rule.protocol === PROTOCOL_TCP ||
            (rule.forProgram && rule.protocol === PROTOCOL_ANY)) &&
          coversPort(rule.localPorts, port, rule.forProgram),
      );
      if (rules.some((rule) => rule.action === ACTION_BLOCK)) {
        state = 'blocked';
      } else if (rules.some((rule) => rule.action === ACTION_ALLOW)) {
        state = 'allowed';
      } else {
        state = 'not-allowed';
      }
    }
    worst = Math.max(worst, STATE_ORDER.indexOf(state));
  }
  return STATE_ORDER[worst] ?? 'unknown';
};

// A single-quoted PowerShell string.
const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;

// PowerShell's -EncodedCommand: the script as UTF-16LE, in base64, so paths
// with spaces or quotes need no escaping on the command line.
const encode = (script: string) =>
  Buffer.from(script, 'utf16le').toString('base64');

const getPowerShellPath = () =>
  join(
    process.env.SystemRoot || String.raw`C:\Windows`,
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  );

/**
 * Reads the network types, each one's firewall switches, and the enabled
 * inbound rules that can apply to M³ (see FirewallSnapshot), with the
 * firewall's COM interface, which any user can read. Store apps' rules have
 * no program and are left out with the other no-program rules that don't name
 * a TCP port.
 * @param program M³'s executable.
 * @returns The script.
 */
export const getFirewallCheckScript = (program: string) => `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$fw =New-Object -ComObject HNetCfg.FwPolicy2
$program = [Environment]::ExpandEnvironmentVariables(${quote(program)}).ToLowerInvariant()
$profiles = foreach ($type in 1, 2, 4) {
  [pscustomobject]@{
    blockAll = [bool]$fw.BlockAllInboundTraffic($type)
    enabled = [bool]$fw.FirewallEnabled($type)
    type = $type
  }
}
$rules = foreach ($rule in $fw.Rules) {
  if ($rule.Direction -ne 1 -or -not $rule.Enabled -or $rule.serviceName) { continue }
  $app = if ($rule.ApplicationName) {
    [Environment]::ExpandEnvironmentVariables($rule.ApplicationName).ToLowerInvariant()
  } else { '' }
  if ($app) {
    if ($app -ne $program) { continue }
  } elseif ($rule.Protocol -ne 6 -or -not $rule.LocalPorts) { continue }
  [pscustomobject]@{
    action = $rule.Action
    forProgram = [bool]$app
    localPorts = $rule.LocalPorts
    profiles = $rule.Profiles
    protocol = $rule.Protocol
  }
}
[pscustomobject]@{
  current = $fw.CurrentProfileTypes
  profiles = @($profiles)
  rules = @($rules)
} | ConvertTo-Json -Compress -Depth 4
`;

/**
 * Run elevated: turns off the rules blocking M³'s incoming connections
 * (Windows saves those when its question is dismissed; turned off rather
 * than deleted, so they can be turned back on), and allows TCP connections
 * to M³ on the port, on every network type. Replaces its own rule of an
 * earlier port. Writes `ok`, or what went wrong, to the result file.
 * @param program M³'s executable.
 * @param port The timer remote's port.
 * @param resultPath Where to write the outcome.
 * @returns The script.
 */
export const getFirewallAllowScript = (
  program: string,
  port: number,
  resultPath: string,
) => `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$resultPath = ${quote(resultPath)}
try {
  $program = ${quote(program)}
  $programLower = [Environment]::ExpandEnvironmentVariables($program).ToLowerInvariant()
  Get-NetFirewallRule -DisplayName ${quote(RULE_NAME)} -ErrorAction SilentlyContinue | Remove-NetFirewallRule
  New-NetFirewallRule -DisplayName ${quote(RULE_NAME)} -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${port} -Program $program -Profile Any | Out-Null
  Get-NetFirewallApplicationFilter -All |
    Where-Object { $_.Program -and [Environment]::ExpandEnvironmentVariables($_.Program).ToLowerInvariant() -eq $programLower } |
    Get-NetFirewallRule |
    Where-Object { $_.Direction -eq 'Inbound' -and $_.Action -eq 'Block' -and $_.Enabled -eq 'True' } |
    Disable-NetFirewallRule
  Set-Content -LiteralPath $resultPath -Value 'ok' -Encoding UTF8
} catch {
  Set-Content -LiteralPath $resultPath -Value $_.Exception.Message -Encoding UTF8
  exit 1
}
`;

/**
 * Starts the allow script elevated, which makes Windows ask for permission,
 * and exits with its exit code, or ERROR_CANCELLED when the question was
 * turned down. Through Process.Start rather than Start-Process: when the
 * question is turned down, Start-Process throws an error that only has
 * Windows' message (tried on Windows 11), while Process.Start's keeps the
 * Win32Exception and its code.
 * @param elevatedScript The script to run elevated.
 * @returns The script.
 */
export const getElevationScript = (elevatedScript: string) => `
$ProgressPreference = 'SilentlyContinue'
try {
  $start = New-Object System.Diagnostics.ProcessStartInfo
  $start.FileName = ${quote(getPowerShellPath())}
  $start.Arguments = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encode(elevatedScript)}'
  $start.Verb = 'runas'
  $start.UseShellExecute = $true
  $start.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
  $process = [System.Diagnostics.Process]::Start($start)
  $process.WaitForExit()
  exit $process.ExitCode
} catch {
  $e = $_.Exception
  while ($e) {
    if ($e -is [System.ComponentModel.Win32Exception] -and $e.NativeErrorCode -eq ${ERROR_CANCELLED}) { exit ${ERROR_CANCELLED} }
    $e = $e.InnerException
  }
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 1
}
`;

const runPowerShell = (script: string, timeout: number) =>
  new Promise<{ code: number; stderr: string; stdout: string }>(
    (resolve, reject) => {
      execFile(
        getPowerShellPath(),
        [
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-EncodedCommand',
          encode(script),
        ],
        { timeout, windowsHide: true },
        (error, stdout, stderr) => {
          const code = (error as null | { code?: unknown })?.code;
          if (error && typeof code !== 'number') {
            // Not started, or killed at the timeout.
            reject(error instanceof Error ? error : new Error(String(error)));
            return;
          }
          resolve({
            code: typeof code === 'number' ? code : 0,
            stderr: String(stderr).trim(),
            stdout: String(stdout).trim(),
          });
        },
      );
    },
  );

const isChecked = () => PLATFORM === 'win32' && APP_STORE !== 'microsoft-store';

// Each check starts PowerShell, for about a second. The timer popup and
// Settings share one while it runs, and its answer for a minute, as long as
// the port and the computer's addresses stay the same: another network gives
// other addresses, and checks again.
const CHECK_CACHE_MS = 60_000;
let cachedCheck: null | {
  at: number;
  key: string;
  status: Promise<TimerRemoteFirewallStatus>;
} = null;

/** Forgets the last check, so the next one reads the firewall again. */
export const clearFirewallCheckCache = () => {
  cachedCheck = null;
};

const checkFirewall = async (
  port: number,
): Promise<TimerRemoteFirewallStatus> => {
  try {
    const { code, stderr, stdout } = await runPowerShell(
      getFirewallCheckScript(process.execPath),
      CHECK_TIMEOUT_MS,
    );
    if (code !== 0) throw new Error(stderr || `exit code ${code}`);
    const state = evaluateFirewall(
      JSON.parse(stdout) as FirewallSnapshot,
      port,
    );
    log('[timerRemote] Firewall', 'timer', 'log', { port, state });
    return { state };
  } catch (error) {
    // Only a hint for the user: a computer where PowerShell can't read the
    // firewall (a locked-down one, say) just doesn't get it.
    log('[timerRemote] Could not check the firewall', 'timer', 'warn', error);
    return { state: 'unknown' };
  }
};

// A check under way, or one made in the last minute for the same port and
// networks, else a new one.
const getSharedCheck = (port: number) => {
  const key = `${port} ${getTimerRemoteUrls(port).join(' ')}`;
  if (
    cachedCheck?.key === key &&
    Date.now() - cachedCheck.at < CHECK_CACHE_MS
  ) {
    return cachedCheck.status;
  }
  const status = checkFirewall(port);
  cachedCheck = { at: Date.now(), key, status };
  return status;
};

/**
 * Whether Windows Firewall lets other devices reach the timer remote. Shares
 * a check under way, or one made in the last minute for the same port and
 * networks.
 * @param port The timer remote's port.
 * @returns `unsupported` outside Windows and in the Microsoft Store build,
 * `unknown` when the check couldn't tell.
 */
export const getTimerRemoteFirewallStatus = async (
  port: unknown,
): Promise<TimerRemoteFirewallStatus> => {
  if (!isChecked()) return { state: 'unsupported' };
  if (!isValidTimerRemotePort(port)) return { state: 'unknown' };
  return getSharedCheck(port);
};

/**
 * Allows other devices to reach the timer remote through Windows Firewall,
 * after Windows asks for permission, then checks again that it did.
 * @param port The timer remote's port.
 * @returns `allowed`, `cancelled` (permission refused), `still-blocked`
 * (done, but something else still blocks it, such as an organization's rule)
 * or `failed`, with the state found afterwards.
 */
export const allowTimerRemoteThroughFirewall = async (
  port: unknown,
): Promise<TimerRemoteFirewallAllowResult> => {
  if (!isChecked() || !isValidTimerRemotePort(port)) {
    return { outcome: 'failed', status: { state: 'unsupported' } };
  }
  const resultPath = join(tmpdir(), `m3-firewall-${randomUUID()}.txt`);
  try {
    const { code, stderr } = await runPowerShell(
      getElevationScript(
        getFirewallAllowScript(process.execPath, port, resultPath),
      ),
      ALLOW_TIMEOUT_MS,
    );
    // The rules may have changed: a check made while Windows asked for
    // permission saw them before.
    clearFirewallCheckCache();
    if (code === ERROR_CANCELLED) {
      log('[timerRemote] Firewall change cancelled', 'timer', 'log');
      return {
        outcome: 'cancelled',
        status: await getTimerRemoteFirewallStatus(port),
      };
    }
    // What the elevated script wrote: `ok`, or what went wrong.
    const detail = (await readFile(resultPath, 'utf8').catch(() => '')).trim();
    if (code !== 0 || detail !== 'ok') {
      throw new Error(detail || stderr || `exit code ${code}`);
    }
  } catch (error) {
    captureElectronError(error, {
      contexts: { fn: { name: 'allowTimerRemoteThroughFirewall', port } },
    });
    // It may have changed some rules before it failed.
    clearFirewallCheckCache();
    return {
      outcome: 'failed',
      status: await getTimerRemoteFirewallStatus(port),
    };
  } finally {
    await rm(resultPath, { force: true }).catch(() => undefined);
  }

  const status = await getTimerRemoteFirewallStatus(port);
  // `unknown`: the check couldn't read the firewall this time, but the rule
  // went in.
  if (status.state === 'allowed' || status.state === 'unknown') {
    return { outcome: 'allowed', status };
  }
  // The rule is in, but something M³ can't change still blocks it.
  log('[timerRemote] Still blocked after allowing', 'timer', 'warn', status);
  return { outcome: 'still-blocked', status };
};
