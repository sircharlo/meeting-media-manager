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

  if (!error.message.includes('fetch failed')) return false;

  const cause = error.cause as Record<string, unknown> | undefined;
  if (!cause) return false;

  const isNetworkCode =
    typeof cause.code === 'string' && NETWORK_ERROR_CODES.has(cause.code);
  const isTimeout =
    cause.name === 'ConnectTimeoutError' || cause.name === 'TimeoutError';

  return isNetworkCode || isTimeout;
}
