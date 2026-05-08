<template>
  <q-menu
    ref="downloadPopup"
    v-model="open"
    anchor="bottom middle"
    no-parent-event
    :offset="[0, 8]"
    self="top middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div class="action-popup flex q-py-md" style="flex-flow: column">
      <div class="card-title row q-px-md q-mb-none items-center">
        <div class="col">{{ t('media-sync') }}</div>
      </div>

      <div class="col overflow-auto q-col-gutter-y-sm">
        <template v-if="groupedByDateEntries.length === 0">
          <div class="row flex-center q-px-md q-mb-sm">
            <div class="col ellipsis text-weight-medium text-dark-grey">
              {{ t('noDownloadsInProgress') }}
            </div>
          </div>
        </template>

        <template v-else>
          <q-list class="full-width" dense>
            <q-expansion-item
              v-for="[dateKey, group] in groupedByDateEntries"
              :key="dateKey"
              dense-toggle
              expand-separator
              :model-value="expandedDates.has(dateKey)"
              @update:model-value="(v) => handleExpansionToggle(dateKey, v)"
            >
              <template #header>
                <div class="row items-center full-width">
                  <q-icon
                    class="q-mr-sm"
                    :color="statusColor(dateKey)"
                    :name="statusIcon(dateKey)"
                    size="sm"
                  />
                  <div class="col">
                    <q-item-section>
                      <q-item-label>
                        {{ localDate(dateKey) || t('unknown-date') }}
                      </q-item-label>
                      <q-item-label caption>{{
                        statusCaption(dateKey, group)
                      }}</q-item-label>
                    </q-item-section>
                  </div>
                  <q-btn
                    class="q-mr-sm"
                    color="primary"
                    flat
                    icon="mmm-arrow-outward"
                    round
                    size="xs"
                    @click.stop="navigateToDate(dateKey)"
                  />
                </div>
              </template>

              <q-list class="full-width q-px-lg" dense>
                <q-item v-for="(item, id) in group" :key="id" dense>
                  <q-item-section>
                    <q-item-label class="text-weight-medium text-dark-grey">
                      {{ basename(item.filename) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon
                      v-if="item.error"
                      color="negative"
                      name="mmm-error"
                      size="sm"
                    >
                      <q-tooltip>{{ errorTooltip(item) }}</q-tooltip>
                    </q-icon>
                    <q-icon
                      v-else-if="item.complete"
                      color="positive"
                      name="mmm-cloud-done"
                      size="sm"
                    />
                    <q-circular-progress
                      v-else-if="item.loaded && item.total"
                      color="primary"
                      size="sm"
                      :thickness="0.3"
                      :value="(item.loaded / item.total) * 100"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </q-list>
        </template>
      </div>

      <q-separator class="bg-accent-200" />
      <div class="q-px-md q-pt-md row q-gutter-sm justify-end">
        <q-btn
          color="warning"
          :disable="refreshDisabled"
          icon="mmm-reset"
          :label="t('refresh-all-meeting-media')"
          :loading="fetchOrDownloadsAreRunning"
          @click="onRefreshMeetingMedia"
        >
          <q-tooltip v-if="!fetchOrDownloadsAreRunning">
            {{ t('refresh-all-meeting-media') }}
          </q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { type QMenu, useQuasar } from 'quasar';
import { useLocale } from 'src/composables/useLocale';
import { SORTER } from 'src/constants/general';
import { updateLookupPeriod } from 'src/helpers/date';
import { fetchMedia } from 'src/helpers/jw-media';
import { dateFromString, getDateDiff, getLocalDate } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// ─── Setup ───────────────────────────────────────────────────────────────────

const { t } = useI18n();
const $q = useQuasar();
const { basename } = globalThis.electronApi;
const { dateLocale } = useLocale();

const open = defineModel<boolean>({ default: false });

const currentState = useCurrentStateStore();
const { currentSettings, downloadProgress, mediaIsPlaying, selectedDate } =
  storeToRefs(currentState);

// ─── Types ───────────────────────────────────────────────────────────────────

type DateStatus = 'complete' | 'error' | 'loading' | 'none';
// 'auto' means expansion is driven by status; manual overrides it.
type ExpansionMode = 'auto' | 'manual-closed' | 'manual-open';

// ─── Grouped data ─────────────────────────────────────────────────────────────

const filteredDownloads = computed(() =>
  Object.values(downloadProgress.value ?? {}).sort((a, b) =>
    SORTER.compare(a.filename, b.filename),
  ),
);

const groupedByDate = computed(() => {
  const map: Record<string, typeof filteredDownloads.value> = {};
  for (const item of filteredDownloads.value) {
    const key = item.meetingDate ?? '';
    map[key] ??= [];
    map[key].push(item);
  }
  return map;
});

const groupedByDateEntries = computed(() =>
  Object.entries(groupedByDate.value).sort(([a], [b]) => {
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    return dateFromString(a).getTime() - dateFromString(b).getTime();
  }),
);

// ─── Status helpers ───────────────────────────────────────────────────────────

function computeStatus(dateKey: string): DateStatus {
  const group = groupedByDate.value[dateKey];
  if (!group?.length) return 'none';
  if (group.some((i) => i.error)) return 'error';
  if (group.some((i) => !i.complete && !i.error)) return 'loading';
  if (group.every((i) => i.complete)) return 'complete';
  return 'none';
}

// Memoised per render cycle — avoids re-computing for every helper call.
const dateStatuses = computed(() =>
  Object.fromEntries(
    Object.keys(groupedByDate.value).map((k) => [k, computeStatus(k)]),
  ),
);

const getStatus = (dateKey: string): DateStatus =>
  dateStatuses.value[dateKey] ?? 'none';

function isRecentError(dateKey: string) {
  return getDateDiff(dateFromString(dateKey), new Date(), 'days') <= 7;
}

function shouldAutoExpand(dateKey: string) {
  const s = getStatus(dateKey);
  return s === 'loading' || (s === 'error' && isRecentError(dateKey));
}

// ─── Template helpers ─────────────────────────────────────────────────────────

const localDate = (dateKey: string) =>
  getLocalDate(
    dateKey,
    dateLocale.value,
    currentSettings.value?.localDateFormat,
  );

const statusIcon = (dateKey: string): string =>
  ({
    complete: 'mmm-cloud-done',
    error: 'mmm-error',
    loading: 'mmm-download',
    none: 'mmm-calendar',
  })[getStatus(dateKey)];

const statusColor = (dateKey: string): string =>
  ({
    complete: 'positive',
    error: 'negative',
    loading: 'primary',
    none: 'secondary',
  })[getStatus(dateKey)];

function statusCaption(dateKey: string, group: typeof filteredDownloads.value) {
  const total = group.length;
  const complete = group.filter((i) => i.complete).length;
  const error = group.filter((i) => i.error).length;
  const loading = total - complete - error;
  if (loading > 0) return t('loading');
  if (error > 0) return `${t('failed')} (${error})`;
  if (complete === total) return t('completed');
  return `${total} ${t('items')}`;
}

const FALLBACK_SUFFIX = `${t('errorDownloadingMeetingMedia')}. ${t('tryConfiguringFallbackLanguage')}.`;

function errorTooltip(item: { meetingDate?: null | string }) {
  const dateKey = item.meetingDate;
  if (!dateKey) return FALLBACK_SUFFIX;
  return getDateDiff(dateKey, new Date(), 'days') > 7
    ? `${t('errorDownloadingMeetingMedia')}. This media may become available later.`
    : FALLBACK_SUFFIX;
}

// ─── Expansion state ──────────────────────────────────────────────────────────

const AUTO_COLLAPSE_MS = 4000;

// Single source of truth for expansion. 'auto' defers to shouldAutoExpand().
const expansionModes = ref<Record<string, ExpansionMode>>({});
// Timestamp of when a date first reached 'complete' status.
const completedAt = ref<Record<string, number>>({});

const expandedDates = computed(() => {
  const now = Date.now();
  return new Set(
    Object.keys(groupedByDate.value).filter((k) => {
      const mode = expansionModes.value[k] ?? 'auto';
      if (mode === 'manual-open') return true;
      if (mode === 'manual-closed') return false;
      // auto: expand while loading/erroring; keep open briefly after completion
      if (shouldAutoExpand(k)) return true;
      const t0 = completedAt.value[k];
      return t0 !== undefined && now - t0 < AUTO_COLLAPSE_MS;
    }),
  );
});

const downloadPopup = useTemplateRef<QMenu>('downloadPopup');

function handleExpansionToggle(dateKey: string, expanded: boolean) {
  expansionModes.value[dateKey] = expanded ? 'manual-open' : 'manual-closed';
  // Let the expansion animation finish before repositioning.
  setTimeout(() => downloadPopup.value?.updatePosition(), 300);
}

// ─── Actions ──────────────────────────────────────────────────────────────────

const fetchOrDownloadsAreRunning = computed(
  () =>
    currentState.fetchingMeetingsCount > 0 ||
    Object.values(downloadProgress.value).some((i) => i.loaded),
);

const refreshDisabled = computed(
  () => fetchOrDownloadsAreRunning.value || mediaIsPlaying.value,
);

function navigateToDate(dateKey?: string) {
  if (!dateKey) return;
  selectedDate.value = dateKey.includes('/')
    ? dateKey
    : dateKey.replace(/(\d{4})(\d{2})(\d{2})/, '$1/$2/$3');
}

function onRefreshMeetingMedia() {
  if (refreshDisabled.value) return;
  $q.dialog({
    cancel: { label: t('cancel') },
    message: t('refresh-all-meeting-media-confirm'),
    ok: { label: t('confirm') },
    persistent: true,
    title: t('refresh-all-meeting-media'),
  }).onOk(async () => {
    updateLookupPeriod({ reset: true });
    await fetchMedia();
  });
}

// React to status changes: track completion timestamps, schedule auto-collapse.
watch(
  dateStatuses,
  (statuses) => {
    const now = Date.now();
    for (const [dateKey, status] of Object.entries(statuses)) {
      if (status === 'complete' && completedAt.value[dateKey] === undefined) {
        completedAt.value[dateKey] = now;
        // Force reactivity update after cooldown so expanded computed re-runs.
        setTimeout(() => {
          // Only clear if still in auto mode so manual overrides are preserved.
          if ((expansionModes.value[dateKey] ?? 'auto') === 'auto') {
            // Trigger recompute by nudging the ref.
            completedAt.value = { ...completedAt.value };
          }
        }, AUTO_COLLAPSE_MS + 50);
      }
    }
  },
  { deep: false },
);

// Reset manual overrides and completion timestamps when menu reopens.
watch(open, (isOpen) => {
  if (!isOpen) return;
  expansionModes.value = {};
  completedAt.value = {};
});

// Keep popup position in sync as the item list grows/shrinks.
watch(
  () => filteredDownloads.value.length,
  () => setTimeout(() => downloadPopup.value?.updatePosition(), 10),
);
</script>
