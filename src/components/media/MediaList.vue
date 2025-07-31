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
import { computed, watch } from 'vue';

import MediaGroup from './MediaGroup.vue';
import MediaItem from './MediaItem.vue';
import MediaSectionHeader from './MediaSectionHeader.vue';
import SectionEmptyState from './SectionEmptyState.vue';

const props = defineProps<{
  mediaList: MediaSection;
  openImportMenu: (section: MediaSectionIdentifier) => void;
}>();

const emit = defineEmits<{
  'update:is-dragging': [isDragging: boolean];
  'update:sortable-items': [items: DynamicMediaObject[]];
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
  updateSectionColor,
  updateSectionLabel,
  visibleItems,
} = useMediaSection(props.mediaList);

// Use the drag and drop composable
const { dragDropContainer, isDragging, sortableItems } = useMediaDragAndDrop(
  visibleItems.value,
  props.mediaList.uniqueId,
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

// Watch for changes in isDragging and emit to parent
watch(
  () => isDragging.value,
  (newIsDragging) => {
    console.log('🔄 isDragging changed, emitting to parent:', {
      isDragging: newIsDragging,
      sectionId: props.mediaList.uniqueId,
      sortableItems: sortableItems.value,
    });
    emit('update:is-dragging', newIsDragging);
    if (!newIsDragging) {
      const newItems = sortableItems.value.map((item) => ({
        ...item,
        section: props.mediaList.uniqueId,
      }));
      emit('update:sortable-items', newItems);
    }
  },
);

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
