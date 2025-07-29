<template>
  <q-list
    :class="
      'media-section ' +
      mediaList.uniqueId +
      ' ' +
      (mediaSectionCanBeCustomized ? ' custom' : '')
    "
    :style="{
      '--bg-color': mediaList.bgColor || 'rgb(148, 94, 181)',
      '--text-color': getTextColor(mediaList),
    }"
  >
    <q-item
      v-if="selectedDateObject"
      :class="
        'text-' +
        mediaList.uniqueId +
        ' items-center ' +
        (mediaSectionCanBeCustomized ? ' custom-text-color' : '')
      "
      @dblclick="
        renameSection = true;
        $nextTick(() => {
          if ($refs.renameInput)
            ($refs.renameInput as HTMLInputElement).focus();
        });
      "
    >
      <q-avatar
        :class="
          (mediaSectionCanBeCustomized
            ? ' custom-bg-color'
            : ' text-white bg-' + mediaList.uniqueId) +
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
        <q-input
          v-if="renameSection"
          ref="renameInput"
          dense
          :model-value="mediaList.label"
          @blur="renameSection = false"
          @change="
            (val: string) =>
              emit('update-media-section-label', {
                uniqueId: mediaList.uniqueId,
                label: val,
              })
          "
          @keyup.enter="renameSection = false"
          @keyup.esc="renameSection = false"
        />
        <template v-else>
          {{ mediaList.label }}
        </template>
      </q-item-section>
      <q-item-section side>
        <div class="row items-center">
          <template v-if="mediaList.extraMediaShortcut">
            <q-btn
              class="add-media-shortcut"
              :class="
                mediaSectionCanBeCustomized
                  ? 'custom-text-color'
                  : 'text-white bg-' + mediaList.uniqueId
              "
              :color="
                !mediaSectionCanBeCustomized ? mediaList.uniqueId : undefined
              "
              :flat="mediaSectionCanBeCustomized"
              :icon="isSongButton ? 'mmm-music-note' : 'mmm-add-media'"
              :label="
                $q.screen.gt.xs
                  ? isSongButton
                    ? mediaList.uniqueId === 'additional'
                      ? t('add-an-opening-song')
                      : t('add-a-closing-song')
                    : !mediaSectionCanBeCustomized
                      ? t('add-extra-media')
                      : undefined
                  : undefined
              "
              :outline="!mediaSectionCanBeCustomized"
              :round="mediaSectionCanBeCustomized"
              size="sm"
              @click="
                isSongButton
                  ? addSong(mediaList.uniqueId)
                  : openImportMenu(mediaList.uniqueId)
              "
            >
              <q-tooltip v-if="!$q.screen.gt.xs" :delay="500">
                {{
                  isSongButton
                    ? mediaList.uniqueId === 'additional'
                      ? t('add-an-opening-song')
                      : t('add-a-closing-song')
                    : t('add-extra-media')
                }}
              </q-tooltip>
            </q-btn>
          </template>
          <template v-if="mediaSectionCanBeCustomized">
            <q-btn
              class="custom-text-color"
              flat
              icon="mmm-palette"
              round
              size="sm"
            >
              <q-popup-proxy
                cover
                transition-hide="scale"
                transition-show="scale"
              >
                <q-color
                  v-model="hexValues[mediaList.uniqueId]"
                  format-model="hex"
                  no-footer
                  no-header
                  @change="
                    (val: string | null) => {
                      emit('update-media-section-bg-color', {
                        uniqueId: mediaList.uniqueId,
                        bgColor: val ?? '',
                      });
                    }
                  "
                />
              </q-popup-proxy>
            </q-btn>
            <q-btn
              v-if="!isFirstCustomSection"
              class="custom-text-color"
              flat
              icon="mmm-up"
              round
              size="sm"
              @click="moveSection(mediaList.uniqueId, 'up')"
            />
            <q-btn
              v-if="!isLastCustomSection"
              class="custom-text-color"
              flat
              icon="mmm-down"
              round
              size="sm"
              @click="moveSection(mediaList.uniqueId, 'down')"
            />
            <q-btn
              v-if="mediaList.uniqueId !== 'additional'"
              color="negative"
              flat
              icon="mmm-delete"
              round
              size="sm"
              @click="deleteSection(mediaList.uniqueId)"
            />
          </template>
        </div>
      </q-item-section>
    </q-item>
    <div v-if="emptyMediaList">
      <q-item>
        <q-item-section
          class="align-center text-secondary text-grey text-subtitle2"
        >
          <div class="row items-center">
            <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
            <span>
              {{
                dragState.isDragging
                  ? t('drop-media-here')
                  : selectedDateObject &&
                      isWeMeetingDay(selectedDateObject?.date)
                    ? t('dont-forget-add-missing-media')
                    : t('no-media-files-for-section')
              }}
            </span>
          </div>
        </q-item-section>
      </q-item>
    </div>
    <div
      ref="dragDropContainer"
      class="sortable-media"
      :class="{
        'drop-here': dragState.isDragging,
        'bg-primary-light': dragState.isDragging,
      }"
      :data-list="mediaList.uniqueId"
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
import type {
  DynamicMediaObject,
  MediaSection,
  MediaSectionIdentifier,
} from 'src/types';

