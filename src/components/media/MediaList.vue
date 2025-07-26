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
    <div v-if="emptyMediaList && !currentlySorting">
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
    <div
      ref="parent"
      class="sortable-media"
      :class="{
        'drop-here': currentlySorting,
        'bg-primary-light': currentlySorting,
      }"
      :data-list="mediaList.type"
    >
      <div v-for="element in sortableItems" :key="element.uniqueId">
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
              <div v-if="element.children">
                <div
                  v-for="childElement in element.children"
                  :key="childElement.uniqueId"
                >
                  <MediaItem
                    :key="childElement.uniqueId"
                    v-model:repeat="childElement.repeat"
                    child
                    :media="childElement"
                    @update:custom-duration="
                      childElement.customDuration =
                        JSON.parse($event) || undefined
                    "
                    @update:hidden="childElement.hidden = !!$event"
                    @update:tag="childElement.tag = $event"
                    @update:title="childElement.title = $event"
                  />
                </div>
              </div>
            </q-expansion-item>
          </q-list>
        </template>
        <div v-else :key="element.uniqueId">
          <MediaItem
            :key="element.uniqueId"
            v-model:repeat="element.repeat"
            :media="element"
            @update:custom-duration="
              element.customDuration = JSON.parse($event) || undefined
            "
            @update:hidden="element.hidden = !!$event"
            @update:tag="element.tag = $event"
            @update:title="element.title = $event"
          />
        </div>
      </div>
    </div>
  </q-list>
</template>
<script setup lang="ts">
import type { DynamicMediaObject, MediaSection } from 'src/types';

import { animations, state } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { watchImmediate } from '@vueuse/core';
import MediaItem from 'components/media/MediaItem.vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { isWeMeetingDay } from 'src/helpers/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  mediaList: MediaListObject;
  openImportMenu: (section: MediaSection) => void;
}>();

const visibleMediaItems = computed(() => {
  return props.mediaList.items.filter((m) => !m.hidden);
});

const [parent, sortableItems] = useDragAndDrop<DynamicMediaObject>(
  visibleMediaItems.value,
  {
    group: 'mediaList',
    multiDrag: true,
    onDragend: () => {
      currentlySorting.value = false;
    },
    onDragstart: () => {
      currentlySorting.value = true;
    },
    plugins: [animations()],
    selectedClass: 'sortable-selected',
  },
);

watch(
  () => props.mediaList.items,
  (newItems) => {
    // Update sortable items when media list items change
    sortableItems.value = newItems.filter((m) => !m.hidden);
  },
  { immediate: true },
);

const currentlySorting = ref(false);

state.on('dragStarted', () => {
  currentlySorting.value = true;
});

state.on('dragEnded', () => {
  currentlySorting.value = false;
  if (!selectedDateObject.value?.dynamicMedia) return;
  // TODO: Make this more efficient, something like: in-place resort if sortableItems same length as filtered dynamicMedia, otherwise replace as below
  selectedDateObject.value.dynamicMedia = [
    ...selectedDateObject.value.dynamicMedia
      .filter((item) => item.section !== props.mediaList.type)
      .concat(
        sortableItems.value.map((item) => ({
          ...item,
          section: props.mediaList.type,
        })),
      ),
  ];
});

export interface MediaListObject {
  alwaysShow: boolean;
  extraMediaShortcut?: boolean;
  items: DynamicMediaObject[];
  jwIcon?: string;
  label: string;
  mmmIcon?: string;
  type: MediaSection;
}

const $q = useQuasar();
const { t } = useI18n();

const currentState = useCurrentStateStore();
const { mediaPlayingUrl, selectedDateObject } = storeToRefs(currentState);

const addSong = (section: MediaSection | undefined) => {
  window.dispatchEvent(
    new CustomEvent<{ section: MediaSection | undefined }>('openSongPicker', {
      detail: { section },
    }),
  );
};

const expandedMediaGroups = ref<Record<string, boolean>>({});

defineExpose({
  expandedMediaGroups,
});

watchImmediate(
  () => selectedDateObject.value?.dynamicMedia?.length,
  () => {
    expandedMediaGroups.value =
      selectedDateObject.value?.dynamicMedia.reduce(
        (acc, element) => {
          if (
            element.children?.length &&
            element.extractCaption &&
            element.section === props.mediaList.type
          ) {
            acc[element.uniqueId] = !!element.cbs; // Default state based on element.cbs
          }
          return acc;
        },
        {} as Record<string, boolean>,
      ) || {};
  },
);

const isSongButton = computed(
  () =>
    props.mediaList.type === 'additional' ||
    (props.mediaList.type === 'circuitOverseer' &&
      !props.mediaList.items.some((m) => !m.hidden)),
);

const emptyMediaList = computed(() => {
  return !props.mediaList.items.filter((m) => !m.hidden).length;
});
</script>
