import type { ExclusiveEventHintOrCaptureContext } from 'app/node_modules/@sentry/core/build/types/utils/prepareEvent';

import { captureException } from '@sentry/electron/renderer';

let lastSentAt = 0;
let trailingTimeout: null | ReturnType<typeof setTimeout> = null;
let trailingPayload: null | {
  context?: ExclusiveEventHintOrCaptureContext;
  error: unknown;
} = null;
const TITLE_SUPPRESSION_WINDOW_MS = 2 * 60 * 1000;
const titleState: Map<string, { lastSent: number; suppressed: number }> =
  new Map<string, { lastSent: number; suppressed: number }>();

/**
 * Logs an error to the console or to Sentry
 * @param error The error to log
 * @param context The context to log with the error
 */
export function capturePreloadError(
  error: Error | string | unknown,
  context?: ExclusiveEventHintOrCaptureContext,
) {
  if (error instanceof Error && error.cause) {
    capturePreloadError(error.cause, context);
  }

  const now = Date.now();
  const key = titleFrom(error);
  if (!titleState.has(key)) {
    titleState.set(key, { lastSent: 0, suppressed: 0 });
  }
  const tState = titleState.get(key) || { lastSent: 0, suppressed: 0 };
  if (now - tState.lastSent < TITLE_SUPPRESSION_WINDOW_MS) {
    tState.suppressed += 1;
    titleState.set(key, tState);
    return;
  }

  const suppressed = tState.suppressed;
  tState.lastSent = now;
  tState.suppressed = 0;
  titleState.set(key, tState);

  const augmentedContext: ExclusiveEventHintOrCaptureContext | undefined =
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
            ...(baseCtx as ExclusiveEventHintOrCaptureContext),
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
          } as ExclusiveEventHintOrCaptureContext;
        })()
      : context;

  const bypass = shouldBypassThrottle(augmentedContext);
  const elapsed = now - lastSentAt;
  const sendNow = () => {
    if (process.env.IS_DEV) {
      console.error(error);
      console.warn('context', augmentedContext);
    } else {
      captureException(error, augmentedContext);
    }
  };

  if (bypass || elapsed >= 1000) {
    lastSentAt = now;
    sendNow();
    if (trailingTimeout) {
      clearTimeout(trailingTimeout);
      trailingTimeout = null;
      trailingPayload = null;
    }
  } else {
    trailingPayload = { context: augmentedContext, error };
    if (!trailingTimeout) {
      trailingTimeout = setTimeout(() => {
        const payload = trailingPayload;
        if (payload) {
          lastSentAt = Date.now();
          if (process.env.IS_DEV) {
            console.error(payload.error);
            console.warn('context', payload.context);
          } else {
            captureException(payload.error, payload.context);
          }
          trailingPayload = null;
        }
        trailingTimeout = null;
      }, 1000 - elapsed);
    }
  }
}

function shouldBypassThrottle(
  context?: ExclusiveEventHintOrCaptureContext,
): boolean {
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

function titleFrom(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