import { animations, state } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { watchImmediate } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import MediaItem from 'src/components/media/MediaItem.vue';
import { isWeMeetingDay } from 'src/helpers/date';
import { deleteSection, getTextColor } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  mediaList: MediaSection;
  openImportMenu: (section: MediaSectionIdentifier) => void;
}>();

const emit = defineEmits([
  'update-media-section-bg-color',
  'update-media-section-label',
]);

const $q = useQuasar();
const { t } = useI18n();

const currentState = useCurrentStateStore();
const { mediaPlayingUrl, selectedDateObject } = storeToRefs(currentState);

// Computed properties
const mediaSectionCanBeCustomized = computed(() => {
  return (
    props.mediaList.uniqueId === 'additional' ||
    props.mediaList.uniqueId?.startsWith('custom')
  );
});

const currentSectionItems = computed(() => {
  return (
    selectedDateObject.value?.dynamicMedia?.filter(
      (m) => m.section === props.mediaList.uniqueId,
    ) || []
  );
});

const currentSectionHiddenItems = computed(() => {
  return currentSectionItems.value.filter((m) => m.hidden);
});

const emptyMediaList = computed(() => {
  return currentSectionItems.value.length === 0;
});

const isSongButton = computed(
  () =>
    (props.mediaList.uniqueId === 'additional' &&
      selectedDateObject.value?.meeting === 'we') ||
    (props.mediaList.uniqueId === 'circuitOverseer' &&
      !currentSectionHiddenItems.value.length),
);

const isFirstCustomSection = computed(() => {
  return (
    selectedDateObject.value?.customSections?.[0]?.uniqueId ===
    props.mediaList.uniqueId
  );
});

const isLastCustomSection = computed(() => {
  return (
    selectedDateObject.value?.customSections?.slice(-1)?.[0]?.uniqueId ===
    props.mediaList.uniqueId
  );
});

// Reactive state
const expandedMediaGroups = ref<Record<string, boolean>>({});
const renameSection = ref(false);
const hexValues = ref<Record<string, string>>({});

// Computed properties
const visibleMediaItems = computed(() => {
  return currentSectionItems.value.filter((m) => !m.hidden);
});

const dragState = ref({
  draggedItems: [] as DynamicMediaObject[],
  isDragging: false,
});

// Optimized function to update media order
const updateMediaOrder = (newOrder: DynamicMediaObject[]) => {
  console.log(
    'updateMediaOrder called for section:',
    props.mediaList.uniqueId,
    'with order:',
    newOrder,
  );

  if (!selectedDateObject.value?.dynamicMedia) return;

  // Get all items that are NOT in the new order for this section
  const itemsNotInThisSection = selectedDateObject.value.dynamicMedia.filter(
    (item) => !newOrder.some((newItem) => newItem.uniqueId === item.uniqueId),
  );

  // Create the new items for this section with correct section assignment
  const thisSectionItems = newOrder.map((item) => {
    // Find the original item to preserve all properties
    const originalItem = selectedDateObject.value?.dynamicMedia.find(
      (media) => media.uniqueId === item.uniqueId,
    );

    if (originalItem) {
      return {
        ...originalItem,
        section: props.mediaList.uniqueId, // Update section assignment
      };
    }

    return item;
  });

  console.log('Items not in this section:', itemsNotInThisSection);
  console.log('Items for this section:', thisSectionItems);

  // Update the store with the new order
  selectedDateObject.value.dynamicMedia = [
    ...itemsNotInThisSection,
    ...thisSectionItems,
  ];

  console.log(
    'Store updated. New dynamicMedia:',
    selectedDateObject.value.dynamicMedia,
  );
};

// Use the drag and drop composable
const [dragDropContainer, sortableItems] = useDragAndDrop<DynamicMediaObject>(
  visibleMediaItems.value,
  {
    disabled: true,
    dropZone: true, // Enable drop zones for empty sections
    group: 'mediaList',
    multiDrag: true,
    plugins: [animations()],
    selectedClass: 'sortable-selected',
  },
);

// Watch for changes in visible items and update sortable items
watch(
  () => visibleMediaItems.value,
  (newItems) => {
    sortableItems.value = newItems;
  },
  { immediate: true },
);

// Local variable to track order during dragging (not updating store)
let localSortableItems = visibleMediaItems.value;

