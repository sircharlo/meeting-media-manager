<template>
  <q-slide-transition>
    <div v-if="showing" class="q-px-md q-pb-sm">
      <div class="bg-accent-100 rounded-borders q-pa-sm">
        <div class="row items-center q-gutter-sm no-wrap">
          <q-circular-progress
            v-if="hasKnownTotal"
            color="primary"
            show-value
            size="42px"
            :thickness="0.18"
            :value="aggregatePercent"
          >
            <span class="text-caption"
              >{{ Math.round(aggregatePercent) }}%</span
            >
          </q-circular-progress>
          <q-spinner v-else color="primary" size="42px" />

          <div class="col">
            <div class="text-weight-medium">
              {{ label }}
            </div>
            <div class="text-caption text-grey-8">
              {{ progressSummary }}
            </div>
            <q-linear-progress
              class="q-mt-xs"
              color="primary"
              :indeterminate="!hasKnownTotal"
              rounded
              size="8px"
              :value="aggregatePercent / 100"
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
              <q-item-label class="text-caption text-grey-8">
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

import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  label?: string;
  loading?: boolean;
  progressCategory?: DownloadProgressItem['progressCategory'];
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
  visibleItems.value.filter((item) => item.total !== undefined),
);

const totalBytes = computed(() =>
  knownTotalItems.value.reduce((sum, item) => sum + (item.total ?? 0), 0),
);

const loadedBytes = computed(() =>
  knownTotalItems.value.reduce((sum, item) => sum + (item.loaded ?? 0), 0),
);

const hasKnownTotal = computed(() => totalBytes.value > 0);

const aggregatePercent = computed(() => {
  if (!hasKnownTotal.value) return 0;
  return Math.min((loadedBytes.value / totalBytes.value) * 100, 100);
});

const showing = computed(() => props.loading || visibleItems.value.length > 0);

const label = computed(() => props.label || t('loading'));

const progressSummary = computed(() => {
  if (!hasKnownTotal.value) return t('please-wait');
  return `${formatBytes(loadedBytes.value)} / ${formatBytes(totalBytes.value)}`;
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
</script>
