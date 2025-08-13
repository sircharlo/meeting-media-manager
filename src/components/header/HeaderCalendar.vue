<template>
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
      :disable="mediaIsPlaying"
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
  <!-- Section: {{ section }} -->
  <q-btn
    v-if="canEditCustomSections"
    color="white-transparent"
    :disable="mediaIsPlaying"
    unelevated
    @click="openCustomSectionEdit"
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
          @click="openSongPickerWithSectionCheck(section)"
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
          @click="openRemoteVideoWithSectionCheck"
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
          @click="openStudyBibleWithSectionCheck"
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
          @click="openAudioBibleWithSectionCheck"
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
        <q-item
          v-close-popup
          clickable
          @click="openPublicTalkMediaPickerWithSectionCheck"
        >
          <q-item-section avatar>
            <q-icon color="primary" name="mmm-lectern" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('pt-media') }}</q-item-label>
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
  <BaseDialog v-model="mediaDeleteAllPending" :dialog-id="dialogId" persistent>
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
        <q-btn
          flat
          :label="t('cancel')"
          @click="mediaDeleteAllPending = false"
        />
        <q-btn
          color="negative"
          flat
          :label="t('delete')"
          @click="
            clearAdditionalMediaForSelectedDate(
              currentCongregation,
              selectedDateObject,
            );
            mediaDeleteAllPending = false;
          "
        />
      </q-card-actions>
    </q-card>
  </BaseDialog>
  <q-btn color="white-transparent" :disable="mediaIsPlaying" unelevated>
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

  <!-- Dialog Components -->
  <DialogCustomSectionEdit
    v-model="showCustomSectionEdit"
    :dialog-id="'header-calendar-custom-section-edit'"
  />
  <DialogSectionPicker
    v-model="showSectionPicker"
    :files="pendingFiles"
    @section-selected="handleSectionSelected"
  />
  <DialogRemoteVideo
    v-model="showRemoteVideo"
    :dialog-id="'header-calendar-remote-video'"
    :section="section"
  />
  <DialogStudyBible
    v-model="showStudyBible"
    :dialog-id="'header-calendar-study-bible'"
    :section="section"
  />
  <DialogAudioBible
    v-model="showAudioBible"
    :dialog-id="'header-calendar-audio-bible'"
    :section="section"
  />
  <DialogSongPicker
    v-model="showSongPicker"
    :dialog-id="'header-calendar-song-picker'"
    :section="section"
  />
  <DialogPublicTalkMediaPicker
    v-model="showPublicTalkMediaPicker"
    :dialog-id="'header-calendar-pt-media-picker'"
    :section="section"
  />
  <DialogJwPlaylist
    v-model="showJwPlaylist"
    :dialog-id="'header-calendar-jw-playlist'"
    :jw-playlist-path="jwPlaylistPath"
    :section="section"
  />
</template>
<script setup lang="ts">
import type { QMenu } from 'quasar';
import type { MediaItem, MediaSectionIdentifier } from 'src/types';

import { useEventListener } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import DialogAudioBible from 'components/dialog/DialogAudioBible.vue';
import DialogCustomSectionEdit from 'components/dialog/DialogCustomSectionEdit.vue';
import DialogJwPlaylist from 'components/dialog/DialogJwPlaylist.vue';
import DialogPublicTalkMediaPicker from 'components/dialog/DialogPublicTalkMediaPicker.vue';
import DialogRemoteVideo from 'components/dialog/DialogRemoteVideo.vue';
import DialogSectionPicker from 'components/dialog/DialogSectionPicker.vue';
import DialogSongPicker from 'components/dialog/DialogSongPicker.vue';
import DialogStudyBible from 'components/dialog/DialogStudyBible.vue';
import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { SORTER } from 'src/constants/general';
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
const dialogId = 'media-delete-all-dialog';
const { clearAdditionalMediaForSelectedDate, showHiddenMediaForSelectedDate } =
  jwStore;
const { lookupPeriod } = storeToRefs(jwStore);

