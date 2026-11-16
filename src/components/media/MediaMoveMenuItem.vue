<template>
  <q-item v-if="reorder || targetSections.length" clickable>
    <q-item-section avatar>
      <q-icon name="mmm-drag-n-drop" />
    </q-item-section>
    <q-item-section>
      <q-item-label>
        {{ reorder ? t('move') : t('move-to-section') }}
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-icon name="mmm-right" size="xs" />
    </q-item-section>
    <q-menu anchor="top end" hover self="top start">
      <q-list role="menu">
        <template v-if="reorder">
          <q-item
            v-close-popup="-1"
            clickable
            :disable="!canMoveUp"
            @click="emit('move', -1)"
          >
            <q-item-section avatar>
              <q-icon name="mmm-up" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('move-up') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup="-1"
            clickable
            :disable="!canMoveDown"
            @click="emit('move', 1)"
          >
            <q-item-section avatar>
              <q-icon name="mmm-down" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('move-down') }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template v-if="targetSections.length">
          <template v-if="reorder">
            <q-separator />
            <q-item-label header>{{ t('move-to-section') }}</q-item-label>
          </template>
          <q-item
            v-for="section in targetSections"
            :key="section.config.uniqueId"
            v-close-popup="-1"
            clickable
            @click="moveToSection(section.config.uniqueId)"
          >
            <q-item-section avatar>
              <q-avatar
                :class="{ 'jw-icon': showJwIcon(section) }"
                size="md"
                :style="getSwatchStyle(section)"
              >
                <template v-if="showJwIcon(section)">
                  {{ getJwIconFromKeyword(section.config.jwIconKeyword) }}
                </template>
                <q-icon v-else name="mmm-additional-media" size="xs" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{
                getMediaSectionLabel(section.config)
              }}</q-item-label>
              <q-item-label v-if="section.config.documentTitle" caption>
                {{ section.config.documentTitle }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-menu>
  </q-item>
</template>

<script setup lang="ts">
import type { MediaSectionIdentifier, MediaSectionWithConfig } from 'src/types';

import { storeToRefs } from 'pinia';
import { getJwIconFromKeyword } from 'src/helpers/fonts';
import {
  getDisplayedMediaSections,
  getMediaSectionLabel,
  getMoveToSectionTargets,
  getSectionAccentColor,
  getTextColorForBgColor,
  moveMediaItemsToSection,
  saveWatchedMediaLayout,
} from 'src/helpers/media-sections';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { useDemoModeStore } from 'stores/demo-mode';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

// One "Move" entry for a media item's context menu, opening a submenu with
// Move up/Move down (when `reorder` is set) and the other sections shown for
// the day. With a multi-selection it's "Move to section" alone: a section is
// left out only when it already holds every selected item, so mixed
// selections can be gathered into any of their own sections too.
const props = defineProps<{
  canMoveDown?: boolean;
  canMoveUp?: boolean;
  // The items to move to another section: empty for a group's children,
  // which never leave their group.
  mediaIds: readonly string[];
  reorder?: boolean;
}>();

const emit = defineEmits<{
  move: [delta: number];
}>();

const { t } = useI18n();

const currentState = useCurrentStateStore();
const { selectedDateObject, selectedDayMeetingType } =
  storeToRefs(currentState);

const demoMode = useDemoModeStore();

const displayedSections = computed(() =>
  getDisplayedMediaSections(
    selectedDateObject.value,
    selectedDayMeetingType.value,
  ),
);

const targetSections = computed(() =>
  getMoveToSectionTargets(displayedSections.value, props.mediaIds),
);

// Same as the section header's avatar: the jw-icons glyph font can't load in
// demo mode (no network), so a bundled icon stands in for it there.
const showJwIcon = (section: MediaSectionWithConfig) =>
  !!section.config.jwIconKeyword && !demoMode.enabled;

const getSwatchStyle = (section: MediaSectionWithConfig) => {
  const color = getSectionAccentColor(
    section.config.uniqueId,
    displayedSections.value,
  );
  return { backgroundColor: color, color: getTextColorForBgColor(color) };
};

const moveToSection = (sectionId: MediaSectionIdentifier) => {
  const day = selectedDateObject.value;
  if (!day) return;

  const movedItems = moveMediaItemsToSection(
    displayedSections.value,
    props.mediaIds,
    sectionId,
  );
  if (!movedItems.length) return;

  log('Moved media items to another section', 'mediaSections', 'log', {
    count: movedItems.length,
    sectionId,
  });

  // Same as a drag between sections (see MediaList's
  // handleWatchedMediaPersistence): watched-folder items keep their section
  // and order in that folder's own layout file.
  const hasWatchedMedia = day.mediaSections.some((section) =>
    section.items?.some((item) => item.source === 'watched'),
  );
  if (hasWatchedMedia) void saveWatchedMediaLayout(day.mediaSections);
};
</script>
