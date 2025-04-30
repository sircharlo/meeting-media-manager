<template>
  <q-list
    v-show="
      mediaList.items?.filter((m) => !m.hidden).length || mediaList.alwaysShow
    "
    :class="'media-section ' + mediaList.type"
  >
    <q-item
      v-if="selectedDateObject"
      :class="'text-' + mediaList.type + ' items-center'"
    >
      <q-avatar
        :class="
          'text-white bg-' +
          mediaList.type +
          (mediaList.jwIcon ? ' jw-icon' : '')
        "
      >
        <!-- :size="isWeMeetingDay(selectedDateObject.date) ? 'lg' : 'md'" -->
        <template v-if="mediaList.jwIcon">
          {{ mediaList.jwIcon }}
        </template>
        <template v-else>
          <q-icon :name="mediaList.mmmIcon" size="md" />
        </template>
      </q-avatar>
      <q-item-section
        class="text-bold text-uppercase text-spaced row justify-between col-grow"
      >
        {{ mediaList.label }}
      </q-item-section>
      <q-item-section v-if="mediaList.extraMediaShortcut" side>
        <q-btn
          :color="mediaList.type"
          :icon="isSongButton ? 'mmm-music-note' : 'mmm-add-media'"
          outline
          @click="
            isSongButton
              ? addSong(mediaList.type)
              : openImportMenu(mediaList.type)
          "
        >
          <q-tooltip :delay="500">
            {{
              isSongButton
                ? mediaList.type === 'additional'
                  ? t('add-an-opening-song')
                  : t('add-a-closing-song')
                : t('add-extra-media')
            }}
          </q-tooltip>
        </q-btn>
      </q-item-section>
    </q-item>
    <div v-if="!mediaList.items.filter((m) => !m.hidden).length">
      <q-item>
        <q-item-section
          class="align-center text-secondary text-grey text-subtitle2"
        >
          <div class="row items-center">
            <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
            <span>
              {{
                selectedDateObject && isWeMeetingDay(selectedDateObject?.date)
                  ? t('dont-forget-add-missing-media')
                  : t('no-media-files-for-section')
              }}
            </span>
          </div>
        </q-item-section>
      </q-item>
    </div>
    <Sortable
      class="sortable-media"
      item-key="uniqueId"
      :list="mediaList.items"
      :options="{ group: 'mediaLists' }"
      @add="handleMediaSort($event, 'ADD', mediaList.type as MediaSection)"
      @end="handleMediaSort($event, 'END', mediaList.type as MediaSection)"
      @remove="
        handleMediaSort($event, 'REMOVE', mediaList.type as MediaSection)
      "
      @start="handleMediaSort($event, 'START', mediaList.type as MediaSection)"
    >
      <template #item="{ element }: { element: DynamicMediaObject }">
        <template v-if="element.children">
          <q-list
            v-if="element.children.some((m) => !m.hidden)"
            bordered
            class="q-mx-sm q-my-sm media-children rounded-borders overflow-hidden"
          >
            <q-menu context-menu style="overflow-x: hidden" touch-position>
              <q-list>
                <q-item
                  v-close-popup
                  clickable
                  :disable="!!mediaPlayingUrl"
                  @click="element.hidden = true"
                >
                  <q-item-section avatar>
                    <q-icon name="mmm-file-hidden" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ t('hide-from-list') }}</q-item-label>
                    <q-item-label caption>
                      {{ t('hide-from-list-explain') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <q-expansion-item
              :key="element.children.map((m) => m.uniqueId).join(',')"
              v-model="expandedMediaGroups[element.uniqueId]"
              :disable="
                element.children.map((m) => m.fileUrl).includes(mediaPlayingUrl)
              "
              :header-class="
                expandedMediaGroups[element.uniqueId]
                  ? $q.dark.isActive
                    ? 'bg-accent-400'
                    : 'bg-accent-200'
                  : ''
              "
            >
              <template #header>
                <q-item-section>
                  <div>
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span v-html="element.extractCaption"></span>
                    <q-badge
                      class="q-ml-sm text-primary"
                      :color="$q.dark.isActive ? 'accent-400' : 'accent-200'"
                      :label="element.children?.length"
                      rounded
                      :text-color="$q.dark.isActive ? 'white' : 'accent-200'"
                    />
                  </div>
                </q-item-section>
              </template>
              <Sortable
                v-if="element.children"
                item-key="uniqueId"
                :list="element.children"
              >
                <template
                  #item="{
                    element: childElement,
                  }: {
                    element: DynamicMediaObject;
                  }"
                >
                  <div :key="childElement.uniqueId">
                    <MediaItem
                      :key="childElement.uniqueId"
                      v-model:repeat="childElement.repeat"
                      child
                      :media="childElement"
                      :play-state="playState(childElement.uniqueId)"
                      @update:custom-duration="
                        childElement.customDuration =
                          JSON.parse($event) || undefined
                      "
                      @update:hidden="childElement.hidden = !!$event"
                      @update:tag="childElement.tag = $event"
                      @update:title="childElement.title = $event"
                    />
                  </div>
                </template>
              </Sortable>
            </q-expansion-item>
          </q-list>
        </template>
        <div v-else :key="element.uniqueId">
          <MediaItem
            :key="element.uniqueId"
            v-model:repeat="element.repeat"
            :media="element"
            :play-state="playState(element.uniqueId)"
            @update:custom-duration="
              element.customDuration = JSON.parse($event) || undefined
            "
            @update:hidden="element.hidden = !!$event"
            @update:tag="element.tag = $event"
            @update:title="element.title = $event"
          />
        </div>
      </template>
    </Sortable>
  </q-list>
</template>
<script setup lang="ts">
import type { SortableEvent } from 'sortablejs';
import type { DynamicMediaObject, MediaSection } from 'src/types';

import { watchImmediate } from '@vueuse/core';
import MediaItem from 'components/media/MediaItem.vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { Sortable } from 'sortablejs-vue3';
import { isWeMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addDayToExportQueue } from 'src/helpers/export-media';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export interface MediaListObject {
  alwaysShow: boolean;
  extraMediaShortcut?: boolean;
  items: DynamicMediaObject[];
  jwIcon?: string;
  label: string;
  mmmIcon?: string;
  type: MediaSection;
}

const props = defineProps<{
  mediaList: MediaListObject;
  openImportMenu: (section: MediaSection) => void;
}>();

const $q = useQuasar();
const { t } = useI18n();

const currentState = useCurrentStateStore();
const {
  getVisibleMediaForSection,
  mediaItemBeingSorted,
  mediaPlayingUniqueId,
  mediaPlayingUrl,
  selectedDate,
  selectedDateObject,
} = storeToRefs(currentState);

const playState = (id: string) => {
  if (id === lastPlayedMediaUniqueId.value) return 'current';
  if (id === nextMediaUniqueId.value) return 'next';
  if (id === previousMediaUniqueId.value) return 'previous';
  return 'unknown';
};

const addSong = (section: MediaSection | undefined) => {
  window.dispatchEvent(
    new CustomEvent<{ section: MediaSection | undefined }>('openSongPicker', {
      detail: { section },
    }),
  );
};

const lastPlayedMediaUniqueId = ref<string>('');

watch(
  () => mediaPlayingUniqueId.value,
  (newMediaUniqueId) => {
    if (newMediaUniqueId) lastPlayedMediaUniqueId.value = newMediaUniqueId;
  },
);

const expandedMediaGroups = ref<Record<string, boolean>>({});

watchImmediate(
  () => selectedDateObject.value?.dynamicMedia?.length,
  () => {
    expandedMediaGroups.value =
      selectedDateObject.value?.dynamicMedia.reduce(
        (acc, element) => {
          if (element.children?.length && element.extractCaption) {
            acc[element.uniqueId] = !!element.cbs; // Default state based on element.cbs
          }
          return acc;
        },
        {} as Record<string, boolean>,
      ) || {};
  },
);

const keyboardShortcutMediaList = computed(() => {
  return [
    ...getVisibleMediaForSection.value.additional,
    ...getVisibleMediaForSection.value.tgw,
    ...getVisibleMediaForSection.value.ayfm,
    ...getVisibleMediaForSection.value.lac,
    ...getVisibleMediaForSection.value.wt,
    ...getVisibleMediaForSection.value.circuitOverseer,
  ].flatMap((m) => {
    return m.children
      ? m.children.map((c) => {
          return {
            ...c,
            parentUniqueId: m.uniqueId,
          };
        })
      : [m];
  });
});

const arraysAreIdentical = (a: string[], b: string[]) =>
  a.length === b.length && a.every((element, index) => element === b[index]);

const sortedMediaFileUrls = computed(() =>
  keyboardShortcutMediaList.value
    .filter((m) => !m.hidden && !!m.fileUrl)
    .map((m) => m.fileUrl)
    .filter((m) => typeof m === 'string')
    .filter((fileUrl, index, self) => self.indexOf(fileUrl) === index),
);

watch(
  () => sortedMediaFileUrls.value,
  (newSortedMediaFileUrls, oldSortedMediaFileUrls) => {
    if (
      selectedDateObject.value?.date &&
      !arraysAreIdentical(newSortedMediaFileUrls, oldSortedMediaFileUrls)
    ) {
      try {
        addDayToExportQueue(selectedDateObject.value.date);
      } catch (e) {
        errorCatcher(e);
      }
    }
  },
);

const previousMediaUniqueId = computed(() => {
  if (!selectedDate.value) return '';
  const sortedMediaIds = keyboardShortcutMediaList.value.map((m) => m.uniqueId);
  if (!lastPlayedMediaUniqueId.value) return sortedMediaIds[0];
  const index = sortedMediaIds.indexOf(lastPlayedMediaUniqueId.value);
  if (index === -1) return sortedMediaIds[0];

  for (let i = index - 1; i >= 0; i--) {
    const mediaItem = keyboardShortcutMediaList.value[i];
    if (mediaItem) {
      if (
        !mediaItem.extractCaption ||
        (mediaItem.parentUniqueId &&
          expandedMediaGroups.value[mediaItem.parentUniqueId])
      ) {
        return mediaItem.uniqueId;
      }
    }
  }
  return sortedMediaIds[0];
});

const nextMediaUniqueId = computed(() => {
  if (!selectedDate.value) return '';
  const sortedMediaIds = keyboardShortcutMediaList.value.map((m) => m.uniqueId);
  if (!lastPlayedMediaUniqueId.value) return sortedMediaIds[0];
  const index = sortedMediaIds.indexOf(lastPlayedMediaUniqueId.value);
  if (index === -1) return sortedMediaIds[0];
  for (let i = index + 1; i < keyboardShortcutMediaList.value.length; i++) {
    const mediaItem = keyboardShortcutMediaList.value[i];
    if (mediaItem) {
      if (
        !mediaItem.extractCaption ||
        (mediaItem?.parentUniqueId &&
          expandedMediaGroups.value[mediaItem.parentUniqueId])
      ) {
        return mediaItem.uniqueId;
      }
    }
  }
  return sortedMediaIds[0];
});

const handleMediaSort = (
  evt: SortableEvent,
  eventType: string,
  list: MediaSection,
) => {
  const sameList = evt.from === evt.to;
  const dynamicMedia = selectedDateObject.value?.dynamicMedia;

  if (!dynamicMedia || !Array.isArray(dynamicMedia)) return;
  if (
    typeof evt.oldIndex === 'undefined' ||
    typeof evt.newIndex === 'undefined'
  )
    return;

  switch (eventType) {
    case 'ADD': {
      if (!sameList && mediaItemBeingSorted.value) {
        const firstElementIndex = dynamicMedia.findIndex(
          (item) => item.section === list,
        );
        const insertIndex =
          firstElementIndex >= 0
            ? firstElementIndex + evt.newIndex
            : evt.newIndex;
        const newItem = { ...mediaItemBeingSorted.value, section: list };
        dynamicMedia.splice(insertIndex, 0, newItem);
      }
      break;
    }

    case 'END': {
      if (sameList) {
        const originalPosition = dynamicMedia.findIndex(
          (item) => item.uniqueId === mediaItemBeingSorted.value?.uniqueId,
        );
        if (originalPosition >= 0) {
          const [movedItem] = dynamicMedia.splice(originalPosition, 1);
          if (movedItem) {
            const newIndex = Math.max(
              0,
              originalPosition + evt.newIndex - evt.oldIndex,
            );
            dynamicMedia.splice(newIndex, 0, movedItem);
          }
        }
      }
      break;
    }

    case 'REMOVE': {
      if (!sameList) {
        const indexToRemove = dynamicMedia.findIndex(
          (item) =>
            item.uniqueId === mediaItemBeingSorted.value?.uniqueId &&
            item.section === list,
        );
        if (indexToRemove >= 0) {
          dynamicMedia.splice(indexToRemove, 1);
        }
      }
      break;
    }

    case 'START': {
      const itemBeingSorted =
        getVisibleMediaForSection.value[list]?.[evt.oldIndex];
      if (itemBeingSorted) {
        mediaItemBeingSorted.value = itemBeingSorted;
      }
      break;
    }
  }
};

const isSongButton = computed(
  () =>
    props.mediaList.type === 'additional' ||
    (props.mediaList.type === 'circuitOverseer' &&
      !props.mediaList.items.some((m) => !m.hidden)),
);
</script>
