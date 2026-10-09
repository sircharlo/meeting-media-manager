import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  Menu: {
    getApplicationMenu: vi.fn(),
  },
}));

vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: {
    mainWindow: {},
  },
}));

interface FakeMenuItem {
  checked?: boolean;
  enabled?: boolean;
  label: string;
  submenu?: { items: FakeMenuItem[] };
}

const createMenuItem = (
  label: string,
  overrides: Partial<FakeMenuItem> = {},
): FakeMenuItem => ({
  checked: false,
  enabled: true,
  label,
  ...overrides,
});

const createMenuTree = (): { items: FakeMenuItem[] } => ({
  items: [
    createMenuItem('Demo', {
      submenu: {
        items: [
          createMenuItem('Demo Mode'),
          createMenuItem('Reseed Demo Congregation'),
          createMenuItem('Meeting Stage', {
            submenu: {
              items: [
                createMenuItem('Jump to Pre-Meeting', { enabled: false }),
                createMenuItem('Jump to Last Song', { enabled: false }),
                createMenuItem('Finish Last Song', { enabled: false }),
              ],
            },
          }),
          createMenuItem('Quick Actions', {
            submenu: {
              items: [
                createMenuItem('Re-show Panels'),
                createMenuItem('Dismiss Before Panel'),
                createMenuItem('Dismiss After Panel'),
              ],
            },
          }),
          createMenuItem('Network', {
            submenu: {
              items: [createMenuItem('Simulate Offline')],
            },
          }),
        ],
      },
    }),
  ],
});

const findItem = (
  tree: { items: FakeMenuItem[] },
  label: string,
): FakeMenuItem | undefined =>
  tree.items
    .flatMap((item) => [
      item,
      ...(item.submenu?.items ?? []),
      ...(item.submenu?.items ?? []).flatMap((sub) => sub.submenu?.items ?? []),
    ])
    .find((item) => item.label === label);

describe('dev menu state sync', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('reflects the renderer state onto the Demo menu items', async () => {
    const { Menu } = await import('electron');
    const { createDevMenu, updateDevMenuState } = await import('../dev-menu');
    createDevMenu();

    const tree = createMenuTree();
    vi.mocked(Menu.getApplicationMenu).mockReturnValue(
      tree as unknown as Electron.Menu,
    );

    updateDevMenuState({ demoEnabled: true, offline: true });

    expect(findItem(tree, 'Demo Mode')?.checked).toBe(true);
    expect(findItem(tree, 'Simulate Offline')?.checked).toBe(true);
    expect(findItem(tree, 'Jump to Pre-Meeting')?.enabled).toBe(true);
    expect(findItem(tree, 'Jump to Last Song')?.enabled).toBe(true);
    expect(findItem(tree, 'Finish Last Song')?.enabled).toBe(true);
    // Items outside the meeting-stage submenu are left alone.
    expect(findItem(tree, 'Re-show Panels')?.enabled).toBe(true);

    updateDevMenuState({ demoEnabled: false, offline: false });

    expect(findItem(tree, 'Demo Mode')?.checked).toBe(false);
    expect(findItem(tree, 'Simulate Offline')?.checked).toBe(false);
    expect(findItem(tree, 'Jump to Pre-Meeting')?.enabled).toBe(false);
  });

  it('no-ops when the application menu has no Demo menu', async () => {
    const { Menu } = await import('electron');
    const { createDevMenu, updateDevMenuState } = await import('../dev-menu');
    createDevMenu();

    vi.mocked(Menu.getApplicationMenu).mockReturnValue({
      items: [],
    } as unknown as Electron.Menu);

    expect(() =>
      updateDevMenuState({ demoEnabled: true, offline: false }),
    ).not.toThrow();
  });

  it('no-ops when the menu was never created (production)', async () => {
    const { Menu } = await import('electron');
    const { updateDevMenuState } = await import('../dev-menu');

    vi.mocked(Menu.getApplicationMenu).mockReturnValue(null);

    expect(() =>
      updateDevMenuState({ demoEnabled: true, offline: false }),
    ).not.toThrow();
  });
});
