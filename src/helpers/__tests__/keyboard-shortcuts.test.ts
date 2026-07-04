import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

import { errorCatcher } from 'src/helpers/error-catcher';
import { sendKeyboardShortcut } from 'src/helpers/keyboard-shortcuts';

describe('sendKeyboardShortcut', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing when no shortcut is provided', () => {
    const sendKeyTap = vi.spyOn(globalThis.electronApi, 'sendKeyTap');

    sendKeyboardShortcut(undefined);
    sendKeyboardShortcut(null);
    sendKeyboardShortcut('');

    expect(sendKeyTap).not.toHaveBeenCalled();
  });

  it('taps a single key without modifiers', () => {
    const sendKeyTap = vi.spyOn(globalThis.electronApi, 'sendKeyTap');

    sendKeyboardShortcut('f4');

    expect(sendKeyTap).toHaveBeenCalledWith('f4');
  });

  it('taps a two-key combination with the modifier translated', () => {
    const sendKeyTap = vi.spyOn(globalThis.electronApi, 'sendKeyTap');

    sendKeyboardShortcut('ctrl+s');

    expect(sendKeyTap).toHaveBeenCalledWith('s', ['control']);
  });

  it('taps a three-key combination, mapping cmd and meta to command', () => {
    const sendKeyTap = vi.spyOn(globalThis.electronApi, 'sendKeyTap');

    sendKeyboardShortcut('cmd+shift+s');

    expect(sendKeyTap).toHaveBeenCalledWith('s', ['command', 'shift']);
  });

  it('taps a four-key combination', () => {
    const sendKeyTap = vi.spyOn(globalThis.electronApi, 'sendKeyTap');

    sendKeyboardShortcut('ctrl+alt+shift+s');

    expect(sendKeyTap).toHaveBeenCalledWith('s', ['control', 'alt', 'shift']);
  });

  it('reports an error for an unsupported shortcut format', () => {
    const sendKeyTap = vi.spyOn(globalThis.electronApi, 'sendKeyTap');

    sendKeyboardShortcut('ctrl+alt+shift+meta+s', 'testContext');

    expect(sendKeyTap).not.toHaveBeenCalled();
    expect(errorCatcher).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: {
          fn: expect.objectContaining({
            context: 'testContext',
            name: 'sendKeyboardShortcut',
          }),
        },
      }),
    );
  });

  it('reports an error if sendKeyTap throws', () => {
    vi.spyOn(globalThis.electronApi, 'sendKeyTap').mockImplementation(() => {
      throw new Error('robotjs failure');
    });

    sendKeyboardShortcut('ctrl+s');

    expect(errorCatcher).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: {
          fn: expect.objectContaining({ name: 'sendKeyboardShortcut' }),
        },
      }),
    );
  });
});
