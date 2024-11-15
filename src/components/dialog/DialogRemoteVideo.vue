<template>
  <q-dialog v-model="open">
    <div
      class="items-center q-pb-lg q-px-lg q-gutter-y-lg bg-secondary-contrast large-overlay"
    >
      <div class="text-h6 row">{{ $t('add-video-jw-org') }}</div>
      <div class="row">{{ $t('add-a-video-explain') }}</div>
      <!-- <div class="row">
        <q-linear-progress
          :value="remoteVideosLoadingProgress"
          class="q-mt-md"
        />
      </div> -->
      <div class="row">
        <div class="col-grow">
          <q-input
            v-model="remoteVideoFilter"
            :label="$t('search')"
            clearable
            dense
            outlined
            spellcheck="false"
          >
            <template #prepend>
              <q-icon name="mmm-search" />
            </template>
          </q-input>
        </div>
      </div>
      <div
        v-if="
          !!(
            remoteVideosLoadingProgress < 1 &&
            (remoteVideosFiltered.length === 0 || remoteVideoFilter)
          )
        "
        class="text-center row items-center justify-center"
      >
        <q-spinner color="primary" size="md" />
      </div>
      <div class="row">
        <q-scroll-area
          :bar-style="barStyle"
          :thumb-style="thumbStyle"
          style="width: 100vw; height: 40vh"
        >
          <div class="row q-col-gutter-md">
            <template v-for="video in remoteVideosFiltered" :key="video.guid">
              <div class="col-xs-6 col-sm-4 col-md-3 col-lg-3 col-xl-2">
                <div
                  v-ripple
                  :class="{
                    'cursor-pointer': true,
                    'rounded-borders-lg': true,
                    'full-height': true,
                    'bg-accent-100': hoveredRemoteVideo === video.guid,
                  }"
                  flat
                  @click="
                    downloadAdditionalRemoteVideo(
                      video.files,
                      getBestImageUrl(video.images, 'md'),
                      false,
                      video.title,
                      section,
                    );
                    open = false;
                  "
                  @mouseout="hoveredRemoteVideo = ''"
                  @mouseover="hoveredRemoteVideo = video.guid"
                >
                  <q-card-section class="q-pa-sm">
                    <q-img
                      :src="getBestImageUrl(video.images, 'md')"
                      class="rounded-borders"
                    >
                      <q-badge
                        class="q-mt-sm q-ml-sm bg-semi-black rounded-borders-sm"
                        style="padding: 5px !important"
                      >
                        <q-icon class="q-mr-xs" color="white" name="mmm-play" />
                        {{ formatTime(video.duration) }}
                      </q-badge>
                    </q-img>
                  </q-card-section>
                  <q-card-section class="q-pa-sm">
                    <div class="text-subtitle2 q-mb-xs">
                      {{ video.title }}
                    </div>
                    <div>
                      <span class="text-caption text-dark-grey">{{
                        video.naturalKey
                      }}</span>
                    </div>
                  </q-card-section>
                </div>
              </div>
            </template>
          </div>
        </q-scroll-area>
      </div>
      <div class="row items-center">
        <div class="col">
          <q-toggle
            v-model="remoteVideosIncludeAudioDescription"
            :label="$t('include-audio-description')"
            checked-icon="mmm-check"
            color="primary"
          />
        </div>
        <div class="col text-right">
          <q-btn v-close-popup :label="$t('cancel')" color="negative" flat />
        </div>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
// Packages
import { computed, ref } from 'vue';

// Composables
import { useScrollbar } from 'src/composables/useScrollbar';

// Helpers
import {
  downloadAdditionalRemoteVideo,
  getBestImageUrl,
} from 'src/helpers/jw-media';
import { formatTime } from 'src/helpers/mediaPlayback';

// Types
import type {
  JwVideoCategory,
  MediaItemsMediatorItem,
  MediaSection,
} from 'src/types';

import { whenever } from '@vueuse/core';
import { fetchJson } from 'src/helpers/api';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';

// Stores
const jwStore = useJwStore();
const { urlVariables } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

// Props
defineProps<{
  section?: MediaSection;
}>();

const open = defineModel<boolean>({ default: false });

const { barStyle, thumbStyle } = useScrollbar();

const remoteVideos = ref<MediaItemsMediatorItem[]>([]);
const remoteVideosLoadingProgress = ref<number>(0);
const remoteVideoFilter = ref('');
const remoteVideosIncludeAudioDescription = ref(false);
const hoveredRemoteVideo = ref('');

const remoteVideosFiltered = computed(() => {
  const useableVideos = ref(
    remoteVideos.value.filter(
      (v) =>
        remoteVideosIncludeAudioDescription.value ||
        !v.primaryCategory.endsWith('AD'),
    ),
  );
  if (remoteVideoFilter.value?.length > 2)
    useableVideos.value = useableVideos.value.filter((video) =>
      video.title.toLowerCase().includes(remoteVideoFilter.value.toLowerCase()),
    );
  return useableVideos.value.slice(0, 50);
});

whenever(open, () => {
  getJwVideos();
});

const getJwVideos = async () => {
  try {
    if (!currentSettings.value) return;
    if (remoteVideosLoadingProgress.value < 1) {
      const getSubcategories = async (category: string) => {
        if (!category) return null;
        return await fetchJson<JwVideoCategory>(
          `${urlVariables.value.mediator}/v1/categories/${
            currentSettings.value?.lang
          }/${category}?detailed=1&mediaLimit=0&clientType=www`,
        );
      };
      const subcategories: {
        key: string;
        parentCategory: string;
      }[] = [{ key: 'LatestVideos', parentCategory: '' }];
      const subcategoriesRequest = await getSubcategories('VideoOnDemand');
      const subcategoriesFirstLevel =
        subcategoriesRequest?.category?.subcategories?.map((s) => s.key) || [];
      for (const subcategoryFirstLevel of subcategoriesFirstLevel) {
        subcategories.push(
          ...((
            await getSubcategories(subcategoryFirstLevel)
          )?.category.subcategories.map((s) => {
            return { key: s.key, parentCategory: subcategoryFirstLevel };
          }) || []),
        );
      }
      let index = 0;
      for (const category of subcategories) {
        if (!category?.key) continue;
        const request = await fetchJson<JwVideoCategory>(
          `${urlVariables.value.mediator}/v1/categories/${
            currentSettings.value?.lang
          }/${category.key}?detailed=0&clientType=www`,
        );
        remoteVideos.value = remoteVideos.value
          .concat(request?.category?.media || [])
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
</script>
