import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const ELECTRON_MAIN_PATH = fileURLToPath(
  new URL('../../dist/electron/UnPackaged/electron-main.js', import.meta.url),
);

// The app opens more than one BrowserWindow at startup (a hidden media
// presentation window, sometimes a timer window). electron.launch()'s
// firstWindow() just returns whichever one finishes loading first, which is
// racy and can hand back the hidden presentation window instead of the main
// one — that window is never shown (see src-electron/main/window/window-base.ts,
// `if (name === 'media') return;` skips its .show()), so it never paints and
// every wait against it just times out. Identify the main window by URL
// instead of trusting "first".
const NON_MAIN_WINDOW_URL_PATTERN = /#\/(?:media-player|timer)\b/;

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
    args: [
      ELECTRON_MAIN_PATH,
      '--no-sandbox',
      '--disable-dev-shm-usage',
      // Headless CI runners have no real GPU; without this the GPU process
      // repeatedly fails to initialize (GpuControl.CreateCommandBuffer) and
      // Electron keeps respawning it, which is what ran the renderer out of
      // memory rather than ever finishing a first paint.
      '--disable-gpu',
      '--disable-software-rasterizer',
    ],
    env: { ...process.env, M3_DEMO_MODE: '1' },
  });

  // Surface the main process's own logs and the renderer's console/errors in
  // CI output, since a silent failure here is otherwise a black box.
  app.process().stdout?.on('data', (d) => process.stdout.write(`[main] ${d}`));
  app.process().stderr?.on('data', (d) => process.stderr.write(`[main] ${d}`));

  const window = await findMainWindow(app);
  window.on('console', (msg) =>
    console.log(`[renderer:${msg.type()}] ${msg.text()}`),
  );
  window.on('pageerror', (error) =>
    console.error('[renderer:pageerror]', error),
  );

  return { app, window };
}

/**
 * Screenshots `window` on an interval into `dir` (must already exist) until
 * the returned stop function is called, so a hang is visible as a sequence
 * of frames instead of a single post-mortem attempt that also times out.
 * Each tick is best-effort: a slow/unresponsive renderer just skips a frame
 * rather than piling up overlapping screenshot calls.
 */
export function startPeriodicScreenshots(window, dir, intervalMs = 1000) {
  let tick = 0;
  let busy = false;

  const timer = setInterval(() => {
    if (busy) return;
    busy = true;
    const label = String(++tick).padStart(3, '0');
    const path = join(dir, `tick-${label}.png`);

    Promise.race([
      window.screenshot({ path }),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('tick screenshot timeout')),
          intervalMs * 2,
        );
      }),
    ])
      .catch((error) =>
        console.error(`[tick ${label}] screenshot skipped:`, error.message),
      )
      .finally(() => {
        busy = false;
      });
  }, intervalMs);

  return () => clearInterval(timer);
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

async function findMainWindow(app, timeoutMs = 30000) {
  for (const page of app.windows()) {
    if (await isMainWindow(page)) return page;
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      app.off('window', onWindow);
      reject(
        new Error(`Timed out after ${timeoutMs}ms waiting for the main window`),
      );
    }, timeoutMs);

    function onWindow(page) {
      isMainWindow(page).then((matched) => {
        if (!matched) return;
        clearTimeout(timer);
        app.off('window', onWindow);
        resolve(page);
      });
    }

    app.on('window', onWindow);
  });
}

async function isMainWindow(page) {
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  // Give Vue Router a moment to resolve the initial hash route after load.
  for (let attempt = 0; attempt < 20; attempt++) {
    const url = page.url();
    if (NON_MAIN_WINDOW_URL_PATTERN.test(url)) return false;
    if (url.startsWith('https://')) return false; // the "present website" window
    if (url.includes('#/')) return true; // routed somewhere, and not excluded above
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }
  return false;
}
