<template>
  <div v-if="groups.length" class="quick-actions-checklist">
    <div class="quick-actions-section-title">
      <q-icon name="mmm-check" size="18px" />
      {{
        t(
          props.mode === 'before'
            ? 'quick-actions-before-checklist'
            : 'quick-actions-after-checklist',
        )
      }}
    </div>
    <q-card
      v-for="group in groups"
      :key="group.category.id"
      bordered
      class="quick-actions-checklist__group"
      flat
    >
      <q-card-section class="quick-actions-checklist__heading">
        {{ getCategoryLabel(group.category) }}
      </q-card-section>
      <q-card-section class="q-pa-sm">
        <q-btn
          v-for="item in group.items"
          :key="item.id"
          :aria-pressed="isItemChecked(item.id)"
          :class="[
            'quick-actions-checklist__item full-width q-mb-sm',
            { 'btn-tonal': !isItemChecked(item.id) },
          ]"
          :color="isItemChecked(item.id) ? 'positive' : 'primary'"
          :flat="!isItemChecked(item.id)"
          no-caps
          :text-color="isItemChecked(item.id) ? 'white' : undefined"
          :unelevated="isItemChecked(item.id)"
          @click="onItemClick(item.id)"
        >
          <q-icon
            class="q-mr-sm"
            :name="isItemChecked(item.id) ? 'mmm-check' : 'mmm-plus'"
            size="20px"
          />
          <span class="column items-start">
            <span :class="{ 'text-strike': isItemChecked(item.id) }">
              {{ getItemLabel(item) }}
            </span>
            <span
              v-if="isItemCheckedAutomatically(item.id)"
              class="quick-actions-checklist__automatic text-caption"
            >
              {{ t('quick-actions-checklist-done-in-zoom') }}
            </span>
          </span>
        </q-btn>
      </q-card-section>
    </q-card>

    <ConfirmDialog
      v-model="zoomConfirmOpen"
      :confirm-label="zoomConfirmLabel"
      :dialog-id="`quick-actions-zoom-item-confirm-${props.mode}`"
      icon="mmm-video-meeting"
      icon-color="primary"
      :message="zoomConfirm?.message"
      persistent
      :title="zoomConfirmTitle"
      @cancel="zoomConfirmOpen = false"
      @confirm="confirmZoomItem"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  MeetingChecklistCategory,
  MeetingChecklistItem,
  SettingsValues,
} from 'src/types';

import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { storeToRefs } from 'pinia';
import {
  getZoomChecklistNotice,
  type ZoomChecklistNotice,
} from 'src/helpers/zoom-checklist';
import { useCurrentStateStore } from 'stores/current-state';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { useMusicStore } from 'stores/music';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ mode: 'after' | 'before' }>();

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);
const quickActions = useMeetingQuickActionsStore();
const { isItemChecked, isItemCheckedAutomatically, toggleItemChecked } =
  quickActions;
const { formatClockTime } = useMusicStore();

// Items the Zoom Meeting Manager does itself are confirmed first: ticking
// one M³ is about to do, or unticking one it did (which changes nothing in
// Zoom), suggests the user doesn't know (see zoom-checklist.ts).
const zoomConfirmOpen = ref(false);
// What the dialog asks about: kept once it closes, so its text doesn't
// change while it fades out.
const zoomConfirm = ref<null | {
  done: boolean;
  itemId: string;
  message: string;
}>(null);

const getZoomConfirmMessage = (notice: ZoomChecklistNotice, now: number) => {
  if (notice.kind === 'done') return t('quick-actions-zoom-done-message');
  if (notice.kind === 'music-start') {
    return t('quick-actions-zoom-on-music-start');
  }
  // Once the music has stopped, M³ is at it (or about to be).
  if (notice.at <= now) return t('quick-actions-zoom-on-music-stop-now');
  return t('quick-actions-zoom-on-music-stop', {
    time: formatClockTime(new Date(notice.at)),
  });
};

const onItemClick = (itemId: string) => {
  const now = Date.now();
  const notice = getZoomChecklistNotice(itemId, props.mode, new Date(now));
  if (!notice) {
    toggleItemChecked(itemId);
    return;
  }
  zoomConfirm.value = {
    done: notice.kind === 'done',
    itemId,
    message: getZoomConfirmMessage(notice, now),
  };
  zoomConfirmOpen.value = true;
};

const confirmZoomItem = () => {
  // A second click while the dialog fades out mustn't toggle it back.
  if (!zoomConfirmOpen.value || !zoomConfirm.value) return;
  zoomConfirmOpen.value = false;
  toggleItemChecked(zoomConfirm.value.itemId);
};

const zoomConfirmTitle = computed(() =>
  t(
    zoomConfirm.value?.done
      ? 'quick-actions-zoom-done-title'
      : 'quick-actions-zoom-will-do-title',
  ),
);

const zoomConfirmLabel = computed(() =>
  t(
    zoomConfirm.value?.done
      ? 'quick-actions-zoom-mark-not-done'
      : 'quick-actions-zoom-mark-done',
  ),
);

const getCategories = (settings: SettingsValues) =>
  props.mode === 'before'
    ? settings.meetingQuickActionsCategoriesBefore
    : settings.meetingQuickActionsCategoriesAfter;

const getItems = (settings: SettingsValues) =>
  props.mode === 'before'
    ? settings.meetingQuickActionsChecklistBefore
    : settings.meetingQuickActionsChecklistAfter;

const groups = computed(() => {
  const settings = currentSettings.value;
  if (!settings) return [];

  const items = getItems(settings);
  return getCategories(settings)
    .filter((category) => category.enabled)
    .map((category) => ({
      category,
      items: items.filter(
        (item) => item.enabled && item.categoryId === category.id,
      ),
    }))
    .filter((group) => group.items.length > 0);
});

const getCategoryLabel = (category: MeetingChecklistCategory) =>
  category.isDefault
    ? t(category.id)
    : category.label || t('quick-actions-custom-category'); // NOSONAR: '' means not set

const getItemLabel = (item: MeetingChecklistItem) =>
  item.isDefault ? t(item.id) : item.label || t('quick-actions-custom-item'); // NOSONAR: '' means not set
</script>

<style scoped>
.quick-actions-checklist {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.quick-actions-section-title {
  align-items: center;
  color: var(--q-primary);
  display: flex;
  font-size: 0.85rem;
  font-weight: 700;
  gap: 0.4rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.quick-actions-checklist__group {
  border-color: color-mix(in srgb, var(--q-primary) 22%, transparent);
}

.quick-actions-checklist__heading {
  color: var(--q-primary);
  font-size: 0.9rem;
  font-weight: 700;
  padding-bottom: 0.25rem;
}

.quick-actions-checklist__item {
  justify-content: flex-start;
  min-height: 48px;
  text-align: left;
}

.quick-actions-checklist__automatic {
  line-height: 1.2;
  opacity: 0.85;
}
</style>
