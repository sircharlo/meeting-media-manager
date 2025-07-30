<template>
  <q-list
    :class="['media-section', mediaList.uniqueId, { custom: isCustomSection }]"
    :style="sectionStyles"
  >
    <!-- Section Header -->
    <MediaSectionHeader
      v-if="selectedDateObject"
      :is-custom="isCustomSection"
      :is-first="isFirst"
      :is-last="isLast"
      :is-renaming="isRenaming"
      :is-song-button="isSongButton"
      :media-list="mediaList"
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
      :data-list="mediaList.uniqueId"
    >
      <template v-if="isEmpty && isDragging">
        <SectionEmptyState
          :is-dragging="isDragging"
          :selected-date="selectedDateObject"
        />
      </template>
      <template v-for="element in sortableItems" :key="element.uniqueId">
        <MediaGroup
          v-if="element.children"
          :element="element"
          :expanded="expandedGroups[element.uniqueId] ?? false"
          :media-playing-url="mediaPlayingUrl"
          @update:child-hidden="
            element.children.forEach((child) => (child.hidden = !!$event))
          "
          @update:expanded="expandedGroups[element.uniqueId] = $event"
          @update:hidden="element.hidden = !!$event"
        />
        <MediaItem
          v-else
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
      </template>
    </div>
  </q-list>
</template>

<script setup lang="ts">
import type {
  DynamicMediaObject,
  MediaSection,
  MediaSectionIdentifier,
} from 'src/types';

import { storeToRefs } from 'pinia';
import { useMediaDragAndDrop } from 'src/composables/useMediaDragAndDrop';
import { useMediaSection } from 'src/composables/useMediaSection';
import { getTextColor } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onMounted, onUnmounted, watch } from 'vue';

import MediaGroup from './MediaGroup.vue';
import MediaItem from './MediaItem.vue';
import MediaSectionHeader from './MediaSectionHeader.vue';
import SectionEmptyState from './SectionEmptyState.vue';

const props = defineProps<{
  mediaList: MediaSection;
  openImportMenu: (section: MediaSectionIdentifier) => void;
}>();

const currentState = useCurrentStateStore();
const { mediaPlayingUrl, selectedDateObject } = storeToRefs(currentState);

// Use the media section composable
const {
  addSong,
  deleteSection,
  expandedGroups,
  isCustomSection,
  isEmpty,
  isFirst,
  isLast,
  isRenaming,
  isSongButton,
  moveSection,
  updateMediaOrder,
  updateSectionColor,
  updateSectionLabel,
  visibleItems,
} = useMediaSection(props.mediaList);

// Use the drag and drop composable
const {
  dragDropContainer,
  forceUpdateSortableItems,
  isDragging,
  sortableItems,
} = useMediaDragAndDrop(
  visibleItems.value,
  updateMediaOrder,
  props.mediaList.uniqueId,
);

// Watch for external changes to visibleItems and update sortableItems accordingly
watch(
  () => visibleItems.value,
  (
    newItems: DynamicMediaObject[],
    oldItems: DynamicMediaObject[] | undefined,
  ) => {
    // Only update if this is an external change (not from drag operations)
    if (!isDragging.value && oldItems) {
      const isExternalChange =
        oldItems.length !== newItems.length ||
        !oldItems.every(
          (item, index) => item.uniqueId === newItems[index]?.uniqueId,
        );

      if (isExternalChange) {
        console.log('🔄 External change detected, updating sortableItems:', {
          newItemCount: newItems.length,
          oldItemCount: oldItems.length,
          sectionId: props.mediaList.uniqueId,
        });
        forceUpdateSortableItems(newItems);
      }
    }
  },
  { deep: true },
);

// Computed styles
const sectionStyles = computed(() => ({
  '--bg-color': props.mediaList.bgColor || 'rgb(148, 94, 181)',
  '--text-color': getTextColor(props.mediaList),
}));

// Methods
const handleRename = (value: boolean) => {
  isRenaming.value = value;
};

// Listen for drag completion events
const handleDragCompleted = (event: CustomEvent) => {
  console.log('🎯 Drag completed event received:', {
    currentSection: props.mediaList.uniqueId,
    eventDetail: event.detail,
  });

  const { sectionId } = event.detail;

  // Always update if this is not the section that triggered the event
  if (sectionId !== props.mediaList.uniqueId) {
    console.log(
      '🔄 Drag completed in different section, updating sortableItems:',
      {
        currentSection: props.mediaList.uniqueId,
        triggeredBySection: sectionId,
      },
    );

    // Force update sortable items with current visible items
    forceUpdateSortableItems(visibleItems.value);
  } else {
    console.log('⏭️ Skipping update (same section):', {
      currentSection: props.mediaList.uniqueId,
      triggeredBySection: sectionId,
    });
  }
};

onMounted(() => {
  window.addEventListener(
    'dragCompleted',
    handleDragCompleted as EventListener,
  );
});

onUnmounted(() => {
  window.removeEventListener(
    'dragCompleted',
    handleDragCompleted as EventListener,
  );
});

defineExpose({
  expandedGroups,
  isDragging,
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
</style>
