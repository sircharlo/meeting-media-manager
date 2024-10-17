<template>
  <SongPicker v-model="chooseSong" />
  <PublicTalkMediaPicker v-model="publicTalkMediaPopup" />
  <q-btn
    :disable="mediaPlaying || !mediaSortForDay"
    color="white-transparent"
    unelevated
    @click="resetSort"
  >
    <q-icon
      :class="{ 'q-mr-sm': $q.screen.gt.sm }"
      name="mmm-reset"
      size="xs"
    />
    {{ $q.screen.gt.sm ? $t('reset-sort-order') : '' }}
    <q-tooltip :delay="1000">
      {{ $t('reset-sort-order') }}
    </q-tooltip>
  </q-btn>
  <q-btn v-if="selectedDate" color="white-transparent" unelevated>
    <q-icon
      :class="{ 'q-mr-sm': $q.screen.gt.sm }"
      name="mmm-import-media"
      size="xs"
    />
    {{ $q.screen.gt.sm ? $t('import-media') : '' }}
    <q-tooltip :delay="1000">
      {{ $t('import-media') }}
    </q-tooltip>
    <q-menu ref="importMenu" :offset="[0, 11]" class="top-menu">
      <q-list style="min-width: 100px">
        <q-item-label header>{{ $t('from-jw-org') }}</q-item-label>
        <q-item
          v-close-popup
          :disable="!online"
          clickable
          @click="chooseSong = true"
        >
          <q-item-section avatar>
            <q-icon color="primary" name="mmm-music-note" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('song') }}</q-item-label>
            <q-item-label caption>{{ $t('from-songbook') }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          :disable="!online"
          clickable
          @click="
            remoteVideoPopup = true;
            getJwVideos();
          "
        >
          <q-item-section avatar>
            <q-icon color="primary" name="mmm-movie" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('video') }}</q-item-label>
            <q-item-label caption>{{
              $t('latest-videos-from-jw-org')
            }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="publicTalkMediaPopup = true">
          <q-item-section avatar>
            <q-icon color="primary" name="mmm-lectern" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('public-talk-media') }}</q-item-label>
            <q-item-label caption>{{ $t('media-from-s34mp') }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item-label header>{{ $t('from-local-computer') }}</q-item-label>
        <template
          v-for="[icon, name] in [
            ['mmm-local-media', 'images-videos'],
            ['mmm-jwpub', 'jwpub-file'],
            ['mmm-jwlplaylist', 'jw-playlist'],
          ]"
          :key="name"
        >
          <q-item v-close-popup clickable @click="dragging">
            <q-item-section avatar>
              <q-icon :name="icon" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t(name) }}</q-item-label>
              <q-item-label caption>{{ $t(name + '-explain') }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-menu>
  </q-btn>
  <q-btn :disable="mediaPlaying" color="white-transparent" unelevated>
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
        :locale="dateLocale"
        :navigation-max-year-month="maxDate()"
        :navigation-min-year-month="minDate()"
        :options="dateOptions"
        minimal
      />
        <!-- <div class="row items-center justify-end q-gutter-sm">
          <q-btn v-close-popup :label="$t('close')" color="primary" outline />
        </div> -->
      <!-- </q-date> -->
    </q-popup-proxy>
  </q-btn>
  <DialogRemoteVideo
    v-model="remoteVideoPopup"
    :remote-videos="remoteVideos"
    :remote-videos-loading-progress="remoteVideosLoadingProgress"
  />
</template>
<script setup lang="ts">
// Packages
import { storeToRefs } from 'pinia';
import { date, QMenu } from 'quasar';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// Globals
import { get } from 'src/boot/axios';

// Composables
import { useLocale } from 'src/composables/useLocale';

// Components
import DialogRemoteVideo from 'src/components/dialog/DialogRemoteVideo.vue';
import PublicTalkMediaPicker from 'src/components/media/PublicTalkMediaPicker.vue';
import SongPicker from 'src/components/media/SongPicker.vue';

// Helpers
import { getLocalDate } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';

// Stores
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';

// Types
import type { JwVideoCategory, MediaItemsMediatorItem } from 'src/types';

const jwStore = useJwStore();
const { resetSort } = jwStore;
const { additionalMediaMaps, lookupPeriod, mediaSort } = storeToRefs(jwStore);

const { dateLocale } = useLocale();

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  mediaPlaying,
  online,
  selectedDate,
} = storeToRefs(currentState);

const publicTalkMediaPopup = ref(false);
const datePickerActive = ref(false);
const remoteVideoPopup = ref(false);
const remoteVideosLoadingProgress = ref(0);
const remoteVideos = ref<MediaItemsMediatorItem[]>([]);

const dragging = () => {
  window.dispatchEvent(new Event('draggingSomething'));
};

const mediaSortForDay = computed(() => {
  if (!selectedDate.value || !currentCongregation.value || !mediaSort.value)
    return false;
  try {
    return (
      mediaSort.value?.[currentCongregation.value]?.[selectedDate.value]
        ?.length > 0
    );
  } catch (error) {
    errorCatcher(error);
    return false;
  }
});

