import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const ELECTRON_MAIN_PATH = fileURLToPath(
  new URL('../../dist/electron/UnPackaged/electron-main.js', import.meta.url),
);

/** Screenshots just the app's content (`#q-app`), excluding OS window chrome. */
export async function captureScreenshot(window, outputPath) {
  await window.locator('#q-app').screenshot({ path: outputPath });
}

/**
 * Launches the app (built via `yarn build:unpacked`) in demo mode: a fake
 * congregation with placeholder meeting media, no real congregation or
 * network access required.
 */
export async function launchDemoApp() {
  const app = await electron.launch({
    args: [ELECTRON_MAIN_PATH, '--no-sandbox', '--disable-dev-shm-usage'],
    env: { ...process.env, M3_DEMO_MODE: '1' },
  });

  // Surface the main process's own logs and the renderer's console/errors in
  // CI output, since a silent failure here is otherwise a black box.
  app.process().stdout?.on('data', (d) => process.stdout.write(`[main] ${d}`));
  app.process().stderr?.on('data', (d) => process.stderr.write(`[main] ${d}`));

  const window = await app.firstWindow();
  window.on('console', (msg) =>
    console.log(`[renderer:${msg.type()}] ${msg.text()}`),
  );
  window.on('pageerror', (error) =>
    console.error('[renderer:pageerror]', error),
  );

  await window.waitForLoadState('domcontentloaded');
  return { app, window };
}

/**
 * Starts a CPU profiler on the renderer via CDP, so a hang/freeze can be
 * diagnosed (which function is stuck) instead of just timing out blind.
 */
export async function startProfiling(window) {
  const client = await window.context().newCDPSession(window);
  await client.send('Profiler.enable');
  await client.send('Profiler.start');
  return client;
}

export async function stopProfilingAndSave(client, outputPath) {
  const { profile } = await client.send('Profiler.stop');
  const { writeFile } = await import('node:fs/promises');
  await writeFile(outputPath, JSON.stringify(profile));
}
