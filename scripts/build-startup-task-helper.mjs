// Compiles the Microsoft Store build's startup task helper
// (src-electron/startup-task-helper/StartupTaskHelper.cs) into
// build/startup-task-helper/StartupTaskHelper.exe, which electron-builder puts
// inside the MSIX (quasar.config.ts). Only for an MSIX build (M3_MSIX=true):
// otherwise it does nothing.
//
// It uses what every Windows 10/11 has, so the helper needs no extra runtime:
// the .NET Framework 4 compiler and System.Runtime.WindowsRuntime, plus the
// Windows SDK's Windows.winmd for the WinRT types (the SDK that builds the
// MSIX: makeappx comes with it).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.M3_MSIX !== 'true') {
  console.log('Not an MSIX build: no startup task helper to build.');
} else {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const source = join(
    root,
    'src-electron',
    'startup-task-helper',
    'StartupTaskHelper.cs',
  );
  const outDir = join(root, 'build', 'startup-task-helper');
  const output = join(outDir, 'StartupTaskHelper.exe');

  const windowsDir =
    process.env.windir ?? process.env.SystemRoot ?? String.raw`C:\Windows`;
  const framework = join(
    windowsDir,
    'Microsoft.NET',
    'Framework64',
    'v4.0.30319',
  );
  const csc = join(framework, 'csc.exe');
  if (!existsSync(csc)) {
    throw new Error(`No .NET Framework 4 compiler at ${csc}`);
  }

  const programFiles =
    process.env['ProgramFiles(x86)'] ?? String.raw`C:\Program Files (x86)`;
  const unionMetadata = join(
    programFiles,
    'Windows Kits',
    '10',
    'UnionMetadata',
  );
  const sdkVersions = existsSync(unionMetadata)
    ? readdirSync(unionMetadata).filter((version) =>
        existsSync(join(unionMetadata, version, 'Windows.winmd')),
      )
    : [];
  const newest = sdkVersions
    .map((version) => ({ parts: version.split('.').map(Number), version }))
    .sort((a, b) => {
      for (let i = 0; i < Math.max(a.parts.length, b.parts.length); i++) {
        const diff = (b.parts[i] ?? 0) - (a.parts[i] ?? 0);
        if (diff) return diff;
      }
      return 0;
    })[0]?.version;
  if (!newest) {
    throw new Error(
      `No Windows SDK Windows.winmd under ${unionMetadata} (found: ${sdkVersions.join(', ') || 'nothing'})`,
    );
  }
  const winmd = join(unionMetadata, newest, 'Windows.winmd');

  mkdirSync(outDir, { recursive: true });
  execFileSync(
    csc,
    [
      '/nologo',
      '/optimize+',
      '/target:exe',
      '/platform:anycpu',
      `/out:${output}`,
      `/r:${winmd}`,
      `/r:${join(framework, 'System.Runtime.WindowsRuntime.dll')}`,
      `/r:${join(framework, 'System.Runtime.dll')}`,
      source,
    ],
    { stdio: 'inherit' },
  );
  console.log(`Built ${output} (Windows SDK ${newest})`);
}
