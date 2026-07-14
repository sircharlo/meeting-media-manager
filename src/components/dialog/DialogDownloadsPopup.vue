<template>
  <q-menu
    ref="downloadPopup"
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div
      ref="popupContent"
      class="action-popup action-popup--scroll-layout q-py-md"
    >
      <div class="card-title row q-px-md q-mb-none items-center">
        <div class="col">{{ t('media-sync') }}</div>
      </div>

      <div class="row items-center no-wrap q-px-md q-mb-sm q-gutter-x-sm">
        <q-spinner
          v-if="checkingCount > 0 || downloadingCount > 0"
          color="primary"
          size="16px"
        />
        <q-icon v-else :color="summaryColor" :name="summaryIcon" size="16px" />
        <div class="text-caption text-weight-medium ellipsis">
          {{ summaryText }}
        </div>
      </div>

      <div class="action-popup__scroll q-col-gutter-y-sm">
        <template v-if="groupedByDateEntries.length === 0">
          <div class="column flex-center q-px-md q-py-lg text-center">
            <q-icon color="positive" name="mmm-cloud-done" size="48px" />
            <div class="text-weight-medium q-mt-sm">
              {{ t('all-caught-up') }}
            </div>
            <div class="text-caption text-dark-grey">
              {{ t('noDownloadsInProgress') }}
            </div>
          </div>
        </template>

        <template v-else>
          <q-list class="full-width" dense>
            <transition-group name="date-row">
              <template
                v-for="[dateKey, group] in groupedByDateEntries"
                :key="dateKey"
              >
                <q-expansion-item
                  v-if="group.length"
                  :key="`${dateKey}-files`"
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
                      >
                        <q-tooltip :delay="500">
                          {{ t('go-to-this-date') }}
                        </q-tooltip>
                      </q-btn>
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
                        <div v-if="item.error" class="row items-center no-wrap">
                          <q-icon
                            :color="
                              itemErrorSeverity(item) === 'error'
                                ? 'negative'
                                : 'info'
                            "
                            :name="
                              itemErrorSeverity(item) === 'error'
                                ? 'mmm-error'
                                : 'mmm-info'
                            "
                            :size="
                              itemErrorSeverity(item) === 'error' ? 'sm' : 'xs'
                            "
                          >
                            <q-tooltip>{{ errorTooltip(item) }}</q-tooltip>
                          </q-icon>
                        </div>
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

                <q-item v-else :key="`${dateKey}-checking`" dense>
                  <q-item-section avatar style="min-width: 0">
                    <q-spinner
                      v-if="getStatus(dateKey) === 'checking'"
                      color="secondary"
                      size="sm"
                    />
                    <q-icon
                      v-else
                      :color="statusColor(dateKey)"
                      :name="statusIcon(dateKey)"
                      size="sm"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      {{ localDate(dateKey) || t('unknown-date') }}
                    </q-item-label>
                    <q-item-label caption>{{
                      statusCaption(dateKey, group)
                    }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      color="primary"
                      flat
                      icon="mmm-arrow-outward"
                      round
                      size="xs"
                      @click="navigateToDate(dateKey)"
                    >
                      <q-tooltip :delay="500">
                        {{ t('go-to-this-date') }}
                      </q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </template>
            </transition-group>
          </q-list>
        </template>
      </div>

      <q-separator class="bg-accent-200" />
      <div
        class="action-popup__footer q-px-md q-pt-md row q-gutter-sm justify-end"
      >
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
import { DOWNLOAD_ROW_AUTO_COLLAPSE_MS, SORTER } from 'src/constants/general';
import { updateLookupPeriod } from 'src/helpers/date';
import { fetchMedia } from 'src/helpers/jw-media';
import { dateFromString, getDateDiff, getLocalDate } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// ─── Setup ───────────────────────────────────────────────────────────────────

const { t } = useI18n();
const $q = useQuasar();
const { basename } = globalThis.electronApi;
const { dateLocale } = useLocale();

const open = defineModel<boolean>({ default: false });

const currentState = useCurrentStateStore();
const {
  currentSettings,
  downloadProgress,
  mediaIsPlaying,
  meetingCheckStatus,
  selectedDate,
} = storeToRefs(currentState);

// ─── Types ───────────────────────────────────────────────────────────────────

type DateStatus =
  'checking' | 'complete' | 'error' | 'loading' | 'none' | 'warning';
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
  // Dates that are being (or were just) checked for updates get their own
  // row even before any file needs downloading - or when nothing did.
  for (const key of Object.keys(meetingCheckStatus.value)) {
    map[key] ??= [];
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
  const group = groupedByDate.value[dateKey] ?? [];
  if (group.length) {
    if (group.some((i) => i.error)) {
      return isWithin7Days(dateKey) ? 'error' : 'warning';
    }
    if (group.some((i) => !i.complete && !i.error)) return 'loading';
    if (group.every((i) => i.complete)) return 'complete';
  }

  const checkState = meetingCheckStatus.value[dateKey];
  if (checkState === 'checking') return 'checking';
  if (checkState === 'error') {
    return isWithin7Days(dateKey) ? 'error' : 'warning';
  }
  if (checkState === 'complete') return 'complete';

  return 'none';
}

// Memoised per render cycle — avoids re-computing for every helper call.
const dateStatuses = computed(() =>
  Object.fromEntries(
    Object.keys(groupedByDate.value).map((k) => [k, computeStatus(k)]),
  ),
);

const getStatus = (dateKey: string): DateStatus => {
  return dateStatuses.value[dateKey] ?? 'none';
};

function shouldAutoExpand(dateKey: string) {
  const s = getStatus(dateKey);
  return s === 'loading' || s === 'error';
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
    checking: 'mmm-search',
    complete: 'mmm-cloud-done',
    error: 'mmm-error',
    loading: 'mmm-download',
    none: 'mmm-calendar-month',
    warning: 'mmm-warning',
  })[getStatus(dateKey)];

