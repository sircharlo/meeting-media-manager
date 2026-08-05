<template>
  <q-item v-if="compact">
    <q-item-section class="align-center text-dark-grey text-subtitle2">
      <div v-if="isTiny" class="text-chip">
        <div class="row items-center no-wrap">
          <q-icon class="q-mr-xs" name="mmm-info" size="xs" />
          <span class="col ellipsis">{{ compactMessage }}</span>
        </div>
        <q-tooltip :delay="500">{{ compactMessage }}</q-tooltip>
      </div>
      <div v-else class="row items-center">
        <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
        <span>{{ compactMessage }}</span>
      </div>
    </q-item-section>
  </q-item>

  <div v-else class="row">
    <div
      :class="[
        'col',
        {
          'content-center': !(
            (shouldShowSpinner && selectedDayMeetingType) ||
            noCongregationSelected
          ),
          'q-py-xl': !(
            (shouldShowSpinner && selectedDayMeetingType) ||
            noCongregationSelected
          ),
        },
      ]"
    >
      <div
        v-if="
          !currentSettings?.disableMediaFetching ||
          !selectedDateObject?.mediaSections ||
          !Object.values(selectedDateObject.mediaSections).some(
            (section) => section.items?.length,
          )
        "
        class="row justify-center"
      >
        <div class="col-6 text-center full-width">
          <div
            v-if="
              (shouldShowSpinner && selectedDayMeetingType) ||
              noCongregationSelected
            "
            :class="[
              'q-my-lg',
              { 'no-congregation-blur': noCongregationSelected },
            ]"
          >
            <!-- Skeleton for media sections -->
            <div
              v-for="section in skeletonSections"
              :key="section.id"
              class="q-mb-lg"
            >
              <q-card bordered class="q-py-md q-px-lg" flat>
                <!-- Section header skeleton -->
                <div class="row items-center q-mb-sm">
                  <q-skeleton class="q-mr-sm" size="40px" type="circle" />
                  <q-skeleton height="20px" type="text" width="150px" />
                </div>

                <!-- Media items skeletons -->
                <div
                  v-for="item in section.itemCount"
                  :key="item"
                  class="row items-center q-mb-sm q-pa-sm"
                >
                  <!-- Thumbnail skeleton -->
                  <q-skeleton
                    class="q-mr-md"
                    height="84px"
                    type="rect"
                    width="150px"
                  />

                  <!-- Title and info skeleton -->
                  <div class="col">
                    <q-skeleton height="16px" type="text" width="80%" />
                    <q-skeleton
                      class="q-mt-xs"
                      height="14px"
                      type="text"
                      width="60%"
                    />
                  </div>

                  <!-- Play button skeleton -->
                  <q-skeleton class="q-ml-sm" size="40px" type="QBtn" />
                </div>
              </q-card>
            </div>
          </div>
          <div v-else class="row items-center justify-center q-my-lg">
            <q-spinner v-if="shouldShowSpinner" color="primary" size="lg" />
            <div
              v-else-if="isErrorState"
              class="icon-chip text-negative empty-state-error-icon"
            >
              <q-icon name="mmm-cloud-error" size="1.5em" />
            </div>
            <div v-else class="no-media-illustration-frame">
              <q-img
                fit="contain"
                src="~assets/img/no-media.svg"
                style="max-height: 30vh"
              />
            </div>
          </div>
          <div
            v-if="
              !(
                (shouldShowSpinner && selectedDayMeetingType) ||
                noCongregationSelected
              )
            "
            class="row items-center justify-center text-subtitle1 text-semibold"
          >
            {{ primaryEmptyStateMessage }}
          </div>
          <div
            v-if="
              !(
                (shouldShowSpinner && selectedDayMeetingType) ||
                noCongregationSelected
              ) && secondaryEmptyStateMessage
            "
            class="row items-center justify-center text-center"
          >
            {{ secondaryEmptyStateMessage }}
          </div>
          <div
            v-if="
              !noCongregationSelected &&
              (currentSettings?.disableMediaFetching ||
                !selectedDayMeetingType ||
                isErrorState)
            "
            class="row items-center justify-center q-mt-lg q-gutter-md"
          >
            <q-btn
              v-if="isErrorState"
              color="primary"
              unelevated
              @click="retryFetch?.()"
            >
              <q-icon class="q-mr-sm" name="mmm-refresh" size="xs" />
              {{ t('try-again') }}
            </q-btn>
            <q-btn
              class="btn-tonal"
              color="primary"
              flat
              @click="goToNextDayWithMedia?.()"
            >
              <q-icon class="q-mr-sm" name="mmm-go-to-date" size="xs" />
              {{ t('next-day-with-media') }}
            </q-btn>
            <q-btn
              v-if="globalSelectedDate"
              color="primary"
              unelevated
              @click="openImportMenu?.(undefined)"
            >
              <q-icon class="q-mr-sm" name="mmm-add-media" size="xs" />
              {{ t('add-extra-media') }}
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DateInfo, MediaSectionIdentifier } from 'src/types';

