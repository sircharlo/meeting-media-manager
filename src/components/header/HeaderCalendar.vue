<template>
  {{ mediaSortCanBeReset }}
  <SongPicker v-model="chooseSong" :section="section" />
  <PublicTalkMediaPicker v-model="publicTalkMediaPopup" :section="section" />
  <DialogRemoteVideo v-model="remoteVideoPopup" :section="section" />
  <DialogStudyBible v-model="studyBiblePopup" :section="section" />
  <DialogAudioBible v-model="audioBiblePopup" :section="section" />
  <DialogJwPlaylist
    v-model="jwPlaylistPopup"
    :jw-playlist-path="jwPlaylistPath"
    :section="section"
  />
  <DialogCustomSectionEdit v-model="customSectionPopup" />
  <transition
    appear
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut"
    mode="out-in"
    name="fade"
  >
    <q-btn
      v-if="mediaSortCanBeReset"
      color="white-transparent"
      :disable="mediaPlaying"
      unelevated
      @click="resetSort"
    >
      <q-icon
        :class="{ 'q-mr-sm': $q.screen.gt.sm }"
        name="mmm-reset"
        size="xs"
      />
      {{ $q.screen.gt.sm ? t('reset-sort-order') : '' }}
      <q-tooltip v-if="!$q.screen.gt.sm" :delay="1000">
        {{ t('reset-sort-order') }}
      </q-tooltip>
    </q-btn>
  </transition>
  <q-btn
    v-if="!selectedDateObject?.meeting"
    color="white-transparent"
    :disable="mediaPlaying"
    unelevated
    @click="customSectionPopup = true"
  >
    <q-icon
      :class="{ 'q-mr-sm': $q.screen.gt.xs }"
      name="mmm-label-sort"
      size="xs"
    />
    {{ $q.screen.gt.xs ? t('edit-sections') : '' }}
    <q-tooltip v-if="!$q.screen.gt.xs" :delay="1000">
      {{ t('edit-sections') }}
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
    {{ $q.screen.gt.xs ? t('extra-media') : '' }}
    <q-tooltip v-if="!$q.screen.gt.xs" :delay="1000">
      {{ t('extra-media') }}
    </q-tooltip>
    <q-menu ref="importMenu" :offset="[0, 11]">
      <q-list class="list-primary">
        <q-item-label header>{{ t('from-jw-org') }}</q-item-label>
        <q-item
          v-close-popup
          clickable
          :disable="!online"
          @click="chooseSong = true"
        >
          <q-item-section avatar>
            <q-icon color="primary" name="mmm-music-note" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('song') }}</q-item-label>
            <q-item-label caption>{{ t('from-songbook') }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          :disable="!online"
          @click="remoteVideoPopup = true"
        >
          <q-item-section avatar>
            <q-icon color="primary" name="mmm-movie" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('video') }}</q-item-label>
            <q-item-label caption>
              {{ t('latest-videos-from-jw-org') }}
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
            <q-icon color="primary" name="mmm-bible" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('study-bible') }}</q-item-label>
            <q-item-label caption>{{ t('study-bible-media') }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          :disable="!online"
          @click="audioBiblePopup = true"
        >
          <q-item-section avatar>
            <q-icon color="primary" name="mmm-audio-bible" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('audio-bible') }}</q-item-label>
            <q-item-label caption>{{ t('audio-bible-media') }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item-label header>{{ t('from-local-computer') }}</q-item-label>
        <q-item v-close-popup clickable @click="publicTalkMediaPopup = true">
          <q-item-section avatar>
            <q-icon color="primary" name="mmm-lectern" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('public-talk-media') }}</q-item-label>
            <q-item-label caption>{{ t('media-from-s34mp') }}</q-item-label>
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
          <q-item v-close-popup clickable @click="openFileImportDialog">
            <q-item-section avatar>
              <q-icon color="primary" :name="icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t(name ? name : '') }}</q-item-label>
              <q-item-label caption>{{ t(name + '-explain') }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template
          v-if="
            additionalMediaForSelectedDayExists ||
            someItemsHiddenForSelectedDate
          "
        >
          <q-item-label header>{{ t('dangerZone') }}</q-item-label>
          <q-item
            v-if="someItemsHiddenForSelectedDate"
            v-close-popup
            clickable
            @click="
              showHiddenMediaForSelectedDate(
                currentCongregation,
                selectedDateObject,
              )
            "
          >
            <q-item-section avatar>
              <q-icon color="primary" name="mmm-eye" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('show-hidden-media') }}</q-item-label>
              <q-item-label caption>
                {{ t('show-hidden-media-explain') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            v-if="additionalMediaForSelectedDayExists"
            v-close-popup
            clickable
            @click="mediaDeleteAllPending = true"
          >
            <q-item-section avatar>
              <q-icon color="negative" name="mmm-delete" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ t('delete-all-additional-media') }}
              </q-item-label>
              <q-item-label caption>
                {{ t('this-will-only-delete-media-for-this-day') }}
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
        {{ t('delete-all-additional-media') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{ t('are-you-sure-delete-all') }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn v-close-popup flat :label="t('cancel')" />
        <q-btn
          v-close-popup
          color="negative"
          flat
          :label="t('delete')"
          @click="
            clearAdditionalMediaForSelectedDate(
              currentCongregation,
              selectedDateObject,
            )
          "
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
    <q-tooltip v-if="!$q.screen.gt.xs" :delay="1000">
      {{ getLocalDate(selectedDate, dateLocale) || t('select-a-date') }}
    </q-tooltip>
    {{
      $q.screen.gt.xs
        ? getLocalDate(selectedDate, dateLocale) || t('select-a-date')
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
        no-unset
        :options="dateOptions"
      />
    </q-popup-proxy>
  </q-btn>
</template>
<script setup lang="ts">
import type { QMenu } from 'quasar';
import type { MediaSectionIdentifier } from 'src/types';

import { useEventListener } from '@vueuse/core';
import DialogAudioBible from 'components/dialog/DialogAudioBible.vue';
import DialogCustomSectionEdit from 'components/dialog/DialogCustomSectionEdit.vue';
import DialogJwPlaylist from 'components/dialog/DialogJwPlaylist.vue';
import DialogRemoteVideo from 'components/dialog/DialogRemoteVideo.vue';
import DialogStudyBible from 'components/dialog/DialogStudyBible.vue';
import PublicTalkMediaPicker from 'components/media/PublicTalkMediaPicker.vue';
import SongPicker from 'components/media/SongPicker.vue';
import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { SORTER } from 'src/constants/general';
import { standardSections } from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  datesAreSame,
  formatDate,
  friendlyDayToJsDay,
  getDateDiff,
  getLocalDate,
  getMaxDate,
  getMinDate,
} from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const jwStore = useJwStore();
const { clearAdditionalMediaForSelectedDate, showHiddenMediaForSelectedDate } =
  jwStore;
const { lookupPeriod } = storeToRefs(jwStore);

const { dateLocale } = useLocale();

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  getAllMediaForSection,
  getVisibleMediaForSection,
  mediaPlaying,
  online,
  selectedDate,
  selectedDateObject,
  someItemsHiddenForSelectedDate,
} = storeToRefs(currentState);

const section = ref<MediaSectionIdentifier | undefined>();
const publicTalkMediaPopup = ref(false);
const datePickerActive = ref(false);
const remoteVideoPopup = ref(false);
const studyBiblePopup = ref(false);
const audioBiblePopup = ref(false);
const jwPlaylistPopup = ref(false);
const jwPlaylistPath = ref('');
const customSectionPopup = ref(false);

const openFileImportDialog = () => {
  window.dispatchEvent(
    new CustomEvent<{ section: MediaSectionIdentifier | undefined }>(
      'openFileImportDialog',
      {
        detail: { section: section.value },
      },
    ),
  );
};

const additionalMediaDates = computed(() =>
  (
    lookupPeriod.value?.[currentCongregation.value]?.filter((day) =>
      day.dynamicMedia.some((media) => media.source !== 'dynamic'),
    ) || []
  ).map((day) => formatDate(day.date, 'YYYY/MM/DD')),
);

const additionalMediaForDayExists = (lookupDate: string) => {
  try {
    return (
      (lookupPeriod.value?.[currentCongregation.value]
        ?.find((day) => datesAreSame(lookupDate, day.date))
        ?.dynamicMedia.filter((media) => media.source !== 'dynamic')?.length ||
        0) > 0
    );
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const additionalMediaForSelectedDayExists = computed(
  () =>
    !!selectedDateObject.value?.dynamicMedia?.filter(
      (media) => media.source !== 'dynamic',
    )?.length,
);

const mediaDeleteAllPending = ref(false);

const getEventDates = () => {
  try {
    if (!lookupPeriod.value || !currentCongregation.value) return [];
    const meetingDates =
      lookupPeriod.value[currentCongregation.value]
        ?.filter((day) => day.meeting)
        .map((day) => formatDate(day.date, 'YYYY/MM/DD')) || [];
    return meetingDates.concat(additionalMediaDates.value);
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
    if (!dateArray[0]) return undefined;
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
    if (!dateArray[0]) return undefined;
    const maxDate = getMaxDate(dateArray[0], ...dateArray.slice(1));
    return formatDate(maxDate, 'YYYY/MM');
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

const importMenu = useTemplateRef<QMenu>('importMenu');
const openImportMenu = (newSection?: MediaSectionIdentifier) => {
  section.value = newSection;
  importMenu.value?.show();
};

const dateOptions = (lookupDate: string) => {
  try {
    if (!lookupPeriod.value || !lookupPeriod.value) return true;
    const dateArray: Date[] =
      lookupPeriod.value[currentCongregation.value]?.map((day) => day.date) ||
      [];
    if (!dateArray[0]) return true;
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
      (d) => datesAreSame(eventDate, d.date),
    );
    if (lookupDate?.error) {
      return 'negative';
    } else if (lookupDate?.complete) {
      return 'primary';
    }
    if (additionalMediaForDayExists(eventDate)) return 'additional';
  } catch (error) {
    errorCatcher(error);
    return 'negative';
  }
  return 'warning';
};

const chooseSong = ref(false);

const openSongPicker = (newSection?: MediaSectionIdentifier) => {
  section.value = newSection;
  chooseSong.value = true;
};

const openJwPlaylistPicker = (
  newSection?: MediaSectionIdentifier,
  playlistPath?: string,
) => {
  section.value = newSection;
  jwPlaylistPath.value = playlistPath || '';
  jwPlaylistPopup.value = true;
};

useEventListener<CustomEvent<{ section: MediaSectionIdentifier | undefined }>>(
  window,
  'openSongPicker',
  (e) => openSongPicker(e.detail?.section),
  { passive: true },
);
useEventListener<CustomEvent<{ section: MediaSectionIdentifier | undefined }>>(
  window,
  'openImportMenu',
  (e) => openImportMenu(e.detail?.section),
  { passive: true },
);
useEventListener<
  CustomEvent<{
    jwPlaylistPath: string;
    section: MediaSectionIdentifier | undefined;
  }>
>(
  window,
  'openJwPlaylistPicker',
  (e) => openJwPlaylistPicker(e.detail?.section, e.detail?.jwPlaylistPath),
  { passive: true },
);

const mediaSortCanBeReset = computed<boolean>(() => {
  if (
    !selectedDateObject.value?.dynamicMedia ||
    !(selectedDateObject.value?.meeting && selectedDateObject.value?.complete)
  )
    return false;

  const nonHiddenMedia = selectedDateObject.value.dynamicMedia.filter(
    (item) => !item.hidden,
  );

  const hasSectionChange = nonHiddenMedia.some((item) => {
    const inStandard =
      standardSections.includes(item.section) ||
      standardSections.includes(item.sectionOriginal);
    console.log(
      `Checking section change for item: ${item.uniqueId}`,
      inStandard && item.section !== item.sectionOriginal,
    );
    return inStandard && item.section !== item.sectionOriginal;
  });

  console.log('hasSectionChange:', hasSectionChange);

  if (hasSectionChange) {
    return true;
  }

  const watchedMediaToConsider = nonHiddenMedia.filter(
    (item) => item.source === 'watched',
  );

  console.log('watchedMediaToConsider', watchedMediaToConsider);

  for (let i = 0; i < watchedMediaToConsider.length - 1; i++) {
    const firstTitle = watchedMediaToConsider[i]?.title ?? '';
    const secondTitle = watchedMediaToConsider[i + 1]?.title ?? '';
    if (SORTER.compare(firstTitle, secondTitle) > 0) {
      return true; // Array is not sorted
    }
  }

  const mediaToConsider = [
    ...(getVisibleMediaForSection.value.tgw || []),
    ...(getVisibleMediaForSection.value.ayfm || []),
    ...(getVisibleMediaForSection.value.lac || []),
    ...(getVisibleMediaForSection.value.wt || []),
  ];

  console.log('mediaToConsider', mediaToConsider);

  for (let i = 0; i < mediaToConsider.length - 1; i++) {
    const firstSortOrder = mediaToConsider[i]?.sortOrderOriginal ?? 0;
    const secondSortOrder = mediaToConsider[i + 1]?.sortOrderOriginal ?? 0;
    console.log(
      `Comparing sortOrder: ${firstSortOrder} and ${secondSortOrder}`,
      i,
      i + 1,
      mediaToConsider[i]?.uniqueId,
      mediaToConsider[i]?.sectionOriginal,
      mediaToConsider[i]?.section,
    );
    if (firstSortOrder > secondSortOrder) {
      return true; // Array is not sorted
    }
  }
  return false; // Array is sorted
});

const resetSort = () => {
  if (!selectedDateObject.value?.dynamicMedia) return;

  selectedDateObject.value.dynamicMedia.forEach((item) => {
    if (item.sectionOriginal !== item.section) {
      item.section = item.sectionOriginal;
    }
  });

  // Remove dynamicMedia with item.source === 'watched', in place, and then add them back but sorted by sortOrderOriginal
  const watchedMedia = selectedDateObject.value.dynamicMedia.filter(
    (item) => item.source === 'watched',
  );
  selectedDateObject.value.dynamicMedia =
    selectedDateObject.value.dynamicMedia.filter(
      (item) => item.source !== 'watched',
    );

  watchedMedia.sort((a, b) =>
    SORTER.compare(
      a?.sortOrderOriginal?.toString() ?? '0',
      b?.sortOrderOriginal?.toString() ?? '0',
    ),
  );

  selectedDateObject.value.dynamicMedia.push(...watchedMedia);

  // Combine all media items into one array
  const mediaToSort = [
    ...(getAllMediaForSection.value.tgw || []),
    ...(getAllMediaForSection.value.ayfm || []),
    ...(getAllMediaForSection.value.lac || []),
    ...(getAllMediaForSection.value.wt || []),
  ];

  // Sort the media array in ascending order by `sortOrderOriginal`
  const sortedMedia = mediaToSort.sort((a, b) =>
    SORTER.compare(
      a?.sortOrderOriginal?.toString() ?? '0',
      b?.sortOrderOriginal?.toString() ?? '0',
    ),
  );

  const customSections = [
    ...new Set(
      selectedDateObject.value?.customSections?.map(
        (section) => section.uniqueId,
      ) ?? [],
    ),
  ];

  const mediaFromCustomSections = customSections.flatMap(
    (sectionId) =>
      selectedDateObject.value?.dynamicMedia?.filter(
        (item) => item.section === sectionId,
      ) || [],
  );

  selectedDateObject.value.dynamicMedia = [
    ...mediaFromCustomSections,
    ...sortedMedia.filter((item) => item.section === 'tgw'),
    ...sortedMedia.filter((item) => item.section === 'ayfm'),
    ...sortedMedia.filter((item) => item.section === 'lac'),
    ...sortedMedia.filter((item) => item.section === 'wt'),
    ...(getAllMediaForSection.value.circuitOverseer || []),
  ];
};
</script>
