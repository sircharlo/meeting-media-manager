<template>
  <q-dialog v-model="open">
    <div
      class="bg-secondary-contrast column fit-snugly large-overlay q-px-none medium-overlay"
    >
      <div class="text-h6 col-shrink full-width q-px-md q-pt-lg">
        {{ $t('add-video-jw-org') }}
      </div>
      <div class="col-shrink full-width q-px-md q-pt-md">
        {{ $t('add-a-video-explain') }}
      </div>
      <div class="col-shrink full-width q-px-md q-py-md">
        <div class="col-grow">
          <q-input
            v-model="remoteVideoFilter"
            clearable
            dense
            :label="$t('search')"
            outlined
            spellcheck="false"
          >
            <template #prepend>
              <q-icon name="mmm-search" />
            </template>
          </q-input>
        </div>
      </div>
      <div class="q-px-md overflow-auto col full-width row">
        <template
          v-for="video in remoteVideosFiltered.slice(
            (currentPage - 1) * videosPerPage,
            currentPage * videosPerPage,
          )"
          :key="video.guid"
        >
          <div class="col col-xs-6 col-sm-4 col-md-3 col-lg-2">
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
                  class="rounded-borders"
                  :src="getBestImageUrl(video.images, 'md', true)"
                >
                  <q-badge
                    class="q-mt-sm q-ml-sm bg-semi-black rounded-borders-sm"
                    style="padding: 5px !important"
                  >
                    <q-icon class="q-mr-xs" color="white" name="mmm-play" />
                    {{ formatTime(video.duration) }}
                  </q-badge>
                  <div
                    class="absolute-bottom text-caption gradient-transparent-to-black"
                  >
                    {{ video.title }}
                  </div>
                  <q-tooltip :delay="1000">
                    {{ video.naturalKey }}
                  </q-tooltip>
                </q-img>
              </q-card-section>
            </div>
          </div>
        </template>
      </div>
      <div class="row q-px-md q-py-md col-shrink full-width justify-center">
        <q-pagination
          v-model="currentPage"
          active-color="primary"
          color="grey"
          direction-links
          flat
          :max="Math.ceil(remoteVideosFiltered.length / videosPerPage)"
          :max-pages="10"
        />
      </div>
      <div class="row q-px-md q-py-md col-shrink full-width">
        <div class="col">
          <q-spinner v-if="videosAreLoading" color="primary" size="md" />
          <q-toggle
            v-model="remoteVideosIncludeAudioDescription"
            checked-icon="mmm-check"
            color="primary"
            :label="$t('include-audio-description')"
          />
        </div>
        <div class="col text-right">
          <q-btn v-close-popup color="negative" flat :label="$t('cancel')" />
        </div>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import type {
  JwVideoCategory,
  MediaItemsMediatorItem,
  MediaSection,
} from 'src/types';

import { whenever } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  downloadAdditionalRemoteVideo,
  getBestImageUrl,
} from 'src/helpers/jw-media';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { fetchJson } from 'src/utils/api';
import { formatTime } from 'src/utils/time';
import { computed, ref } from 'vue';

// Stores
const jwStore = useJwStore();
const { urlVariables } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

// Props
defineProps<{
  section: MediaSection | undefined;
}>();

const open = defineModel<boolean>({ default: false });

const remoteVideos = ref<MediaItemsMediatorItem[]>([]);
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

  if (remoteVideoFilter.value?.length > 2) {
    // Split the filter string into terms (space-separated)
    const searchTerms = remoteVideoFilter.value
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term); // Remove empty terms

    // Check if all search terms are present
    useableVideos.value = useableVideos.value.filter((video) =>
      searchTerms.every((term) => video.title.toLowerCase().includes(term)),
    );
  }

  return useableVideos.value;
});
const videosAreLoading = ref(false);
const currentPage = ref(1);
const videosPerPage = ref(24);

whenever(open, () => {
  getJwVideos();
});

const getJwVideos = async () => {
  try {
    if (!currentSettings.value) return;

    videosAreLoading.value = true;

    const getSubcategories = async (category: string) => {
      if (!category) return null;
      return await fetchJson<JwVideoCategory>(
        `${urlVariables.value.mediator}/v1/categories/${
          currentSettings.value?.lang
        }/${category}`,
        new URLSearchParams({
          clientType: 'www',
          detailed: '1',
          mediaLimit: '0',
        }),
        currentState.online,
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
    for (const category of subcategories) {
      if (!category?.key) continue;
      const request = await fetchJson<JwVideoCategory>(
        `${urlVariables.value.mediator}/v1/categories/${
          currentSettings.value?.lang
        }/${category.key}`,
        new URLSearchParams({
          clientType: 'www',
          detailed: '0',
        }),
        currentState.online,
      );
      const newVideos = (request?.category?.media || []).filter(
        (video) => !remoteVideos.value.find((v) => v.guid === video.guid),
      );
      remoteVideos.value.push(...newVideos);
      remoteVideos.value.sort((a, b) =>
        b.firstPublished.localeCompare(a.firstPublished),
      );
    }
    videosAreLoading.value = false;
  } catch (error) {
    errorCatcher(error);
  }
};
</script>
