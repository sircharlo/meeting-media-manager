import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  errorCatcher: vi.fn(),
  getLowDiskSpaceStatus: vi.fn(async () => false),
  notifyCreate: vi.fn(() => vi.fn()),
  tMock: vi.fn((key: string) => key),
}));

vi.mock('boot/i18n', () => ({
  i18n: { global: { t: mocks.tMock } },
}));

vi.mock('quasar', () => ({
  Notify: { create: mocks.notifyCreate },
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: mocks.errorCatcher,
}));

vi.mock('stores/dialog-state', () => ({
  useDialogStateStore: () => ({ isAnyDialogOpen: false }),
}));

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
