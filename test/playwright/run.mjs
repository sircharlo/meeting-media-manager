#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { captureScreenshot, launchDemoApp } from './capture.mjs';
import { targets } from './targets.mjs';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const DEBUG_DIR = resolve(REPO_ROOT, 'test/playwright/debug-output');

async function run() {
  const { app, window } = await launchDemoApp();
  try {
    for (const target of targets) {
      try {
        await target.prepare(window);
      } catch (error) {
        // Leave a screenshot + URL behind so a CI failure is diagnosable
        // without being able to run Electron locally.
        await mkdir(DEBUG_DIR, { recursive: true });
        await window
          .screenshot({
            path: resolve(DEBUG_DIR, `${target.name}-failure.png`),
          })
          .catch((screenshotError) => console.error(screenshotError));
        console.error(`Failed preparing "${target.name}" at ${window.url()}`);
        throw error;
      }
      const outputPath = resolve(REPO_ROOT, target.outputPath);
      await mkdir(dirname(outputPath), { recursive: true });
      await captureScreenshot(window, outputPath);
      console.log(`Captured ${target.name} -> ${target.outputPath}`);
    }
  } finally {
    await app.close();
  }
}

try {
  await run();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
