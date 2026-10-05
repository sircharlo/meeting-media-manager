import { BrowserWindow, session } from 'electron';
import { captureElectronError } from 'src-electron/main/utils';
import { log } from 'src/shared/vanilla';

// Some configured Website hosts put WOL behind an AWS WAF bot challenge:
// every non-browser request gets an empty 202 until the client runs the
// challenge's JavaScript and presents the resulting token cookie. That
// left the yeartext (and WOL font discovery) silently unavailable. A real
// Chromium page clears it on its own within about a second, so this loads
// the host in a hidden, sandboxed window to obtain the token, then attaches
// it to the app's own requests to that host - which Chromium won't do by
// itself, because they come from a file:// page and the cookie is
// SameSite=Lax.

const WAF_TOKEN_COOKIE = 'aws-waf-token';
const CHALLENGE_TIMEOUT_MS = 20_000;

const tokensByHost = new Map<string, string>();
const inFlightChallenges = new Map<string, Promise<boolean>>();
const challengeWebContentsIds = new Set<number>();

const getTokenCookie = async (origin: string) => {
  const [cookie] = await session.defaultSession.cookies.get({
    name: WAF_TOKEN_COOKIE,
    url: origin,
  });
  return cookie?.value;
};

const waitForToken = (win: BrowserWindow, origin: string) =>
  new Promise<string | undefined>((resolve) => {
    const { cookies } = session.defaultSession;
    let settled = false;

    const finish = (token: string | undefined) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      cookies.off('changed', check);
      resolve(token);
    };

    const check = () => {
      getTokenCookie(origin)
        .then((token) => {
          if (token) finish(token);
        })
        .catch(() => undefined);
    };

    const timeout = setTimeout(() => finish(undefined), CHALLENGE_TIMEOUT_MS);
    cookies.on('changed', check);
    // A token still valid from an earlier challenge never fires 'changed':
    // the page simply loads, so check again once it has.
    win.webContents.on('did-finish-load', check);
    win.on('closed', () => finish(undefined));
  });

const runChallenge = async (host: string): Promise<boolean> => {
  const origin = `https://${host}/`;
  const win = new BrowserWindow({
    height: 600,
    show: false,
    webPreferences: {
      // A hidden window's timers are throttled by default, which would
      // slow the challenge's proof-of-work down.
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    width: 800,
  });
  const { webContents } = win;
  challengeWebContentsIds.add(webContents.id);
  webContents.setAudioMuted(true);
  webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  try {
    const tokenPromise = waitForToken(win, origin);
    win.loadURL(origin).catch(() => undefined);
    const token = await tokenPromise;
    if (!token) {
      log('WAF challenge did not yield a token', 'electronWindow', 'warn', {
        host,
      });
      return false;
    }
    tokensByHost.set(host, token);
    return true;
  } finally {
    challengeWebContentsIds.delete(webContents.id);
    if (!win.isDestroyed()) win.destroy();
  }
};

/**
 * Validates a renderer-supplied URL before a hidden window is ever pointed
 * at it: only the configured Website's own WOL host, over HTTPS.
 * @param url The URL whose request was challenged
 * @param base The configured base domain (e.g. `jw.org`)
 * @returns The host to challenge, or undefined if it isn't allowed
 */
export const getChallengeHost = (
  url: string,
  base: string,
): string | undefined => {
  if (!base) return undefined;
  const parsed = URL.parse(url);
  if (parsed?.protocol !== 'https:') return undefined;
  return parsed.hostname === `wol.${base}` ? parsed.hostname : undefined;
};

/**
 * Obtains a bot-challenge token for the given host by loading it in a
 * hidden window, once at a time per host.
 * @param host The challenged host (already validated by the caller)
 * @returns Whether a token was obtained
 */
export const passWafChallenge = (host: string): Promise<boolean> => {
  const existing = inFlightChallenges.get(host);
  if (existing) return existing;

  const attempt = runChallenge(host)
    .catch((error) => {
      captureElectronError(error, {
        contexts: { fn: { host, name: 'passWafChallenge' } },
      });
      return false;
    })
    .finally(() => {
      inFlightChallenges.delete(host);
    });
  inFlightChallenges.set(host, attempt);
  return attempt;
};

/**
 * Adds a previously obtained challenge token to a request's headers.
 * Requests from the challenge window itself are left alone: Chromium
 * already sends that page its own cookies.
 * @param url The request URL
 * @param webContentsId The request's sender, if any
 * @param requestHeaders The headers to amend in place
 */
export const attachWafToken = (
  url: string,
  webContentsId: number | undefined,
  requestHeaders: Record<string, string>,
) => {
  if (webContentsId !== undefined && challengeWebContentsIds.has(webContentsId))
    return;

  const host = URL.parse(url)?.hostname;
  const token = host ? tokensByHost.get(host) : undefined;
  if (!token) return;

  const tokenPair = `${WAF_TOKEN_COOKIE}=${token}`;
  const existing = requestHeaders['Cookie'];
  if (existing?.includes(`${WAF_TOKEN_COOKIE}=`)) return;
  requestHeaders['Cookie'] = existing ? `${existing}; ${tokenPair}` : tokenPair;
};
