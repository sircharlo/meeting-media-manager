import { beforeEach, describe, expect, it, vi } from 'vitest';

// BE-7 (full-audit-2026-09-04.md): globalShortcut.register() returns false
// (doesn't throw) when the accelerator is already claimed by the OS or
// another app - a fairly common real-world conflict that previously left
// zero trace in logs/Sentry.
const mocks = vi.hoisted(() => ({
  captureElectronError: vi.fn(),
  isRegistered: vi.fn(),
  log: vi.fn(),
  register: vi.fn(),
  sendToWindow: vi.fn(),
  unregister: vi.fn(),
  unregisterAll: vi.fn(),
}));

vi.mock('electron', () => ({
  globalShortcut: {
    isRegistered: mocks.isRegistered,
    register: mocks.register,
    unregister: mocks.unregister,
    unregisterAll: mocks.unregisterAll,
  },
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: mocks.captureElectronError,
}));

vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: mocks.sendToWindow,
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: { mainWindow: null },
}));

vi.mock('src/shared/vanilla', () => ({
  log: mocks.log,
}));

describe('registerShortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isRegistered.mockReturnValue(false);
  });

  it('does nothing for an empty key sequence', async () => {
    const { registerShortcut } = await import('../shortcuts');

    expect(registerShortcut('obsPort', '')).toBeUndefined();
    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.log).not.toHaveBeenCalled();
  });

  it('registers successfully and logs nothing when there is no conflict', async () => {
    mocks.register.mockReturnValue(true);
    const { registerShortcut } = await import('../shortcuts');

    expect(registerShortcut('obsPort', 'CommandOrControl+Shift+K')).toBe(true);
    expect(mocks.log).not.toHaveBeenCalled();
  });

  it('logs a warning when the accelerator is already claimed (register returns false)', async () => {
    mocks.register.mockReturnValue(false);
    const { registerShortcut } = await import('../shortcuts');

    expect(registerShortcut('obsPort', 'CommandOrControl+Shift+K')).toBe(false);
    expect(mocks.log).toHaveBeenCalledWith(
      expect.any(String),
      'electronShortcuts',
      'warn',
      { keySequence: 'CommandOrControl+Shift+K', shortcut: 'obsPort' },
    );
    expect(mocks.captureElectronError).not.toHaveBeenCalled();
  });

  it('reports via captureElectronError when register throws, without also logging the false-return warning', async () => {
    mocks.register.mockImplementation(() => {
      throw new Error('platform API failure');
    });
    const { registerShortcut } = await import('../shortcuts');

    registerShortcut('obsPort', 'CommandOrControl+Shift+K');

    expect(mocks.captureElectronError).toHaveBeenCalled();
    expect(mocks.log).not.toHaveBeenCalled();
  });
});

describe('unregisterShortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('only calls unregister when the shortcut is actually registered', async () => {
    mocks.isRegistered.mockReturnValue(false);
    const { unregisterShortcut } = await import('../shortcuts');

    unregisterShortcut('CommandOrControl+Shift+K');

    expect(mocks.unregister).not.toHaveBeenCalled();
  });

  it('unregisters when the shortcut is registered', async () => {
    mocks.isRegistered.mockReturnValue(true);
    const { unregisterShortcut } = await import('../shortcuts');

    unregisterShortcut('CommandOrControl+Shift+K');

    expect(mocks.unregister).toHaveBeenCalledWith('CommandOrControl+Shift+K');
  });
});
