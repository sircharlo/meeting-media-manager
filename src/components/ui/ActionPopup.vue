<template>
  <!-- The popup every action island button opens, laid out the same way in
       each: the title alone on its row; a status line under it (icon or
       spinner, one line of text, and at most one small icon action at its
       end); banners; the body, which scrolls; and a footer that stays put,
       with the popup's main action as a full-width button and any secondary
       actions in a row under it. -->
  <q-menu
    ref="menu"
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div ref="content" class="action-popup action-popup--scroll-layout q-py-md">
      <div class="card-title col-shrink full-width q-px-md q-mb-none">
        {{ title }}
      </div>

      <div
        v-if="statusText || $slots.status"
        class="action-popup__status row items-center no-wrap q-px-md"
      >
        <q-spinner v-if="statusLoading" color="primary" size="16px" />
        <q-icon
          v-else-if="statusIcon"
          :color="statusColor"
          :name="statusIcon"
          size="16px"
        />
        <div class="col text-caption text-weight-medium ellipsis">
          <slot name="status">{{ statusText }}</slot>
        </div>
        <slot name="status-action" />
      </div>

      <slot name="banners" />

      <div class="action-popup__scroll full-width">
        <slot />
      </div>

      <template v-if="$slots.footer || $slots['footer-secondary']">
        <q-separator class="bg-accent-200" />
        <div class="action-popup__footer full-width">
          <slot name="footer" />
          <div
            v-if="$slots['footer-secondary']"
            class="action-popup__footer-row"
          >
            <slot name="footer-secondary" />
          </div>
        </div>
      </template>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import type { QMenu } from 'quasar';

import { onBeforeUnmount, useTemplateRef, watch } from 'vue';

defineProps<{
  /** Quasar color of the status icon. */
  statusColor?: string;
  statusIcon?: string;
  /** Shows a spinner in place of the status icon. */
  statusLoading?: boolean;
  /** One line; the `status` slot replaces it. */
  statusText?: string;
  title: string;
}>();

const open = defineModel<boolean>({ default: false });

const menu = useTemplateRef<QMenu>('menu');
const content = useTemplateRef<HTMLElement>('content');

// The popup sits above its button: as its content grows or shrinks, it has
// to move to stay there.
let resizeObserver: ResizeObserver | undefined;

watch(content, (el) => {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  if (!el) return;
  resizeObserver = new ResizeObserver(() => {
    menu.value?.updatePosition();
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>
