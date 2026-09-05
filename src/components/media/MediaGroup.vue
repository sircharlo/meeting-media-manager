<template>
  <q-list
    v-if="element.children?.some((m) => !m.hidden)"
    bordered
    class="q-mx-sm q-my-sm media-children rounded-borders overflow-hidden"
  >
    <q-menu context-menu style="overflow-x: hidden" touch-position>
      <q-list role="menu">
        <q-item
          v-close-popup
          clickable
          :disable="!!mediaPlaying.url"
          @click="emit('update:hidden', true)"
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
      :key="
        element.children
          .map((m) => m.uniqueId)
          .sort()
          .join(',')
      "
      v-model="isExpanded"
      :disable="
        element.children.map((m) => m.fileUrl).includes(mediaPlaying.url)
      "
      :header-class="[
        'hover-reveal-group',
        isExpanded
          ? $q.dark.isActive
            ? 'bg-accent-400'
            : 'bg-accent-200'
          : '',
      ]"
    >
      <template #header>
        <q-item-section class="relative-position">
          <div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="sanitize(element.extractCaption || '')"></span>
            <q-badge
              class="q-ml-sm bg-primary-semi-transparent"
              :label="
                hiddenChildrenCount > 0
                  ? t(
                      'items-hidden',
                      {
                        count: element.children?.length ?? 0,
                        hidden: hiddenChildrenCount,
                      },
                      element.children?.length ?? 0,
                    )
                  : t(
                      'items',
                      { count: element.children?.length ?? 0 },
                      element.children?.length ?? 0,
                    )
              "
              rounded
              text-color="white"
            />
          </div>
          <div
            class="icon-chip hover-reveal absolute-right text-accent-400 q-pa-md row items-center no-wrap"
          >
            <!--
              UX-6 (full-audit-2026-09-04.md): keyboard/screen-reader
              equivalent to the drag handle - it has no tabindex/keyboard
              handler of its own. @click.stop keeps these from also
              toggling the expansion panel they sit inside.
            -->
            <q-btn
              :aria-label="t('move-up')"
              color="accent-400"
              dense
              :disable="!canMoveUp"
              flat
              icon="mmm-up"
              round
              size="sm"
              @click.stop="emit('move', -1)"
            >
              <q-tooltip :delay="500">{{ t('move-up') }}</q-tooltip>
            </q-btn>
            <q-btn
              :aria-label="t('move-down')"
              color="accent-400"
              dense
              :disable="!canMoveDown"
              flat
              icon="mmm-down"
              round
              size="sm"
              @click.stop="emit('move', 1)"
            >
              <q-tooltip :delay="500">{{ t('move-down') }}</q-tooltip>
            </q-btn>
            <q-icon
              class="media-drag-handle section-drag-handle"
              color="accent-400"
              name="mmm-drag-n-drop"
              size="sm"
              @click.stop
            >
              <q-tooltip v-if="!isDragging" :delay="500">
                {{ t('drag-to-reorder') }}
              </q-tooltip>
            </q-icon>
          </div>
        </q-item-section>
      </template>

      <div v-if="element.children" ref="childrenDragDropContainer">
        <div
          v-for="childElement in sortableChildren"
          :key="childElement.uniqueId"
        >
          <MediaItem
            :key="childElement.uniqueId"
            v-model:repeat="childElement.repeat"
            child
            :is-dragging="isDragging || isChildDragging"
            :media="childElement"
            :media-filter-terms="mediaFilterTerms"
            :selected="selectedMediaItems?.includes(childElement.uniqueId)"
            :selected-media-items="selectedMediaItems"
            @click="
              (evt) =>
                emit('item-clicked', {
                  event: evt as MouseEvent,
                  mediaItemId: childElement.uniqueId,
                  sectionId: element.uniqueId,
                })
            "
            @update:custom-duration="
              emit('update:custom-duration', $event, childElement.uniqueId)
            "
            @update:hidden="
              emit('update:child-hidden', $event, childElement.uniqueId)
            "
            @update:tag="emit('update:tag', $event, childElement.uniqueId)"
            @update:title="emit('update:title', $event, childElement.uniqueId)"
          />
        </div>
      </div>
    </q-expansion-item>
  </q-list>
</template>

<script setup lang="ts">
import type { MediaItem as MediaItemType } from 'src/types';

import { useEventListener } from '@vueuse/core';
import DOMPurify from 'dompurify';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useMediaDragAndDrop } from 'src/composables/useMediaDragAndDrop';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import MediaItem from './MediaItem.vue';

const { sanitize } = DOMPurify;

const currentState = useCurrentStateStore();
const { mediaPlaying } = storeToRefs(currentState);

