import type { DateLocale } from 'quasar';

import { localeOptions } from 'src/i18n';
import { formatDate } from 'src/utils/date';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export function useLocale() {
  const i18n = useI18n();
  const { t } = i18n;

  const localeObject = computed(() => {
    return localeOptions.find((l) => l.value === i18n.locale.value);
  });

  const dateLocale = computed((): Required<DateLocale> => {
    return {
      days: t('days-long').split('_'),
      daysShort: t('days-short').split('_'),
      months: t('months-long').split('_'),
      monthsShort: t('months-short').split('_'),
    };
  });

  const getDateLocale = (locale?: string): Required<DateLocale> => {
    return locale
      ? {
          days: t('days-long', {}, { locale }).split('_'),
          daysShort: t('days-short', {}, { locale }).split('_'),
          months: t('months-long', {}, { locale }).split('_'),
          monthsShort: t('months-short', {}, { locale }).split('_'),
        }
      : dateLocale.value;
  };

  // Only trust Intl when it knows the UI language: otherwise it silently
  // falls back to another language's names, so the app's own are used.
  const getIntlFormatter = (options: Intl.DateTimeFormatOptions) => {
    try {
      if (!Intl.DateTimeFormat.supportedLocalesOf(i18n.locale.value).length) {
        return undefined;
      }
      return new Intl.DateTimeFormat(i18n.locale.value, options);
    } catch {
      // An invalid language tag.
      return undefined;
    }
  };

  const dayMonthFormatter = computed(() =>
    getIntlFormatter({ day: 'numeric', month: 'short' }),
  );

  const weekdayDateFormatter = computed(() =>
    getIntlFormatter({ day: 'numeric', month: 'long', weekday: 'long' }),
  );

  /** A short range of days, such as "Nov 23 – 29" or "Dec 28 – Jan 3". */
  const formatDayMonthRange = (start: Date, end: Date) => {
    const formatter = dayMonthFormatter.value;
    // formatRange shortens "Nov 23 – Nov 29" to "Nov 23 – 29", but adds both
    // years to a range that spans New Year, which is too wide for a label.
    if (formatter && start.getFullYear() === end.getFullYear()) {
      return formatter.formatRange(start, end);
    }
    const format = (date: Date) =>
      formatter?.format(date) ?? formatDate(date, 'D MMM', dateLocale.value);
    return `${format(start)} – ${format(end)}`;
  };

  /** A day with its weekday and no year, such as "Tuesday, December 8". */
  const formatWeekdayDate = (date: Date) =>
    weekdayDateFormatter.value?.format(date) ??
    `${dateLocale.value.days[date.getDay()]} ${formatDate(date, 'D MMMM', dateLocale.value)}`;

  return {
    dateLocale,
    formatDayMonthRange,
    formatWeekdayDate,
    getDateLocale,
    localeObject,
    t,
  };
}
