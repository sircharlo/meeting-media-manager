import { describe, expect, it } from 'vitest';

import { getTimerReportStatus } from '../timer-report';

describe('getTimerReportStatus', () => {
  it('reports missing status when timings are incomplete', () => {
    expect(getTimerReportStatus({ endTime: null, startTime: 0 }, 10)).toEqual({
      amountMinutes: 0,
      kind: 'missing',
    });
  });

  it('reports on-time status at minute precision', () => {
    expect(
      getTimerReportStatus({ endTime: 10 * 60 * 1000, startTime: 0 }, 10),
    ).toEqual({
      amountMinutes: 0,
      kind: 'on-time',
    });
  });

  it('reports overtime amount in minutes', () => {
    expect(
      getTimerReportStatus({ endTime: 12 * 60 * 1000, startTime: 0 }, 10),
    ).toEqual({
      amountMinutes: 2,
      kind: 'overtime',
    });
  });

  it('reports undertime amount in minutes', () => {
    expect(
      getTimerReportStatus({ endTime: 9 * 60 * 1000, startTime: 0 }, 10),
    ).toEqual({
      amountMinutes: 1,
      kind: 'undertime',
    });
  });
});
