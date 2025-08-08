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
          @media-stopped="handleMediaStopped"
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
import type {
  MediaItem as MediaItemType,
  MediaSectionIdentifier,
  MediaSectionWithConfig,
} from 'src/types';

import DialogAddDivider from 'components/dialog/DialogAddDivider.vue';
import { storeToRefs } from 'pinia';
import { useMediaDragAndDrop } from 'src/composables/useMediaDragAndDrop';
import { useMediaSection } from 'src/composables/useMediaSection';
import { getTextColor } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, nextTick, ref, watch } from 'vue';

import MediaDivider from './MediaDivider.vue';
import MediaGroup from './MediaGroup.vue';
import MediaItem from './MediaItem.vue';
import MediaSectionHeader from './MediaSectionHeader.vue';
import SectionEmptyState from './SectionEmptyState.vue';

const props = defineProps<{
  mediaList: MediaSectionWithConfig;
  openImportMenu: (section: MediaSectionIdentifier) => void;
}>();

const emit = defineEmits<{
  'media-stopped': [];
  'update:is-dragging': [isDragging: boolean];
  'update:sortable-items': [items: MediaItemType[]];
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

// Use the media dividers composable
import { useMediaDividers } from 'src/composables/useMediaDividers';
const { addDivider, deleteDivider, updateDividerColors, updateDividerTitle } =
  useMediaDividers(props.mediaList.config?.uniqueId);

// Use the drag and drop composable
const { dragDropContainer, isDragging, sortableItems } = useMediaDragAndDrop(
  visibleItems.value,
  props.mediaList.config?.uniqueId || '',
);

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

const handleMediaStopped = () => {
  console.log(
    '🛑 [handleMediaStopped] Media stopped, updating section repeat to false',
  );
  // Update section repeat to false when media is stopped
  if (sectionHeaderRef.value) {
    sectionHeaderRef.value.updateSectionRepeatState(false);
  }
};

// Watch for changes in isDragging and emit to parent
watch(
  () => isDragging.value,
  (newIsDragging) => {
    console.log('🔄 isDragging changed, emitting to parent:', {
      isDragging: newIsDragging,
      sectionId: props.mediaList.config?.uniqueId,
      sortableItems: sortableItems.value,
    });
    emit('update:is-dragging', newIsDragging);
    if (!newIsDragging) {
      // Note: MediaItem no longer has a section property
      // The section is now determined by the key in mediaSections
      emit('update:sortable-items', sortableItems.value);
    }
  },
);

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
