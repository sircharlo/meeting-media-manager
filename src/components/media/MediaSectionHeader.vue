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
        isCustom && selectedDayMeetingType !== 'we'
          ? 'custom-bg-color'
          : 'text-white bg-' + mediaList.config?.uniqueId,
        { 'jw-icon': mediaList.config?.jwIconKeyword },
      ]"
    >
      <template v-if="mediaList.config?.jwIconKeyword">
        {{ getJwIconFromKeyword(mediaList.config?.jwIconKeyword) }}
      </template>
      <template v-else>
        <q-icon name="mmm-additional-media" size="md" />
      </template>
    </q-avatar>

    <q-item-section
      ref="sectionHeader"
      :class="{
        'cursor-pointer': isHovered && isCustom,
        'section-title': !isRenaming,
      }"
      @click.stop="isCustom && !canCollapse ? undefined : () => {}"
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
        <div v-if="mediaList.config?.documentTitle" class="section-subtitle">
          {{ mediaList.config.documentTitle }}
        </div>
      </template>
    </q-item-section>

    <q-item-section side>
      <div class="row items-center q-gutter-sm">
        <!-- Three-dots menu for other controls -->
        <template v-if="isCustom && !selectedDayMeetingType">
          <q-btn
            :aria-label="t('more-options')"
            class="custom-text-color btn-tonal"
            flat
            icon="mmm-dots"
            round
            size="sm"
            @click.stop
          >
            <q-tooltip v-if="!moreOptionsMenuActive" :delay="500">
              {{ t('more-options') }}
            </q-tooltip>
            <q-menu v-model="moreOptionsMenuActive">
              <q-list role="menu" style="min-width: 150px">
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
            :aria-label="t('stop-repeat-section')"
            color="positive"
            icon="mmm-repeat"
            round
            size="sm"
            @click.stop="handleRepeatClick"
          >
            <q-tooltip :delay="500">
              {{ t('stop-repeat-section') }}
            </q-tooltip>
          </q-btn>
        </template>

        <!-- Add Media Button -->
        <template v-if="hasAddMediaButton">
          <q-btn
            :aria-label="!buttonLabel ? tooltipText : undefined"
            class="add-media-shortcut btn-tonal"
            :class="
              isCustom && selectedDayMeetingType !== 'we'
                ? 'custom-text-color'
                : undefined
            "
            :color="
              !isCustom || (isCustom && selectedDayMeetingType === 'we')
                ? mediaList.config?.uniqueId
                : undefined
            "
            flat
            :icon="isSongButton ? 'mmm-music-note' : 'mmm-add-media'"
            :label="buttonLabel"
            :round="!buttonLabel"
            size="sm"
            @click.stop="handleAddClick"
          >
            <q-tooltip v-if="!buttonLabel" :delay="500">
              {{ tooltipText }}
            </q-tooltip>
          </q-btn>
        </template>
        <!-- Chevron for collapsing (non-meeting days only) -->
        <template v-if="canCollapse">
          <q-btn
            :aria-label="collapsed ? t('expand') : t('collapse')"
            class="btn-tonal"
            color="primary"
            flat
            :icon="collapsed ? 'mmm-left' : 'mmm-down'"
            round
            size="sm"
            @click="toggleCollapse()"
          >
            <q-tooltip :delay="500">
              {{ collapsed ? t('expand') : t('collapse') }}
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
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useMediaSection } from 'src/composables/useMediaSection';
import { useMediaSectionRepeat } from 'src/composables/useMediaSectionRepeat';
import { getJwIconFromKeyword } from 'src/helpers/fonts';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  collapsed?: boolean;
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
  'update:collapsed': [value: boolean];
}>();

const $q = useQuasar();
const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings, selectedDayMeetingType } = storeToRefs(currentState);

// Section repeat functionality
const { isSectionRepeating, toggleSectionRepeat } = useMediaSectionRepeat();

