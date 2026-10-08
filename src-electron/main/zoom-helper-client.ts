import type {
  ZoomCommand,
  ZoomCommandResult,
  ZoomCommandType,
} from 'src/types';

// Kept free of Electron imports: the local live Zoom test
// (test/zoom-live) drives the helper through this same client.

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
}

const ENDPOINTS: Record<ZoomCommandType, Endpoint> = {
  admit: { method: 'POST', path: '/participants/admit' },
  'ask-all-to-unmute': {
    method: 'POST',
    path: '/participants/ask-all-to-unmute',
  },
  'join-audio': { method: 'POST', path: '/audio/join' },
  'leave-audio': { method: 'POST', path: '/audio/leave' },
  meeting: { method: 'GET', path: '/meeting' },
  'mute-all': { method: 'POST', path: '/participants/mute-all' },
  participants: { method: 'GET', path: '/participants' },
  'set-video': { method: 'POST', path: '/video' },
  'share-entries': { method: 'GET', path: '/share/entries' },
  'start-share': { method: 'POST', path: '/share/start' },
  'stop-share': { method: 'POST', path: '/share/stop' },
  'video-title': { method: 'GET', path: '/video/title' },
};

/** Header carrying the per-run secret the helper requires (see uia_helper.py). */
export const ZOOM_HELPER_TOKEN_HEADER = 'X-Zoom-Helper-Token';

export const isZoomCommand = (value: unknown): value is ZoomCommand =>
  !!value &&
  typeof value === 'object' &&
  'type' in value &&
  typeof value.type === 'string' &&
  Object.hasOwn(ENDPOINTS, value.type);

export interface ZoomHelperConnection {
  baseUrl: string;
  fetch?: typeof fetch;
  token: string;
}

export const runZoomCommand = async (
  { baseUrl, fetch: fetchImpl = fetch, token }: ZoomHelperConnection,
  command: ZoomCommand,
): Promise<ZoomCommandResult> => {
  const { method, path } = ENDPOINTS[command.type];
  const payload = Object.fromEntries(
    Object.entries(command).filter(([key]) => key !== 'type'),
  );
  const headers: Record<string, string> = {
    [ZOOM_HELPER_TOKEN_HEADER]: token,
  };
  const init: RequestInit = { headers, method };
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(payload);
  }

  const response = await fetchImpl(`${baseUrl}${path}`, init);
  let result: null | ZoomCommandResult = null;
  try {
    result = (await response.json()) as ZoomCommandResult;
  } catch {
    // Not JSON: reported below with the HTTP status.
  }
  if (result && typeof result.ok === 'boolean') return result;
  return { error: `http-${response.status}`, ok: false };
};
