import type {
  MeetingPart,
  MeetingPartOption,
  MeetingPartTimings,
} from 'src/types';

import { i18n } from 'boot/i18n';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { getTimerReportStatus } from 'src/utils/timer-report';

const t = (key: string, named?: Record<string, unknown>) =>
  (i18n.global.t as (key: string, named?: Record<string, unknown>) => string)(
    key,
    named ?? {},
  );

export interface TimerReportInput {
  date: Date | undefined;
  getDuration: (
    timings: MeetingPartTimings | null | undefined,
    duration?: number,
  ) => string;
  getTimeString: (timestamp: null | number, seconds?: boolean) => string;
  partDurations: Partial<Record<MeetingPart, number>>;
  parts: MeetingPartOption[];
  partTimings: Partial<Record<MeetingPart, MeetingPartTimings>>;
}

export interface TimerReportRow {
  actualDuration: string;
  endTime: string;
  label: string;
  plannedMinutes: number;
  startTime: string;
  status: ReturnType<typeof getTimerReportStatus>;
  statusText: string;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const getReportStatusText = (
  status: ReturnType<typeof getTimerReportStatus>,
) => {
  if (status.kind === 'missing') return '';
  if (status.kind === 'on-time') return t('on-time');

  const label = status.kind === 'overtime' ? t('overtime') : t('undertime');
  return `${label} ${status.amountMinutes} min.`;
};

export const buildTimerReportRows = (
  input: TimerReportInput,
): TimerReportRow[] =>
  input.parts.map((part) => {
    const timings = input.partTimings[part.value];
    const plannedMinutes = input.partDurations[part.value] ?? 0;
    const status = getTimerReportStatus(timings, plannedMinutes);
    return {
      actualDuration: input.getDuration(timings, plannedMinutes),
      endTime: input.getTimeString(timings?.endTime ?? null, true),
      label: part.label,
      plannedMinutes,
      startTime: input.getTimeString(timings?.startTime ?? null, true),
      status,
      statusText: getReportStatusText(status),
    };
  });

const formatReportDate = (date: Date | undefined) => {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(i18n.global.locale.value, {
      dateStyle: 'full',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

const formatFileDate = (date: Date | undefined) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Languages M³ offers that are written right to left.
const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur']);

export const isRtlLocale = (locale: string) =>
  RTL_LANGUAGES.has(locale.toLowerCase().split(/[-_]/)[0] ?? '');

const STATUS_COLORS: Record<TimerReportRow['status']['kind'], string> = {
  missing: '#6b7280',
  'on-time': '#1f8f4e',
  overtime: '#c62828',
  undertime: '#1d4ed8',
};

/**
 * The timing report as a self-contained HTML document, rendered to PDF by
 * the main process. Chromium picks fonts for every script, so translated
 * part names and right-to-left languages print as they show on screen.
 */
export const buildTimerReportHtml = (
  rows: TimerReportRow[],
  date: Date | undefined,
  congregationName: string,
) => {
  const dir = isRtlLocale(i18n.global.locale.value) ? 'rtl' : 'ltr';
  const title = escapeHtml(t('timer-report-title'));
  const heading = [congregationName, formatReportDate(date)]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' · ');

  const headerCells = [
    t('meeting-part'),
    t('timer-report-planned-duration'),
    t('start-time'),
    t('timer-report-end-time'),
    t('timer-report-duration'),
    t('status'),
  ]
    .map((cell) => `<th>${escapeHtml(cell)}</th>`)
    .join('');

  const bodyRows = rows
    .map((row) => {
      const color = STATUS_COLORS[row.status.kind];
      const planned = row.plannedMinutes
        ? `${row.plannedMinutes} min.`
        : t('part-skipped');
      const cells = [
        `<td class="label">${escapeHtml(row.label)}</td>`,
        `<td>${escapeHtml(planned)}</td>`,
        `<td class="num">${escapeHtml(row.startTime)}</td>`,
        `<td class="num">${escapeHtml(row.endTime)}</td>`,
        `<td class="num">${escapeHtml(row.actualDuration)}</td>`,
        `<td class="status" style="color:${color}">${escapeHtml(row.statusText)}</td>`,
      ];
      return `<tr>${cells.join('')}</tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="${escapeHtml(i18n.global.locale.value)}" dir="${dir}">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif; color: #111; margin: 0; padding: 0; font-size: 11pt; }
  h1 { font-size: 18pt; margin: 0 0 4pt; }
  .subtitle { color: #555; margin: 0 0 14pt; font-size: 11pt; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #cfd8dc; padding: 6pt 8pt; text-align: start; vertical-align: top; }
  th { background: #e3f2fd; font-weight: 600; }
  tr:nth-child(even) td { background: #fafafa; }
  td.num { font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.status { font-weight: 600; white-space: nowrap; }
  td.label { width: 38%; }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="subtitle">${heading}</p>
<table>
<thead><tr>${headerCells}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
</body>
</html>`;
};

/** Builds the timing report for the selected day and lets the user save it. */
export const exportTimerReport = async (
  input: TimerReportInput,
  congregationName: string,
) => {
  const rows = buildTimerReportRows(input);
  const html = buildTimerReportHtml(rows, input.date, congregationName);
  const fileName = `${t('timer-report-title')} ${formatFileDate(input.date)}.pdf`;

  try {
    const result = await globalThis.electronApi.exportHtmlToPdf(html, fileName);
    if (result.canceled) return result;
    createTemporaryNotification({
      group: 'timer-report',
      icon: result.error ? 'mmm-error' : 'mmm-file',
      message: t(
        result.error ? 'timer-report-not-saved' : 'timer-report-saved',
      ),
      type: result.error ? 'negative' : 'positive',
    });
    return result;
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'exportTimerReport' } } });
    createTemporaryNotification({
      group: 'timer-report',
      icon: 'mmm-error',
      message: t('timer-report-not-saved'),
      type: 'negative',
    });
    return { canceled: false, error: String(error) };
  }
};
