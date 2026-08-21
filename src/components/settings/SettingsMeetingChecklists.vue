<template>
  <div class="subgroup-card">
    <q-item-label class="settings-subgroup-label" header>
      {{ t('quickActions') }}
    </q-item-label>

    <q-item
      v-if="currentSettings"
      class="rounded-borders"
      :style="$q.screen.lt.sm ? 'flex-direction: column' : ''"
      tag="label"
    >
      <q-item-section>
        <q-item-label>{{ t('enableMeetingQuickActions') }}</q-item-label>
        <q-item-label caption :class="{ 'q-pb-sm': $q.screen.lt.sm }">
          {{ t('enableMeetingQuickActions-explain') }}
        </q-item-label>
      </q-item-section>
      <q-item-section
        side
        :style="
          ($q.screen.lt.sm ? 'padding-left: 0' : '') + ';align-items: end'
        "
      >
        <q-toggle
          v-model="currentSettings.enableMeetingQuickActions"
          checked-icon="mmm-check"
          color="primary"
        />
      </q-item-section>
    </q-item>

    <template v-if="currentSettings?.enableMeetingQuickActions">
      <q-separator class="bg-accent-200 q-my-sm" />

      <div class="quick-actions-editor">
        <div class="text-caption quick-actions-editor__intro">
          {{ t('meeting-quick-actions-settings-explain') }}
        </div>

        <q-tabs v-model="activeMode" align="left" class="q-mb-md" dense>
          <q-tab :label="t('quick-actions-before-title')" name="before" />
          <q-tab :label="t('quick-actions-after-title')" name="after" />
        </q-tabs>

        <q-tab-panels v-model="activeMode" animated>
          <q-tab-panel
            v-for="mode in modes"
            :key="mode"
            class="q-pa-none"
            :name="mode"
          >
            <div class="quick-actions-editor__toolbar">
              <div class="text-caption">
                {{ t('quick-actions-category-order-explain') }}
              </div>
              <q-input
                v-model="newCategoryLabels[mode]"
                class="quick-actions-editor__add-input"
                dense
                :label="t('quick-actions-new-category')"
                outlined
                @keydown.enter="addCategory(mode)"
              >
                <template #append>
                  <q-btn
                    :aria-label="t('add')"
                    color="primary"
                    dense
                    flat
                    icon="mmm-plus"
                    round
                    @click="addCategory(mode)"
                  />
                </template>
              </q-input>
            </div>

            <q-card
              v-for="(category, categoryIndex) in getCategories(mode)"
              :key="category.id"
              bordered
              class="quick-actions-editor__category q-mb-md"
              flat
            >
              <q-card-section class="quick-actions-editor__category-header">
                <div class="quick-actions-editor__category-title">
                  <q-icon class="q-mr-xs" name="mmm-menu" size="18px" />
                  <span v-if="category.isDefault">{{ t(category.id) }}</span>
                  <q-input
                    v-else
                    v-model="category.label"
                    borderless
                    dense
                    :label="t('quick-actions-category-name')"
                  />
                </div>
                <div class="row q-gutter-xs">
                  <q-btn
                    :aria-label="t('move-up')"
                    color="primary"
                    dense
                    :disable="categoryIndex === 0"
                    flat
                    icon="mmm-up"
                    round
                    @click="moveCategory(mode, categoryIndex, -1)"
                  />
                  <q-btn
                    :aria-label="t('move-down')"
                    color="primary"
                    dense
                    :disable="categoryIndex === getCategories(mode).length - 1"
                    flat
                    icon="mmm-down"
                    round
                    @click="moveCategory(mode, categoryIndex, 1)"
                  />
                  <q-toggle
                    v-if="category.isDefault"
                    v-model="category.enabled"
                    :aria-label="t('quick-actions-enabled')"
                    color="primary"
                  />
                  <q-btn
                    v-else
                    :aria-label="t('delete')"
                    color="negative"
                    dense
                    flat
                    icon="mmm-delete"
                    round
                    @click="removeCategory(mode, category.id)"
                  />
                </div>
              </q-card-section>

              <q-separator />
              <q-card-section class="q-pa-sm">
                <div
                  v-for="(item, itemIndex) in getCategoryItems(
                    mode,
                    category.id,
                  )"
                  :key="item.id"
                  class="quick-actions-editor__item"
                >
                  <q-icon name="mmm-check" size="16px" />
                  <span
                    v-if="item.isDefault"
                    class="quick-actions-editor__item-label"
                  >
                    {{ t(item.id) }}
                  </span>
                  <q-input
                    v-else
                    v-model="item.label"
                    borderless
                    class="quick-actions-editor__item-label"
                    dense
                    :label="t('quick-actions-item-name')"
                  />
                  <q-btn
                    :aria-label="t('move-up')"
                    color="primary"
                    dense
                    :disable="itemIndex === 0"
                    flat
                    icon="mmm-up"
                    round
                    @click="moveItem(mode, category.id, itemIndex, -1)"
                  />
                  <q-btn
                    :aria-label="t('move-down')"
                    color="primary"
                    dense
                    :disable="
                      itemIndex ===
                      getCategoryItems(mode, category.id).length - 1
                    "
                    flat
                    icon="mmm-down"
                    round
                    @click="moveItem(mode, category.id, itemIndex, 1)"
                  />
                  <q-toggle
                    v-if="item.isDefault"
                    v-model="item.enabled"
                    :aria-label="t('quick-actions-enabled')"
                    color="primary"
                  />
                  <q-btn
                    v-else
                    :aria-label="t('delete')"
                    color="negative"
                    dense
                    flat
                    icon="mmm-delete"
                    round
                    @click="removeItem(mode, item.id)"
                  />
                </div>
                <div class="quick-actions-editor__add-item">
                  <q-input
                    v-model="newItemLabels[`${mode}:${category.id}`]"
                    dense
                    :label="t('quick-actions-new-item')"
                    outlined
                    @keydown.enter="addItem(mode, category.id)"
                  >
                    <template #append>
                      <q-btn
                        :aria-label="t('add')"
                        color="primary"
                        dense
                        flat
                        icon="mmm-plus"
                        round
                        @click="addItem(mode, category.id)"
                      />
                    </template>
                  </q-input>
                </div>
              </q-card-section>
            </q-card>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { MeetingChecklistCategory, MeetingChecklistItem } from 'src/types';

