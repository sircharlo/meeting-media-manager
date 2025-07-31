<template>
  <q-item
    :class="[
      'text-' + mediaList.uniqueId,
      'items-center',
      {
        'custom-text-color': isCustom,
      },
    ]"
  >
    <q-avatar
      :class="[
        isCustom && currentState.selectedDateObject?.meeting !== 'we'
          ? 'custom-bg-color'
          : 'text-white bg-' + mediaList.uniqueId,
        { 'jw-icon': mediaList.jwIcon },
      ]"
    >
      <template v-if="mediaList.jwIcon">
        {{ mediaList.jwIcon }}
      </template>
      <template v-else>
        <q-icon :name="mediaList.mmmIcon" size="md" />
      </template>
    </q-avatar>

    <q-item-section
      ref="sectionHeader"
      class="text-bold text-uppercase text-spaced row justify-between col-grow"
      :class="{ 'cursor-pointer': isHovered && isCustom }"
      @dblclick="isCustom ? handleDoubleClick() : undefined"
    >
      <q-input
        v-if="isRenaming"
        ref="renameInput"
        dense
        :model-value="mediaList.label"
        @blur="handleRename(false)"
        @change="handleLabelChange"
        @keyup.enter="handleRename(false)"
        @keyup.esc="handleRename(false)"
      />
      <template v-else>
        {{ mediaList.label }}
      </template>
    </q-item-section>

    <q-item-section side>
      <div class="row items-center">
        <!-- Add Media Button -->
        <template v-if="mediaList.extraMediaShortcut">
          <q-btn
            class="add-media-shortcut"
            :class="[
              isCustom && currentState.selectedDateObject?.meeting !== 'we'
                ? 'custom-text-color'
                : 'bg-' + mediaList.uniqueId,
            ]"
            :color="
              !isCustom ||
              (isCustom && currentState.selectedDateObject?.meeting === 'we')
                ? mediaList.uniqueId
                : undefined
            "
            :flat="
              isCustom && currentState.selectedDateObject?.meeting !== 'we'
            "
            :icon="isSongButton ? 'mmm-music-note' : 'mmm-add-media'"
            :label="buttonLabel"
            :outline="
              !isCustom && currentState.selectedDateObject?.meeting !== 'we'
            "
            :round="
              isCustom && currentState.selectedDateObject?.meeting !== 'we'
            "
            size="sm"
            @click="handleAddClick"
          >
            <q-tooltip v-if="!$q.screen.gt.xs" :delay="500">
              {{ tooltipText }}
            </q-tooltip>
          </q-btn>
        </template>

        <!-- Custom Section Controls -->
        <template v-if="isCustom">
          <!-- Color Picker -->
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
                v-model="hexValue"
                format-model="hex"
                no-footer
                no-header
                @change="handleColorChange"
              />
            </q-popup-proxy>
          </q-btn>

          <!-- Move Up -->
          <q-btn
            v-if="!isFirst"
            class="custom-text-color"
            flat
            icon="mmm-up"
            round
            size="sm"
            @click="$emit('move', 'up')"
          />

          <!-- Move Down -->
          <q-btn
            v-if="!isLast"
            class="custom-text-color"
            flat
            icon="mmm-down"
            round
            size="sm"
            @click="$emit('move', 'down')"
          />

          <!-- Add Divider -->
          <q-btn
            class="custom-text-color"
            flat
            icon="mmm-minus"
            round
            size="sm"
            @click="$emit('add-divider', mediaList.uniqueId)"
          >
            <q-tooltip :delay="500">
              {{ t('add-divider') }}
            </q-tooltip>
          </q-btn>

          <!-- Repeat Section (only for custom sections on non-meeting days) -->
          <q-btn
            v-if="isCustom && !currentState.selectedDateObject?.meeting"
            :color="
              isSectionRepeating(mediaList.uniqueId)
                ? 'positive'
                : 'custom-text-color'
            "
            :flat="!isSectionRepeating(mediaList.uniqueId)"
            :icon="
              isSectionRepeating(mediaList.uniqueId)
                ? 'mmm-repeat'
                : 'mmm-repeat-off'
            "
            round
            size="sm"
            @click="handleRepeatClick"
          >
            <q-tooltip :delay="500">
              {{
                isSectionRepeating(mediaList.uniqueId)
                  ? t('stop-repeat-section')
                  : t('repeat-section')
              }}
            </q-tooltip>
          </q-btn>

          <!-- Delete -->
          <q-btn
            v-if="mediaList.uniqueId !== 'additional'"
            color="negative"
            flat
            icon="mmm-delete"
            round
            size="sm"
            @click="$emit('delete')"
          />
        </template>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { MediaSection } from 'src/types';

