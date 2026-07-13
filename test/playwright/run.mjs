#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  captureScreenshot,
  launchDemoApp,
  startProfiling,
  stopProfilingAndSave,
} from './capture.mjs';
import { targets } from './targets.mjs';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const DEBUG_DIR = resolve(REPO_ROOT, 'test/playwright/debug-output');

async function run() {
  const { app, window } = await launchDemoApp();
  const profilerClient = await startProfiling(window).catch((error) => {
    console.error('Failed to start profiler', error);
    return null;
  });
  try {
    for (const target of targets) {
      try {
        await target.prepare(window);
      } catch (error) {
        // Leave a screenshot + CPU profile behind so a hang/freeze is
        // diagnosable without being able to run Electron locally. Load the
        // .cpuprofile file in Chrome DevTools' Performance/Profiler tab.
        await mkdir(DEBUG_DIR, { recursive: true });
        await withTimeout(
          window.screenshot({
            path: resolve(DEBUG_DIR, `${target.name}-failure.png`),
          }),
          35000,
          'debug screenshot',
        ).catch((screenshotError) => console.error(screenshotError));
        if (profilerClient) {
          await withTimeout(
            stopProfilingAndSave(
              profilerClient,
              resolve(DEBUG_DIR, `${target.name}-failure.cpuprofile`),
            ),
            15000,
            'stopProfilingAndSave',
          ).catch((profileError) => console.error(profileError));
        }
        console.error(`Failed preparing "${target.name}" at ${window.url()}`);
        throw error;
      }
      const outputPath = resolve(REPO_ROOT, target.outputPath);
      await mkdir(dirname(outputPath), { recursive: true });
      await captureScreenshot(window, outputPath);
      console.log(`Captured ${target.name} -> ${target.outputPath}`);
    }
  } finally {
    await withTimeout(app.close(), 15000, 'app.close()').catch((error) => {
      console.error(error);
      // The app is unresponsive even to a close request; don't hang the CI
      // job waiting for it.
      process.exit(1);
    });
  }
}

// If the app freezes (e.g. a runaway loop), don't let a hung app.close() eat
// the whole CI job — force-exit once artifacts are saved.
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      );
    }),
  ]);
}

try {
  await run();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