import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { uuid } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

type ChecklistMode = 'after' | 'before';

const modes: ChecklistMode[] = ['before', 'after'];
const activeMode = ref<ChecklistMode>('before');
const newCategoryLabels = ref<Record<ChecklistMode, string>>({
  after: '',
  before: '',
});
const newItemLabels = ref<Record<string, string>>({});

const { t } = useI18n();
const $q = useQuasar();
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const getCategories = (mode: ChecklistMode): MeetingChecklistCategory[] => {
  const settings = currentSettings.value;
  if (!settings) return [];
  return mode === 'before'
    ? settings.meetingQuickActionsCategoriesBefore
    : settings.meetingQuickActionsCategoriesAfter;
};

const getItems = (mode: ChecklistMode): MeetingChecklistItem[] => {
  const settings = currentSettings.value;
  if (!settings) return [];
  return mode === 'before'
    ? settings.meetingQuickActionsChecklistBefore
    : settings.meetingQuickActionsChecklistAfter;
};

const getCategoryItems = (mode: ChecklistMode, categoryId: string) =>
  getItems(mode).filter((item) => item.categoryId === categoryId);

const addCategory = (mode: ChecklistMode) => {
  const label = newCategoryLabels.value[mode].trim();
  if (!label || !currentSettings.value) return;
  getCategories(mode).push({
    enabled: true,
    id: uuid(),
    isDefault: false,
    label,
  });
  newCategoryLabels.value[mode] = '';
};

