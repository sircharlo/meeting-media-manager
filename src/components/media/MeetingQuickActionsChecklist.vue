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
          @click="toggleItemChecked(item.id)"
        >
          <q-icon
            class="q-mr-sm"
            :name="isItemChecked(item.id) ? 'mmm-check' : 'mmm-plus'"
            size="20px"
          />
          <span :class="{ 'text-strike': isItemChecked(item.id) }">
            {{ getItemLabel(item) }}
          </span>
        </q-btn>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import type {
  MeetingChecklistCategory,
  MeetingChecklistItem,
  SettingsValues,
} from 'src/types';

import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ mode: 'after' | 'before' }>();

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);
const quickActions = useMeetingQuickActionsStore();
const { isItemChecked, toggleItemChecked } = quickActions;

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
    : category.label || t('quick-actions-custom-category');

const getItemLabel = (item: MeetingChecklistItem) =>
  item.isDefault ? t(item.id) : item.label || t('quick-actions-custom-item');
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
</style>
