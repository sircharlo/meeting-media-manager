import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

const mocks = vi.hoisted(() => ({
  attention: { holdsNotifications: false },
  dialogState: { isAnyDialogOpen: false },
  errorCatcher: vi.fn(),
  getLowDiskSpaceStatus: vi.fn(async () => false),
  markUserWarnedAboutDiskSpace: vi.fn(),
  markUserWarnedAboutDiskSpaceInMain: vi.fn(),
  notifyCreate: vi.fn<(options: unknown) => (() => void) | undefined>(() =>
    vi.fn(),
  ),
  tMock: vi.fn((key: string) => key),
  useAttentionStore: vi.fn(),
  useDialogStateStore: vi.fn(),
}));

vi.mock('boot/i18n', () => ({
  i18n: { global: { t: mocks.tMock } },
}));

vi.mock('quasar', () => ({
  Notify: { create: mocks.notifyCreate },
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: mocks.errorCatcher,
  markUserWarnedAboutDiskSpace: mocks.markUserWarnedAboutDiskSpace,
}));

vi.mock('stores/dialog-state', () => ({
  useDialogStateStore: mocks.useDialogStateStore,
}));

vi.mock('stores/attention', () => ({
  useAttentionStore: mocks.useAttentionStore,
}));

// Pinia is up, as in the app: the stores above stand in for it.
vi.mock('pinia', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getActivePinia: () => ({}),
}));

beforeEach(() => {
  mocks.useAttentionStore.mockImplementation(() => mocks.attention);
  mocks.useDialogStateStore.mockImplementation(() => mocks.dialogState);
});

// BE-8 (full-audit-2026-09-04.md): shared by the one-time congregation-switch
// check (DialogCongregationSwitcher.vue) and the periodic during-downloads
// check (MainLayout.vue) so both show the exact same warning.
describe('checkLowDiskSpaceAndNotify', () => {
  const originalElectronApi = globalThis.electronApi;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLowDiskSpaceStatus.mockResolvedValue(false);
    globalThis.electronApi = {
      getLowDiskSpaceStatus: mocks.getLowDiskSpaceStatus,
      markUserWarnedAboutDiskSpace: mocks.markUserWarnedAboutDiskSpaceInMain,
    } as unknown as typeof globalThis.electronApi;
  });

  afterEach(() => {
    globalThis.electronApi = originalElectronApi;
  });

  it('does nothing when electronApi is unavailable', async () => {
    globalThis.electronApi =
      undefined as unknown as typeof globalThis.electronApi;

    const { checkLowDiskSpaceAndNotify } = await import('../notifications');
    await checkLowDiskSpaceAndNotify();

    expect(mocks.getLowDiskSpaceStatus).not.toHaveBeenCalled();
    expect(mocks.notifyCreate).not.toHaveBeenCalled();
  });

  it('does not notify when disk space is fine', async () => {
    mocks.getLowDiskSpaceStatus.mockResolvedValue(false);

    const { checkLowDiskSpaceAndNotify } = await import('../notifications');
    await checkLowDiskSpaceAndNotify();

    expect(mocks.getLowDiskSpaceStatus).toHaveBeenCalled();
    expect(mocks.notifyCreate).not.toHaveBeenCalled();
    expect(mocks.markUserWarnedAboutDiskSpace).not.toHaveBeenCalled();
  });

  it('shows a warning notification when disk space is critically low', async () => {
    mocks.getLowDiskSpaceStatus.mockResolvedValue(true);

    const { checkLowDiskSpaceAndNotify } = await import('../notifications');
    await checkLowDiskSpaceAndNotify();

    expect(mocks.notifyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'disk-space-is-running-low',
        type: 'warning',
      }),
    );
  });

  // MMM-V2-3M6..3M9: once warned, a full disk is no longer reported.
  it('records the warning in both processes', async () => {
    mocks.getLowDiskSpaceStatus.mockResolvedValue(true);

    const { checkLowDiskSpaceAndNotify } = await import('../notifications');
    await checkLowDiskSpaceAndNotify();

    expect(mocks.markUserWarnedAboutDiskSpace).toHaveBeenCalled();
    expect(mocks.markUserWarnedAboutDiskSpaceInMain).toHaveBeenCalled();
  });

  // The check repeats every 2 minutes while downloads run: it shouldn't
  // warn each time.
  it('reminds at most every half hour, and always warns when asked', async () => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-26T10:00:00'));
    mocks.getLowDiskSpaceStatus.mockResolvedValue(true);
    const { checkLowDiskSpaceAndNotify } = await import('../notifications');

    await checkLowDiskSpaceAndNotify({ reminder: true });
    expect(mocks.notifyCreate).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-11-26T10:20:00'));
    await checkLowDiskSpaceAndNotify({ reminder: true });
    expect(mocks.notifyCreate).toHaveBeenCalledTimes(1);

    // A profile switch checks again on its own.
    await checkLowDiskSpaceAndNotify();
    expect(mocks.notifyCreate).toHaveBeenCalledTimes(2);

    vi.setSystemTime(new Date('2026-11-26T10:51:00'));
    await checkLowDiskSpaceAndNotify({ reminder: true });
    expect(mocks.notifyCreate).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  // Warnings held back while a dialog is open would otherwise stack.
  it('folds repeated warnings into one', async () => {
    mocks.getLowDiskSpaceStatus.mockResolvedValue(true);

    const { checkLowDiskSpaceAndNotify } = await import('../notifications');
    await checkLowDiskSpaceAndNotify();

    expect(mocks.notifyCreate).toHaveBeenCalledWith(
      expect.objectContaining({ group: 'low-disk-space' }),
    );
  });

  it('reports failures via errorCatcher instead of throwing', async () => {
    mocks.getLowDiskSpaceStatus.mockRejectedValue(new Error('statfs failed'));

    const { checkLowDiskSpaceAndNotify } = await import('../notifications');
    await expect(checkLowDiskSpaceAndNotify()).resolves.toBeUndefined();

    expect(mocks.errorCatcher).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: { fn: { name: 'checkLowDiskSpaceAndNotify' } },
      }),
    );
  });
});