const { dateLocale } = useLocale();

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  mediaIsPlaying,
  online,
  selectedDate,
  selectedDateObject,
  someItemsHiddenForSelectedDate,
} = storeToRefs(currentState);

const section = ref<MediaSectionIdentifier | undefined>();
const datePickerActive = ref(false);

// Dialog state refs
const showCustomSectionEdit = ref(false);
const showRemoteVideo = ref(false);
const showStudyBible = ref(false);
const showAudioBible = ref(false);
const showSongPicker = ref(false);
const showPublicTalkMediaPicker = ref(false);
const showJwPlaylist = ref(false);
const jwPlaylistPath = ref('');
const showSectionPicker = ref(false);
const pendingFiles = ref<(File | string)[]>([]);

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
    lookupPeriod.value?.[currentCongregation.value]?.filter((day) => {
      if (!day.mediaSections) return false;
      return Object.values(day.mediaSections).some((sectionMedia) =>
        sectionMedia.items?.some((media) => media.source !== 'dynamic'),
      );
    }) || []
  ).map((day) => formatDate(day.date, 'YYYY/MM/DD')),
);

const additionalMediaForDayExists = (lookupDate: string) => {
  try {
    const day = lookupPeriod.value?.[currentCongregation.value]?.find((day) =>
      datesAreSame(lookupDate, day.date),
    );

    if (!day?.mediaSections) return false;

    const additionalMediaCount = Object.values(day.mediaSections).reduce(
      (total, sectionMedia) => {
        return (
          total +
          (sectionMedia.items?.filter((media) => media.source !== 'dynamic')
            .length || 0)
        );
      },
      0,
    );

    return additionalMediaCount > 0;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const additionalMediaForSelectedDayExists = computed(() => {
  if (!selectedDateObject.value?.mediaSections) return false;
  const allMedia: MediaItem[] = [];
  Object.values(selectedDateObject.value.mediaSections).forEach(
    (sectionMedia) => {
      allMedia.push(...(sectionMedia.items || []));
    },
  );
  return allMedia.some((media) => media.source !== 'dynamic');
});

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
const openImportMenuWithSectionCheck = (
  newSection?: MediaSectionIdentifier,
) => {
  if (newSection) {
    section.value = newSection;
    importMenu.value?.show();
  } else if (hasMultipleSections.value) {
    pendingDialogAction.value = () => {
      importMenu.value?.show();
    };
    showSectionPicker.value = true;
  } else {
    // If only one section exists, show the import menu directly
    importMenu.value?.show();
  }
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
    if (additionalMediaForDayExists(eventDate)) return 'imported-media';
  } catch (error) {
    errorCatcher(error);
    return 'negative';
  }
  return 'warning';
};

useEventListener<CustomEvent<{ section: MediaSectionIdentifier | undefined }>>(
  window,
  'openSongPicker',
  (e) => openSongPickerWithSectionCheck(e.detail?.section),
  { passive: true },
);
useEventListener<CustomEvent<{ section: MediaSectionIdentifier | undefined }>>(
  window,
  'openImportMenu',
  (e) => openImportMenuWithSectionCheck(e.detail?.section),
  { passive: true },
);
useEventListener<
  CustomEvent<{
    jwPlaylistPath: string;
    section: MediaSectionIdentifier | undefined;
  }>
>(window, 'openJwPlaylistPicker', (e) => {
  console.log('🎯 openJwPlaylistPicker event received:', e.detail);
  openJwPlaylistPickerWithSectionCheck(
    e.detail?.section,
    e.detail?.jwPlaylistPath,
  );
});

const mediaSortCanBeReset = computed<boolean>(() => {
  if (
    !selectedDateObject.value?.mediaSections ||
    !(selectedDateObject.value?.meeting && selectedDateObject.value?.complete)
  )
    return false;

  const allMedia: MediaItem[] = Object.values(
    selectedDateObject.value.mediaSections,
  ).flatMap((section) => section.items || []);

  const nonHiddenMedia = allMedia.filter((item) => !item.hidden);

  const hasSectionChange =
    selectedDateObject.value?.mediaSections?.some((section) =>
      section.items?.some(
        (item) =>
          item.originalSection &&
          item.originalSection !== section.config.uniqueId,
      ),
    ) ?? false;

  if (hasSectionChange) {
    return true;
  }

  const watchedMediaToConsider = nonHiddenMedia.filter(
    (item) => item.source === 'watched',
  );

  for (let i = 0; i < watchedMediaToConsider.length - 1; i++) {
    const firstTitle = watchedMediaToConsider[i]?.title ?? '';
    const secondTitle = watchedMediaToConsider[i + 1]?.title ?? '';
    if (SORTER.compare(firstTitle, secondTitle) > 0) {
      return true; // Array is not sorted
    }
  }

  const mediaToConsider = [
    ...(selectedDateObject.value?.mediaSections
      ?.find((section) => section.config.uniqueId === 'tgw')
      ?.items?.filter((item) => !item.hidden) || []),
    ...(selectedDateObject.value?.mediaSections
      ?.find((section) => section.config.uniqueId === 'ayfm')
      ?.items?.filter((item) => !item.hidden) || []),
    ...(selectedDateObject.value?.mediaSections
      ?.find((section) => section.config.uniqueId === 'lac')
      ?.items?.filter((item) => !item.hidden) || []),
    ...(selectedDateObject.value?.mediaSections
      ?.find((section) => section.config.uniqueId === 'wt')
      ?.items?.filter((item) => !item.hidden) || []),
  ];

  for (let i = 0; i < mediaToConsider.length - 1; i++) {
    const firstSortOrder = mediaToConsider[i]?.sortOrderOriginal ?? 0;
    const secondSortOrder = mediaToConsider[i + 1]?.sortOrderOriginal ?? 0;
    if (firstSortOrder > secondSortOrder) {
      return true; // Array is not sorted
    }
  }
  return false; // Array is sorted
});

const resetSort = () => {
  if (!selectedDateObject.value?.mediaSections) return;

  // First, move items back to their original sections based on originalSection
  const itemsToMove: {
    fromSection: MediaSectionIdentifier;
    item: MediaItem;
    toSection: MediaSectionIdentifier;
  }[] = [];

  selectedDateObject.value.mediaSections.forEach((sectionData) => {
    if (!sectionData?.items || !sectionData.config) return;

    sectionData.items.forEach((item) => {
      // If item has originalSection and it's different from current section, it needs to be moved
      if (
        item.originalSection &&
        item.originalSection !== sectionData.config.uniqueId
      ) {
        itemsToMove.push({
          fromSection: sectionData.config.uniqueId,
          item,
          toSection: item.originalSection,
        });
      }
    });
  });

  // Move items to their original sections
  itemsToMove.forEach(({ fromSection, item, toSection }) => {
    // Remove from current section
    const fromSectionData = selectedDateObject.value?.mediaSections.find(
      (section) => section.config.uniqueId === fromSection,
    );
    if (fromSectionData?.items) {
      fromSectionData.items = fromSectionData.items.filter(
        (i) => i.uniqueId !== item.uniqueId,
      );
    }

    // Add to original section
    let toSectionData = selectedDateObject.value?.mediaSections.find(
      (section) => section.config.uniqueId === toSection,
    );
    if (!toSectionData && selectedDateObject.value) {
      toSectionData = {
        config: { uniqueId: toSection },
        items: [],
      };
      selectedDateObject.value.mediaSections.push(toSectionData);
    }
    if (toSectionData?.items) {
      toSectionData.items.push(item);
    }
  });

  // Then sort each section by sortOrderOriginal
  const sectionsToSort = [
    'tgw',
    'ayfm',
    'lac',
    'wt',
    'circuit-overseer',
  ] as const;

  sectionsToSort.forEach((sectionId) => {
    const sectionMedia = selectedDateObject.value?.mediaSections.find(
      (section) => section.config.uniqueId === sectionId,
    );
    if (!sectionMedia?.items?.length) return;
    // Sort by sortOrderOriginal
    sectionMedia.items.sort((a, b) =>
      SORTER.compare(
        a?.sortOrderOriginal?.toString() ?? '0',
        b?.sortOrderOriginal?.toString() ?? '0',
      ),
    );
  });

  // Trigger visual update by dispatching events
  window.dispatchEvent(new CustomEvent('reset-sort-order'));

  // Add a small delay to ensure the reset-sort-order event is processed first
  // setTimeout(() => {
  //   window.dispatchEvent(new CustomEvent('force-calendar-update'));
  // }, 100);
};

const openCustomSectionEdit = () => {
  showCustomSectionEdit.value = true;
};

const handleSectionSelected = (selectedSection: MediaSectionIdentifier) => {
  section.value = selectedSection;
  showSectionPicker.value = false;

  // Now open the pending dialog with the selected section
  if (pendingDialogAction.value) {
    pendingDialogAction.value();
    pendingDialogAction.value = null;
  }
};

// Store the pending dialog action
const pendingDialogAction = ref<(() => void) | null>(null);

// Wrapper functions that check for section specification
const openRemoteVideoWithSectionCheck = () => {
  if (section.value) {
    showRemoteVideo.value = true;
  } else if (hasMultipleSections.value) {
    pendingDialogAction.value = () => {
      showRemoteVideo.value = true;
    };
    showSectionPicker.value = true;
  } else {
    // If only one section exists, use it directly
    showRemoteVideo.value = true;
  }
};

const openStudyBibleWithSectionCheck = () => {
  if (section.value) {
    showStudyBible.value = true;
  } else if (hasMultipleSections.value) {
    pendingDialogAction.value = () => {
      showStudyBible.value = true;
    };
    showSectionPicker.value = true;
  } else {
    // If only one section exists, use it directly
    showStudyBible.value = true;
  }
};

const openAudioBibleWithSectionCheck = () => {
  if (section.value) {
    showAudioBible.value = true;
  } else if (hasMultipleSections.value) {
    pendingDialogAction.value = () => {
      showAudioBible.value = true;
    };
    showSectionPicker.value = true;
  } else {
    // If only one section exists, use it directly
    showAudioBible.value = true;
  }
};

const openSongPickerWithSectionCheck = (
  newSection?: MediaSectionIdentifier,
) => {
  if (newSection || section.value) {
    section.value = newSection || section.value;
    showSongPicker.value = true;
  } else if (hasMultipleSections.value) {
    pendingDialogAction.value = () => {
      showSongPicker.value = true;
    };
    showSectionPicker.value = true;
  } else {
    // If only one section exists, use it directly
    showSongPicker.value = true;
  }
};

const openPublicTalkMediaPickerWithSectionCheck = () => {
  if (section.value) {
    showPublicTalkMediaPicker.value = true;
  } else if (hasMultipleSections.value) {
    pendingDialogAction.value = () => {
      showPublicTalkMediaPicker.value = true;
    };
    showSectionPicker.value = true;
  } else {
    // If only one section exists, use it directly
    showPublicTalkMediaPicker.value = true;
  }
};

const openJwPlaylistPickerWithSectionCheck = (
  newSection?: MediaSectionIdentifier,
  playlistPath?: string,
) => {
  if (newSection || section.value) {
    section.value = newSection || section.value;
    jwPlaylistPath.value = playlistPath || '';
    showJwPlaylist.value = true;
  } else if (hasMultipleSections.value) {
    pendingDialogAction.value = () => {
      jwPlaylistPath.value = playlistPath || '';
      showJwPlaylist.value = true;
    };
    showSectionPicker.value = true;
  } else {
    // If only one section exists, use it directly
    jwPlaylistPath.value = playlistPath || '';
    showJwPlaylist.value = true;
  }
};

const canEditCustomSections = computed(() => {
  return !!(
    !selectedDateObject.value?.meeting &&
    selectedDateObject.value?.mediaSections &&
    selectedDateObject.value.mediaSections.some(
      (section) => !!section.items?.length,
    )
  );
});

// Check if there are multiple sections for the selected date
const hasMultipleSections = computed(() => {
  return (selectedDateObject.value?.mediaSections?.length || 0) > 1;
});
</script>
