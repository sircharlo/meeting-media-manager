import type { NoticeType } from 'src/types';

/** The icon of each type of notice, in a toast or a banner alike. */
export const NOTICE_ICONS: Record<NoticeType, string> = {
  info: 'mmm-info',
  negative: 'mmm-error',
  neutral: 'mmm-info',
  positive: 'mmm-check',
  warning: 'mmm-warning',
};