describe('notifyDiskFull', () => {
  const originalElectronApi = globalThis.electronApi;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-19T10:00:00Z'));
    globalThis.electronApi = {
      markUserWarnedAboutDiskSpace: mocks.markUserWarnedAboutDiskSpaceInMain,
    } as unknown as typeof globalThis.electronApi;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.electronApi = originalElectronApi;
  });

  it('tells the user the disk is full, and records the warning in both processes', async () => {
    const { notifyDiskFull } = await import('../notifications');

    notifyDiskFull();

    expect(mocks.notifyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: 'disk-full',
        message: 'disk-full-explain',
        type: 'negative',
      }),
    );
    expect(mocks.markUserWarnedAboutDiskSpace).toHaveBeenCalled();
    expect(mocks.markUserWarnedAboutDiskSpaceInMain).toHaveBeenCalled();
  });

  it('shows one warning for a burst of failures, and another after a few minutes', async () => {
    const { notifyDiskFull } = await import('../notifications');

    notifyDiskFull();
    notifyDiskFull();
    expect(mocks.notifyCreate).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-10-19T10:05:00Z'));
    notifyDiskFull();
    expect(mocks.notifyCreate).toHaveBeenCalledTimes(2);
  });

  // MMM-V2-3P8: the update couldn't be unpacked on a full disk.
  it("tells the user the update couldn't be installed for want of space, and records the warning", async () => {
    const { notifyUpdateDiskFull } = await import('../notifications');

    notifyUpdateDiskFull();

    expect(mocks.notifyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: 'update-failed',
        message: 'update-error-disk-full',
        type: 'negative',
      }),
    );
    expect(mocks.markUserWarnedAboutDiskSpace).toHaveBeenCalled();
    expect(mocks.markUserWarnedAboutDiskSpaceInMain).toHaveBeenCalled();
  });
});

describe('notifyYeartextPreviewFailed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  // Its message used to show "{year}" as is: t() got no year to put in it.
  it('names the year whose yeartext could not be fetched', async () => {
    const { notifyYeartextPreviewFailed } = await import('../notifications');

    notifyYeartextPreviewFailed(2027);

    expect(mocks.tMock).toHaveBeenCalledWith('yeartext-preview-failed', {
      year: 2027,
    });
    expect(mocks.notifyCreate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative' }),
    );
  });
});

