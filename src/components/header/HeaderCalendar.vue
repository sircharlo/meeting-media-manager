<template>
  <SongPicker v-model="chooseSong" :section="section" />
  <PublicTalkMediaPicker v-model="publicTalkMediaPopup" />
  <DialogRemoteVideo v-model="remoteVideoPopup" :section="section" />
  <DialogStudyBible v-model="studyBiblePopup" :section="section" />
  <q-btn
    color="white-transparent"
    :disable="mediaPlaying || !mediaSortForDay"
    unelevated
    @click="resetSort"
  >
    <q-icon
      :class="{ 'q-mr-sm': $q.screen.gt.sm }"
      name="mmm-reset"
      size="xs"
    />
    {{ $q.screen.gt.sm ? $t('reset-sort-order') : '' }}
    <q-tooltip v-if="!$q.screen.gt.xs" :delay="1000">
      {{ $t('reset-sort-order') }}
    </q-tooltip>
  </q-btn>
  <q-btn
    v-if="selectedDate"
    color="white-transparent"
    unelevated
    @click="section = undefined"
  >
    <q-icon
      :class="{ 'q-mr-sm': $q.screen.gt.xs }"
      name="mmm-add-media"
      size="xs"
    />
    {{ $q.screen.gt.xs ? $t('extra-media') : '' }}
    <q-tooltip v-if="!$q.screen.gt.xs" :delay="1000">
      {{ $t('extra-media') }}
    </q-tooltip>
    <q-menu ref="importMenu" :offset="[0, 11]">
      <q-list style="min-width: 100px">
        <q-item-label header>{{ $t('from-jw-org') }}</q-item-label>
        <q-item
          v-close-popup
          clickable
          :disable="!online"
          @click="chooseSong = true"
        >
          <q-item-section avatar>
            <q-icon color="accent-400" name="mmm-music-note" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('song') }}</q-item-label>
            <q-item-label caption>{{ $t('from-songbook') }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          :disable="!online"
          @click="remoteVideoPopup = true"
        >
          <q-item-section avatar>
            <q-icon color="accent-400" name="mmm-movie" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('video') }}</q-item-label>
            <q-item-label caption>
              {{ $t('latest-videos-from-jw-org') }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          :disable="!online"
          @click="studyBiblePopup = true"
        >
          <q-item-section avatar>
            <q-icon color="accent-400" name="mmm-bible" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('study-bible') }}</q-item-label>
            <q-item-label caption>{{ $t('study-bible-media') }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item-label header>{{ $t('from-local-computer') }}</q-item-label>
        <q-item v-close-popup clickable @click="publicTalkMediaPopup = true">
          <q-item-section avatar>
            <q-icon color="accent-400" name="mmm-lectern" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('public-talk-media') }}</q-item-label>
            <q-item-label caption>{{ $t('media-from-s34mp') }}</q-item-label>
          </q-item-section>
        </q-item>
        <template
          v-for="[icon, name] in [
            ['mmm-local-media', 'images-videos'],
            ['mmm-jwpub', 'jwpub-file'],
            ['mmm-jwlplaylist', 'jw-playlist'],
          ]"
          :key="name"
        >
          <q-item v-close-popup clickable @click="openDragAndDropper">
            <q-item-section avatar>
              <q-icon color="accent-400" :name="icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t(name) }}</q-item-label>
              <q-item-label caption>{{ $t(name + '-explain') }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template v-if="additionalMediaForDay || hiddenMediaForDay">
          <q-item-label header>{{ $t('dangerZone') }}</q-item-label>
          <q-item
            v-if="hiddenMediaForDay"
            v-close-popup
            clickable
            @click="showCurrentDayHiddenMedia()"
          >
            <q-item-section avatar>
              <q-icon color="accent-400" name="mmm-eye" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('show-hidden-media') }}</q-item-label>
              <q-item-label caption>
                {{ $t('show-hidden-media-explain') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            v-if="additionalMediaForDay"
            v-close-popup
            clickable
            @click="mediaDeleteAllPending = true"
          >
            <q-item-section avatar>
              <q-icon color="negative" name="mmm-delete" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ $t('delete-all-additional-media') }}
              </q-item-label>
              <q-item-label caption>
                {{ $t('this-will-only-delete-media-for-this-day') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-menu>
  </q-btn>
  <q-dialog v-model="mediaDeleteAllPending" persistent>
    <q-card class="modal-confirm">
      <q-card-section
        class="row items-center text-bigger text-semibold text-negative q-pb-none"
      >
        <q-icon class="q-mr-sm" name="mmm-delete" />
        {{ $t('delete-all-additional-media') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{ $t('are-you-sure-delete-all') }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn v-close-popup flat :label="$t('cancel')" />
        <q-btn
          v-close-popup
          color="negative"
          flat
          :label="$t('delete')"
          @click="clearCurrentDayAdditionalMedia()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-btn color="white-transparent" :disable="mediaPlaying" unelevated>
    <q-icon
      :class="{ 'q-mr-sm': $q.screen.gt.xs }"
      name="mmm-calendar-month"
      size="xs"
    />
    {{
      $q.screen.gt.xs
        ? getLocalDate(selectedDate, dateLocale) || $t('select-a-date')
        : ''
    }}
    <q-popup-proxy v-model="datePickerActive" :offset="[0, 11]">
      <q-date
        v-model="selectedDate"
        :event-color="getEventDayColor"
        :events="getEventDates()"
        :first-day-of-week="friendlyDayToJsDay(currentSettings?.firstDayOfWeek)"
        :locale="dateLocale"
        minimal
        :navigation-max-year-month="maxDate()"
        :navigation-min-year-month="minDate()"
        :options="dateOptions"
      />
    </q-popup-proxy>
  </q-btn>
</template>
<script setup lang="ts">
// Types
import type { MediaSection } from 'src/types';

// Packages
import { useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { date, type QMenu } from 'quasar';
// Components
import DialogRemoteVideo from 'src/components/dialog/DialogRemoteVideo.vue';
import DialogStudyBible from 'src/components/dialog/DialogStudyBible.vue';
import PublicTalkMediaPicker from 'src/components/media/PublicTalkMediaPicker.vue';
import SongPicker from 'src/components/media/SongPicker.vue';
// Composables
import { useLocale } from 'src/composables/useLocale';
// Helpers
import { friendlyDayToJsDay, getLocalDate } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
// Stores
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { computed, ref, useTemplateRef } from 'vue';

const { formatDate, getDateDiff, getMaxDate, getMinDate } = date;

const jwStore = useJwStore();
const { clearCurrentDayAdditionalMedia, resetSort, showCurrentDayHiddenMedia } =
  jwStore;
const { additionalMediaMaps, lookupPeriod, mediaSort } = storeToRefs(jwStore);

const { dateLocale } = useLocale();

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  mediaPlaying,
  online,
  selectedDate,
  watchFolderMedia,
} = storeToRefs(currentState);

const section = ref<MediaSection | undefined>();
const publicTalkMediaPopup = ref(false);
const datePickerActive = ref(false);
const remoteVideoPopup = ref(false);
const studyBiblePopup = ref(false);

const openDragAndDropper = () => {
  window.dispatchEvent(
    new CustomEvent<{ section?: MediaSection }>('openDragAndDropper', {
      detail: { section: section.value },
    }),
  );
};

const mediaSortForDay = computed(() => {
  if (!selectedDate.value || !currentCongregation.value || !mediaSort.value)
    return false;
  try {
    return (
      (mediaSort.value?.[currentCongregation.value]?.[selectedDate.value]
        ?.length || 0) > 0
    );
  } catch (error) {
    errorCatcher(error);
    return false;
  }
});

const additionalMediaForDay = computed(
  () =>
    (additionalMediaMaps.value?.[currentCongregation.value]?.[
      selectedDate.value
    ]?.length || 0) > 0,
);

const hiddenMediaForDay = computed(() =>
  (
    lookupPeriod.value?.[currentCongregation.value]?.find(
      (day) => formatDate(day.date, 'YYYY/MM/DD') === selectedDate.value,
    )?.dynamicMedia || []
  )
    .concat(
      additionalMediaMaps.value?.[currentCongregation.value]?.[
        selectedDate.value
      ] || [],
    )
    .concat(watchFolderMedia.value?.[selectedDate.value] || [])
    .some((media) => media.hidden),
);

const mediaDeleteAllPending = ref(false);

const getEventDates = () => {
  try {
    if (
      !(lookupPeriod.value || additionalMediaMaps.value) ||
      !currentCongregation.value
    )
      return [];
    const meetingDates =
      lookupPeriod.value[currentCongregation.value]
        ?.filter((day) => day.meeting)
        .map((day) => formatDate(day.date, 'YYYY/MM/DD')) || [];
    const additionalMedia =
      additionalMediaMaps.value[currentCongregation.value];
    const additionalMediaDates = additionalMedia
      ? Object.keys(additionalMedia)
          .filter((day) => (additionalMedia[day]?.length || 0) > 0)
          .map((day) => formatDate(day, 'YYYY/MM/DD'))
      : [];
    return meetingDates.concat(additionalMediaDates);
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

const minDate = () => {
  try {
    if (!lookupPeriod.value || !currentCongregation.value) return undefined;
    const dateArray: Date[] =
      lookupPeriod.value[currentCongregation.value]?.map((day) => day.date) ||
      [];
    const minDate = getMinDate(dateArray[0], ...dateArray.slice(1));
    return formatDate(minDate, 'YYYY/MM');
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

const maxDate = () => {
  try {
    if (!lookupPeriod.value || !currentCongregation.value) return undefined;
    const dateArray: Date[] =
      lookupPeriod.value[currentCongregation.value]?.map((day) => day.date) ||
      [];
    const maxDate = getMaxDate(dateArray[0], ...dateArray.slice(1));
    return formatDate(maxDate, 'YYYY/MM');
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

const importMenu = useTemplateRef<QMenu>('importMenu');
const openImportMenu = (newSection?: MediaSection) => {
  section.value = newSection;
  importMenu.value?.show();
};

const dateOptions = (lookupDate: string) => {
  try {
    if (!lookupPeriod.value || !lookupPeriod.value) return true;
    const dateArray: Date[] =
      lookupPeriod.value[currentCongregation.value]?.map((day) => day.date) ||
      [];
    const minDate = getMinDate(dateArray[0], ...dateArray.slice(1));
    const maxDate = getMaxDate(dateArray[0], ...dateArray.slice(1));
    return (
      getDateDiff(lookupDate, minDate, 'days') >= 0 &&
      getDateDiff(lookupDate, maxDate, 'days') <= 0
    );
  } catch (error) {
    errorCatcher(error);
    return true;
  }
};

const getEventDayColor = (eventDate: string) => {
  try {
    if (!lookupPeriod.value || !currentCongregation.value)
      throw new Error('No congregation or lookup period');
    const lookupDate = lookupPeriod.value[currentCongregation.value]?.find(
      (d) => getDateDiff(eventDate, d.date, 'days') === 0,
    );
    if (lookupDate?.error) {
      return 'negative';
    } else if (lookupDate?.complete) {
      return 'primary';
    }
    const additionalDates =
      additionalMediaMaps.value[currentCongregation.value];
    if (additionalDates) {
      const isAdditional = Object.keys(additionalDates)
        .filter((day) => (additionalDates[day]?.length || 0) > 0)
        .map((day) => formatDate(day, 'YYYY/MM/DD'))
        .includes(eventDate);
      if (isAdditional) return 'additional';
    }
  } catch (error) {
    errorCatcher(error);
    return 'negative';
  }
  return 'warning';
};

const chooseSong = ref(false);

const openSongPicker = (newSection?: MediaSection) => {
  section.value = newSection;
  chooseSong.value = true;
};

useEventListener<CustomEvent<{ section?: MediaSection }>>(
  window,
  'openSongPicker',
  (e) => openSongPicker(e.detail?.section),
);
useEventListener<CustomEvent<{ section?: MediaSection }>>(
  window,
  'openImportMenu',
  (e) => openImportMenu(e.detail?.section),
);
</script>
