import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';
import sharp from 'sharp';

const ELECTRON_MAIN_PATH = fileURLToPath(
  new URL('../../dist/electron/UnPackaged/electron-main.js', import.meta.url),
);

// macOS-screenshot-style presentation: rounded corners + a soft drop shadow
// on transparent padding, so the README preview doesn't look like a bare
// rectangle floating in the page.
const SHADOW_PADDING = 48;
const SHADOW_RADIUS = 14;
const SHADOW_BLUR = 24;
const SHADOW_OFFSET_Y = 12;

/** Rounds an image's corners and composites it onto a padded, drop-shadowed transparent canvas. */
async function addDropShadow(buffer) {
  const { height, width } = await sharp(buffer).metadata();

  const roundedMask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${SHADOW_RADIUS}" ry="${SHADOW_RADIUS}"/></svg>`,
  );
  const rounded = await sharp(buffer)
    .composite([{ blend: 'dest-in', input: roundedMask }])
    .png()
    .toBuffer();

  const canvasWidth = width + SHADOW_PADDING * 2;
  const canvasHeight = height + SHADOW_PADDING * 2;
  const shadow = Buffer.from(
    `<svg width="${canvasWidth}" height="${canvasHeight}">
      <defs>
        <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="${SHADOW_BLUR}" />
        </filter>
      </defs>
      <rect
        x="${SHADOW_PADDING}" y="${SHADOW_PADDING + SHADOW_OFFSET_Y}"
        width="${width}" height="${height}"
        rx="${SHADOW_RADIUS}" ry="${SHADOW_RADIUS}"
        fill="black" fill-opacity="0.35" filter="url(#blur)"
      />
    </svg>`,
  );

  return sharp({
    create: {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      channels: 4,
      height: canvasHeight,
      width: canvasWidth,
    },
  })
    .composite([
      { input: shadow, left: 0, top: 0 },
      { input: rounded, left: SHADOW_PADDING, top: SHADOW_PADDING },
    ])
    .png()
    .toBuffer();
}

// The app opens more than one BrowserWindow at startup (a hidden media
// presentation window, sometimes a timer window). electron.launch()'s
// firstWindow() just returns whichever one finishes loading first, which is
// racy and can hand back the hidden presentation window instead of the main
// one — that window is never shown (see src-electron/main/window/window-base.ts,
// `if (name === 'media') return;` skips its .show()), so it never paints and
// every wait against it just times out. Identify the main window by URL
// instead of trusting "first".
//
// Media/timer windows load with a `?page=media-player`/`?page=timer` hash
// param (see window-base.ts) that the router later rewrites to
// `#/media-player`/`#/timer`. Before that rewrite lands the URL already
// contains `#/` (e.g. `#/?page=media-player`), so match both forms or the
// hidden media window gets mistaken for the main one during startup.
const NON_MAIN_WINDOW_URL_PATTERN = /#(?:\/|\?page=)(?:media-player|timer)\b/;

// A typical laptop-window viewport for the calendar rather than full HD
// (1920x1080) — full-HD made the README preview unnecessarily huge and the
// layout stretched. Kept as plain local constants since this script runs
// under plain Node (not bundled through Quasar/Vite), so the `app/...` alias
// and TypeScript imports don't resolve here.
const CAPTURE_WIDTH = 1280;
const CAPTURE_HEIGHT = 800;

/**
 * Screenshots just the app's content (`#q-app`), excluding OS window chrome,
 * then presents it with rounded corners and a soft drop shadow.
 */
export async function captureScreenshot(window, outputPath) {
  const raw = await window.locator('#q-app').screenshot();
  const shadowed = await addDropShadow(raw);
  await writeFile(outputPath, shadowed);
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

  // Playwright's page has no concept of resizing an Electron BrowserWindow
  // (it's not a browser viewport) — go through the main-process window
  // handle instead, and size the content area itself so OS window chrome
  // doesn't throw off the final pixel dimensions.
  const browserWindow = await app.browserWindow(window);
  await browserWindow.evaluate(
    (win, [width, height]) => win.setContentSize(width, height),
    [CAPTURE_WIDTH, CAPTURE_HEIGHT],
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
