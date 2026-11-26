import { beforeEach, describe, expect, it, vi } from 'vitest';

const constants = vi.hoisted(() => ({ IS_DEV: true }));

vi.mock('src-electron/constants', () => constants);

const loadDevFaults = async () => {
  vi.resetModules();
  return import('../dev-faults');
};

describe('dev faults', () => {
  beforeEach(() => {
    constants.IS_DEV = true;
  });

  it('fakes a failure only while it is on', async () => {
    const { isDevFaultOn, setDevFault } = await loadDevFaults();
    expect(isDevFaultOn('failDownloads')).toBe(false);

    setDevFault('failDownloads', true);
    expect(isDevFaultOn('failDownloads')).toBe(true);
    expect(isDevFaultOn('lowDiskSpace')).toBe(false);

    setDevFault('failDownloads', false);
    expect(isDevFaultOn('failDownloads')).toBe(false);
  });

  it('ignores an unknown fault, and anything but true for on', async () => {
    const { isDevFaultOn, setDevFault } = await loadDevFaults();

    setDevFault('quitApp', true);
    setDevFault('lowDiskSpace', 'yes');

    expect(isDevFaultOn('lowDiskSpace')).toBe(false);
  });

  it('never fakes anything in production', async () => {
    constants.IS_DEV = false;
    const { isDevFaultOn, setDevFault } = await loadDevFaults();

    setDevFault('failDownloads', true);

    expect(isDevFaultOn('failDownloads')).toBe(false);
  });
});
