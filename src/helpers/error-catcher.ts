import { captureException } from '@sentry/vue';
import {
  getFilesystemErrorCode,
  getFilesystemErrorSyscall,
} from 'src/shared/filesystem-errors';
import { log } from 'src/shared/vanilla';

type CaptureCtx = Parameters<typeof captureException>[1];

/**
 * Node fs errors (ENOENT, EPERM, EBUSY, ...) embed the full dynamic file
 * path in their message. Sentry's default grouping picks that up, so what's
 * really one recurring failure fragments into a separate issue per unique
 * path. Group by the stable parts instead — error code, syscall, and the
 * originating function (from the `contexts.fn.name` callers already pass).
 */
const nodeFsErrorFingerprint = (
  error: unknown,
  context?: CaptureCtx,
): string[] | undefined => {
  const code = getFilesystemErrorCode(error);
  const syscall = getFilesystemErrorSyscall(error);
  if (!code || !syscall) return undefined;

  const fnName =
    context && typeof context === 'object' && 'contexts' in context
      ? (context.contexts as undefined | { fn?: { name?: unknown } })?.fn?.name
      : undefined;

  return [
    'node-fs-error',
    code,
    syscall,
    typeof fnName === 'string' ? fnName : 'unknown',
  ];
};

export const errorCatcher = async (error: unknown, context?: CaptureCtx) => {
  if (!error) return;

  // Raw DOM events (e.g. a <video>/<audio> 'error' event with no attached
  // MediaError) carry no message or stack trace and are useless in Sentry.
  if (typeof Event !== 'undefined' && error instanceof Event) return;

  const cause =
    (error instanceof Error && error.cause) ||
    (typeof error === 'object' && error !== null && 'cause' in error
      ? (error as { cause: unknown }).cause
      : undefined);

  // Only recurse into a cause that's itself an Error (a real report) or an
  // Event (dropped by the check above, same as a top-level one). Other DOM
  // objects attached as a cause - e.g. a <video>/<audio> MediaError, which
  // has no useful own message/stack - would otherwise reach captureException
  // raw and get stringified to something like "[object MediaError]". Fall
  // through and report the outer wrapper instead, which already has a real
  // message assembled from the cause where one was available.
  if (
    cause instanceof Error ||
    (typeof Event !== 'undefined' && cause instanceof Event)
  ) {
    // The cause is the actual failure; the outer error is just a wrapper
    // adding context, so only the cause needs its own Sentry report.
    errorCatcher(cause, context);
    return;
  }

  if (import.meta.env.IS_DEV) {
    log(error, 'errorHandling', 'error');
    log('context', 'errorHandling', 'warn', context);
  } else {
    const fingerprint = nodeFsErrorFingerprint(error, context);
    captureException(
      error,
      fingerprint && typeof context !== 'function'
        ? ({ ...context, fingerprint } as CaptureCtx)
        : context,
    );
  }
};
