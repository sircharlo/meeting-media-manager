import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import useTimer from './useTimer';

/**
 * "On time", "2 min. behind" or "1 min. ahead" for the part being timed, or
 * an empty string when the indicator is off or there's nothing to compare.
 */
export const formatAheadBehind = (
  minutes: null | number | undefined,
  t: (key: string, named?: Record<string, unknown>) => string,
): string => {
  if (minutes === null || minutes === undefined) return '';

  const humanFriendlyMinutes = Math.round(Math.abs(minutes));
  if (humanFriendlyMinutes < 1) return t('on-time');
  return minutes > 0
    ? t('minutes-behind', { humanFriendlyMinutes })
    : t('minutes-ahead', { humanFriendlyMinutes });
};

export const useTimerAheadBehindText = () => {
  const { t } = useI18n();
  const { aheadBehindMinutes } = useTimer();
  return computed(() =>
    formatAheadBehind(
      aheadBehindMinutes.value,
      t as (key: string, named?: Record<string, unknown>) => string,
    ),
  );
};
