import type { DateLocale } from 'quasar';

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export function useLocale() {
  const i18n = useI18n();
  const { t } = i18n;

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

  return { dateLocale, getDateLocale };
}
