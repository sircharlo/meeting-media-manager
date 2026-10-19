import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

const mocks = vi.hoisted(() => ({
  dialogState: { isAnyDialogOpen: false },
  errorCatcher: vi.fn(),
  getLowDiskSpaceStatus: vi.fn(async () => false),
  markUserWarnedAboutDiskSpace: vi.fn(),
  markUserWarnedAboutDiskSpaceInMain: vi.fn(),
  notifyCreate: vi.fn<(options: unknown) => (() => void) | undefined>(() =>
    vi.fn(),
  ),
  tMock: vi.fn((key: string) => key),
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

beforeEach(() => {
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
});

describe('createTemporaryNotification', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
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

  it("passes the optional fields through and uses the type's icon", async () => {
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
      actions: [{ color: 'dark', icon: 'close', round: true }],
      caption: 'Caption',
      classes: 'extra',
      group: 'my-group',
      icon: 'mmm-warning',
      message: 'Careful',
      position: 'bottom',
      timeout: 0,
      type: 'warning',
    });
  });

  it.each([
    ['info', 'mmm-info'],
    ['negative', 'mmm-error'],
    ['ongoing', 'mmm-loading'],
    ['positive', 'mmm-check'],
    ['primary', 'mmm-info'],
  ] as const)('gives a %s notification the %s icon', async (type, icon) => {
    const { createTemporaryNotification } = await import('../notifications');

    createTemporaryNotification({ message: 'x', type });

    expect(lastNotifyOptions()).toMatchObject({ icon, type });
  });

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

  it('reports an unknown type instead of showing anything', async () => {
    const { createTemporaryNotification } = await import('../notifications');

    const dismiss = createTemporaryNotification({
      message: 'x',
      type: 'bogus' as 'info',
    });

    expect(dismiss).toBeUndefined();
    expect(mocks.notifyCreate).not.toHaveBeenCalled();
    expect(mocks.errorCatcher).toHaveBeenCalledWith(
      new Error('Unknown notify type: "bogus"'),
    );
  });

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

    expect(dismiss).toBeUndefined();
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
});
