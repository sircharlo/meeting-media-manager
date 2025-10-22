import { captureException } from '@sentry/electron/renderer';

type CaptureCtx = Parameters<typeof captureException>[1];

let lastSentAt = 0;
let trailingTimeout: null | ReturnType<typeof setTimeout> = null;
let trailingPayload: null | {
  context?: CaptureCtx;
  error: Error | string | unknown;
} = null;

const TITLE_SUPPRESSION_WINDOW_MS = 2 * 60 * 1000;
const titleState: Map<string, { lastSent: number; suppressed: number }> =
  new Map<string, { lastSent: number; suppressed: number }>();

function sendNow(error: Error | string | unknown, context?: CaptureCtx) {
  if (!process.env.IS_DEV) {
    captureException(error, context);
  } else {
    console.error(error);
    console.warn('context', context);
  }
}

function sendWithGlobalThrottle(
  error: Error | string | unknown,
  context?: CaptureCtx,
) {
  const now = Date.now();
  if (shouldBypassThrottle(context)) {
    sendNow(error, context);
    lastSentAt = now;
    return;
  }

  const elapsed = now - lastSentAt;
  if (elapsed >= 1000) {
    lastSentAt = now;
    sendNow(error, context);
    if (trailingTimeout) {
      clearTimeout(trailingTimeout);
      trailingTimeout = null;
      trailingPayload = null;
    }
  } else {
    trailingPayload = { context, error };
    if (!trailingTimeout) {
      trailingTimeout = setTimeout(() => {
        if (trailingPayload) {
          lastSentAt = Date.now();
          sendNow(trailingPayload.error, trailingPayload.context);
          trailingPayload = null;
        }
        trailingTimeout = null;
      }, 1000 - elapsed);
    }
  }
}

function shouldBypassThrottle(context?: CaptureCtx): boolean {
  const c: unknown = context || {};
  const anyC = c as {
    forceSend?: boolean;
    level?: string;
    mechanism?: { handled?: boolean };
  };
  return (
    anyC?.forceSend === true ||
    anyC?.level === 'fatal' ||
    anyC?.mechanism?.handled === false
  );
}

function titleFrom(error: Error | string | unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export const errorCatcher = async (
  error: Error | string | unknown,
  context?: CaptureCtx,
) => {
  if (!error) return;

  if (error instanceof Error && error.cause) {
    errorCatcher(error.cause, context);
  }

  const key = titleFrom(error);
  const now = Date.now();
  const state = titleState.get(key) || { lastSent: 0, suppressed: 0 };

  if (now - state.lastSent < TITLE_SUPPRESSION_WINDOW_MS) {
    state.suppressed += 1;
    titleState.set(key, state);
    return; // Suppress identical title within 2 minutes
  }

  // If we reach here, we are allowed to send. Attach suppressed info if any
  const suppressed = state.suppressed;
  state.lastSent = now;
  state.suppressed = 0;
  titleState.set(key, state);

  const augmentedContext: CaptureCtx | undefined =
    suppressed > 0
      ? (() => {
          const baseCtx =
            context && typeof context === 'object'
              ? (context as Record<string, unknown>)
              : {};
          const baseContexts =
            baseCtx.contexts && typeof baseCtx.contexts === 'object'
              ? (baseCtx.contexts as Record<string, unknown>)
              : {};
          const baseExtra =
            baseCtx.extra && typeof baseCtx.extra === 'object'
              ? (baseCtx.extra as Record<string, unknown>)
              : {};
          const baseTags =
            baseCtx.tags && typeof baseCtx.tags === 'object'
              ? (baseCtx.tags as Record<string, unknown>)
              : {};
          return {
            ...(baseCtx as CaptureCtx),
            contexts: {
              ...baseContexts,
              rateLimit: {
                suppressedSinceLastSend: suppressed,
                titleKey: key,
                windowMs: TITLE_SUPPRESSION_WINDOW_MS,
              },
            },
            extra: { ...baseExtra, rate_limit_suppressed_count: suppressed },
            tags: { ...baseTags, rate_limited: 'per-title' },
          } as CaptureCtx;
        })()
      : context;

  sendWithGlobalThrottle(error, augmentedContext);
};
