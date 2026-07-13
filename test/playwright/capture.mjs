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
    args: [ELECTRON_MAIN_PATH],
    env: { ...process.env, M3_DEMO_MODE: '1' },
  });
  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');
  return { app, window };
}
