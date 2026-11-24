<template>
  <q-banner
    class="notice"
    :class="`notice--${type}`"
    :dark="false"
    :dense="dense"
    :inline-actions="inlineActions"
    rounded
  >
    <template #avatar>
      <LiquidSpinner v-if="loading" class="notice__icon" :size="iconSize" />
      <q-icon
        v-else
        class="notice__icon"
        :name="icon || NOTICE_ICONS[type]"
        :size="iconSize"
      />
    </template>
    <slot />
    <q-icon
      v-if="details.length"
      class="notice__details q-ml-xs"
      name="mmm-info"
      size="xs"
    >
      <q-tooltip max-width="360px">
        <div v-if="detailsTitle" class="notice__details-title">
          {{ detailsTitle }}
        </div>
        <ul class="notice__details-list">
          <li
            v-for="(line, index) in detailLines"
            :key="index"
            class="ellipsis"
          >
            {{ line }}
          </li>
        </ul>
        <div v-if="moreDetails" class="notice__details-more">
          +{{ moreDetails }}
        </div>
      </q-tooltip>
    </q-icon>
    <template v-if="actions.length || $slots.action" #action>
      <slot name="action">
        <q-btn
          v-for="action in actions"
          :key="action.label"
          :dense="dense"
          flat
          :label="action.label"
          @click="action.onClick()"
        />
      </slot>
    </template>
  </q-banner>
</template>

<script setup lang="ts">
import type { NoticeAction, NoticeType } from 'src/types';

import LiquidSpinner from 'components/ui/LiquidSpinner.vue';
import { NOTICE_ICONS } from 'src/constants/notices';
import { computed } from 'vue';

// A notice on the page, in a card or in a popup: a light tint of its type's
// color behind the usual text, with its icon, its buttons and an edge on its
// start side in a stronger shade of that color, which the dark theme
// lightens (see the notice variables in app.scss). The tint mixes with
// whatever is under it, so it suits every surface. Never Quasar's dark
// banner, whose flat grey would hide it.

const props = withDefaults(
  defineProps<{
    /** Buttons, after the text; the `action` slot replaces them. */
    actions?: NoticeAction[];
    /** Smaller, as in a popup. */
    dense?: boolean;
    /**
     * Listed as bullets in a tooltip on an ⓘ after the text (the names of
     * the hidden media items, say). A long line ends in "…".
     */
    details?: string[];
    /** A heading over the details' list, e.g. "Hidden media:". */
    detailsTitle?: string;
    /** An icon in place of the type's own. */
    icon?: string;
    /** Buttons beside the text, rather than under it. */
    inlineActions?: boolean;
    /** Work under way: a sloshing glass in place of the icon. */
    loading?: boolean;
    type: NoticeType;
  }>(),
  {
    actions: () => [],
    details: () => [],
    detailsTitle: undefined,
    icon: undefined,
  },
);

const iconSize = computed(() => (props.dense ? '20px' : '28px'));

// A tooltip that stays on the screen: past this many lines, the last one
// says how many more there are ("+5") rather than naming just one more.
const MAX_DETAIL_LINES = 12;

const isOverflowing = computed(() => props.details.length > MAX_DETAIL_LINES);

const detailLines = computed(() =>
  isOverflowing.value
    ? props.details.slice(0, MAX_DETAIL_LINES - 1)
    : props.details,
);

const moreDetails = computed(() =>
  isOverflowing.value ? props.details.length - (MAX_DETAIL_LINES - 1) : 0,
);
</script>

<style lang="scss" scoped>
.notice {
  background: color-mix(
    in srgb,
    var(--notice-base) var(--notice-tint),
    transparent
  );
  border-inline-start: 3px solid var(--notice-strong);
  color: inherit;
}

// Its buttons take the strong shade too (white or dark text on the tint
// would hardly look like buttons).
.notice__icon,
.notice__details,
.notice :deep(.q-banner__actions) .q-btn {
  color: var(--notice-strong);
}

.notice__details {
  cursor: help;
  vertical-align: text-bottom;
}

// The ⓘ's tooltip: a heading, then the details as a bulleted list.
.notice__details-title {
  font-weight: 600;
  margin-bottom: 2px;
}

// The bullets go inside each line: its ellipsis (overflow: hidden) would
// clip ones drawn outside it.
.notice__details-list {
  list-style-position: inside;
  margin: 0;
  padding-inline-start: 0.25em;
}

.notice__details-more {
  opacity: 0.8;
  padding-inline-start: 1.1em;
}

.notice--positive {
  --notice-base: #{$positive};
  --notice-strong: var(--notice-positive-strong);
}

.notice--info {
  --notice-base: #{$primary};
  --notice-strong: var(--notice-info-strong);
}

.notice--warning {
  --notice-base: #{$warning};
  --notice-strong: var(--notice-warning-strong);
}

.notice--negative {
  --notice-base: #{$negative};
  --notice-strong: var(--notice-negative-strong);
}

// A state the user chose (a dismissed panel, say): a faint wash of the text
// color, with no edge, and a blue icon.
.notice--neutral {
  --notice-strong: var(--notice-info-strong);

  background: color-mix(in srgb, currentColor 6%, transparent);
  border-inline-start-color: transparent;
}
</style>
