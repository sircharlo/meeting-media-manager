<template>
  <q-item
    :class="[
      'text-' + mediaList.uniqueId,
      'items-center',
      { 'custom-text-color': isCustom },
    ]"
    @dblclick="handleDoubleClick"
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
      class="text-bold text-uppercase text-spaced row justify-between col-grow"
    >
      {{ isCustom }}
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
              isCustom
                ? 'custom-text-color'
                : 'text-white bg-' + mediaList.uniqueId,
            ]"
            :color="!isCustom ? mediaList.uniqueId : undefined"
            :flat="isCustom"
            :icon="isSongButton ? 'mmm-music-note' : 'mmm-add-media'"
            :label="buttonLabel"
            :outline="!isCustom"
            :round="isCustom"
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

import { useQuasar } from 'quasar';
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
}>();

const emit = defineEmits<{
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
</script>

<style lang="scss" scoped>
.add-media-shortcut {
  max-width: 100%;
}
</style>
