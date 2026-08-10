<template>
  <q-item
    :class="['media-divider hover-reveal-group', { 'is-editing': isEditing }]"
    dense
    :style="{
      ...dividerStyles,
      '--divider-bg-color': divider.bgColor || 'var(--q-secondary)',
    }"
  >
    <q-item-section avatar>
      <q-icon
        class="media-drag-handle section-drag-handle"
        name="mmm-drag-n-drop"
        size="sm"
        :style="{ color: divider.textColor }"
      >
        <q-tooltip v-if="!isDragging" :delay="500">
          {{ t('drag-to-reorder') }}
        </q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section>
      <q-input
        v-if="isEditing"
        ref="editTitleInput"
        v-model="editTitle"
        borderless
        class="custom-text-color"
        dense
        style="height: 30px; margin-top: -10px"
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
          v-if="!isEditing"
          class="hover-reveal"
          flat
          icon="mmm-edit"
          round
          size="sm"
          :style="{ color: divider.textColor }"
          @click="startEdit"
        >
          <q-tooltip :delay="500">{{ t('edit') }}</q-tooltip>
        </q-btn>
        <q-btn
          v-if="isEditing"
          flat
          icon="mmm-check"
          round
          size="sm"
          :style="{ color: divider.textColor }"
          @click="saveTitle"
        >
          <q-tooltip :delay="500">{{ t('save') }}</q-tooltip>
        </q-btn>
        <q-btn
          v-if="isEditing"
          flat
          icon="mmm-palette"
          round
          size="sm"
          :style="{ color: divider.textColor }"
        >
          <q-tooltip :delay="500">{{ t('change-color') }}</q-tooltip>
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
          size="sm"
          :style="{ color: divider.textColor }"
          @click="deleteDivider"
        >
          <q-tooltip :delay="500">{{ t('delete') }}</q-tooltip>
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { MediaDivider } from 'src/types';

import { whenever } from '@vueuse/core';
import {
  findMediaSection,
  getSectionBgColor,
  getTextColorForBgColor,
} from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  divider: MediaDivider;
  isDragging?: boolean;
}>();

const emit = defineEmits<{
  delete: [dividerId: string];
  'update:color': [bgColor: string, textColor: string];
  'update:title': [title: string];
}>();

const isEditing = ref(false);
const editTitle = ref('');
const currentBgColor = ref(props.divider.bgColor || 'var(--q-secondary)');

const editTitleInput = ref<HTMLInputElement>();

const dividerStyles = computed(() => {
  const { selectedDateObject } = useCurrentStateStore();

  if (!selectedDateObject?.mediaSections)
    return {
      backgroundColor: `${props.divider.bgColor || 'var(--q-secondary)'} !important`,
      color: props.divider.textColor || 'white',
    };

  const section = findMediaSection(
    selectedDateObject?.mediaSections,
    props.divider.section,
  );
  if (!section?.config)
    return {
      backgroundColor: `${props.divider.bgColor || 'var(--q-secondary)'} !important`,
      color: props.divider.textColor || 'white',
    };

  return {
    backgroundColor: `${props.divider.bgColor || getSectionBgColor(section.config)} !important`,
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
  const textColor = getTextColorForBgColor(newColor);
  emit('update:color', newColor, textColor);
};

const deleteDivider = () => {
  emit('delete', props.divider.uniqueId);
};

whenever(isEditing, () => {
  nextTick(() => {
    editTitleInput.value?.focus();
  });
});
</script>

<style lang="scss" scoped>
.custom-text-color *,
.q-item__section--side {
  color: inherit;
}

.media-divider {
  margin: 4px 0 4px -1px;
  transition: all 0.2s ease;
  border-radius: 0px;

  &.sortable-selected {
    transform: none;
    background-color: unset !important;
    background-color: var(--divider-bg-color) !important;
  }

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
</style>
