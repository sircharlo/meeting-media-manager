export const NETWORK_ERROR_CODES = new Set([
  'EAGAIN',
  'EAI_AGAIN',
  'EBUSY',
  'ECONNREFUSED',
  'ECONNRESET',
  'EINTR',
  'ENETDOWN',
  'ENETRESET',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
]);

/**
 * Chromium's names (net::ERR_*) for a network that isn't there or doesn't
 * get through: no internet, a DNS that doesn't answer, a firewall, filter
 * or proxy in the way. Electron gives them as an error's `code` (a failed
 * page load or download) or as did-fail-load's description.
 */
export const CHROMIUM_NETWORK_ERROR_CODES = new Set([
  'ERR_ADDRESS_UNREACHABLE',
  'ERR_CONNECTION_CLOSED',
  // Chromium's name for ECONNREFUSED: the user's firewall, filter or proxy
  // refused the connection (MMM-V2-AN, for the update server).
  'ERR_CONNECTION_REFUSED',
  'ERR_CONNECTION_RESET',
  'ERR_CONNECTION_TIMED_OUT',
  'ERR_INTERNET_DISCONNECTED',
  // The computer couldn't look up the site's address (MMM-V2-3P7).
  'ERR_NAME_NOT_RESOLVED',
  'ERR_NAME_RESOLUTION_FAILED',
  'ERR_NETWORK_CHANGED',
  'ERR_NETWORK_IO_SUSPENDED',
  'ERR_PROXY_CONNECTION_FAILED',
  'ERR_TIMED_OUT',
  // Sibling of ERR_PROXY_CONNECTION_FAILED: a proxy that refuses or can't
  // complete the HTTPS CONNECT tunnel (MMM-V2-AN, for the update server).
  'ERR_TUNNEL_CONNECTION_FAILED',
]);

/**
 * Whether Electron failed for want of a network (see
 * CHROMIUM_NETWORK_ERROR_CODES), rather than over the page or file itself.
 */
export const isChromiumNetworkError = (error: unknown): boolean => {
  const code = (error as null | undefined | { code?: unknown })?.code;
  return typeof code === 'string' && CHROMIUM_NETWORK_ERROR_CODES.has(code);
};

export function isFetchNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // `AbortSignal.timeout()` (fetchJson's per-attempt bound) rejects with a
  // DOMException named 'TimeoutError', not 'AbortError' - missing it meant
  // timeouts were reported as errors and never retried (MMM-V2-3JQ).
  if (
    error.name === 'AbortError' ||
    error.name === 'TimeoutError' ||
    error.name === 'ConnectTimeoutError'
  ) {
    return true;
  }

  const errorCode = (error as { code?: unknown }).code;
  if (typeof errorCode === 'string' && NETWORK_ERROR_CODES.has(errorCode)) {
    return true;
  }

  // A bare browser `TypeError: Failed to fetch` carries no further detail
  // (DNS failure, connection refused, offline, ...) — same class of noise
  // as the Node/undici error codes above, just without a `.code`. Some
  // runtimes append a parenthesized host to the message (e.g. "Failed to
  // fetch (b.jw-cdn.org)"), so match on prefix rather than exact equality.
  if (
    error.name === 'TypeError' &&
    error.message.startsWith('Failed to fetch')
  ) {
    return true;
  }

  // An empty/truncated response body is still a network-transport problem,
  // just surfaced at the body-parse stage (response.json()) instead of the
  // initial fetch — same class of noise, different failure point.
  if (
    error.name === 'SyntaxError' &&
    error.message.includes('Unexpected end of JSON input')
  ) {
    return true;
  }

  // A 2xx response whose body is actually an HTML page (interstitial, error
  // page, ...) instead of the JSON an API endpoint promised is the same
  // upstream-misbehavior noise as the cases above, just caught by
  // response.json() rather than the HTTP status. V8 has used two message
  // formats for this across versions ("Unexpected token < in JSON at
  // position 0" and "Unexpected token '<', "<!DOCTYPE "... is not valid
  // JSON"), so match on the common "Unexpected token '<'" prefix rather
  // than either exact string.
  if (
    error.name === 'SyntaxError' &&
    /Unexpected token .?<.?/.test(error.message)
  ) {
    return true;
  }

  if (!error.message.includes('fetch failed')) return false;

  const cause = error.cause as Record<string, unknown> | undefined;
  if (!cause) return false;

  const isNetworkCode =
    typeof cause.code === 'string' && NETWORK_ERROR_CODES.has(cause.code);
  const isTimeout =
    cause.name === 'ConnectTimeoutError' || cause.name === 'TimeoutError';

  return isNetworkCode || isTimeout;
}
