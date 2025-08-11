<template>
  <q-item
    :class="[
      'text-' + mediaList.config?.uniqueId,
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
          : 'text-white bg-' + mediaList.config?.uniqueId,
        { 'jw-icon': mediaList.config?.jwIcon },
      ]"
    >
      <template v-if="mediaList.config?.jwIcon">
        {{ mediaList.config?.jwIcon }}
      </template>
      <template v-else>
        <q-icon name="mmm-additional-media" size="md" />
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
        :model-value="mediaList.config?.label"
        @blur="handleRename(false)"
        @change="handleLabelChange"
        @keyup.enter="handleRename(false)"
        @keyup.esc="handleRename(false)"
      />
      <template v-else>
        {{
          !mediaList.config?.label &&
          (mediaList.config?.uniqueId === 'imported-media' ||
            mediaList.config?.uniqueId.startsWith('custom-'))
            ? t('imported-media')
            : mediaList.config?.label || t(mediaList.config?.uniqueId)
        }}
      </template>
    </q-item-section>

    <q-item-section side>
      <div class="row items-center">
        <!-- Three-dots menu for other controls -->
        <template v-if="isCustom && !currentState.selectedDateObject?.meeting">
          <q-btn class="custom-text-color" flat icon="mmm-dots" round size="sm">
            <q-menu>
              <q-list style="min-width: 150px">
                <!-- Color Picker -->
                <q-item clickable @click="showColorPicker = true">
                  <q-item-section avatar>
                    <q-icon name="mmm-palette" />
                  </q-item-section>
                  <q-item-section>{{ t('change-color') }}</q-item-section>
                </q-item>

                <!-- Move Up -->
                <q-item v-if="!isFirst" clickable @click="$emit('move', 'up')">
                  <q-item-section avatar>
                    <q-icon name="mmm-up" />
                  </q-item-section>
                  <q-item-section>{{ t('move-up') }}</q-item-section>
                </q-item>

                <!-- Move Down -->
                <q-item v-if="!isLast" clickable @click="$emit('move', 'down')">
                  <q-item-section avatar>
                    <q-icon name="mmm-down" />
                  </q-item-section>
                  <q-item-section>{{ t('move-down') }}</q-item-section>
                </q-item>

                <!-- Add Divider -->
                <q-item
                  clickable
                  @click="
                    $emit('add-divider', mediaList.config?.uniqueId || '')
                  "
                >
                  <q-item-section avatar>
                    <q-icon name="mmm-minus" />
                  </q-item-section>
                  <q-item-section>{{ t('add-divider') }}</q-item-section>
                </q-item>

                <!-- Repeat Section -->
                <q-item clickable @click="handleRepeatClick">
                  <q-item-section avatar>
                    <q-icon
                      :name="
                        mediaList.config?.uniqueId &&
                        isSectionRepeating(mediaList.config?.uniqueId)
                          ? 'mmm-repeat'
                          : 'mmm-repeat-off'
                      "
                    />
                  </q-item-section>
                  <q-item-section>
                    {{
                      mediaList.config?.uniqueId &&
                      isSectionRepeating(mediaList.config?.uniqueId)
                        ? t('stop-repeat-section')
                        : t('repeat-section')
                    }}
                  </q-item-section>
                </q-item>

                <!-- Delete -->
                <q-item
                  v-if="mediaList.config?.uniqueId !== 'imported-media'"
                  clickable
                  @click="$emit('delete')"
                >
                  <q-item-section avatar>
                    <q-icon color="negative" name="mmm-delete" />
                  </q-item-section>
                  <q-item-section class="text-negative">
                    {{ t('delete') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <!-- Color Picker Popup -->
            <q-popup-proxy
              v-model="showColorPicker"
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
        </template>

        <!-- Repeat Button (only when repeating) -->
        <template
          v-if="
            mediaList.config?.uniqueId &&
            isSectionRepeating(mediaList.config?.uniqueId)
          "
        >
          <q-btn
            color="positive"
            icon="mmm-repeat"
            round
            size="sm"
            @click="handleRepeatClick"
          >
            <q-tooltip :delay="500">
              {{ t('stop-repeat-section') }}
            </q-tooltip>
          </q-btn>
        </template>

        <!-- Add Media Button -->
        <template v-if="hasAddMediaButton">
          <q-btn
            class="add-media-shortcut"
            :class="[
              !buttonLabel
                ? 'custom-text-color'
                : 'bg-' + mediaList.config?.uniqueId,
            ]"
            :color="
              !isCustom ||
              (isCustom && currentState.selectedDateObject?.meeting === 'we')
                ? mediaList.config?.uniqueId
                : undefined
            "
            :flat="!buttonLabel"
            :icon="isSongButton ? 'mmm-music-note' : 'mmm-add-media'"
            :label="buttonLabel"
            :outline="!!buttonLabel"
            :round="!buttonLabel"
            size="sm"
            @click="handleAddClick"
          >
            <q-tooltip v-if="!$q.screen.gt.xs" :delay="500">
              {{ tooltipText }}
            </q-tooltip>
          </q-btn>
        </template>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { MediaSectionWithConfig } from 'src/types';

import { useElementHover } from '@vueuse/core';
import { useQuasar } from 'quasar';
import { useMediaSection } from 'src/composables/useMediaSection';
import { useMediaSectionRepeat } from 'src/composables/useMediaSectionRepeat';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  hasAddMediaButton: boolean;
  isCustom: boolean;
  isFirst: boolean;
  isLast: boolean;
  isRenaming: boolean;
  isSongButton: boolean;
  mediaList: MediaSectionWithConfig;
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
const hexValue = ref(props.mediaList.config?.bgColor || '#ffffff');
const showColorPicker = ref(false);

// Computed properties
const buttonLabel = computed(() => {
  if (!$q.screen.gt.xs) return undefined;

  if (props.isSongButton) {
    return props.mediaList.config?.uniqueId === 'pt'
      ? t('add-an-opening-song')
      : t('add-a-closing-song');
  }

  return !props.isCustom ? t('add-extra-media') : undefined;
});

const tooltipText = computed(() => {
  if (props.isSongButton) {
    return props.mediaList.config?.uniqueId === 'pt'
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
    emit('add-song', props.mediaList.config?.uniqueId || '');
    console.log(
      '🔄 [handleAddClick] Adding song to section:',
      props.mediaList.config?.uniqueId,
    );
  } else {
    emit('open-import', props.mediaList.config?.uniqueId || '');
  }
};

const handleLabelChange = (val: string) => {
  emit('update-label', val);
};

const handleColorChange = (val: null | string) => {
  emit('update-color', val ?? '');
};

const handleRepeatClick = () => {
  const isCurrentlyRepeating = isSectionRepeating(
    props.mediaList.config?.uniqueId || '',
  );
  const newRepeatState = !isCurrentlyRepeating;

  // Update the section settings
  updateSectionRepeat(newRepeatState);

  // Toggle the repeat functionality
  if (props.mediaList.config?.uniqueId) {
    toggleSectionRepeat(props.mediaList.config?.uniqueId);
  }
};

// Method to update section repeat state (can be called from parent)
const updateSectionRepeatState = (newState: boolean) => {
  console.log('🔄 [updateSectionRepeatState] Updating section repeat state:', {
    isCurrentlyRepeating: props.mediaList.config?.uniqueId
      ? isSectionRepeating(props.mediaList.config?.uniqueId)
      : false,
    newState,
    sectionId: props.mediaList.config?.uniqueId,
  });

  updateSectionRepeat(newState);
  if (newState) {
    // Start repeating if not already
    if (
      props.mediaList.config?.uniqueId &&
      !isSectionRepeating(props.mediaList.config?.uniqueId)
    ) {
      toggleSectionRepeat(props.mediaList.config?.uniqueId);
    }
  } else {
    // Stop repeating if currently repeating
    if (
      props.mediaList.config?.uniqueId &&
      isSectionRepeating(props.mediaList.config?.uniqueId)
    ) {
      toggleSectionRepeat(props.mediaList.config?.uniqueId);
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