const statusColor = (dateKey: string): string =>
  ({
    checking: 'secondary',
    complete: 'positive',
    error: 'negative',
    loading: 'primary',
    none: 'secondary',
    warning: 'warning',
  })[getStatus(dateKey)];

function statusCaption(dateKey: string, group: typeof filteredDownloads.value) {
  if (!group.length) {
    const status = getStatus(dateKey);
    if (status === 'checking') return t('checking-for-updates');
    if (status === 'error' || status === 'warning') return t('failed');
    if (status === 'complete') return t('completed');
    return '';
  }
  const total = group.length;
  const complete = group.filter((i) => i.complete).length;
  const error = group.filter((i) => i.error).length;
  const loading = total - complete - error;
  if (loading > 0) return t('loading');
  if (error > 0) return `${t('failed')} (${error})`;
  if (complete === total) return t('completed');
  return t('items', { count: total }, total);
}

const WARNING_SHOULD_BECOME_AVAILABLE = `${t('errorDownloadingMeetingMedia')}. ${t('willProbablyBeAvailableLater')}.`;
const ERROR_SHOULD_BE_AVAILABLE = `${t('errorDownloadingMeetingMedia')}. ${t('thisShouldBeInvestigatedToEnsureThatAllRequiredMeetingMediaIsPresent')}.`;

function errorTooltip(item: { meetingDate?: null | string }) {
  const dateKey = item.meetingDate;
  if (!dateKey) return ERROR_SHOULD_BE_AVAILABLE;
  return isWithin7Days(dateKey)
    ? ERROR_SHOULD_BE_AVAILABLE
    : WARNING_SHOULD_BECOME_AVAILABLE;
}

function isWithin7Days(dateKey?: null | string) {
  if (!dateKey) return true;
  const daysUntilMeeting = getDateDiff(
    dateFromString(dateKey),
    new Date(),
    'days',
  );
  return daysUntilMeeting >= 0 && daysUntilMeeting <= 7;
}