describe('createTemporaryNotification', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.attention = { holdsNotifications: false };
    mocks.dialogState = { isAnyDialogOpen: false };
    mocks.notifyCreate.mockImplementation(() => vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const lastNotifyOptions = () => mocks.notifyCreate.mock.calls.at(-1)?.[0];

  it('creates a closable top notification with the default timeout', async () => {
    const { createTemporaryNotification } = await import('../notifications');

    const dismiss = createTemporaryNotification({ message: 'Hello' });

    expect(dismiss).toBe(mocks.notifyCreate.mock.results[0]?.value);
    expect(lastNotifyOptions()).toStrictEqual({
      actions: [{ color: 'white', icon: 'close', round: true }],
      group: false,
      message: 'Hello',
      position: 'top',
      timeout: 5000,
    });
    expect(mocks.useDialogStateStore).not.toHaveBeenCalled();
  });

  it('passes the optional fields through', async () => {
    const { createTemporaryNotification } = await import('../notifications');

    createTemporaryNotification({
      caption: 'Caption',
      classes: 'extra',
      group: 'my-group',
      message: 'Careful',
      position: 'bottom',
      timeout: 0,
      type: 'warning',
    });

    expect(lastNotifyOptions()).toStrictEqual({
      actions: [{ color: 'white', icon: 'close', round: true }],
      caption: 'Caption',
      classes: 'extra',
      group: 'my-group',
      message: 'Careful',
      position: 'bottom',
      timeout: 0,
      type: 'warning',
    });
  });

  it('tells its caller when it closes, however that happens', async () => {
    const onDismiss = vi.fn();
    const { createTemporaryNotification } = await import('../notifications');

    createTemporaryNotification({ message: 'x', onDismiss });
    createTemporaryNotification({ message: 'y' });

    expect(mocks.notifyCreate.mock.calls[0]?.[0]).toMatchObject({ onDismiss });
    expect(mocks.notifyCreate.mock.calls[1]?.[0]).not.toHaveProperty(
      'onDismiss',
    );
  });

  // Every type's text is white (see boot/notify-types.ts), warning too: its
  // close button used to be dark, for Quasar's own dark-on-orange warning.
  it.each(['info', 'negative', 'ongoing', 'positive', 'warning'] as const)(
    'gives a %s notification a white close button, and leaves its icon to its type',
    async (type) => {
      const { createTemporaryNotification } = await import('../notifications');

      createTemporaryNotification({ message: 'x', type });

      expect(lastNotifyOptions()).toMatchObject({
        actions: [{ color: 'white', icon: 'close', round: true }],
        type,
      });
      // An icon given as undefined would replace the type's own.
      expect(lastNotifyOptions()).not.toHaveProperty('icon');
    },
  );

  it('prefers an explicit icon and explicit actions', async () => {
    const actions = [{ label: 'Undo' }];
    const { createTemporaryNotification } = await import('../notifications');

    createTemporaryNotification({
      actions,
      icon: 'mmm-music-note',
      message: 'x',
      type: 'positive',
    });

    expect(lastNotifyOptions()).toMatchObject({
      actions,
      icon: 'mmm-music-note',
    });
  });

  it('leaves out the close button when noClose is set, even with actions', async () => {
    const { createTemporaryNotification } = await import('../notifications');

    createTemporaryNotification({
      actions: [{ label: 'Undo' }],
      message: 'x',
      noClose: true,
    });

    expect(lastNotifyOptions()).not.toHaveProperty('actions');
  });

  // 'primary' was a type of its own, until its one toast became a warning.
  it.each(['bogus', 'primary'])(
    'reports an unknown type (%s) instead of showing anything',
    async (type) => {
      const { createTemporaryNotification } = await import('../notifications');

      const dismiss = createTemporaryNotification({
        message: 'x',
        type: type as 'info',
      });

      expect(dismiss).toBeUndefined();
      expect(mocks.notifyCreate).not.toHaveBeenCalled();
      expect(mocks.errorCatcher).toHaveBeenCalledWith(
        new Error(`Unknown notify type: "${type}"`),
      );
    },
  );

  it('reports a failure to create the notification', async () => {
    const error = new Error('Notify failed');
    mocks.notifyCreate.mockImplementation(() => {
      throw error;
    });
    const { createTemporaryNotification } = await import('../notifications');

    expect(createTemporaryNotification({ message: 'x' })).toBeUndefined();
    expect(mocks.errorCatcher).toHaveBeenCalledWith(error);
  });

  it('lets dismissAllTemporaryNotifications dismiss it until its timeout passes', async () => {
    const first = vi.fn();
    const second = vi.fn();
    mocks.notifyCreate
      .mockImplementationOnce(() => first)
      .mockImplementationOnce(() => second);
    const { createTemporaryNotification, dismissAllTemporaryNotifications } =
      await import('../notifications');

    createTemporaryNotification({ message: 'short', timeout: 1000 });
    createTemporaryNotification({ message: 'long', timeout: 5000 });
    vi.advanceTimersByTime(1000);
    dismissAllTemporaryNotifications();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('keeps tracking a notification without a timeout', async () => {
    const dismiss = vi.fn();
    mocks.notifyCreate.mockImplementationOnce(() => dismiss);
    const { createTemporaryNotification, dismissAllTemporaryNotifications } =
      await import('../notifications');

    createTemporaryNotification({ message: 'sticky', timeout: 0 });
    vi.advanceTimersByTime(60 * 60 * 1000);
    dismissAllTemporaryNotifications();

    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('never lets dismissAllTemporaryNotifications dismiss a protected one', async () => {
    const dismiss = vi.fn();
    mocks.notifyCreate.mockImplementationOnce(() => dismiss);
    const { createTemporaryNotification, dismissAllTemporaryNotifications } =
      await import('../notifications');

    createTemporaryNotification({ message: 'updater', protect: true });
    dismissAllTemporaryNotifications();

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('does not track a notification Quasar gave no dismiss function for', async () => {
    mocks.notifyCreate.mockImplementationOnce(() => undefined);
    const { createTemporaryNotification, dismissAllTemporaryNotifications } =
      await import('../notifications');

    expect(createTemporaryNotification({ message: 'x' })).toBeUndefined();
    expect(() => dismissAllTemporaryNotifications()).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shows a deferred notification right away when no dialog is open', async () => {
    const { createTemporaryNotification } = await import('../notifications');

    const dismiss = createTemporaryNotification({
      deferWhileDialogOpen: true,
      message: 'x',
    });

    expect(dismiss).toBe(mocks.notifyCreate.mock.results[0]?.value);
    expect(mocks.useDialogStateStore).toHaveBeenCalledOnce();
  });

  it('holds a deferred notification until every dialog has closed', async () => {
    const dialogState = reactive({ isAnyDialogOpen: true });
    mocks.dialogState = dialogState;
    const { createTemporaryNotification } = await import('../notifications');

    const dismiss = createTemporaryNotification({
      deferWhileDialogOpen: true,
      message: 'later',
    });

    expect(dismiss).toBeTypeOf('function');
    expect(mocks.notifyCreate).not.toHaveBeenCalled();

    dialogState.isAnyDialogOpen = false;
    await nextTick();

    expect(mocks.notifyCreate).toHaveBeenCalledOnce();
    expect(lastNotifyOptions()).toMatchObject({ message: 'later' });

    // Shown once only: the wait stops after the dialogs close.
    dialogState.isAnyDialogOpen = true;
    await nextTick();
    dialogState.isAnyDialogOpen = false;
    await nextTick();

    expect(mocks.notifyCreate).toHaveBeenCalledOnce();
  });

  it('ignores open dialogs for a notification that does not ask to wait', async () => {
    mocks.dialogState = reactive({ isAnyDialogOpen: true });
    const { createTemporaryNotification } = await import('../notifications');

    createTemporaryNotification({ message: 'now' });

    expect(mocks.notifyCreate).toHaveBeenCalledOnce();
  });

  describe('while a screen covers the window', () => {
    // Today's song check, the Zoom screens, a tour (see the attention store).
    const coverWindow = () => {
      const attention = reactive({ holdsNotifications: true });
      mocks.attention = attention;
      return async () => {
        attention.holdsNotifications = false;
        await nextTick();
      };
    };

    it('holds a notification until that screen closes', async () => {
      const uncover = coverWindow();
      const { createTemporaryNotification } = await import('../notifications');

      const handle = createTemporaryNotification({ message: 'muted' });

      expect(handle).toBeTypeOf('function');
      expect(mocks.notifyCreate).not.toHaveBeenCalled();

      await uncover();

      expect(mocks.notifyCreate).toHaveBeenCalledOnce();
      expect(lastNotifyOptions()).toMatchObject({ message: 'muted' });
    });

    it('shows them in the order they came', async () => {
      const uncover = coverWindow();
      const { createTemporaryNotification } = await import('../notifications');

      createTemporaryNotification({ message: 'first', type: 'warning' });
      createTemporaryNotification({ message: 'second', type: 'negative' });
      await uncover();

      expect(
        mocks.notifyCreate.mock.calls.map(
          ([options]) => (options as { message: string }).message,
        ),
      ).toEqual(['first', 'second']);
    });

    it('still waits for dialogs when the notification asks to', async () => {
      const uncover = coverWindow();
      const dialogState = reactive({ isAnyDialogOpen: true });
      mocks.dialogState = dialogState;
      const { createTemporaryNotification } = await import('../notifications');

      createTemporaryNotification({ deferWhileDialogOpen: true, message: 'x' });
      await uncover();
      expect(mocks.notifyCreate).not.toHaveBeenCalled();

      dialogState.isAnyDialogOpen = false;
      await nextTick();
      expect(mocks.notifyCreate).toHaveBeenCalledOnce();
    });

    it('shows an urgent one at once, marked to stay on top', async () => {
      coverWindow();
      const { createTemporaryNotification } = await import('../notifications');

      const handle = createTemporaryNotification({
        classes: 'extra',
        message: 'A hand is raised',
        urgent: true,
      });

      expect(handle).toBe(mocks.notifyCreate.mock.results[0]?.value);
      expect(lastNotifyOptions()).toMatchObject({
        classes: 'extra notify-urgent',
      });
    });

    it.each(['info', 'positive'] as const)(
      'drops a %s message that waited more than a minute, out of date by then',
      async (type) => {
        const uncover = coverWindow();
        const onDismiss = vi.fn();
        const { createTemporaryNotification } =
          await import('../notifications');

        createTemporaryNotification({ message: 'muted', onDismiss, type });
        vi.advanceTimersByTime(61_000);
        await uncover();

        expect(mocks.notifyCreate).not.toHaveBeenCalled();
        expect(onDismiss).toHaveBeenCalledOnce();
      },
    );

    it.each([
      { message: 'a warning', type: 'warning' },
      { message: 'an error', type: 'negative' },
      { message: 'stays until closed', timeout: 0, type: 'info' },
      { deferWhileDialogOpen: true, message: 'asked to wait', type: 'info' },
    ] as const)('shows $message however long it waited', async (props) => {
      const uncover = coverWindow();
      const { createTemporaryNotification } = await import('../notifications');

      createTemporaryNotification(props);
      vi.advanceTimersByTime(10 * 60_000);
      await uncover();

      expect(mocks.notifyCreate).toHaveBeenCalledOnce();
    });

    it('never shows one closed while it waited', async () => {
      const uncover = coverWindow();
      const onDismiss = vi.fn();
      const { createTemporaryNotification } = await import('../notifications');

      const handle = createTemporaryNotification({ message: 'x', onDismiss });
      handle?.();
      await uncover();

      expect(mocks.notifyCreate).not.toHaveBeenCalled();
      expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('shows one updated while it waited as updated, and its handle then works on it', async () => {
      const uncover = coverWindow();
      const shown = vi.fn();
      mocks.notifyCreate.mockImplementationOnce(() => shown);
      const { createTemporaryNotification } = await import('../notifications');

      const handle = createTemporaryNotification({
        message: '1 file',
        timeout: 0,
        type: 'warning',
      });
      handle?.({ message: '2 files' });
      await uncover();

      expect(lastNotifyOptions()).toMatchObject({ message: '2 files' });

      handle?.();
      expect(shown).toHaveBeenCalledWith(undefined);
    });

    it('lets dismissAllTemporaryNotifications drop the waiting ones, except protected ones', async () => {
      const uncover = coverWindow();
      const { createTemporaryNotification, dismissAllTemporaryNotifications } =
        await import('../notifications');

      createTemporaryNotification({ message: 'old profile' });
      createTemporaryNotification({ message: 'updater', protect: true });
      dismissAllTemporaryNotifications();
      await uncover();

      expect(mocks.notifyCreate).toHaveBeenCalledOnce();
      expect(lastNotifyOptions()).toMatchObject({ message: 'updater' });
    });
  });
});
