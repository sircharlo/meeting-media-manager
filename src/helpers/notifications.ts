import { i18n } from 'boot/i18n';
import { getActivePinia } from 'pinia';
import {
  Notify,
  type QNotifyCreateOptions,
  type QNotifyUpdateOptions,
} from 'quasar';
import {
  errorCatcher,
  markUserWarnedAboutDiskSpace,
} from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { useAttentionStore } from 'stores/attention';
import { useDialogStateStore } from 'stores/dialog-state';
import { watch, type WatchHandle } from 'vue';

// 1. Strict allowed types: the four registered in boot/notify-types.ts, each
// with its own color and icon, and Quasar's own 'ongoing' (with a spinner)
const allowedTypes = [
  'positive',
  'negative',
  'warning',
  'info',
  'ongoing',
] as const;

// 2. Interface with strict type
interface AllowedNotifyProps {
  actions?: QNotifyCreateOptions['actions'];
  caption?: QNotifyCreateOptions['caption'];
  /**
   * Extra CSS class(es) applied to the notification card itself - mainly
   * useful as a `:has()` hook so a specific dialog can boost the whole
   * (shared, app-wide) `.q-notifications__list` container above itself
   * while one of its own notifications is showing, without affecting
   * notifications everywhere else. See DialogCongregationSwitcher.vue for
   * an example.
   */
  classes?: QNotifyCreateOptions['classes'];
  /**
   * When true, and a dialog (any BaseDialog-registered one, e.g. a picker or
   * the congregation switcher) is open at the moment this is called, hold
   * off actually creating the notification until every open dialog has
   * closed, instead of potentially rendering on top of one - Quasar
   * notifications sit above dialogs in z-index by default, so a
   * notification that happens to fire on the same event that closes a
   * modal (e.g. a congregation-switch side effect racing the congregation
   * switcher's own close) can otherwise visibly stack on top of it.
   *
   * Its handle works meanwhile: closing it before it shows means it never
   * does. Unlike other notifications that wait (see urgent), it shows
   * however long it waited.
   */
  deferWhileDialogOpen?: boolean;
  group?: QNotifyCreateOptions['group'];
  icon?: QNotifyCreateOptions['icon'];
  message?: QNotifyCreateOptions['message'];
  noClose?: boolean;
  /**
   * Called once it's closed, however that happens: its close button or an
   * action, its timeout, or dismissAllTemporaryNotifications() (switching
   * congregations). Updating a closed notification shows nothing.
   */
  onDismiss?: QNotifyCreateOptions['onDismiss'];
  position?: QNotifyCreateOptions['position'];
  /**
   * When true, this notification is not tracked by
   * dismissAllTemporaryNotifications() and therefore survives events (like
   * switching congregations) that dismiss regular temporary notifications.
   * Use this for app-level notifications (e.g. the updater) that aren't tied
   * to the currently selected congregation.
   */
  protect?: boolean;
  timeout?: QNotifyCreateOptions['timeout'];
  type?: AllowedNotifyType; // 👈 strict union
  /**
   * When true, it shows at once, even while a screen covers the whole
   * window (a maximized dialog such as today's song check, or a tour), and
   * on top of it. Every other notification waits for that screen to close
   * (see the attention store's holdsNotifications), and an info or success
   * message that waited more than a minute is dropped by then, out of date.
   * For what can't wait: a raised hand during the meeting.
   */
  urgent?: boolean;
}

type AllowedNotifyType = (typeof allowedTypes)[number];

/** A notification waiting to show (see mustWait). */
interface HeldNotification {
  heldAt: number;
  props: AllowedNotifyProps;
  /** Its own handle, once it shows. */
  shown?: NotificationHandle;
  /** What its handle changed while it waited. */
  updates?: QNotifyUpdateOptions;
}

// 3. Reject extra keys
type NoExtraKeys<T> = Record<
  Exclude<keyof T, keyof AllowedNotifyProps>,
  never
> &
  T;

/** A notification's handle: updates it with the props given, else closes it. */
type NotificationHandle = (props?: QNotifyUpdateOptions) => void;

// Track all active notification dismiss functions
const activeTemporaryNotifications: (() => void)[] = [];

const DEFAULT_TIMEOUT_MS = 5000;

// An info or success message that waited longer than this for a screen to
// close ("Participants muted", minutes later) is out of date by then.
const OUT_OF_DATE_AFTER_MS = 60_000;

/** The notifications waiting to show, oldest first. */
const heldNotifications: HeldNotification[] = [];

let heldNotificationsWatcher: undefined | WatchHandle;

/**
 * Whether a notification has to wait: a screen covers the whole window, or
 * is about to (see the attention store), or, for one that asks to, a dialog
 * is open. Not before Pinia is up: nothing can be on screen yet.
 */
const mustWait = (props: AllowedNotifyProps) => {
  if (props.urgent || !getActivePinia()) return false;
  if (useAttentionStore().holdsNotifications) return true;
  return !!props.deferWhileDialogOpen && useDialogStateStore().isAnyDialogOpen;
};

