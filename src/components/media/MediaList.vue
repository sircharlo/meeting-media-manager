<template>
  <q-list
    v-show="
      mediaList.items?.filter((m) => !m.hidden).length || mediaList.alwaysShow
    "
    :class="'media-section ' + mediaList.type"
  >
    <q-item
      v-if="selectedDateObject"
      :class="'text-' + mediaList.type + ' items-center'"
    >
      <q-avatar
        :class="
          'text-white bg-' +
          mediaList.type +
          (mediaList.jwIcon ? ' jw-icon' : '')
        "
      >
        <!-- :size="isWeMeetingDay(selectedDateObject.date) ? 'lg' : 'md'" -->
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
        {{ mediaList.label }}
      </q-item-section>
      <q-item-section v-if="mediaList.extraMediaShortcut" side>
        <q-btn
          :color="mediaList.type"
          :icon="isSongButton ? 'mmm-music-note' : 'mmm-add-media'"
          outline
          @click="
            isSongButton
              ? addSong(mediaList.type)
              : openImportMenu(mediaList.type)
          "
        >
          <q-tooltip :delay="500">
            {{
              isSongButton
                ? mediaList.type === 'additional'
                  ? t('add-an-opening-song')
                  : t('add-a-closing-song')
                : t('add-extra-media')
            }}
          </q-tooltip>
        </q-btn>
      </q-item-section>
    </q-item>
    <div v-if="emptyMediaList && !currentlySorting">
      <q-item>
        <q-item-section
          class="align-center text-secondary text-grey text-subtitle2"
        >
          <div class="row items-center">
            <q-icon class="q-mr-sm" name="mmm-info" size="sm" />
            <span>
              {{
                selectedDateObject && isWeMeetingDay(selectedDateObject?.date)
                  ? t('dont-forget-add-missing-media')
                  : t('no-media-files-for-section')
              }}
            </span>
          </div>
        </q-item-section>
      </q-item>
    </div>
    <Sortable
      class="sortable-media"
      :class="{
        'drop-here': currentlySorting,
        // 'dashed-border': currentlySorting,
        // 'rounded-borders': currentlySorting,
        'bg-primary-light': currentlySorting,
      }"
      item-key="uniqueId"
      :list="mediaList.items"
      :options="{
        animation: 150,
        group: 'mediaLists',
        multiDrag: true,
        selectedClass: 'sortable-selected',
        multiDragKey: 'ctrl',
        avoidImplicitDeselect: false,
      }"
      @add="handleMediaSort($event, 'ADD', mediaList.type as MediaSection)"
      @end="handleMediaSort($event, 'END', mediaList.type as MediaSection)"
      @remove="
        handleMediaSort($event, 'REMOVE', mediaList.type as MediaSection)
      "
      @select="
        handleMediaSort($event, 'SELECT', mediaList.type as MediaSection)
      "
      @start="handleMediaSort($event, 'START', mediaList.type as MediaSection)"
      @unselect="
        handleMediaSort($event, 'UNSELECT', mediaList.type as MediaSection)
      "
    >
      <template #item="{ element }: { element: DynamicMediaObject }">
        <template v-if="element.children">
          <q-list
            v-if="element.children.some((m) => !m.hidden)"
            bordered
            class="q-mx-sm q-my-sm media-children rounded-borders overflow-hidden"
          >
            <q-menu context-menu style="overflow-x: hidden" touch-position>
              <q-list>
                <q-item
                  v-close-popup
                  clickable
                  :disable="!!mediaPlayingUrl"
                  @click="element.hidden = true"
                >
                  <q-item-section avatar>
                    <q-icon name="mmm-file-hidden" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ t('hide-from-list') }}</q-item-label>
                    <q-item-label caption>
                      {{ t('hide-from-list-explain') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <q-expansion-item
              :key="element.children.map((m) => m.uniqueId).join(',')"
              v-model="expandedMediaGroups[element.uniqueId]"
              :disable="
                element.children.map((m) => m.fileUrl).includes(mediaPlayingUrl)
              "
              :header-class="
                expandedMediaGroups[element.uniqueId]
                  ? $q.dark.isActive
                    ? 'bg-accent-400'
                    : 'bg-accent-200'
                  : ''
              "
            >
              <template #header>
                <q-item-section>
                  <div>
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span v-html="element.extractCaption"></span>
                    <q-badge
                      class="q-ml-sm text-primary"
                      :color="$q.dark.isActive ? 'accent-400' : 'accent-200'"
                      :label="element.children?.length"
                      rounded
                      :text-color="$q.dark.isActive ? 'white' : 'accent-200'"
                    />
                  </div>
                </q-item-section>
              </template>
              <Sortable
                v-if="element.children"
                item-key="uniqueId"
                :list="element.children"
              >
                <template
                  #item="{
                    element: childElement,
                  }: {
                    element: DynamicMediaObject;
                  }"
                >
                  <div :key="childElement.uniqueId">
                    <MediaItem
                      :key="childElement.uniqueId"
                      v-model:repeat="childElement.repeat"
                      child
                      :media="childElement"
                      :play-state="playState(childElement.uniqueId)"
                      @update:custom-duration="
                        childElement.customDuration =
                          JSON.parse($event) || undefined
                      "
                      @update:hidden="childElement.hidden = !!$event"
                      @update:tag="childElement.tag = $event"
                      @update:title="childElement.title = $event"
                    />
                  </div>
                </template>
              </Sortable>
            </q-expansion-item>
          </q-list>
        </template>
        <div v-else :key="element.uniqueId">
          <MediaItem
            :key="element.uniqueId"
            v-model:repeat="element.repeat"
            :media="element"
            :play-state="playState(element.uniqueId)"
            @update:custom-duration="
              element.customDuration = JSON.parse($event) || undefined
            "
            @update:hidden="element.hidden = !!$event"
            @update:tag="element.tag = $event"
            @update:title="element.title = $event"
          />
        </div>
      </template>
    </Sortable>
  </q-list>
</template>
<script setup lang="ts">
import type { DynamicMediaObject, MediaSection } from 'src/types';

import { watchImmediate } from '@vueuse/core';
import MediaItem from 'components/media/MediaItem.vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import SortableJs, { type SortableEvent } from 'sortablejs';
import { Sortable } from 'sortablejs-vue3';
// @ts-expect-error Could not find a declaration file for module 'sortablejs/modular/sortable.core.esm'
import { MultiDrag } from 'sortablejs/modular/sortable.core.esm';
import { isWeMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addDayToExportQueue } from 'src/helpers/export-media';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

try {
  SortableJs?.mount(new MultiDrag());
} catch (error) {
  console.warn('Failed to mount MultiDrag:', error);
}

export interface MediaListObject {
  alwaysShow: boolean;
  extraMediaShortcut?: boolean;
  items: DynamicMediaObject[];
  jwIcon?: string;
  label: string;
  mmmIcon?: string;
  type: MediaSection;
}

const props = defineProps<{
  mediaList: MediaListObject;
  openImportMenu: (section: MediaSection) => void;
}>();

const $q = useQuasar();
const { t } = useI18n();

const currentState = useCurrentStateStore();
const {
  getVisibleMediaForSection,
  mediaItemsBeingSorted,
  mediaPlayingUniqueId,
  mediaPlayingUrl,
  selectedDate,
  selectedDateObject,
} = storeToRefs(currentState);

const playState = (id: string) => {
  if (id === lastPlayedMediaUniqueId.value) return 'current';
  if (id === nextMediaUniqueId.value) return 'next';
  if (id === previousMediaUniqueId.value) return 'previous';
  return 'unknown';
};

const addSong = (section: MediaSection | undefined) => {
  window.dispatchEvent(
    new CustomEvent<{ section: MediaSection | undefined }>('openSongPicker', {
      detail: { section },
    }),
  );
};

const lastPlayedMediaUniqueId = ref<string>('');

watch(
  () => mediaPlayingUniqueId.value,
  (newMediaUniqueId) => {
    if (newMediaUniqueId) lastPlayedMediaUniqueId.value = newMediaUniqueId;
  },
);

const expandedMediaGroups = ref<Record<string, boolean>>({});

watchImmediate(
  () => selectedDateObject.value?.dynamicMedia?.length,
  () => {
    expandedMediaGroups.value =
      selectedDateObject.value?.dynamicMedia.reduce(
        (acc, element) => {
          if (element.children?.length && element.extractCaption) {
            acc[element.uniqueId] = !!element.cbs; // Default state based on element.cbs
          }
          return acc;
        },
        {} as Record<string, boolean>,
      ) || {};
  },
);

const keyboardShortcutMediaList = computed(() => {
  return [
    ...getVisibleMediaForSection.value.additional,
    ...getVisibleMediaForSection.value.tgw,
    ...getVisibleMediaForSection.value.ayfm,
    ...getVisibleMediaForSection.value.lac,
    ...getVisibleMediaForSection.value.wt,
    ...getVisibleMediaForSection.value.circuitOverseer,
  ].flatMap((m) => {
    return m.children
      ? m.children.map((c) => {
          return {
            ...c,
            parentUniqueId: m.uniqueId,
          };
        })
      : [m];
  });
});

const arraysAreIdentical = (a: string[], b: string[]) =>
  a.length === b.length && a.every((element, index) => element === b[index]);

const sortedMediaFileUrls = computed(() =>
  keyboardShortcutMediaList.value
    .filter((m) => !m.hidden && !!m.fileUrl)
    .map((m) => m.fileUrl)
    .filter((m) => typeof m === 'string')
    .filter((fileUrl, index, self) => self.indexOf(fileUrl) === index),
);

watch(
  () => sortedMediaFileUrls.value,
  (newSortedMediaFileUrls, oldSortedMediaFileUrls) => {
    if (
      selectedDateObject.value?.date &&
      !arraysAreIdentical(newSortedMediaFileUrls, oldSortedMediaFileUrls)
    ) {
      try {
        addDayToExportQueue(selectedDateObject.value.date);
      } catch (e) {
        errorCatcher(e);
      }
    }
  },
);

const previousMediaUniqueId = computed(() => {
  if (!selectedDate.value) return '';
  const sortedMediaIds = keyboardShortcutMediaList.value.map((m) => m.uniqueId);
  if (!lastPlayedMediaUniqueId.value) return sortedMediaIds[0];
  const index = sortedMediaIds.indexOf(lastPlayedMediaUniqueId.value);
  if (index === -1) return sortedMediaIds[0];

  for (let i = index - 1; i >= 0; i--) {
    const mediaItem = keyboardShortcutMediaList.value[i];
    if (mediaItem) {
      if (
        !mediaItem.extractCaption ||
        (mediaItem.parentUniqueId &&
          expandedMediaGroups.value[mediaItem.parentUniqueId])
      ) {
        return mediaItem.uniqueId;
      }
    }
  }
  return sortedMediaIds[0];
});

const nextMediaUniqueId = computed(() => {
  if (!selectedDate.value) return '';
  const sortedMediaIds = keyboardShortcutMediaList.value.map((m) => m.uniqueId);
  if (!lastPlayedMediaUniqueId.value) return sortedMediaIds[0];
  const index = sortedMediaIds.indexOf(lastPlayedMediaUniqueId.value);
  if (index === -1) return sortedMediaIds[0];
  for (let i = index + 1; i < keyboardShortcutMediaList.value.length; i++) {
    const mediaItem = keyboardShortcutMediaList.value[i];
    if (mediaItem) {
      if (
        !mediaItem.extractCaption ||
        (mediaItem?.parentUniqueId &&
          expandedMediaGroups.value[mediaItem.parentUniqueId])
      ) {
        return mediaItem.uniqueId;
      }
    }
  }
  return sortedMediaIds[0];
});

const handleMediaSort = (
  evt: SortableEvent,
  eventType: string,
  list: MediaSection,
) => {
  console.group(`🔄 Media Sort Event: ${eventType} on ${list}`);
  console.log('📋 Event data:', evt);
  console.log('📍 Same list operation:', evt.from === evt.to);

  const sameList = evt.from === evt.to;
  const dynamicMedia = selectedDateObject.value?.dynamicMedia;

  const oldIndicies = evt.oldIndicies?.length
    ? evt.oldIndicies
    : [{ index: evt.oldIndex }];
  const newIndicies = evt.newIndicies?.length
    ? evt.newIndicies
    : [{ index: evt.newIndex }];

  console.log('📊 Index mapping:', {
    newIndicies: newIndicies.map((i) => i.index),
    oldIndicies: oldIndicies.map((i) => i.index),
  });

  if (!dynamicMedia || !Array.isArray(dynamicMedia)) {
    console.warn('⚠️ No dynamic media found or not an array');
    console.groupEnd();
    return;
  }

  switch (eventType) {
    case 'ADD': {
      console.log('➕ Processing ADD event');
      if (mediaItemsBeingSorted.value.length) {
        console.log(
          '📦 Items being sorted:',
          mediaItemsBeingSorted.value.length,
        );

        if (oldIndicies.length && newIndicies.length) {
          const firstElementIndex = dynamicMedia.findIndex(
            (item) => item.section === list,
          );
          console.log('🎯 First element index for section:', firstElementIndex);

          // Sort by newIndex in descending order to avoid index shifting issues
          const sortedItems = mediaItemsBeingSorted.value
            .map((item, i) => ({
              item,
              newIndex: newIndicies[i]?.index,
              oldIndex: oldIndicies[i]?.index,
            }))
            .filter(
              ({ newIndex, oldIndex }) =>
                oldIndex !== undefined && newIndex !== undefined,
            )
            .sort((a, b) => (b.newIndex || 0) - (a.newIndex || 0));

          console.log(
            '📈 Sorted items for insertion:',
            sortedItems.map((s) => ({
              newIndex: s.newIndex,
              oldIndex: s.oldIndex,
              uniqueId: s.item.uniqueId,
            })),
          );

          for (const { item: mediaItemBeingSorted, newIndex } of sortedItems) {
            const insertIndex =
              firstElementIndex >= 0
                ? firstElementIndex + (newIndex || 0)
                : newIndex;

            console.log('🔄 Inserting item:', {
              insertIndex,
              originalSection: mediaItemBeingSorted.section,
              section: list,
              uniqueId: mediaItemBeingSorted.uniqueId,
            });

            const newItem = { ...mediaItemBeingSorted, section: list };
            if (!newItem.sectionOriginal) {
              newItem.sectionOriginal = mediaItemBeingSorted.section;
            }
            dynamicMedia.splice(insertIndex || 0, 0, newItem);
          }
        }
      } else {
        console.log('📭 No items being sorted');
      }
      break;
    }

    case 'END': {
      console.log('🏁 Processing END event');
      console.log('📦 Items being sorted:', mediaItemsBeingSorted.value.length);
      console.log('🎯 Target section:', list);

      if (sameList && mediaItemsBeingSorted.value.length > 0) {
        console.log('🔄 Same list sorting operation');

        // Create a mapping of moves to execute
        const moves = [];
        for (let i = 0; i < oldIndicies.length; i++) {
          const mediaItemBeingSorted = mediaItemsBeingSorted.value[i];
          const evtOldIndex = oldIndicies[i]?.index;
          const evtNewIndex = newIndicies[i]?.index;

          if (
            mediaItemBeingSorted &&
            evtOldIndex !== undefined &&
            evtNewIndex !== undefined
          ) {
            const originalPosition = dynamicMedia.findIndex(
              (item) => item.uniqueId === mediaItemBeingSorted.uniqueId,
            );

            if (originalPosition >= 0) {
              moves.push({
                evtNewIndex,
                evtOldIndex,
                item: mediaItemBeingSorted,
                originalPosition,
                targetPosition: originalPosition + evtNewIndex - evtOldIndex,
              });
            }
          }
        }

        console.log(
          '🎯 Planned moves:',
          moves.map((m) => ({
            from: m.originalPosition,
            newIndex: m.evtNewIndex,
            oldIndex: m.evtOldIndex,
            to: Math.max(0, m.targetPosition),
            uniqueId: m.item.uniqueId,
          })),
        );

        // Sort moves by original position (descending) to avoid index shifting
        moves.sort((a, b) => b.originalPosition - a.originalPosition);

        // Execute moves
        const movedItems = [];
        for (const move of moves) {
          console.log('🔄 Executing move:', {
            from: move.originalPosition,
            removing: true,
            uniqueId: move.item.uniqueId,
          });

          const [movedItem] = dynamicMedia.splice(move.originalPosition, 1);
          if (movedItem) {
            movedItems.push({
              item: movedItem,
              targetPosition: Math.max(0, move.targetPosition),
            });
          }
        }

        // Sort by target position and insert
        movedItems.sort((a, b) => a.targetPosition - b.targetPosition);
        for (const { item, targetPosition } of movedItems) {
          console.log('🔄 Inserting moved item:', {
            at: targetPosition,
            uniqueId: item.uniqueId,
          });
          dynamicMedia.splice(targetPosition, 0, item);
        }

        console.log('✅ Same list sorting completed');
        mediaItemsBeingSorted.value = [];
      } else if (!sameList) {
        console.log(
          '🔀 Cross-list operation - items should be handled by ADD/REMOVE',
        );
      }

      console.log('🧹 Clearing items being sorted');
      mediaItemsBeingSorted.value = [];
      break;
    }

    case 'REMOVE': {
      console.log('➖ Processing REMOVE event');
      console.log('📦 Items to remove:', mediaItemsBeingSorted.value.length);
      console.log('🎯 From section:', list);

      if (!sameList) {
        const removedItems = [];
        for (const mediaItemBeingSorted of mediaItemsBeingSorted.value) {
          const indexToRemove = dynamicMedia.findIndex(
            (item) =>
              item.uniqueId === mediaItemBeingSorted?.uniqueId &&
              item.section === list,
          );

          if (indexToRemove >= 0) {
            console.log('🗑️ Removing item:', {
              index: indexToRemove,
              section: list,
              uniqueId: mediaItemBeingSorted.uniqueId,
            });
            dynamicMedia.splice(indexToRemove, 1);
            removedItems.push(mediaItemBeingSorted.uniqueId);
          } else {
            console.warn(
              '⚠️ Item not found for removal:',
              mediaItemBeingSorted.uniqueId,
            );
          }
        }
        console.log('✅ Removed items:', removedItems);
        mediaItemsBeingSorted.value = [];
      } else {
        console.log('ℹ️ Same list - skipping remove (handled by END)');
      }
      break;
    }

    case 'START': {
      console.log('🚀 Processing START event');
      console.log('🎯 Source section:', list);

      mediaItemsBeingSorted.value = [];

      if (evt.oldIndicies?.length) {
        console.log(
          '🔢 Processing multiple indices:',
          evt.oldIndicies.map((i) => i.index),
        );

        // Don't reverse here - maintain original order
        for (const oldIndex of evt.oldIndicies) {
          const itemBeingSorted =
            getVisibleMediaForSection.value[list]?.[oldIndex.index];

          console.log('🎯 Processing index:', {
            found: !!itemBeingSorted,
            index: oldIndex.index,
            uniqueId: itemBeingSorted?.uniqueId,
          });

          if (itemBeingSorted) {
            mediaItemsBeingSorted.value.push(itemBeingSorted);
          }
        }
      } else if (
        evt.oldIndex !== null &&
        evt.oldIndex !== undefined &&
        evt.oldIndex > -1
      ) {
        console.log('🔢 Processing single index:', evt.oldIndex);

        const itemBeingSorted =
          getVisibleMediaForSection.value[list]?.[evt.oldIndex];
        if (itemBeingSorted) {
          console.log('🎯 Found item:', itemBeingSorted.uniqueId);
          mediaItemsBeingSorted.value.push(itemBeingSorted);
        } else {
          console.warn('⚠️ No item found at index:', evt.oldIndex);
        }
      }

      console.log(
        '📦 Items selected for sorting:',
        mediaItemsBeingSorted.value.map((item) => ({
          section: item.section,
          uniqueId: item.uniqueId,
        })),
      );
      break;
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${eventType}`);
      break;
  }

  console.log('📊 Final dynamic media count:', dynamicMedia.length);
  console.groupEnd();
};

const isSongButton = computed(
  () =>
    props.mediaList.type === 'additional' ||
    (props.mediaList.type === 'circuitOverseer' &&
      !props.mediaList.items.some((m) => !m.hidden)),
);

const emptyMediaList = computed(() => {
  return !props.mediaList.items.filter((m) => !m.hidden).length;
});

const currentlySorting = computed(() => {
  return mediaItemsBeingSorted.value.length > 0;
});
</script>