const props = defineProps<{
  canMoveDown?: boolean;
  canMoveUp?: boolean;
  element: MediaItemType;
  expanded: boolean;
  isDragging?: boolean;
  mediaFilterTerms?: string[];
  selected?: boolean;
  selectedMediaItems?: string[];
}>();

const emit = defineEmits<{
  click: [value: Event];
  'item-clicked': [
    payload: {
      event: Event;
      mediaItemId: string;
      sectionId: string | undefined;
    },
  ];
  move: [delta: number];
  'update:child-hidden': [value: boolean, uniqueId: string];
  'update:children-order': [children: MediaItemType[]];
  'update:custom-duration': [value: string, uniqueId: string];
  'update:expanded': [value: boolean];
  'update:hidden': [value: boolean];
  'update:tag': [value: unknown, uniqueId: string];
  'update:title': [value: string, uniqueId: string];
}>();

const $q = useQuasar();
const { t } = useI18n();

const hasMediaFilterTerms = computed(
  () => (props.mediaFilterTerms?.length ?? 0) > 0,
);

const hiddenChildrenCount = computed(
  () => props.element.children?.filter((m) => m.hidden).length ?? 0,
);

const isExpanded = computed({
  get: () => (hasMediaFilterTerms.value ? true : props.expanded),
  set: (value) => {
    if (hasMediaFilterTerms.value) return;
    emit('update:expanded', value);
  },
});

// A drag zone fully independent of the outer section list (own dragHandle
// selector, own unique group name - see useMediaDragAndDrop's options doc)
// so dragging a child only ever reorders within this group.
const {
  dragDropContainer: childrenDragDropContainer,
  isDragging: isChildDragging,
  sortableItems: sortableChildren,
} = useMediaDragAndDrop(props.element.children ?? [], {
  dragHandle: '.group-child-drag-handle',
  group: `group-children-${props.element.uniqueId}`,
  multiDrag: false,
});

// Mirrors MediaList's own top-level watcher: mutating props.element
// directly here would go against this component's existing convention of
// only ever emitting for the parent to apply (see every other handler
// above) - flush: 'post' + the isChildDragging guard keep this from firing
// mid-drag, only once a reorder has actually settled.
watch(
  () => [
    sortableChildren.value?.map((child) => child.uniqueId).join('|'),
    isChildDragging.value,
  ],
  ([, currentlyDragging]) => {
    if (currentlyDragging) return;
    if (!sortableChildren.value) return;
    emit('update:children-order', sortableChildren.value);
  },
  { flush: 'post' },
);

// useMediaDragAndDrop captures props.element.children once at setup as its
// own independent reactive array - resetSort() (HeaderCalendar.vue)
// resorting that same underlying array in place afterwards doesn't
// propagate into it on its own, same reason MediaList.vue needs the
// identical listener for its own top-level sortableItems.
useEventListener(globalThis, 'reset-sort-order', () => {
  if (!sortableChildren.value?.length || !props.element.children?.length)
    return;
  sortableChildren.value = props.element.children;
});
</script>

<style lang="scss" scoped>
// .icon-chip is a plain decorative wrapper elsewhere (dialog headers etc.),
// always visible, so it has no pointer-events handling of its own - scoped
// here rather than changed globally. This usage overlaps the header's own
// click-to-expand/collapse area, so while hidden (opacity: 0, via
// .hover-reveal) it still needs to let clicks through to whatever's
// underneath it instead of silently eating them.
.icon-chip.hover-reveal {
  pointer-events: none;
}

.hover-reveal-group:hover .icon-chip.hover-reveal,
.hover-reveal-group:focus-within .icon-chip.hover-reveal {
  pointer-events: auto;
}

// The shared .hover-reveal-group:focus-within rule (app.scss) keeps a
// revealed control visible while it holds keyboard focus - correct for an
// actionable control a keyboard user tabs to, but QExpansionItem's header
// is itself focusable purely for a11y, so a plain mouse click on the header
// (to expand/collapse) also focuses it. Without this override the chip
// stays visibly "stuck" after such a click until focus lands elsewhere in
// the app, long after the mouse has moved away. There's no keyboard
// equivalent for dragging here, so this chip specifically only needs to
// react to real hover. Higher specificity than the shared rule (extra
// .icon-chip) wins without needing !important; the :hover re-assertion
// after it keeps the chip visible if the pointer is over it while also
// focused.
.hover-reveal-group:focus-within .icon-chip.hover-reveal {
  opacity: 0;
}

.hover-reveal-group:hover .icon-chip.hover-reveal {
  opacity: 1;
  transition-delay: 400ms;
}
</style>
