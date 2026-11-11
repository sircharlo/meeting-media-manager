import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'upath';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ userData: '' }));

vi.mock('electron', () => ({
  app: { getPath: () => mocks.userData },
}));

const {
  clearPendingUpdate,
  countPendingUpdateInstallAttempt,
  readPendingUpdate,
  rememberPendingUpdate,
} = await import('../pending-update');

describe('pending update', () => {
  beforeEach(async () => {
    mocks.userData = await mkdtemp(join(tmpdir(), 'mmm-pending-update-'));
  });

  afterEach(async () => {
    await rm(mocks.userData, { force: true, recursive: true });
  });

  it('has none until an update is remembered', () => {
    expect(readPendingUpdate()).toBeNull();

    rememberPendingUpdate('26.12.0');

    expect(readPendingUpdate()).toEqual({
      installAttempts: 0,
      version: '26.12.0',
    });
  });

  it('counts the install attempts of the same version', () => {
    rememberPendingUpdate('26.12.0');
    countPendingUpdateInstallAttempt('26.12.0');
    countPendingUpdateInstallAttempt('26.12.0');
    // Downloaded again in a later session: the attempts still count.
    rememberPendingUpdate('26.12.0');

    expect(readPendingUpdate()).toEqual({
      installAttempts: 2,
      version: '26.12.0',
    });
  });

  it('starts counting again for another version', () => {
    countPendingUpdateInstallAttempt('26.12.0');
    rememberPendingUpdate('26.12.1');

    expect(readPendingUpdate()).toEqual({
      installAttempts: 0,
      version: '26.12.1',
    });

    countPendingUpdateInstallAttempt('26.12.2');

    expect(readPendingUpdate()).toEqual({
      installAttempts: 1,
      version: '26.12.2',
    });
  });

  it('forgets the update once cleared', () => {
    rememberPendingUpdate('26.12.0');
    clearPendingUpdate();

    expect(readPendingUpdate()).toBeNull();
    expect(() => clearPendingUpdate()).not.toThrow();
  });

  it.each([
    ['not JSON', '{"version":'],
    ['without a version', '{"installAttempts":0}'],
    ['without a count', '{"version":"26.12.0"}'],
    ['with a broken count', '{"installAttempts":"1","version":"26.12.0"}'],
  ])('ignores a file %s', async (_title, content) => {
    await writeFile(join(mocks.userData, 'pending-update.json'), content);

    expect(readPendingUpdate()).toBeNull();
  });
});
