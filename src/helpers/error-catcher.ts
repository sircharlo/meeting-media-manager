import { captureException } from '@sentry/vue';
import {
  getNodeFsErrorFingerprint,
  isDiskFullError,
} from 'src/shared/filesystem-errors';
import { log } from 'src/shared/vanilla';

type CaptureCtx = Parameters<typeof captureException>[1];

/**
 * Dispatched on `globalThis` for every disk-full error, so the main window
 * can tell the user (see notifyDiskFull).
 */
export const DISK_FULL_ERROR_EVENT = 'diskFullError';

// Whether the user has seen a disk space warning this session (low disk
// space, or a full disk). From then on, a write failing for lack of space
// is the user's to fix, so it isn't reported.
let userWarnedAboutDiskSpace = false;

export const markUserWarnedAboutDiskSpace = () => {
  userWarnedAboutDiskSpace = true;
};

/**
 * Has the main window tell the user the disk is full (see notifyDiskFull).
 * @param error The disk-full error
 * @returns 'already-warned' if the user had been warned before this error
 */
const showDiskFullWarning = (error: unknown) => {
  // Read first: the warning this event shows marks the user as warned.
  const alreadyWarned = userWarnedAboutDiskSpace;
  globalThis.dispatchEvent(new CustomEvent(DISK_FULL_ERROR_EVENT));
  if (!alreadyWarned) return 'first-warning';

  log('Disk full (user already warned)', 'errorHandling', 'warn', error);
  return 'already-warned';
};

export const errorCatcher = (error: unknown, context?: CaptureCtx): void => {
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

  // MMM-V2-3M7/3M9: a full disk is always shown to the user, but only
  // reported until they've been warned.
  if (
    isDiskFullError(error) &&
    showDiskFullWarning(error) === 'already-warned'
  ) {
    return;
  }

  if (import.meta.env.IS_DEV) {
    log(error, 'errorHandling', 'error');
    log('context', 'errorHandling', 'warn', context);
  } else {
    const fingerprint = getNodeFsErrorFingerprint(error, context);
    captureException(
      error,
      fingerprint && typeof context !== 'function'
        ? ({ ...context, fingerprint } as CaptureCtx)
        : context,
    );
  }
};