function itemErrorSeverity(item: { meetingDate?: null | string }) {
  return isWithin7Days(item.meetingDate) ? 'error' : 'warning';
}

// ─── Summary header ───────────────────────────────────────────────────────────

const checkingEntries = computed(() =>
  Object.entries(meetingCheckStatus.value),
);

const checkingCount = computed(
  () => checkingEntries.value.filter(([, v]) => v === 'checking').length,
);

const checkingTotal = computed(() => checkingEntries.value.length);

const activeDownloadItems = computed(() =>
  Object.values(downloadProgress.value).filter(
    (i) =>
      !i.complete && !i.error && (!i.loaded || !i.total || i.loaded < i.total),
  ),
);

const downloadingCount = computed(() => activeDownloadItems.value.length);

const erroredCount = computed(() => {
  const dateErrors = checkingEntries.value.filter(
    ([key, v]) => v === 'error' && isWithin7Days(key),
  ).length;
  const itemErrors = Object.values(downloadProgress.value).filter(
    (i) => i.error && isWithin7Days(i.meetingDate),
  ).length;
  return dateErrors + itemErrors;
});

const summaryText = computed(() => {
  const parts: string[] = [];
  if (checkingCount.value > 0) {
    parts.push(
      t('checking-meeting-dates', {
        current: checkingCount.value,
        total: checkingTotal.value,
      }),
    );
  }
  if (downloadingCount.value > 0) {
    parts.push(
      t(
        'downloading-files',
        { count: downloadingCount.value },
        downloadingCount.value,
      ),
    );
  }
  if (parts.length) return parts.join(' · ');

  if (erroredCount.value > 0) {
    return t(
      'n-items-failed',
      { count: erroredCount.value },
      erroredCount.value,
    );
  }

  return t('up-to-date');
});

const summaryIcon = computed(() => {
  if (erroredCount.value > 0) return 'mmm-warning';
  return 'mmm-cloud-done';
});

const summaryColor = computed(() => {
  if (erroredCount.value > 0) return 'warning';
  return 'positive';
});

// ─── Expansion state ──────────────────────────────────────────────────────────

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
      return t0 !== undefined && now - t0 < DOWNLOAD_ROW_AUTO_COLLAPSE_MS;
    }),
  );
});

const downloadPopup = useTemplateRef<QMenu>('downloadPopup');
const popupContent = useTemplateRef<HTMLElement>('popupContent');
let popupResizeObserver: ResizeObserver | undefined;

function handleExpansionToggle(dateKey: string, expanded: boolean) {
  expansionModes.value[dateKey] = expanded ? 'manual-open' : 'manual-closed';
}

// ─── Actions ──────────────────────────────────────────────────────────────────

const fetchOrDownloadsAreRunning = computed(
  () => currentState.hasActiveMediaWork,
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
        }, DOWNLOAD_ROW_AUTO_COLLAPSE_MS + 50);
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

// The popup is anchored bottom-up (self="bottom middle") so it visually
// grows out of the action island. That only holds if we reposition every
// time the content's actual rendered size changes - row add/remove,
// expand/collapse animations, fade-out transitions completing, etc. A
// ResizeObserver catches all of these at the moment they really happen,
// instead of guessing with setTimeout delays tied to animation durations.
watch(popupContent, (el) => {
  popupResizeObserver?.disconnect();
  popupResizeObserver = undefined;
  if (!el) return;
  popupResizeObserver = new ResizeObserver(() => {
    downloadPopup.value?.updatePosition();
  });
  popupResizeObserver.observe(el);
});

onBeforeUnmount(() => popupResizeObserver?.disconnect());
</script>

<style scoped lang="scss">
.date-row-move,
.date-row-enter-active,
.date-row-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.date-row-enter-from,
.date-row-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