import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { TINY_SCREEN_WIDTH } from 'src/constants/general';
import { isWeMeetingDay } from 'src/helpers/date';
import { formatDate, getDateDiff } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const { t } = useI18n();
const isTiny = computed(() => $q.screen.width < TINY_SCREEN_WIDTH);

const props = defineProps<{
  // compact mode
  allItemsAreHidden?: boolean;
  compact?: boolean;
  goToNextDayWithMedia?: (ignoreTodaysDate?: boolean) => void;
  isCategory?: boolean;
  isDragging?: boolean;
  // full mode
  openImportMenu?: (section: MediaSectionIdentifier | undefined) => void;
  retryFetch?: () => void;
  selectedDate?: DateInfo | null;
  someItemsAreHidden?: boolean;
}>();

const currentState = useCurrentStateStore();
// Renamed from the store's own "selectedDate" to avoid colliding with this
// component's own `selectedDate` prop (the compact-mode day-info object) -
// they're unrelated values that happen to share a name.
const {
  currentCongregation,
  currentSettings,
  mediaRefreshPending,
  meetingCheckStatus,
  selectedDate: globalSelectedDate,
  selectedDateObject,
  selectedDayMeetingType,
} = storeToRefs(currentState);

// On app launch there's a brief window where a date is already selected
// (selectedDate defaults to today) but no congregation profile has been
// picked yet - selectedDateObject/selectedDayMeetingType are both still
// null at that point purely because there's nothing to look them up
// against, not because the selected date genuinely has no media. Without
// this, that startup gap would render "there are no media items for the
// selected date" for a congregation that hasn't even loaded its schedule
// yet. Routed to the same skeleton treatment as an in-flight fetch below
// rather than a distinct message, since there's nothing true to say yet.
const noCongregationSelected = computed(() => !currentCongregation.value);

// ---- compact-mode message selection (from the former SectionEmptyState) ----
const compactMessage = computed(() => {
  const date = props.selectedDate?.date;

  // 1. Dragging
  if (props.isDragging) return t('drop-media-here');

  // 2. No date
  if (!date) return t('noDateSelected');

  // 3. Hidden items logic
  if (props.allItemsAreHidden) return t('all-items-hidden');
  if (props.someItemsAreHidden) return t('some-media-items-are-hidden');

  // 4. Meeting-day logic
  if (isWeMeetingDay(date)) {
    const mediaSections = props.selectedDate?.mediaSections || {};
    const hasAnyMedia = Object.values(mediaSections).some(
      (section) => section.items?.length,
    );

    if (!hasAnyMedia) {
      return t('there-are-no-media-items-for-the-selected-date');
    }

    return t('dont-forget-add-missing-media');
  }

  // 5. Category empty
  if (props.isCategory) return t('no-media-for-this-category');

  // 6. Default
  return t('no-media-files-for-section');
});

// A day actively being (re)fetched should always show the loading skeleton,
// regardless of its last-known `status` - status can still read 'error' (or
// even a stale 'complete') for a while after a refetch has already been
// queued, since fetchMedia() sets meetingCheckStatus to 'checking' as a
// distinct, purpose-built "in flight" signal rather than relying on status
// alone. Without this, a day that errored before could sit on the plain
// empty-state message (no spinner) for the whole duration of its retry,
// then have media pop in with no loading indicator ever shown.
const isCheckingSelectedDay = computed(() => {
  const date = selectedDateObject.value?.date;
  if (!date) return false;
  if (meetingCheckStatus.value[formatDate(date, 'YYYYMMDD')] === 'checking') {
    return true;
  }
  // A refresh was just kicked off (e.g. a congregation switch) but hasn't
  // reached the point of deciding whether this specific day needs
  // rechecking yet - meetingCheckStatus has nothing for it either way at
  // this point, which would otherwise read as "not checking" and let stale
  // leftover status (or a stale error icon) flash before the real per-day
  // status is known.
  return (
    mediaRefreshPending.value &&
    !!selectedDayMeetingType.value &&
    !currentSettings.value?.disableMediaFetching
  );
});

// ---- full-mode logic (from the former MediaEmptyState) ----
const shouldShowSpinner = computed(() => {
  if (
    currentSettings.value?.disableMediaFetching ||
    !selectedDayMeetingType.value
  ) {
    return false;
  }

  if (isCheckingSelectedDay.value) {
    return true;
  }

  if (selectedDateObject.value?.status) {
    return false;
  }

  if (!currentSettings.value?.meteredConnection) {
    return true;
  }

  const date = selectedDateObject.value?.date;
  if (!date) {
    return false;
  }

  return getDateDiff(date, new Date(), 'days') <= 1;
});

