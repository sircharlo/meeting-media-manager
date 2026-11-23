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
    /** An icon in place of the type's own. */
    icon?: string;
    /** Buttons beside the text, rather than under it. */
    inlineActions?: boolean;
    /** Work under way: a sloshing glass in place of the icon. */
    loading?: boolean;
    type: NoticeType;
  }>(),
  { actions: () => [], icon: undefined },
);

const iconSize = computed(() => (props.dense ? '20px' : '28px'));
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
.notice :deep(.q-banner__actions) .q-btn {
  color: var(--notice-strong);
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
