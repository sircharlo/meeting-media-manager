<template>
  <q-list
    :class="[
      'media-section',
      mediaList.config?.uniqueId,
      { custom: isCustomSection },
    ]"
    :style="sectionStyles"
  >
    <!-- Section Header -->
    <MediaSectionHeader
      v-if="selectedDateObject"
      ref="sectionHeaderRef"
      :has-add-media-button="hasAddMediaButton"
      :is-custom="isCustomSection"
      :is-first="isFirst"
      :is-last="isLast"
      :is-renaming="isRenaming"
      :is-song-button="isSongButton"
      :media-list="mediaList"
      @add-divider="handleAddDivider"
      @add-song="addSong"
      @delete="deleteSection"
      @move="moveSection"
      @open-import="openImportMenu"
      @rename="handleRename"
      @update-color="updateSectionColor"
      @update-label="updateSectionLabel"
    />
    <!-- Empty State -->
    <SectionEmptyState
      v-if="isEmpty && !isDragging"
      :is-dragging="isDragging"
      :selected-date="selectedDateObject"
    />
    <!-- Media Items -->
    <div
      ref="dragDropContainer"
      class="sortable-media"
      :class="{ 'drop-here': isDragging }"
      :data-list="mediaList.config?.uniqueId"
    >
      <template v-if="isEmpty && isDragging">
        <SectionEmptyState
          :is-dragging="isDragging"
          :selected-date="selectedDateObject"
        />
      </template>
      <template v-for="element in sortableItems" :key="element.uniqueId">
        <!-- Render dividers -->
        <MediaDivider
          v-if="element.type === 'divider'"
          :divider="element as any"
          @delete="handleDeleteDivider"
          @update:color="
            (bgColor, textColor) =>
              handleUpdateDividerColor(element.uniqueId, bgColor, textColor)
          "
          @update:title="
            (title) => handleUpdateDividerTitle(element.uniqueId, title)
          "
        />
        <!-- Render media groups -->
        <MediaGroup
          v-else-if="element.children"
          :element="element"
          :expanded="expandedGroups[element.uniqueId] ?? false"
          :selected="selectedMediaItems?.includes(element.uniqueId)"
          :selected-media-items="selectedMediaItems"
          @item-clicked="
            (evt) =>
              emit('item-clicked', {
                event: evt as unknown as MouseEvent,
                mediaItemId: element.uniqueId,
                sectionId: props.mediaList.config?.uniqueId,
              })
          "
          @update:child-hidden="
            element.children.forEach((child) => (child.hidden = !!$event))
          "
          @update:expanded="expandedGroups[element.uniqueId] = $event"
          @update:hidden="element.hidden = !!$event"
        />
        <!-- Render media items -->
        <MediaItem
          v-else
          v-model:repeat="element.repeat"
          :media="element"
          :selected="selectedMediaItems?.includes(element.uniqueId)"
          :selected-media-items="selectedMediaItems"
          @click="
            (evt) =>
              emit('item-clicked', {
                event: evt as MouseEvent,
                mediaItemId: element.uniqueId,
                sectionId: props.mediaList.config?.uniqueId,
              })
          "
          @update:custom-duration="
            element.customDuration = JSON.parse($event) || undefined
          "
          @update:hidden="element.hidden = !!$event"
          @update:tag="element.tag = $event"
          @update:title="
            nextTick(() => {
              element.title = $event;
            })
          "
        />
      </template>
    </div>

    <!-- Add Divider Dialog -->
    <DialogAddDivider
      v-model="showAddDividerDialog"
      :dialog-id="`add-divider-${mediaList.config?.uniqueId}`"
      @ok="handleAddDividerResult"
    />
  </q-list>
</template>

<script setup lang="ts">
import type { MediaSectionWithConfig } from 'src/types';

import DialogAddDivider from 'components/dialog/DialogAddDivider.vue';
import { storeToRefs } from 'pinia';
import { useMediaDragAndDrop } from 'src/composables/useMediaDragAndDrop';
import { useMediaSection } from 'src/composables/useMediaSection';
import {
  getTextColor,
  saveWatchedMediaSectionOrder,
} from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, nextTick, ref, watch } from 'vue';

import MediaDivider from './MediaDivider.vue';
import MediaGroup from './MediaGroup.vue';
import MediaItem from './MediaItem.vue';
import MediaSectionHeader from './MediaSectionHeader.vue';
import SectionEmptyState from './SectionEmptyState.vue';

const props = defineProps<{
  mediaList: MediaSectionWithConfig;
  openImportMenu: (section: string) => void;
  selectedMediaItems?: string[];
}>();

const currentState = useCurrentStateStore();
const { selectedDateObject } = storeToRefs(currentState);

// Ref to the section header
const sectionHeaderRef = ref<InstanceType<typeof MediaSectionHeader> | null>(
  null,
);

// Dialog state
const showAddDividerDialog = ref(false);