const skeletonSections = computed(() => {
  const map = {
    mw: [
      { id: 1, itemCount: 2 },
      { id: 2, itemCount: 1 },
      { id: 3, itemCount: 4 },
    ],
    we: [
      { id: 1, itemCount: 1 },
      { id: 2, itemCount: 4 },
    ],
  };

  return map[selectedDayMeetingType.value || 'we'];
});

// A genuine fetch failure (not just "actively being rechecked" -
// isCheckingSelectedDay above already routes that to the spinner branch
// before this is ever consulted) deserves its own distinct empty-state
// branch rather than silently falling through to the generic "no media"
// message - a failed fetch and a day that simply has no media are different
// situations and the difference matters to the user (one has a fix - retry
// - the other doesn't).
const isErrorState = computed(
  () =>
    !isCheckingSelectedDay.value &&
    selectedDateObject.value?.status === 'error',
);

const emptyStateFlags = computed(() => {
  const fetchingEnabled = !currentSettings.value?.disableMediaFetching;
  const hasMeetingType = !!selectedDayMeetingType.value;
  const status = selectedDateObject.value?.status;

  const isFetchable = fetchingEnabled && hasMeetingType && status !== 'error';

  const isFarFutureOnMetered = (() => {
    if (!currentSettings.value?.meteredConnection) return false;
    const d = selectedDateObject.value?.date;
    return d && getDateDiff(d, new Date(), 'days') > 1;
  })();

  return {
    hasDate: !!globalSelectedDate.value,
    isFarFutureOnMetered,
    isFetchable,
  };
});

const primaryEmptyStateMessage = computed(() => {
  const f = emptyStateFlags.value;

  if (!f.hasDate) return t('noDateSelected');

  if (isErrorState.value)
    return t('unable-to-load-media-for-the-selected-date');

  if (f.isFetchable) {
    if (f.isFarFutureOnMetered) {
      return t('this-meeting-is-far-in-the-future');
    }
    return t('please-wait');
  }

  return t('there-are-no-media-items-for-the-selected-date');
});

const secondaryEmptyStateMessage = computed(() => {
  const f = emptyStateFlags.value;

  if (!f.hasDate) return t('select-a-date-to-begin');

  if (isErrorState.value) return '';

  if (f.isFetchable) {
    if (f.isFarFutureOnMetered) {
      return t('not-yet-available-due-to-metered-connection');
    }
    return t('currently-loading');
  }

  return t(
    'use-the-import-button-to-add-media-for-this-date-or-select-another-date-to-view-the-corresponding-meeting-media',
  );
});
</script>

<style lang="scss" scoped>
// The real bug (found after the color-contrast theory below turned out not
// to be it): this frame div sits between the flex row and <q-img>, and had
// no explicit width. <q-img> is `width: 100%` of ITS parent (this frame),
// and its height comes from a `padding-bottom: X%` trick that resolves
// against that same width - but the frame itself, as a plain block div with
// no width of its own inside a `row items-center` (align-items: center, not
// stretch) flex container, gets sized by max-content: a percentage-width
// child contributes no intrinsic size to that calculation, so the frame
// collapsed to 0 width, and the image collapsed to 0x0 inside it. The small
// colored box actually visible was just the frame's own padding - never the
// picture. An explicit width fixes the whole chain.
.no-media-illustration-frame {
  border-radius: 1.1em;
  width: 100%;
}

// no-media.svg is drawn with hardcoded light fills (white/pale-blue), so it
// reads as a washed-out slab directly on the dark-mode page background - the
// illustration already has its own light-blue backdrop shape baked in,
// which reads fine on a plain light page, so this background is only needed
// in dark mode.
body.body--dark .no-media-illustration-frame {
  background: $accent-100-dark;
  padding: 1em 1.5em;
}

// Larger than .icon-chip's default 2em - this is the sole focal illustration
// for the whole empty state (standing in for the no-media.svg it replaces
// in the error case), not a small leading icon next to a title.
.empty-state-error-icon {
  height: 4em;
  width: 4em;
}

// Before a congregation profile is chosen, the skeleton above has nothing
// real to report yet - not "loading this day's media" (that requires a
// congregation's schedule to look the date up against in the first place),
// just "the app itself is still settling". Blurring it (rather than
// rendering it sharp, or showing a text message) reads as an inert
// placeholder instead of a claim about the selected date, and matches the
// backdrop-filter blur DialogCongregationSwitcher.vue applies once its own
// picker actually appears a moment later.
.no-congregation-blur {
  filter: blur(3px);
  opacity: 0.6;
  pointer-events: none;
}
</style>