/**
 * Whether a waiting notification is out of date: an info or success
 * message that closes by itself, which waited for a screen to close for
 * more than OUT_OF_DATE_AFTER_MS. One that asked to wait for dialogs always
 * shows.
 */
const isOutOfDate = ({ heldAt, props }: HeldNotification) =>
  !props.deferWhileDialogOpen &&
  (props.type === 'info' || props.type === 'positive') &&
  (props.timeout ?? DEFAULT_TIMEOUT_MS) > 0 &&
  Date.now() - heldAt > OUT_OF_DATE_AFTER_MS;

/** Takes a waiting notification off the list: it never shows. */
const dropHeldNotification = (held: HeldNotification) => {
  const index = heldNotifications.indexOf(held);
  if (index === -1) return;
  heldNotifications.splice(index, 1);
  held.props.onDismiss?.();
};

/**
 * The default actions of a closable notification: just a close button,
 * white like the text of every type of notification.
 */
const getCloseActions = (): QNotifyCreateOptions['actions'] => [
  { color: 'white', icon: 'close', round: true },
];

/**
 * Tracks a notification's dismiss function for
 * dismissAllTemporaryNotifications(), until its timeout (if any) has passed.
 */
const trackTemporaryNotification = (dismiss: () => void, timeout: number) => {
  activeTemporaryNotifications.push(dismiss);

  // Auto-remove from tracking after timeout (if not indefinite)
  if (timeout > 0) {
    setTimeout(() => {
      const index = activeTemporaryNotifications.indexOf(dismiss);
      if (index > -1) {
        activeTemporaryNotifications.splice(index, 1);
      }
    }, timeout);
  }
};

/** The options passed on to Quasar only when they're given. */
const getOptionalOptions = ({
  caption,
  classes,
  group,
  onDismiss,
}: AllowedNotifyProps) => ({
  ...(caption && { caption }),
  ...(classes && { classes }),
  ...(group && { group }),
  ...(onDismiss && { onDismiss }),
});

/** Shows a notification now, with what its handle changed while it waited. */
const showNotification = (
  props: AllowedNotifyProps,
  updates?: QNotifyUpdateOptions,
): NotificationHandle => {
  const {
    actions,
    icon,
    message,
    noClose = false,
    position = 'top',
    protect = false,
    timeout = DEFAULT_TIMEOUT_MS,
    type,
    urgent = false,
  } = props;

  // Runtime safety
  if (type && !allowedTypes.includes(type)) {
    throw new Error(`Unknown notify type: "${type}"`);
  }

  // An urgent one stays on top of a screen covering the window (see
  // app.scss), which the others go under.
  const classes = [props.classes, urgent && 'notify-urgent']
    .filter(Boolean)
    .join(' ');

  // Without an icon of its own, it gets its type's (see
  // boot/notify-types.ts): one given as undefined would replace it.
  const dismiss = Notify.create({
    group: false,
    message,
    position,
    timeout,
    ...getOptionalOptions({ ...props, classes }),
    ...(type && { type }),
    ...(icon && { icon }),
    ...(!noClose && { actions: actions ?? getCloseActions() }),
    ...updates,
  });

  // Track the dismiss function if it exists, unless it's protected from
  // being swept up by dismissAllTemporaryNotifications()
  if (dismiss && !protect) trackTemporaryNotification(dismiss, timeout);

  return dismiss;
};

/**
 * Shows the waiting notifications that no longer have to wait, oldest
 * first, and drops those out of date by now. Stops watching once none is
 * left.
 */
const showHeldNotifications = () => {
  const ready = heldNotifications.filter((held) => !mustWait(held.props));
  for (const held of ready) {
    if (isOutOfDate(held)) {
      log('Notification dropped, out of date', 'notifications', 'info', {
        message: held.props.message,
      });
      dropHeldNotification(held);
      continue;
    }
    heldNotifications.splice(heldNotifications.indexOf(held), 1);
    try {
      held.shown = showNotification(held.props, held.updates);
    } catch (error) {
      errorCatcher(error);
    }
  }
  if (heldNotifications.length) return;
  heldNotificationsWatcher?.stop();
  heldNotificationsWatcher = undefined;
};

/**
 * Keeps a notification until it no longer has to wait (see mustWait). Its
 * handle works meanwhile: an update changes what it shows, and closing it
 * means it never shows.
 */
const holdNotification = (props: AllowedNotifyProps): NotificationHandle => {
  const held: HeldNotification = { heldAt: Date.now(), props };
  heldNotifications.push(held);
  heldNotificationsWatcher ??= watch(
    [
      () => useAttentionStore().holdsNotifications,
      () => useDialogStateStore().isAnyDialogOpen,
    ],
    showHeldNotifications,
  );
  return (updates) => {
    if (held.shown) {
      held.shown(updates);
    } else if (updates) {
      held.updates = { ...held.updates, ...updates };
    } else {
      dropHeldNotification(held);
    }
  };
};

export const createTemporaryNotification = (
  props: NoExtraKeys<AllowedNotifyProps>,
) => {
  try {
    if (mustWait(props)) return holdNotification(props);
    return showNotification(props);
  } catch (error) {
    errorCatcher(error);
  }
};