// Handle drag events
watch(
  () => sortableItems.value,
  (newItems, oldItems) => {
    if (!oldItems) return;

    // Check if items from other sections are being dragged
    const hasItemsFromOtherSections = newItems.some(
      (item) => item.section !== props.mediaList.uniqueId,
    );

    if (hasItemsFromOtherSections) {
      // Clear the selection by resetting to only items from this section
      const itemsFromThisSection = visibleMediaItems.value;
      sortableItems.value = itemsFromThisSection;
      localSortableItems = itemsFromThisSection;
      console.log('Cleared selection - items from other sections detected');
      return;
    }

    // Always update local variable during dragging
    localSortableItems = newItems;
    console.log(
      'sortableItems changed:',
      newItems.map((item) => item.uniqueId),
    );
  },
  { deep: true },
);

// Global drag state management for cross-component communication
state.on('dragStarted', () => {
  dragState.value.isDragging = true;
  console.log('Drag started for section:', props.mediaList.uniqueId);

  // Clear selections in other sections by resetting their sortableItems
  // This will be handled by the drag and drop library's internal state
});

state.on('dragEnded', () => {
  dragState.value.isDragging = false;
  console.log(
    'Drag ended for section:',
    props.mediaList.uniqueId,
    'Items:',
    localSortableItems,
  );

  if (!selectedDateObject.value?.dynamicMedia) return;

  // Use nextTick to ensure drag and drop library has finished its updates
  nextTick(() => {
    // Only update the store when drag is complete
    updateMediaOrder(localSortableItems);
  });
});

// Initialize hex values
watchImmediate(
  () => selectedDateObject.value?.customSections,
  (customSections) => {
    if (customSections) {
      hexValues.value = customSections.reduce(
        (acc, section) => ({
          ...acc,
          [section.uniqueId]: section.bgColor || '#ffffff',
        }),
        {},
      );
    }
  },
);

// Initialize expanded media groups
watchImmediate(
  () => selectedDateObject.value?.dynamicMedia?.length,
  () => {
    expandedMediaGroups.value =
      selectedDateObject.value?.dynamicMedia.reduce(
        (acc, element) => {
          if (
            element.children?.length &&
            element.extractCaption &&
            element.section === props.mediaList.uniqueId
          ) {
            acc[element.uniqueId] = !!element.cbs;
          }
          return acc;
        },
        {} as Record<string, boolean>,
      ) || {};
  },
);

// Methods
const addSong = (section: MediaSectionIdentifier | undefined) => {
  window.dispatchEvent(
    new CustomEvent<{ section: MediaSectionIdentifier | undefined }>(
      'openSongPicker',
      {
        detail: { section },
      },
    ),
  );
};

const moveSection = (section: string, direction: 'down' | 'up') => {
  if (!selectedDateObject.value?.customSections) return;
  const currentIndex = selectedDateObject.value.customSections.findIndex(
    (s) => s.uniqueId === section,
  );
  if (currentIndex === -1) return;
  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (
    newIndex < 0 ||
    newIndex >= selectedDateObject.value.customSections.length
  )
    return;
  const [movedSection] = selectedDateObject.value.customSections.splice(
    currentIndex,
    1,
  );
  if (!movedSection) {
    console.error('No section found at index:', currentIndex);
    return;
  }
  selectedDateObject.value.customSections.splice(newIndex, 0, movedSection);
};

defineExpose({
  expandedMediaGroups,
});
</script>

<style lang="scss" scoped>
.media-section.custom .custom-text-color {
  color: var(--bg-color) !important;
}
.media-section.custom .custom-bg-color {
  background-color: var(--bg-color) !important;
  color: var(--text-color) !important;
}
.media-section.custom:before {
  background-color: var(--bg-color);
}
.add-media-shortcut {
  max-width: 100%;
}

// Drag and drop styles
.sortable-media {
  transition: background-color 0.2s ease;

  &.drop-here {
    background-color: rgba(var(--q-primary), 0.1);
    border: 2px dashed var(--q-primary);
  }
}

.sortable-selected {
  opacity: 0.7;
  transform: scale(0.98);
}

[data-dragging='true'] {
  opacity: 0.5;
  transform: rotate(2deg);
}

[data-drag-placeholder='true'] {
  background-color: rgba(0, 0, 0, 0.1);
  border: 2px dashed #ccc;
  border-radius: 4px;
  height: 60px;
  margin: 4px 0;
}

.empty-drop-zone {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed transparent;
  border-radius: 8px;
  transition: all 0.2s ease;

  .sortable-media.drop-here & {
    border-color: var(--q-primary);
    background-color: rgba(var(--q-primary), 0.05);
  }
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--q-secondary);
  opacity: 0.7;

  .sortable-media.drop-here & {
    opacity: 1;
    color: var(--q-primary);
  }
}
</style>