import { useElementHover } from '@vueuse/core';
import { useQuasar } from 'quasar';
import { useMediaSection } from 'src/composables/useMediaSection';
import { useMediaSectionRepeat } from 'src/composables/useMediaSectionRepeat';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  isCustom: boolean;
  isFirst: boolean;
  isLast: boolean;
  isRenaming: boolean;
  isSongButton: boolean;
  mediaList: MediaSection;
  shouldUpdateRepeatOnStop?: boolean;
}>();

const emit = defineEmits<{
  'add-divider': [section: string];
  'add-song': [section: string | undefined];
  delete: [];
  move: [direction: 'down' | 'up'];
  'open-import': [section: string];
  rename: [value: boolean];
  'update-color': [color: string];
  'update-label': [label: string];
}>();

const $q = useQuasar();
const { t } = useI18n();
const currentState = useCurrentStateStore();

// Section repeat functionality
const { isSectionRepeating, toggleSectionRepeat } = useMediaSectionRepeat();

// Get the section composable for updating repeat settings
const { updateSectionRepeat } = useMediaSection(props.mediaList);

const sectionHeader = ref<HTMLElement>();
const isHovered = useElementHover(sectionHeader);

const renameInput = ref<HTMLInputElement>();
const hexValue = ref(props.mediaList.bgColor || '#ffffff');

// Computed properties
const buttonLabel = computed(() => {
  if (!$q.screen.gt.xs) return undefined;

  if (props.isSongButton) {
    return props.mediaList.uniqueId === 'additional'
      ? t('add-an-opening-song')
      : t('add-a-closing-song');
  }

  return !props.isCustom ? t('add-extra-media') : undefined;
});

const tooltipText = computed(() => {
  if (props.isSongButton) {
    return props.mediaList.uniqueId === 'additional'
      ? t('add-an-opening-song')
      : t('add-a-closing-song');
  }
  return t('add-extra-media');
});

// Methods
const handleDoubleClick = () => {
  emit('rename', true);
  nextTick(() => {
    if (renameInput.value) {
      renameInput.value.focus();
    }
  });
};

const handleRename = (value: boolean) => {
  emit('rename', value);
};

const handleAddClick = () => {
  if (props.isSongButton) {
    emit('add-song', props.mediaList.uniqueId);
  } else {
    emit('open-import', props.mediaList.uniqueId);
  }
};

const handleLabelChange = (val: string) => {
  emit('update-label', val);
};

const handleColorChange = (val: null | string) => {
  emit('update-color', val ?? '');
};

const handleRepeatClick = () => {
  const isCurrentlyRepeating = isSectionRepeating(props.mediaList.uniqueId);
  const newRepeatState = !isCurrentlyRepeating;

  // Update the section settings
  updateSectionRepeat(newRepeatState);

  // Toggle the repeat functionality
  toggleSectionRepeat(props.mediaList.uniqueId);
};

// Method to update section repeat state (can be called from parent)
const updateSectionRepeatState = (newState: boolean) => {
  console.log('🔄 [updateSectionRepeatState] Updating section repeat state:', {
    isCurrentlyRepeating: isSectionRepeating(props.mediaList.uniqueId),
    newState,
    sectionId: props.mediaList.uniqueId,
  });

  updateSectionRepeat(newState);
  if (newState) {
    // Start repeating if not already
    if (!isSectionRepeating(props.mediaList.uniqueId)) {
      toggleSectionRepeat(props.mediaList.uniqueId);
    }
  } else {
    // Stop repeating if currently repeating
    if (isSectionRepeating(props.mediaList.uniqueId)) {
      toggleSectionRepeat(props.mediaList.uniqueId);
    }
  }
};

// Expose the method for parent components
defineExpose({
  updateSectionRepeatState,
});
</script>

<style lang="scss" scoped>
.custom-text-color {
  color: var(--bg-color);
}
.custom-bg-color {
  background-color: var(--bg-color);
  color: var(--text-color);
}

.add-media-shortcut {
  max-width: 100%;
}
</style>
