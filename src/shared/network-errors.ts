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

export function isFetchNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  if (error.name === 'AbortError' || error.name === 'ConnectTimeoutError') {
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

  if (!error.message.includes('fetch failed')) return false;

  const cause = error.cause as Record<string, unknown> | undefined;
  if (!cause) return false;

  const isNetworkCode =
    typeof cause.code === 'string' && NETWORK_ERROR_CODES.has(cause.code);
  const isTimeout =
    cause.name === 'ConnectTimeoutError' || cause.name === 'TimeoutError';

  return isNetworkCode || isTimeout;
}