const LOW_DISK_REMINDER_INTERVAL_MS = 30 * 60 * 1000;
let lastLowDiskWarningAt = 0;

/**
 * Records that the user has seen a disk space warning, so that neither
 * process reports disk-full errors from then on.
 */
const recordDiskSpaceWarning = () => {
  markUserWarnedAboutDiskSpace();
  globalThis.electronApi?.markUserWarnedAboutDiskSpace();
};

/**
 * Checks disk space and warns the user if it's running low. Shared so both
 * the one-time congregation-switch check (DialogCongregationSwitcher.vue)
 * and the periodic during-downloads check (MainLayout.vue, added for BE-8 in
 * full-audit-2026-09-04.md - a user switching congregations with just-enough
 * free space got no further warning even as a long download session kept
 * consuming it) show the exact same warning.
 *
 * The periodic check is a `reminder`: it warns at most every half hour, not
 * on each check, every 2 minutes. Warnings waiting for a dialog to close
 * fold into one.
 */
export const checkLowDiskSpaceAndNotify = async ({
  reminder = false,
}: { reminder?: boolean } = {}): Promise<void> => {
  if (!globalThis.electronApi) return;
  if (
    reminder &&
    Date.now() - lastLowDiskWarningAt < LOW_DISK_REMINDER_INTERVAL_MS
  ) {
    return;
  }
  try {
    const isLowDiskSpace = await globalThis.electronApi.getLowDiskSpaceStatus();
    if (!isLowDiskSpace) return;

    lastLowDiskWarningAt = Date.now();
    createTemporaryNotification({
      caption: i18n.global.t('low-disk-space-warning'),
      deferWhileDialogOpen: true,
      group: 'low-disk-space',
      message: i18n.global.t('disk-space-is-running-low'),
      timeout: 10_000,
      type: 'warning',
    });
    recordDiskSpaceWarning();
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'checkLowDiskSpaceAndNotify' } },
    });
  }
};

const DISK_FULL_WARNING_THROTTLE_MS = 5 * 60 * 1000;
let lastDiskFullWarningAt = 0;

/**
 * Tells the user that M³ couldn't save a file because the disk is full.
 * Throttled, since a full disk tends to fail many writes in a row.
 */
export const notifyDiskFull = (): void => {
  const now = Date.now();
  if (now - lastDiskFullWarningAt < DISK_FULL_WARNING_THROTTLE_MS) return;
  lastDiskFullWarningAt = now;

  createTemporaryNotification({
    caption: i18n.global.t('disk-full'),
    deferWhileDialogOpen: true,
    message: i18n.global.t('disk-full-explain'),
    timeout: 15_000,
    type: 'negative',
  });
  recordDiskSpaceWarning();
};

/**
 * Tells the user that M³ couldn't install its update because the disk is full
 * (MMM-V2-3P8). Like any disk-full warning, it stops disk-full errors from
 * being reported from then on.
 */
export const notifyUpdateDiskFull = (): void => {
  createTemporaryNotification({
    caption: i18n.global.t('update-failed'),
    message: i18n.global.t('update-error-disk-full'),
    timeout: 15_000,
    type: 'negative',
  });
  recordDiskSpaceWarning();
};

/**
 * Tells the user that next year's yeartext couldn't be fetched for its
 * preview, naming the year (the message used to show "{year}" as is).
 */
export const notifyYeartextPreviewFailed = (year: number): void => {
  createTemporaryNotification({
    message: i18n.global.t('yeartext-preview-failed', { year }),
    type: 'negative',
  });
};

const EXPECTED_DOWNLOAD_ISSUE_WARNING_THROTTLE_MS = 5 * 60 * 1000;
let lastExpectedDownloadIssueWarningAt = 0;

/**
 * Gently nudges an affected user (see the main process's
 * isDownloadErrorExpected) toward the two things most likely to help - a
 * stable connection and a correct website address. Throttled since this
 * can be triggered from many independent caught fetch errors in quick
 * succession (a single sync pass can touch several endpoints), and
 * repeating the same toast for each one would just be noise.
 */
export const maybeWarnAboutExpectedDownloadIssue = (): void => {
  const now = Date.now();
  if (
    now - lastExpectedDownloadIssueWarningAt <
    EXPECTED_DOWNLOAD_ISSUE_WARNING_THROTTLE_MS
  ) {
    return;
  }
  lastExpectedDownloadIssueWarningAt = now;

  createTemporaryNotification({
    caption: i18n.global.t('download-issues-warning'),
    deferWhileDialogOpen: true,
    message: i18n.global.t('download-issues-warning-explain'),
    timeout: 10_000,
    type: 'warning',
  });
};

/**
 * Dismisses all active temporary notifications, and those still waiting to
 * show (unless protected)
 */
export const dismissAllTemporaryNotifications = () => {
  try {
    const unprotected = heldNotifications.filter((held) => !held.props.protect);
    for (const held of unprotected) dropHeldNotification(held);
    // Call all dismiss functions
    while (activeTemporaryNotifications.length > 0) {
      const dismiss = activeTemporaryNotifications.pop();
      dismiss?.();
    }
  } catch (error) {
    errorCatcher(error);
  }
};
