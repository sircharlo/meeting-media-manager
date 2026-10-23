import { ipcRenderer } from 'electron/renderer';
import { describe, expect, it, vi } from 'vitest';

import { removeAllIpcListeners } from '../ipc';

// A real EventEmitter, like Electron's ipcRenderer: its methods rely on
// `this`, which is what MMM-V2-3MP was about.
vi.mock('electron/renderer', async () => {
  const { EventEmitter } = await import('node:events');
  return { ipcRenderer: new EventEmitter() };
});

describe('removeAllIpcListeners', () => {
  it("removes a channel's listeners without throwing", () => {
    ipcRenderer.on('log', vi.fn());
    ipcRenderer.on('log', vi.fn());
    ipcRenderer.on('shortcut', vi.fn());

    expect(() => removeAllIpcListeners('log')).not.toThrow();

    expect(ipcRenderer.listenerCount('log')).toBe(0);
    expect(ipcRenderer.listenerCount('shortcut')).toBe(1);
  });
});
