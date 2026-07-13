#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { captureScreenshot, launchDemoApp } from './capture.mjs';
import { targets } from './targets.mjs';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

async function run() {
  const { app, window } = await launchDemoApp();
  try {
    for (const target of targets) {
      await target.prepare(window);
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