// Use the media section composable
const {
  addSong,
  deleteSection,
  expandedGroups,
  hasAddMediaButton,
  isCustomSection,
  isEmpty,
  isFirst,
  isLast,
  isRenaming,
  isSongButton,
  moveSection,
  sectionData,
  updateSectionColor,
  updateSectionLabel,
} = useMediaSection(props.mediaList);

import { useEventListener } from '@vueuse/core';
// Use the media dividers composable
import { useMediaDividers } from 'src/composables/useMediaDividers';
const { addDivider, deleteDivider, updateDividerColors, updateDividerTitle } =
  useMediaDividers(props.mediaList.config?.uniqueId);

// Use the drag and drop composable - pass the reactive sectionData items directly
const { dragDropContainer, isDragging, sortableItems } = useMediaDragAndDrop(
  sectionData.value?.items || [],
);

// Efficient watcher to ensure changes are persisted to the store
// Only triggers when the actual array content changes, not on every re-render
watch(
  () => [sortableItems.value?.map((item) => item.uniqueId), isDragging.value],
  ([, isDragging]) => {
    if (isDragging) return; // Avoid updating while dragging
    if (!sectionData.value || !sortableItems.value || !selectedDateObject.value)
      return;

    // Save section order information for watched media items
    if (sortableItems.value.some((item) => item.source === 'watched')) {
      try {
        const watchedItems = sortableItems.value.filter(
          (item) => item.source === 'watched' && item.fileUrl,
        );
        // Get the first watched item's file path to determine the watched day folder
        const watchedItem = watchedItems[0];
        if (watchedItem) {
          const { fileUrlToPath, path } = window.electronApi;
          const { dirname } = path;

          const firstWatchedItemPath = fileUrlToPath(watchedItem.fileUrl);
          if (firstWatchedItemPath) {
            const watchedDayFolder = dirname(firstWatchedItemPath);
            if (watchedDayFolder) {
              console.log(
                '🔍 [updateMediaListItems] Saving section order for watched media items:',
                watchedDayFolder,
                props.mediaList.config?.uniqueId,
                watchedItems,
              );
              saveWatchedMediaSectionOrder(
                watchedDayFolder,
                props.mediaList.config?.uniqueId,
                watchedItems,
              );
            }
          }
        }
      } catch (error) {
        // Fail gracefully - if we can't save the order file, it's not a big deal
        console.warn(`⚠️ Could not save section order: ${error}`);
      }
    }

    // Update the section data to match the sorted order
    if (selectedDateObject.value && props.mediaList.config) {
      const sectionIndex = selectedDateObject.value.mediaSections.findIndex(
        (section) =>
          section.config.uniqueId === props.mediaList.config.uniqueId,
      );
      if (
        sectionIndex !== -1 &&
        selectedDateObject.value.mediaSections[sectionIndex]
      ) {
        selectedDateObject.value.mediaSections[sectionIndex].items =
          sortableItems.value;
      }
    }
  },
  { flush: 'post' },
);

// Listen for sort order reset events
useEventListener(window, 'reset-sort-order', () => {
  // Reset the sortable items to the original order from mediaList.items
  if (!sortableItems.value?.length || !props.mediaList.items?.length) return;
  sortableItems.value = props.mediaList.items;
});

// Computed styles
const sectionStyles = computed(() => ({
  '--bg-color': props.mediaList.config?.bgColor || 'rgb(148, 94, 181)',
  '--text-color': getTextColor(props.mediaList),
}));

// Methods
const handleRename = (value: boolean) => {
  isRenaming.value = value;
};

const handleDeleteDivider = (dividerId: string) => {
  deleteDivider(dividerId);
};

const handleAddDivider = () => {
  console.log('🎯 handleAddDivider called');
  showAddDividerDialog.value = true;
};

const handleAddDividerResult = (title?: string, addToTop?: boolean) => {
  console.log(
    '✅ DialogAddDivider returned title:',
    title,
    'addToTop:',
    addToTop,
  );
  addDivider(title, addToTop);
  showAddDividerDialog.value = false;
};

const handleUpdateDividerTitle = (dividerId: string, newTitle: string) => {
  updateDividerTitle(dividerId, newTitle);
};

const handleUpdateDividerColor = (
  dividerId: string,
  bgColor: string,
  textColor: string,
) => {
  updateDividerColors(dividerId, bgColor, textColor);
};

const emit = defineEmits<{
  'item-clicked': [
    payload: {
      event: MouseEvent;
      mediaItemId: string;
      sectionId: string | undefined;
    },
  ];
}>();

defineExpose({
  expandedGroups,
  isDragging,
  sectionHeaderRef,
});
</script>

<style lang="scss" scoped>
.media-section {
  &.custom {
    .custom-text-color {
      color: var(--bg-color) !important;
    }

    .custom-bg-color {
      background-color: var(--bg-color) !important;
      color: var(--text-color) !important;
    }

    &:before {
      background-color: var(--bg-color);
    }
  }
}

.sortable-media {
  transition: background-color 0.2s ease;

  // &.drop-here {
  //   background-color: rgba(var(--q-primary), 0.1);
  //   border: 2px dashed var(--q-primary);
  // }
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
</style>
