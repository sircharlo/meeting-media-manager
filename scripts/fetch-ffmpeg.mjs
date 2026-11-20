// Puts the FFmpeg that M³ ships for the platform being built in
// build/ffmpeg/bin, which electron-builder copies to resources/ffmpeg (see
// extraResources in quasar.config.ts). Run by `yarn build`.
//
// Each archive is pinned by URL and SHA-256: a different file fails the
// build instead of shipping a binary nobody checked. When the pinned build is
// there already (the macOS retry without notarization, a local rebuild),
// nothing is downloaded. M3_SKIP_FFMPEG_BUNDLE=1 skips it altogether: M³
// then downloads FFmpeg the first time it needs it, as it did before.
//
// - Windows: gyan.dev's "essentials" build (static), from its GitHub mirror.
// - macOS: Martin Riedl's Apple Silicon and Intel builds, joined with lipo
//   into one universal binary, which @electron/universal leaves as it is.
// - Linux: BtbN's build (glibc 2.28 and later, with NVIDIA's encoder), a
//   month-end one, which BtbN keeps for two years.
//
// All three are FFmpeg 9.0.2, under the GPL v3: build/ffmpeg/README.md (the
// sources) and COPYING.GPLv3 ship with it. To update FFmpeg, change the
// builds below and that README.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { setDefaultResultOrder } from 'node:dns';
import { createWriteStream } from 'node:fs';
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const BUILDS = {
  darwin: [
    {
      arch: 'arm64',
      member: 'ffmpeg',
      sha256:
        'c8ed4c4e6978a03c485edbfe4e0a5dc2380f8a30bba5150531b31b094492d924',
      url: 'https://ffmpeg.martin-riedl.de/download/macos/arm64/1789931890_9.0.2/ffmpeg.zip',
    },
    {
      arch: 'x86_64',
      member: 'ffmpeg',
      sha256:
        '7c6b4125b191cbf773832dc51f424cf2b6bb7da43007d1e066f95909e47cacd4',
      url: 'https://ffmpeg.martin-riedl.de/download/macos/amd64/1789931006_9.0.2/ffmpeg.zip',
    },
  ],
  linux: [
    {
      member: 'ffmpeg-n9.0.2-39-g7adfbe40dc-linux64-gpl-9.0/bin/ffmpeg',
      sha256:
        '73e29a56974ae5a651133a04584c7483b21afe941e17dc91d79814a758b608d3',
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-10-31-12-59/ffmpeg-n9.0.2-39-g7adfbe40dc-linux64-gpl-9.0.tar.xz',
    },
  ],
  win32: [
    {
      member: 'ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe',
      sha256:
        '60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba',
      url: 'https://github.com/GyanD/codexffmpeg/releases/download/9.0.2/ffmpeg-9.0.2-essentials_build.zip',
    },
  ],
};

const DOWNLOAD_TRIES = 4;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'build', 'ffmpeg', 'bin');
// Which archives the binary in OUT_DIR came from.
const SOURCE_FILE = join(OUT_DIR, 'source.json');

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

/** Runs a command, failing with what it printed if it fails. */
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    const why = result.error?.message ?? `exit code ${result.status}`;
    throw new Error(
      `${command} ${args.join(' ')} failed (${why}): ${result.stderr}`,
    );
  }
  return result.stdout;
};

/** Downloads `url` to `file` once, and returns its SHA-256. */
const downloadOnce = async (url, file) => {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }
  const hash = createHash('sha256');
  await pipeline(
    Readable.fromWeb(response.body),
    new Transform({
      transform(chunk, _encoding, callback) {
        hash.update(chunk);
        callback(null, chunk);
      },
    }),
    createWriteStream(file),
  );
  return hash.digest('hex');
};

/**
 * Downloads `url` to `file`, trying again a few times, waiting a bit longer
 * each time, and returns its SHA-256.
 */
const download = async (url, file, attempt = 1) => {
  try {
    return await downloadOnce(url, file);
  } catch (error) {
    if (attempt >= DOWNLOAD_TRIES) {
      throw new Error(
        `Couldn't download ${url} (${attempt} tries): ${error.message}`,
        { cause: error },
      );
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 2000 * attempt);
    });
    return download(url, file, attempt + 1);
  }
};

/**
 * Extracts one file from an archive with the system's tar: bsdtar reads zip
 * files on Windows and macOS, GNU tar the .tar.xz on Linux. On Windows, by
 * its full path: the Git Bash CI shell would find GNU tar first, which
 * doesn't read zip files.
 */
const extract = (archive, member, dir) => {
  const tar =
    process.platform === 'win32'
      ? join(
          process.env.SystemRoot ?? String.raw`C:\Windows`,
          'System32',
          'tar.exe',
        )
      : 'tar';
  run(tar, ['-xf', archive, '-C', dir, member]);
  return join(dir, ...member.split('/'));
};

/**
 * Downloads one build's archive into `dir`, checks its SHA-256, and extracts
 * its FFmpeg binary there. Returns where that binary is.
 */
const fetchBuild = async (build, dir) => {
  await mkdir(dir);
  const archive = join(dir, build.url.split('/').pop());
  console.log(`FFmpeg: downloading ${build.url}`);
  const sha256 = await download(build.url, archive);
  if (sha256 !== build.sha256) {
    throw new Error(
      `${build.url} has SHA-256 ${sha256}, not the pinned ${build.sha256}`,
    );
  }
  return extract(archive, build.member, dir);
};

const fetchFFmpeg = async () => {
  if (process.env.M3_SKIP_FFMPEG_BUNDLE === '1') {
    console.log('FFmpeg: not bundled (M3_SKIP_FFMPEG_BUNDLE=1)');
    return;
  }
  const builds = BUILDS[process.platform];
  if (!builds) throw new Error(`No FFmpeg build for ${process.platform}`);

  const binary = join(
    OUT_DIR,
    process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg',
  );
  const source = JSON.stringify(builds.map((build) => build.sha256));
  if (
    (await exists(binary)) &&
    (await exists(SOURCE_FILE)) &&
    (await readFile(SOURCE_FILE, 'utf8')) === source
  ) {
    console.log(`FFmpeg: ${binary} is up to date`);
    return;
  }

  await rm(OUT_DIR, { force: true, recursive: true });
  await mkdir(OUT_DIR, { recursive: true });
  const work = await mkdtemp(join(tmpdir(), 'm3-ffmpeg-'));
  try {
    // macOS's two archives download side by side.
    const extracted = await Promise.all(
      builds.map((build, index) =>
        fetchBuild(build, join(work, String(index))),
      ),
    );

    if (process.platform === 'darwin') {
      run('lipo', ['-create', '-output', binary, ...extracted]);
      const archs = run('lipo', ['-archs', binary]).trim().split(/\s+/);
      for (const build of builds) {
        if (!archs.includes(build.arch)) {
          throw new Error(`${binary} lacks ${build.arch}: ${archs.join(' ')}`);
        }
      }
    } else {
      await copyFile(extracted[0], binary);
    }
    // Zip files don't keep the executable bit, and the AppImage is read-only.
    await chmod(binary, 0o755);
    await writeFile(SOURCE_FILE, source);
    console.log(`FFmpeg: ${binary} ready`);
  } finally {
    await rm(work, { force: true, recursive: true });
  }
};

// Some networks resolve GitHub's IPv6 addresses without routing them.
setDefaultResultOrder('ipv4first');
try {
  await fetchFFmpeg();
} catch (error) {
  console.error(`FFmpeg: ${error.message}`);
  // Not process.exit(): on Windows it can trip a libuv assertion while
  // fetch's sockets close.
  process.exitCode = 1;
}