const removeCategory = (mode: ChecklistMode, categoryId: string) => {
  const categories = getCategories(mode);
  const categoryIndex = categories.findIndex(
    (category) => category.id === categoryId,
  );
  if (categoryIndex >= 0) categories.splice(categoryIndex, 1);
  const items = getItems(mode);
  for (let index = items.length - 1; index >= 0; index--) {
    if (items[index]?.categoryId === categoryId) items.splice(index, 1);
  }
};

const addItem = (mode: ChecklistMode, categoryId: string) => {
  const key = `${mode}:${categoryId}`;
  const label = (newItemLabels.value[key] ?? '').trim();
  if (!label || !currentSettings.value) return;
  getItems(mode).push({
    categoryId,
    enabled: true,
    id: uuid(),
    isDefault: false,
    label,
  });
  newItemLabels.value[key] = '';
};

const removeItem = (mode: ChecklistMode, itemId: string) => {
  const items = getItems(mode);
  const index = items.findIndex((item) => item.id === itemId);
  if (index >= 0) items.splice(index, 1);
};

const moveCategory = (
  mode: ChecklistMode,
  index: number,
  direction: number,
) => {
  const categories = getCategories(mode);
  const destination = index + direction;
  if (!categories[index] || !categories[destination]) return;
  [categories[index], categories[destination]] = [
    categories[destination],
    categories[index],
  ];
};

const moveItem = (
  mode: ChecklistMode,
  categoryId: string,
  index: number,
  direction: number,
) => {
  const items = getCategoryItems(mode, categoryId);
  const destination = index + direction;
  const current = items[index];
  const replacement = items[destination];
  if (!current || !replacement) return;
  const allItems = getItems(mode);
  const currentIndex = allItems.indexOf(current);
  const replacementIndex = allItems.indexOf(replacement);
  if (currentIndex < 0 || replacementIndex < 0) return;
  const temporary = allItems[currentIndex];
  const replacementItem = allItems[replacementIndex];
  if (!temporary || !replacementItem) return;
  allItems[currentIndex] = replacementItem;
  allItems[replacementIndex] = temporary;
};
</script>

<style scoped>
/* Mirrors src/pages/SettingsPage.vue's .subgroup-card/.settings-subgroup-label
   (Vue scoped styles can't be shared across components) so this settings
   card reads identically to every other one on the page instead of looking
   like a bolted-on, separately-styled block. */
.subgroup-card {
  border: 1px solid color-mix(in srgb, rgb(170, 188, 227) 45%, transparent);
  border-radius: 14px;
  box-shadow:
    0px 2px 12px 0px rgba(35, 60, 120, 0.06),
    0px 6px 20px 0px rgba(35, 60, 120, 0.05);
  background: white;
  margin-bottom: 0.85rem;
  overflow: hidden;
  padding-bottom: 0.35rem;
}

body.body--dark .subgroup-card {
  background: #1d1d1d;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.35),
    0 6px 20px rgba(0, 0, 0, 0.25);
}

.settings-subgroup-label {
  font-weight: 650;
  letter-spacing: 0.02em;
  padding: 0.75rem 1rem 0.25rem;
}

.quick-actions-editor {
  padding: 0.25rem 1rem 0.75rem;
}

.quick-actions-editor__intro {
  margin-bottom: 0.75rem;
}

.quick-actions-editor__toolbar {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.quick-actions-editor__add-input {
  max-width: 320px;
  width: 100%;
}

.quick-actions-editor__category {
  border-color: color-mix(in srgb, var(--q-primary) 25%, transparent);
}

.quick-actions-editor__category-header {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.quick-actions-editor__category-title {
  align-items: center;
  display: flex;
  flex: 1;
  gap: 0.5rem;
  min-width: 0;
}

.quick-actions-editor__item {
  align-items: center;
  display: flex;
  gap: 0.35rem;
  min-height: 42px;
}

.quick-actions-editor__item-label {
  flex: 1;
  min-width: 0;
}

.quick-actions-editor__add-item {
  margin-top: 0.5rem;
}

@media (max-width: 640px) {
  .quick-actions-editor__toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .quick-actions-editor__add-input {
    max-width: none;
  }
}
</style>
