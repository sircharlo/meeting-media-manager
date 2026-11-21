import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { MSIX_IDENTITY_NAME, MSIX_PUBLISHER } from 'src-electron/constants';
import { join } from 'upath';

// The 32 characters a publisher ID is written with (Crockford's Base32, in
// lowercase).
const PUBLISHER_ID_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

/**
 * The publisher ID Windows derives from a package's publisher, the part of
 * its package family name after the "_": the first 8 bytes of the SHA-256 of
 * the publisher in UTF-16LE, read as 13 characters of 5 bits each (the last
 * one padded with a 0 bit).
 * @param publisher The package's publisher, e.g. "CN=Example".
 * @returns The publisher ID, e.g. "8wekyb3d8bbwe" for Microsoft's.
 */
export const getPublisherId = (publisher: string) => {
  const hash = createHash('sha256')
    .update(Buffer.from(publisher, 'utf16le'))
    .digest();
  const bits = [...hash.subarray(0, 8)]
    .map((byte) => byte.toString(2).padStart(8, '0'))
    .join('')
    .concat('0');
  let id = '';
  for (let i = 0; i < bits.length; i += 5) {
    id += PUBLISHER_ID_ALPHABET[Number.parseInt(bits.slice(i, i + 5), 2)];
  }
  return id;
};

/**
 * The Microsoft Store build's own data folder, %LOCALAPPDATA%\Packages\ and
 * its package family name. Unlike the AppData folder, which Windows
 * virtualizes for a packaged app, it's where it looks: File Explorer and
 * other apps see what M³ writes there. Windows deletes it with the app.
 * @returns The folder, or undefined without LOCALAPPDATA.
 */
export const getPackageDataDir = () => {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return undefined;
  return join(
    localAppData,
    'Packages',
    `${MSIX_IDENTITY_NAME}_${getPublisherId(MSIX_PUBLISHER)}`,
  );
};

// The startup task in the package manifest (build/appxmanifest.xml).
const STARTUP_TASK_ID = 'M3Startup';

/**
 * Windows PowerShell that turns the startup task on or off and prints its
 * state. A packaged app has to ask the StartupTask WinRT API: RequestEnable
 * doesn't turn on a task the user turned off in Windows' settings (only the
 * user can, there), and then says so.
 * @param enable Whether to turn the task on.
 * @returns The script.
 */
const getStartupTaskScript = (enable: boolean) =>
  [
    "$ErrorActionPreference = 'Stop'",
    'Add-Type -AssemblyName System.Runtime.WindowsRuntime',
    // WindowsRuntimeSystemExtensions.AsTask(IAsyncOperation<T>), to wait for
    // a WinRT operation.
    '$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {',
    "  $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and",
    "  $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'",
    '} | Select-Object -First 1',
    'function Wait-Operation($operation, [Type] $resultType) {',
    '  $task = $asTask.MakeGenericMethod($resultType).Invoke($null, @($operation))',
    '  $null = $task.Wait(-1)',
    '  $task.Result',
    '}',
    '$taskType = [Windows.ApplicationModel.StartupTask, Windows.ApplicationModel, ContentType = WindowsRuntime]',
    '$stateType = [Windows.ApplicationModel.StartupTaskState, Windows.ApplicationModel, ContentType = WindowsRuntime]',
    `$startupTask = Wait-Operation ($taskType::GetAsync('${STARTUP_TASK_ID}')) $taskType`,
    enable
      ? '$state = Wait-Operation ($startupTask.RequestEnableAsync()) $stateType'
      : '$startupTask.Disable(); $state = $startupTask.State',
    'Write-Output "$state"',
  ].join('\n');

/**
 * Turns the Microsoft Store build's startup task, its "Start at login", on or
 * off. Windows PowerShell runs as M³'s child process, so with its package
 * identity, which the StartupTask API needs.
 * @param enable Whether M³ should start at login.
 * @returns The task's state afterwards: Enabled, Disabled, DisabledByUser
 * (turned off in Windows' settings) or DisabledByPolicy.
 */
export const setStartupTaskEnabled = (enable: boolean) =>
  new Promise<string>((resolve, reject) => {
    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-EncodedCommand',
        Buffer.from(getStartupTaskScript(enable), 'utf16le').toString('base64'),
      ],
      { timeout: 30_000, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `Couldn't turn the startup task ${enable ? 'on' : 'off'}: ${String(stderr).trim() || error.message}`,
            ),
          );
        } else {
          resolve(String(stdout).trim());
        }
      },
    );
  });