// Get the section composable for updating repeat settings
const { updateSectionRepeat } = useMediaSection(props.mediaList);

const sectionHeader = ref<HTMLElement>();
const isHovered = useElementHover(sectionHeader);

const renameInput = ref<HTMLInputElement>();
const hexValue = ref(props.mediaList.config?.bgColor || '#ffffff');
const showColorPicker = ref(false);
const moreOptionsMenuActive = ref(false);

// Computed properties
const buttonLabel = computed(() => {
  if (currentSettings.value?.compactAddMediaButton !== false) {
    return undefined;
  }

  if (!$q.screen.gt.xs) return undefined;

  if (props.isSongButton) {
    return props.mediaList.config?.uniqueId === 'pt'
      ? t('add-an-opening-song')
      : t('add-a-closing-song');
  }

  return props.isCustom ? undefined : t('add-extra-media');
});

const tooltipText = computed(() => {
  if (props.isSongButton) {
    return props.mediaList.config?.uniqueId === 'pt'
      ? t('add-an-opening-song')
      : t('add-a-closing-song');
  }
  return t('add-extra-media');
});

// Computed property to determine if section can be collapsed
const canCollapse = computed(() => !selectedDayMeetingType.value);

// Methods
const toggleCollapse = () => {
  log('🔄 toggleCollapse called', 'mediaSections', 'log', {
    currentCollapsed: props.collapsed,
    newCollapsed: !props.collapsed,
  });
  emit('update:collapsed', !props.collapsed);
};
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
    log(
      '🔄 [handleAddClick] Adding song to section:',
      'mediaSections',
      'log',
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
  log(
    '🔄 [updateSectionRepeatState] Updating section repeat state:',
    'mediaSections',
    'log',
    {
      isCurrentlyRepeating: props.mediaList.config?.uniqueId
        ? isSectionRepeating(props.mediaList.config?.uniqueId)
        : false,
      newState,
      sectionId: props.mediaList.config?.uniqueId,
    },
  );

  updateSectionRepeat(newState);
  if (newState) {
    // Start repeating if not already
    if (
      props.mediaList.config?.uniqueId &&
      !isSectionRepeating(props.mediaList.config?.uniqueId)
    ) {
      toggleSectionRepeat(props.mediaList.config?.uniqueId);
    }
  } else if (
    // Stop repeating if currently repeating
    props.mediaList.config?.uniqueId &&
    isSectionRepeating(props.mediaList.config?.uniqueId)
  ) {
    toggleSectionRepeat(props.mediaList.config?.uniqueId);
  }
};

// props.mediaList.config is a shared reactive object that DialogCustomSectionEdit's
// bulk "Edit sections" dialog can also mutate directly - hexValue is only a
// local staging copy (kept separate from the prop so the picker can update
// live while dragging, only committing via handleColorChange's @change), so
// without this it could keep showing a stale color from before an edit made
// elsewhere. Resync it every time the popup opens, not continuously, so it
// doesn't fight the user's own in-progress drag.
watch(showColorPicker, (open) => {
  if (!open) return;
  hexValue.value = props.mediaList.config?.bgColor || '#ffffff';
});

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
  border-radius: 4px;
}

// Overrides the global .section-title (src/css/app.scss) just for this
// component's instances. The template also puts Quasar's "row" (flex)
// class on this div; flex wraps the raw text in an anonymous flex item
// that has its own implicit min-width: auto, which defeats text-overflow
// no matter what's set here. Forcing block layout removes that anonymous
// flex item so the ellipsis rules below actually apply.
.section-title {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Sits below the section title as a quieter second line, so the specific
// document (e.g. this week's study article) reads as detail rather than
// competing with the section name for attention.
.section-subtitle {
  font-size: 0.8em;
  font-weight: 500;
  opacity: 0.75;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// .section-title lives in src/css/app.scss as a global utility - it's also
// reused (unstyled here) by PresentWebsite.vue's section headers, which
// share the same text-{id} convention.
</style>
