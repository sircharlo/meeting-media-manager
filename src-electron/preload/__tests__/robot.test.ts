import { beforeEach, describe, expect, it, vi } from 'vitest';

const keyTapMock = vi.fn();

vi.mock('@jitsi/robotjs', () => ({
  default: {
    keyTap: (...args: unknown[]) => keyTapMock(...args),
  },
}));

const { sendKeyTap } = await import('../robot');

// SEC-12 (full-audit-2026-09-05.md): sendKeyTap is a direct preload->native
// call, reachable from a compromised app-bundle renderer with no ipcMain
// validation in between - previously any string was passed straight to
// robot.keyTap() unvalidated.
describe('sendKeyTap', () => {
  beforeEach(() => {
    keyTapMock.mockClear();
  });

  it('taps an allowed single key with no modifiers', () => {
    sendKeyTap('a');

    expect(keyTapMock).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('taps an allowed key with allowed modifiers', () => {
    sendKeyTap('f', ['control', 'shift']);

    expect(keyTapMock).toHaveBeenCalledExactlyOnceWith('f', [
      'control',
      'shift',
    ]);
  });

  it('allows named keys and function keys used by real shortcuts', () => {
    sendKeyTap('enter');
    sendKeyTap('f12');

    expect(keyTapMock).toHaveBeenNthCalledWith(1, 'enter');
    expect(keyTapMock).toHaveBeenNthCalledWith(2, 'f12');
  });

  it('silently drops a call for a key outside the allowlist', () => {
    sendKeyTap('rm -rf /');

    expect(keyTapMock).not.toHaveBeenCalled();
  });

  it('filters out a modifier outside the allowlist instead of passing it through', () => {
    sendKeyTap('a', ['control', 'not-a-real-modifier']);

    expect(keyTapMock).toHaveBeenCalledExactlyOnceWith('a', ['control']);
  });

  it('falls back to the no-modifiers call when every modifier gets filtered out', () => {
    sendKeyTap('a', ['not-a-real-modifier']);

    expect(keyTapMock).toHaveBeenCalledExactlyOnceWith('a');
  });
});
