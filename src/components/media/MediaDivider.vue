<template>
  <q-item
    ref="dividerElement"
    :class="['media-divider', { 'is-editing': isEditing }]"
    :dense="!divider.title"
    :style="dividerStyles"
  >
    <q-item-section>
      <q-input
        v-if="isEditing"
        ref="editTitleInput"
        v-model="editTitle"
        borderless
        class="custom-text-color"
        dense
        @keyup.enter="saveTitle"
        @keyup.esc="cancelEdit"
      />
      <q-item-label v-else class="divider-title" @dblclick="startEdit">
        {{ divider.title }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="row items-center">
        <q-btn
          v-if="isEditing"
          flat
          icon="mmm-check"
          round
          size="xs"
          :style="{ color: divider.textColor }"
          @click="saveTitle"
        />
        <q-btn
          v-if="!isEditing && isHovering"
          flat
          icon="mmm-edit"
          round
          size="xs"
          :style="{ color: divider.textColor }"
          @click="startEdit"
        />
        <q-btn
          v-if="isEditing"
          flat
          icon="mmm-palette"
          round
          size="xs"
          :style="{ color: divider.textColor }"
        >
          <q-popup-proxy cover transition-hide="scale" transition-show="scale">
            <q-color
              v-model="currentBgColor"
              format-model="hex"
              no-footer
              no-header
              @change="handleColorChange"
            />
          </q-popup-proxy>
        </q-btn>
        <q-btn
          v-if="isEditing"
          flat
          icon="mmm-delete"
          round
          size="xs"
          :style="{ color: divider.textColor }"
          @click="deleteDivider"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { MediaDivider } from 'src/types';

import { useElementHover, whenever } from '@vueuse/core';
import { getSectionBgColor } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, nextTick, ref } from 'vue';

const props = defineProps<{
  divider: MediaDivider;
}>();

const emit = defineEmits<{
  delete: [dividerId: string];
  'update:color': [bgColor: string, textColor: string];
  'update:title': [title: string];
}>();

const dividerElement = ref<HTMLElement>();
const isEditing = ref(false);
const isHovering = useElementHover(dividerElement);
const editTitle = ref('');
const currentBgColor = ref(props.divider.bgColor || 'var(--q-secondary)');

const editTitleInput = ref<HTMLInputElement>();

whenever(isEditing, () => {
  nextTick(() => {
    editTitleInput.value?.focus();
  });
});

// Calculate luminance and determine text color (memoized)
const calculateLuminance = (hexColor: string): number => {
  // Remove # if present and validate
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return 0.5; // Default to middle luminance for invalid colors

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance using sRGB coefficients
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance;
};

const getContrastTextColor = (bgColor: string): string => {
  // Handle CSS variables and non-hex colors
  if (!bgColor.startsWith('#')) return '#ffffff';

  const luminance = calculateLuminance(bgColor);
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

const dividerStyles = computed(() => {
  const { selectedDateObject } = useCurrentStateStore();

  return {
    backgroundColor:
      props.divider.bgColor ||
      getSectionBgColor(
        selectedDateObject?.mediaSections?.[props.divider.section]?.config,
      ),
    color: props.divider.textColor || 'white',
  };
});

const startEdit = () => {
  editTitle.value = props.divider.title;
  isEditing.value = true;
};

const saveTitle = () => {
  emit('update:title', editTitle.value.trim());
  isEditing.value = false;
};

const cancelEdit = () => {
  isEditing.value = false;
  editTitle.value = '';
};

const handleColorChange = (newColor: string) => {
  const textColor = getContrastTextColor(newColor);
  emit('update:color', newColor, textColor);
};

const deleteDivider = () => {
  emit('delete', props.divider.uniqueId);
};
</script>

<style lang="scss" scoped>
.custom-text-color *,
.q-item__section--side {
  color: inherit;
}

.media-divider {
  margin: 4px 0 4px -1px;
  border-radius: 8px;
  transition: all 0.2s ease;
  border-radius: 0px;

  &.is-editing {
    box-shadow: 0 0 0 2px var(--q-primary);
  }
}

.divider-title {
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;

  &:hover {
    opacity: 0.8;
  }
}

.media-divider:hover .q-item-section--side {
  opacity: 1;
}

.q-item-section--side {
  opacity: 0;
  transition: opacity 0.2s ease;
}
</style>
