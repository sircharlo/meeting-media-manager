<template>
  <q-list
    v-if="element.children?.some((m) => !m.hidden)"
    bordered
    class="q-mx-sm q-my-sm media-children rounded-borders overflow-hidden"
  >
    <!--
      Opened by a right-click anywhere on the group or by the header's "..."
      button (which points menuTarget at itself while it's open), same as a
      media item's menu.
    -->
    <q-menu
      v-model="contextMenu"
      context-menu
      style="overflow-x: hidden"
      :target="menuTarget"
      touch-position
    >
      <q-list role="menu">
        <!--
          UX-6 (full-audit-2026-09-04.md): Move up/Move down are the
          keyboard/screen-reader equivalent to dragging the header. They used
          to be two always-there header buttons, which looked just like the
          expand chevron beside them; they now sit in this menu like a media
          item's, with the other sections to move the group to.
        -->
        <MediaMoveMenuItem
          :can-move-down="canMoveDown"
          :can-move-up="canMoveUp"
          :media-ids="[element.uniqueId]"
          reorder
          @move="(delta) => emit('move', delta)"
        />
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
        // The whole header is the drag handle, like a media item's row: the
        // drag icon below is only a hint, shown per the showMediaDragHandle
        // setting. Child rows aren't inside the header, so they still only
        // drag within the group (group-child-drag-handle).
        'hover-reveal-group section-drag-handle',
        isExpanded
          ? $q.dark.isActive
            ? 'bg-accent-400'
            : 'bg-accent-200'
          : '',
      ]"
    >
      <template #header>
        <q-item-section
          :class="[
            'group-header-section relative-position',
            { 'has-drag-handle': currentSettings?.showMediaDragHandle },
          ]"
        >
          <div class="group-header-title">
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
          <!--
            @click.stop keeps these from also toggling the expansion panel
            they sit inside.
          -->
          <div
            :class="[
              'group-header-actions absolute-right row items-center no-wrap',
              { 'is-menu-open': isMoreMenuOpen },
            ]"
          >
            <q-icon
              v-if="currentSettings?.showMediaDragHandle"
              class="media-drag-handle q-mr-xs"
              name="mmm-drag-n-drop"
              size="sm"
              @click.stop
            >
              <q-tooltip v-if="!isDragging" :delay="500">
                {{ t('drag-to-reorder') }}
              </q-tooltip>
            </q-icon>
            <q-btn
              ref="moreButton"
              :aria-label="t('more-options')"
              dense
              flat
              icon="mmm-dots"
              round
              size="sm"
              @click.stop="openMoreMenu"
            >
              <q-tooltip v-if="!contextMenu && !isDragging" :delay="500">
                {{ t('more-options') }}
              </q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </template>

      <div v-if="element.children" ref="childrenDragDropContainer">
        <div
          v-for="(childElement, childIndex) in sortableChildren"
          :key="childElement.uniqueId"
        >
          <MediaItem
            :key="childElement.uniqueId"
            v-model:repeat="childElement.repeat"
            :can-move-down="childIndex < sortableChildren.length - 1"
            :can-move-up="childIndex > 0"
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
            @move="(delta) => moveChildItem(childIndex, delta)"
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
import { type QBtn, useQuasar } from 'quasar';
import { useMediaDragAndDrop } from 'src/composables/useMediaDragAndDrop';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import MediaItem from './MediaItem.vue';
import MediaMoveMenuItem from './MediaMoveMenuItem.vue';

const { sanitize } = DOMPurify;

const currentState = useCurrentStateStore();
const { currentSettings, mediaPlaying } = storeToRefs(currentState);

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

// Same as MediaItem.vue: the menu anchors to the "..." button while that
// opened it, and goes back to being a right-click menu once it closes.
const moreButton = useTemplateRef<QBtn>('moreButton');
const contextMenu = ref(false);
const menuTarget = ref<boolean | string | undefined>(true);

function openMoreMenu() {
  menuTarget.value = moreButton.value?.$el;
  contextMenu.value = true;
}

// Keeps the header's actions showing while the "..." menu is open, since the
// pointer has left the header for the menu by then.
const isMoreMenuOpen = computed(
  () => contextMenu.value && menuTarget.value !== true,
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

watch(contextMenu, (open) => {
  if (!open) menuTarget.value = true;
});

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

// UX-6 follow-up (full-audit backlog): keyboard alternative to the
// group-child drag handle, mirroring MediaList.vue's moveTopLevelItem -
// reassigning sortableChildren (rather than mutating in place) is what the
// watch above picks up to persist the new order, the same as a real drag
// does. Scoped to within this group only, matching the drag zone above
// (group: `group-children-${element.uniqueId}`) - never moves a child out.
function moveChildItem(index: number, delta: number) {
  if (!sortableChildren.value) return;

  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= sortableChildren.value.length) return;

  const children = [...sortableChildren.value];
  const [moved] = children.splice(index, 1);
  if (!moved) return;
  children.splice(targetIndex, 0, moved);
  sortableChildren.value = children;
}
</script>

<style lang="scss" scoped>
// The header's drag icon + "..." button: a media row's hover actions, laid
// over the right end of the title. Not the shared .hover-reveal /
// .hover-actions-overlay / .fades-under-hover-actions classes, because
// those also reveal on :focus-within, and QExpansionItem's header takes
// focus on a plain mouse click (to expand/collapse) - the actions would
// stay "stuck" on screen after the pointer had left. Here they show while
// the pointer is over the header, while the header or one of the actions
// has keyboard focus (:focus-visible, which a mouse click doesn't set), or
// while the "..." menu is open.
.group-header-section {
  --group-actions-width: 24px;
}

.group-header-section.has-drag-handle {
  // Drag icon (24px) + its q-mr-xs (4px) + the "..." button (24px).
  --group-actions-width: 52px;
}

.group-header-actions {
  // Same ink as the expand chevron next to it (QItem's side section), so
  // the actions stay legible on the expanded header's tint in both themes.
  // `transition: none` for the same reason QItem.sass gives: without an
  // explicit transition, Chrome keeps a stale currentColor inside
  // color-mix() after a dark-mode toggle.
  color: color-mix(in srgb, currentColor 54%, transparent);
  transition: none;
  opacity: 0;
  // Invisible still means "present": let clicks through to the header.
  pointer-events: none;
}

:global(.body--dark) .group-header-actions {
  color: color-mix(in srgb, currentColor 70%, transparent);
}

.hover-reveal-group:hover .group-header-actions,
.hover-reveal-group:focus-visible .group-header-actions,
.group-header-actions:has(:focus-visible),
.group-header-actions.is-menu-open {
  opacity: 1;
  pointer-events: auto;
}

// Fades the title out just before the actions, and fully clears it under
// them, instead of drawing the icons over the words (a long title wraps
// under them). Both gradients share one shape so they're interchangeable.
.group-header-title {
  mask-image: linear-gradient(to right, #000 100%, transparent 100%);
}

.hover-reveal-group:hover .group-header-title,
.hover-reveal-group:focus-visible .group-header-title,
.hover-reveal-group:has(.group-header-actions :focus-visible)
  .group-header-title,
.hover-reveal-group:has(.is-menu-open) .group-header-title {
  mask-image: linear-gradient(
    to right,
    #000 calc(100% - var(--group-actions-width) - 28px),
    transparent calc(100% - var(--group-actions-width) - 4px)
  );
}
</style>