const getEventDates = () => {
  try {
    if (
      !(lookupPeriod.value || additionalMediaMaps.value) ||
      !currentCongregation.value
    )
      return [];
    const meetingDates = lookupPeriod.value[currentCongregation.value]
      ?.filter((day) => day.meeting)
      .map((day) => date.formatDate(day.date, 'YYYY/MM/DD'));
    const additionalMedia =
      additionalMediaMaps.value[currentCongregation.value];
    const additionalMediaDates = additionalMedia
      ? Object.keys(additionalMedia)
          .filter((day) => additionalMedia[day].length > 0)
          .map((day) => date.formatDate(day, 'YYYY/MM/DD'))
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
    const dateArray: Date[] = lookupPeriod.value[
      currentCongregation.value
    ]?.map((day) => day.date);
    const minDate = date.getMinDate(dateArray[0], ...dateArray.slice(1));
    return date.formatDate(minDate, 'YYYY/MM');
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

const maxDate = () => {
  try {
    if (!lookupPeriod.value || !currentCongregation.value) return undefined;
    const dateArray: Date[] = lookupPeriod.value[
      currentCongregation.value
    ]?.map((day) => day.date);
    const maxDate = date.getMaxDate(dateArray[0], ...dateArray.slice(1));
    return date.formatDate(maxDate, 'YYYY/MM');
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

const importMenu = ref<QMenu | undefined>();
const openImportMenu = () => {
  importMenu.value?.show();
};

const dateOptions = (lookupDate: string) => {
  try {
    if (!lookupPeriod.value || !lookupPeriod.value) return true;
    const dateArray: Date[] = lookupPeriod.value[
      currentCongregation.value
    ]?.map((day) => day.date);
    const minDate = date.getMinDate(dateArray[0], ...dateArray.slice(1));
    const maxDate = date.getMaxDate(dateArray[0], ...dateArray.slice(1));
    return (
      date.getDateDiff(lookupDate, minDate, 'days') >= 0 &&
      date.getDateDiff(lookupDate, maxDate, 'days') <= 0
    );
  } catch (error) {
    errorCatcher(error);
    return true;
  }
};

const getJwVideos = async () => {
  try {
    if (!currentSettings.value) return;
    if (remoteVideosLoadingProgress.value < 1) {
      const getSubcategories = async (category: string) => {
        return (await get(
          `https://b.jw-cdn.org/apis/mediator/v1/categories/${
            currentSettings.value?.lang
          }/${category}?detailed=1&mediaLimit=0&clientType=www`,
        )) as JwVideoCategory;
      };
      const subcategories: {
        key: string;
        parentCategory: string;
      }[] = [{ key: 'LatestVideos', parentCategory: '' }];
      const subcategoriesRequest = await getSubcategories('VideoOnDemand');
      const subcategoriesFirstLevel =
        subcategoriesRequest.category.subcategories.map((s) => s.key);
      for (const subcategoryFirstLevel of subcategoriesFirstLevel) {
        subcategories.push(
          ...(
            await getSubcategories(subcategoryFirstLevel)
          ).category.subcategories.map((s) => {
            return { key: s.key, parentCategory: subcategoryFirstLevel };
          }),
        );
      }
      let index = 0;
      for (const category of subcategories) {
        const request = (await get(
          `https://b.jw-cdn.org/apis/mediator/v1/categories/${
            currentSettings.value?.lang
          }/${category.key}?detailed=0&clientType=www`,
        )) as JwVideoCategory;
        remoteVideos.value = remoteVideos.value
          .concat(request.category.media)
          .reduce((accumulator: MediaItemsMediatorItem[], current) => {
            const guids = new Set(accumulator.map((item) => item.guid));
            if (!guids.has(current.guid)) {
              accumulator.push(current);
            }
            return accumulator;
          }, [])
          .sort((a, b) => {
            return (
              new Date(b.firstPublished).getTime() -
              new Date(a.firstPublished).getTime()
            );
          });
        index++;
        remoteVideosLoadingProgress.value = index / subcategories.length;
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const getEventDayColor = (eventDate: string) => {
  try {
    if (!lookupPeriod.value || !currentCongregation.value)
      throw new Error('No congregation or lookup period');
    const lookupDate = lookupPeriod.value[currentCongregation.value]?.find(
      (d) => date.getDateDiff(eventDate, d.date, 'days') === 0,
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
        .filter((day) => additionalDates[day].length > 0)
        .map((day) => date.formatDate(day, 'YYYY/MM/DD'))
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

const openSongPicker = () => {
  chooseSong.value = true;
};

onMounted(() => {
  window.addEventListener('openSongPicker', openSongPicker);
  window.addEventListener('openImportMenu', openImportMenu);
});

onBeforeUnmount(() => {
  window.removeEventListener('openSongPicker', openSongPicker);
  window.removeEventListener('openImportMenu', openImportMenu);
});
</script>
