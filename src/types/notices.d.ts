/** A button of a banner (see NoticeBanner.vue). */
export interface NoticeAction {
  label: string;
  onClick: () => void;
}

/**
 * How a notice (a toast, a banner or an inline alert) reads:
 * - positive: what was asked for is done;
 * - info: for information, or a normal state; nothing to do;
 * - warning: worth a look, though things still work;
 * - negative: something failed, and won't happen until it's fixed or
 *   retried;
 * - neutral (banners only): a state the user chose, such as a dismissed
 *   panel.
 * Work under way is an 'ongoing' toast, or an info banner with a spinner.
 */
export type NoticeType =
  'info' | 'negative' | 'neutral' | 'positive' | 'warning';
