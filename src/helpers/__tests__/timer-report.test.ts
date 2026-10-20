import type { MeetingPartOption } from 'src/types';

import { describe, expect, it, vi } from 'vitest';

import {
  buildTimerReportHtml,
  buildTimerReportRows,
  isRtlLocale,
} from '../timer-report';

vi.mock('boot/i18n', () => ({
  i18n: {
    global: {
      locale: { value: 'en' },
      t: (key: string, named?: Record<string, unknown>) =>
        named && Object.keys(named).length
          ? `${key}:${JSON.stringify(named)}`
          : key,
    },
  },
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

const parts: MeetingPartOption[] = [
  { label: 'Public Talk', value: 'public-talk' },
  { label: 'Watchtower <Study>', value: 'wt' },
  { label: 'Extra', value: 'custom-abc' },
];

const input = {
  date: new Date(2026, 9, 11),
  getDuration: (
    timings:
      null | undefined | { endTime: null | number; startTime: null | number },
    duration?: number,
  ) =>
    timings?.startTime && timings.endTime
      ? `${Math.round((timings.endTime - timings.startTime) / 60000)}:00`
      : duration
        ? `${duration}:00`
        : '',
  getTimeString: (timestamp: null | number) =>
    timestamp ? new Date(timestamp).toISOString() : '',
  partDurations: { 'custom-abc': 0, 'public-talk': 30, wt: 60 },
  parts,
  partTimings: {
    'public-talk': { endTime: 33 * 60_000, startTime: 60_000 },
    wt: { endTime: null, startTime: null },
  },
};

describe('buildTimerReportRows', () => {
  it('reports each part with its planned length and timing status', () => {
    const rows = buildTimerReportRows(input);
    expect(rows.map((row) => row.status.kind)).toEqual([
      'overtime',
      'missing',
      'missing',
    ]);
    expect(rows[0]).toMatchObject({
      actualDuration: '32:00',
      label: 'Public Talk',
      plannedMinutes: 30,
      statusText: 'overtime 2 min.',
    });
    expect(rows[1]).toMatchObject({ actualDuration: '60:00', startTime: '' });
    expect(rows[2]).toMatchObject({ actualDuration: '', plannedMinutes: 0 });
  });
});

describe('buildTimerReportHtml', () => {
  it('escapes part names and marks skipped parts', () => {
    const html = buildTimerReportHtml(
      buildTimerReportRows(input),
      input.date,
      'Congregation & Co',
    );
    expect(html).toContain('Watchtower &lt;Study&gt;');
    expect(html).toContain('Congregation &amp; Co');
    expect(html).not.toContain('<Study>');
    expect(html).toContain('part-skipped');
    expect(html).toContain('lang="en" dir="ltr"');
    expect(html).toContain('timer-report-title');
  });
});

describe('isRtlLocale', () => {
  it('recognizes right-to-left languages by their language code', () => {
    expect(isRtlLocale('ar')).toBe(true);
    expect(isRtlLocale('fa-IR')).toBe(true);
    expect(isRtlLocale('he')).toBe(true);
    expect(isRtlLocale('en')).toBe(false);
    expect(isRtlLocale('pt-br')).toBe(false);
    expect(isRtlLocale('')).toBe(false);
  });
});
