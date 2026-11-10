<template>
  <q-slide-transition>
    <div v-if="showing || isFinishing" class="q-px-md q-pb-sm">
      <!-- With a known size, the card itself fills up as the files arrive;
           without one there's nothing to fill, so it keeps a spinner. -->
      <div
        class="bg-accent-100 download-progress rounded-borders q-pa-sm"
        :class="{ 'liquid-host': showsLiquid }"
      >
        <LiquidFill
          v-if="showsLiquid"
          :done="isFinishing"
          :percent="shownTotalPercent"
          @frame="onFrame"
          @report="digits?.bump($event)"
        />
        <progress
          v-if="showsLiquid"
          :aria-label="label"
          class="mmm-visually-hidden"
          max="100"
          :value="Math.round(shownTotalPercent)"
        />
        <div class="row items-center q-gutter-sm no-wrap">
          <q-spinner v-if="!showsLiquid" color="primary" size="42px" />

          <div class="col">
            <div class="text-weight-medium">
              {{ label }}
            </div>
            <div class="text-caption text-dark-grey">
              {{ progressSummary }}
            </div>
            <q-linear-progress
              v-if="!showsLiquid"
              class="q-mt-xs"
              color="primary"
              indeterminate
              rounded
              size="8px"
            />
          </div>

          <div v-if="showsLiquid" class="download-progress__end">
            <DoneCheck v-if="isFinishing" variant="solid" />
            <RollingNumber
              v-else
              ref="digits"
              class="download-progress__percent"
              suffix="%"
              :value="shownPercent"
            />
          </div>
        </div>

        <q-list v-if="visibleItems.length" class="q-mt-xs" dense>
          <q-item
            v-for="item in visibleItems"
            :key="item.filename"
            class="q-px-none"
            dense
          >
            <q-item-section>
              <q-item-label class="ellipsis text-caption">
                {{ basename(item.filename) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-caption text-dark-grey">
                {{ itemProgressLabel(item) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </q-slide-transition>
</template>

<script setup lang="ts">
import type { DownloadProgressItem } from 'src/types';

import { useTimeoutFn } from '@vueuse/core';
import DoneCheck from 'components/ui/DoneCheck.vue';
import LiquidFill from 'components/ui/LiquidFill.vue';
import RollingNumber from 'components/ui/RollingNumber.vue';
import { storeToRefs } from 'pinia';
import { useMotionMode } from 'src/composables/useMotionMode';
import { LIQUID_DONE_HOLD_MS } from 'src/utils/liquid-motion';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  label?: string;
  loading?: boolean;
  progressCategory?: NonNullable<DownloadProgressItem['progressCategory']>;
}>();

const { t } = useI18n();
const { basename } = globalThis.electronApi;
const { downloadProgress } = storeToRefs(useCurrentStateStore());

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

const categoryItems = computed(() =>
  props.progressCategory
    ? Object.values(downloadProgress.value).filter(
        (item) => item.progressCategory === props.progressCategory,
      )
    : [],
);

const visibleItems = computed(() =>
  categoryItems.value.filter((item) => !item.complete || item.error),
);

const knownTotalItems = computed(() =>
  categoryItems.value.filter((item) => item.total !== undefined),
);

const totalBytes = computed(() =>
  knownTotalItems.value.reduce((sum, item) => sum + (item.total ?? 0), 0),
);

const loadedBytes = computed(() =>
  knownTotalItems.value.reduce(
    (sum, item) =>
      sum + (item.complete ? (item.total ?? 0) : (item.loaded ?? 0)),
    0,
  ),
);

const hasKnownTotal = computed(() => totalBytes.value > 0);

const aggregatePercent = computed(() => {
  if (!hasKnownTotal.value) return 0;
  return Math.min((loadedBytes.value / totalBytes.value) * 100, 100);
});

const showing = computed(() => props.loading || visibleItems.value.length > 0);

const label = computed(() => props.label || t('loading')); // NOSONAR: '' means not set

const motion = useMotionMode();
const digits = useTemplateRef<InstanceType<typeof RollingNumber>>('digits');

// What the liquid eases to between reports; the digits and sizes follow it.
const shownPercent = ref(0);

// Once everything is in, the card stays up a moment, full and green, before
// it slides away.
const isFinishing = ref(false);
const { start: holdFinishedCard } = useTimeoutFn(
  () => {
    isFinishing.value = false;
  },
  LIQUID_DONE_HOLD_MS,
  { immediate: false },
);

const showsLiquid = computed(() => hasKnownTotal.value || isFinishing.value);
const shownTotalPercent = computed(() =>
  isFinishing.value ? 100 : aggregatePercent.value,
);

const onFrame = (shown: number) => {
  shownPercent.value = Math.round(shown);
};

const progressSummary = computed(() => {
  if (isFinishing.value) {
    return `${formatBytes(totalBytes.value)} / ${formatBytes(totalBytes.value)}`;
  }
  if (!hasKnownTotal.value) return t('please-wait');
  const shownBytes = (totalBytes.value * shownPercent.value) / 100;
  return `${formatBytes(Math.min(shownBytes, totalBytes.value))} / ${formatBytes(totalBytes.value)}`;
});

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${numberFormatter.format(value)} ${units[unitIndex]}`;
}

function itemProgressLabel(item: DownloadProgressItem) {
  if (item.error) return t('failed');
  if (!item.total) return t('loading');
  return `${formatBytes(item.loaded ?? 0)} / ${formatBytes(item.total)}`;
}

watch(showing, (isShowing, wasShowing) => {
  if (isShowing || !wasShowing || !hasKnownTotal.value) return;
  if (motion.value === 'still') return;
  isFinishing.value = true;
  holdFinishedCard();
});
</script>

<style lang="scss" scoped>
.download-progress {
  --liquid-back: rgba(48, 117, 242, 0.1);
  --liquid-front: rgba(48, 117, 242, 0.2);
  --liquid-bubble: rgba(48, 117, 242, 0.35);
}

.download-progress__end {
  display: flex;
  flex: none;
  justify-content: flex-end;
  min-width: 3.2em;
}

.download-progress__percent {
  color: $primary;
  font-size: 22px;
}

/* The theme's primary blue is low-contrast against this card's dark-mode
   background (same root cause as the focused-field-label fix in app.scss). */
body.body--dark .download-progress {
  --liquid-back: rgba(75, 132, 237, 0.18);
  --liquid-front: rgba(75, 132, 237, 0.34);
  --liquid-bubble: rgba(255, 255, 255, 0.3);

  .download-progress__percent {
    color: color-mix(in srgb, var(--q-primary) 55%, white);
  }
}
</style>
