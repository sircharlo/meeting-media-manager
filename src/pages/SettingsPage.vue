<template>
  <q-dialog
    v-model="settingsFilterVisible"
    class="settings-filter-dialog"
    position="top"
    seamless
    style="z-index: 1500 !important"
  >
    <q-card class="settings-filter-overlay">
      <q-card-section class="q-pa-sm row items-center no-wrap q-gutter-sm">
        <q-input
          ref="settingsFilterInput"
          v-model="settingsFilter"
          autofocus
          bg-color="accent-100"
          color="primary"
          dense
          :label="t('search')"
          outlined
          spellcheck="false"
          @blur="closeEmptySettingsFilter"
          @keydown.escape="closeSettingsFilter"
        >
          <template #prepend>
            <q-icon name="mmm-search" />
          </template>
        </q-input>
        <q-btn
          color="primary"
          dense
          flat
          icon="close"
          round
          @click="closeSettingsFilter"
        >
          <q-tooltip>{{ t('close') }}</q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card>
  </q-dialog>
  <q-page padding>
    <q-form
      v-if="currentSettings"
      ref="settingsFormDynamic"
      greedy
      no-error-focus
      novalidate
    >
      <template
        v-for="[groupId, { name, description, icon }] in settingsGroupsEntries"
        :key="groupId"
      >
        <q-expansion-item
          v-if="hasVisibleSettings(groupId)"
          :caption="t(description)"
          class="media-section text-subtitle2 text-weight-medium q-pr-md"
          :icon="icon"
          :label="t(name)"
          :model-value="isGroupExpanded(groupId)"
          @update:model-value="updateGroupExpansion(groupId, $event)"
        >
          <div>
            <q-separator
              v-if="groupId === 'advanced'"
              class="bg-accent-200"
              spaced
            />
            <q-item
              v-if="groupId === 'advanced'"
              class="q-mt-sm rounded-borders"
              :inset-level="1"
              :style="$q.screen.lt.sm ? 'flex-direction: column' : ''"
            >
              <q-item-section>
                <q-item-label>{{
                  t('profile-settings-transfer')
                }}</q-item-label>
                <q-item-label caption :class="{ 'q-pb-sm': $q.screen.lt.sm }">
                  {{ t('profile-settings-transfer-explain') }}
                </q-item-label>
              </q-item-section>
              <q-item-section
                side
                :style="
                  ($q.screen.lt.sm ? 'padding-left: 0' : '') +
                  ';align-items: end'
                "
              >
                <div class="q-gutter-sm row justify-end">
                  <q-btn
                    color="primary"
                    :label="t('export-profile-settings')"
                    outline
                    @click="exportCurrentProfileSettings"
                  />
                  <q-btn
                    color="primary"
                    :label="t('import-profile-settings')"
                    outline
                    @click="importCurrentProfileSettings"
                  />
                </div>
              </q-item-section>
            </q-item>
            <template
              v-for="([settingId, item], index) in filteredSettingsByGroup[
                groupId
              ] || []"
              :key="`${settingId}-${index}`"
            >
              <template
                v-if="item.subgroup && isFirstInSubgroup(index, groupId)"
              >
                <q-separator class="bg-accent-200" spaced />
                <q-item-label
                  class="q-pl-xl q-ml-lg text-accent-400 text-uppercase"
                  header
                >
                  {{ t(item.subgroup) }}
                </q-item-label>
              </template>
              <q-separator
                v-if="index === 0 && !item.subgroup"
                class="bg-accent-200"
                spaced
              />
              <q-item
                :id="settingId"
                :class="{
                  'bg-error': invalidSettings.includes(settingId),
                  'bg-accent-300': settingParam === settingId,
                  'q-mt-sm': index === 0,
                  'rounded-borders': true,
                }"
                :inset-level="1"
                :style="
                  $q.screen.lt.sm && item.type !== 'toggle'
                    ? 'flex-direction: column'
                    : ''
                "
                tag="label"
              >
                <q-item-section>
                  <q-item-label>
                    <template
                      v-for="part in highlightSearchParts(t(settingId))"
                      :key="`${settingId}-label-${part.index}`"
                    >
                      <mark
                        v-if="part.highlight"
                        class="settings-filter__highlight"
                      >
                        {{ part.text }}
                      </mark>
                      <span v-else>{{ part.text }}</span>
                    </template>
                    <q-badge v-if="item.beta" align="top">
                      <q-tooltip>{{ t('beta-tooltip') }}</q-tooltip>
                      {{ t('beta') }}
                    </q-badge>
                  </q-item-label>
                  <q-item-label caption :class="{ 'q-pb-sm': $q.screen.lt.sm }">
                    <template
                      v-for="part in highlightSearchParts(
                        t(settingId + '-explain'),
                      )"
                      :key="`${settingId}-caption-${part.index}`"
                    >
                      <mark
                        v-if="part.highlight"
                        class="settings-filter__highlight"
                      >
                        {{ part.text }}
                      </mark>
                      <span v-else>{{ part.text }}</span>
                    </template>
                  </q-item-label>
                </q-item-section>
                <q-item-section
                  side
                  :style="
                    ($q.screen.lt.sm ? 'padding-left: 0' : '') +
                    ';align-items: end'
                  "
                >
                  <BaseInput
                    v-model="currentSettings[settingId]"
                    :item="item"
                    :setting-id="settingId"
                    :style="$q.screen.lt.sm ? 'width: 100%;max-width:100%' : ''"
                    v-bind="$attrs"
                  />
                </q-item-section>
              </q-item>
            </template>
          </div>
        </q-expansion-item>
      </template>
      <q-item
        v-if="settingsFilter && !hasAnyVisibleSettings"
        class="settings-filter-empty-state q-mt-xl"
      >
        <q-item-section>
          <q-item-label class="text-accent-400">
            {{ t('settings-filter-empty') }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-form>
  </q-page>
  <DialogCongregationLookup
    v-model="showCongregationLookup"
    :dialog-id="'settings-congregation-lookup'"
  />
</template>

<script setup lang="ts">
import type {
  SettingsGroup,
  SettingsGroupKey,
  SettingsItem,
  SettingsItems,
  SettingsValues,
} from 'src/types';

import { useEventListener, whenever } from '@vueuse/core';
import { useRouteParams } from '@vueuse/router';
import BaseInput from 'components/form-inputs/BaseInput.vue';
import { storeToRefs } from 'pinia';
import { type QForm, type QInput, useMeta, useQuasar } from 'quasar';
import DialogCongregationLookup from 'src/components/dialog/DialogCongregationLookup.vue';
import {
  RESOLUTIONS,
  settingsDefinitions,
  settingsGroups,
} from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { localeOptions } from 'src/i18n';
import {
  exportProfileSettingsToFile,
  importProfileSettingsFromFile,
} from 'src/utils/profile-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
useMeta({ title: t('settings') });

const $q = useQuasar();

const showCongregationLookup = ref(false);
const settingsFilter = ref<null | string | undefined>('');
const settingsFilterInput = useTemplateRef<QInput>('settingsFilterInput');
const settingsFilterVisible = ref(false);
let settingsFilterClosedAt = 0;

const openCongregationLookup = () => {
  showCongregationLookup.value = true;
};

const openSettingsFilter = () => {
  settingsFilterVisible.value = true;
  nextTick(() => {
    settingsFilterInput.value?.focus();
    settingsFilterInput.value?.select();
  });
};

const closeSettingsFilter = () => {
  settingsFilter.value = undefined;
  settingsFilterVisible.value = false;
  settingsFilterClosedAt = Date.now();
};

const toggleSettingsFilter = () => {
  if (
    !settingsFilterVisible.value &&
    Date.now() - settingsFilterClosedAt < 150
  ) {
    return;
  }

  if (settingsFilterVisible.value) {
    closeSettingsFilter();
    return;
  }

  openSettingsFilter();
};

const closeEmptySettingsFilter = () => {
  setTimeout(() => {
    if (getSettingsFilterValue()) return;
    settingsFilterVisible.value = false;
    settingsFilterClosedAt = Date.now();
  });
};

onMounted(() => {
  globalThis.addEventListener('openCongregationLookup', openCongregationLookup);
});

onBeforeUnmount(() => {
  globalThis.removeEventListener(
    'openCongregationLookup',
    openCongregationLookup,
  );
});

useEventListener(globalThis, 'keydown', (event: KeyboardEvent) => {
  if (event.key.toLowerCase() !== 'f' || (!event.ctrlKey && !event.metaKey)) {
    return;
  }

  event.preventDefault();
  openSettingsFilter();
});

useEventListener(globalThis, 'openSettingsFilter', openSettingsFilter);
useEventListener(globalThis, 'toggleSettingsFilter', toggleSettingsFilter);

// Store initializations
const currentState = useCurrentStateStore();
const { currentLangObject, currentSettings, online, onlyShowInvalidSettings } =
  storeToRefs(currentState);
const { getInvalidSettings } = currentState;

const jwStore = useJwStore();
const { updateJwLanguages, updateYeartext } = jwStore;
const { jwLanguages } = storeToRefs(jwStore);

const obsState = useObsStateStore();
const { scenes } = storeToRefs(obsState);

// Ref and reactive initializations
const expansionState = ref<Partial<Record<SettingsGroupKey, boolean>>>({});
const settingsFormDynamic = useTemplateRef<QForm>('settingsFormDynamic');
const settingsValid = ref(true);

const settingsGroupsEntries = Object.entries(settingsGroups) as [
  SettingsGroupKey,
  SettingsGroup,
][];

const settingDefinitionEntries = Object.entries(settingsDefinitions) as [
  keyof SettingsItems,
  SettingsItem,
][];

const getSettingsFilterValue = (): string => settingsFilter.value?.trim() ?? '';

const normalizedSettingsFilter = computed(() =>
  getSettingsFilterValue().toLocaleLowerCase(),
);

// Computed property for filtered settings by group
const filteredSettingsByGroup = computed(() => {
  const result: Record<string, [keyof SettingsItems, SettingsItem][]> = {};

  for (const [settingId, item] of settingDefinitionEntries) {
    if (shouldShowSetting(item, settingId)) {
      if (!settingMatchesFilter(settingId, item)) continue;

      const subgroups = Array.isArray(item.subgroup)
        ? item.subgroup
        : [item.subgroup || ''];
      for (const subgroup of subgroups) {
        if (!result[item.group]) {
          result[item.group] = [];
        }
        result[item.group]?.push([settingId, { ...item, subgroup }]);
      }
    }
  }

  return result;
});

const hasAnyVisibleSettings = computed(() =>
  Object.values(filteredSettingsByGroup.value).some(
    (settings) => settings.length > 0,
  ),
);

const hasVisibleSettings = (groupId: SettingsGroupKey): boolean => {
  return (filteredSettingsByGroup.value[groupId]?.length ?? 0) > 0;
};

const isGroupExpanded = (groupId: SettingsGroupKey): boolean => {
  return !!normalizedSettingsFilter.value || !!expansionState.value[groupId];
};

const updateGroupExpansion = (groupId: SettingsGroupKey, expanded: boolean) => {
  if (normalizedSettingsFilter.value) return;
  expansionState.value[groupId] = expanded;
};

// Helper method to check if this is the first item in a subgroup
const isFirstInSubgroup = (index: number, groupId: string) => {
  if (index === 0) return true;
  const groupSettings = filteredSettingsByGroup.value[groupId] || [];
  const prevItem = groupSettings[index - 1]?.[1];
  return prevItem && prevItem.subgroup !== groupSettings[index]?.[1].subgroup;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightSearchParts = (
  value: string,
): { highlight: boolean; index: number; text: string }[] => {
  const needle = getSettingsFilterValue();

  if (!needle) return [{ highlight: false, index: 0, text: value }];

  const parts: { highlight: boolean; index: number; text: string }[] = [];
  const matcher = new RegExp(escapeRegExp(needle), 'gi');
  let lastIndex = 0;
  let match = matcher.exec(value);

  while (match) {
    if (match.index > lastIndex) {
      parts.push({
        highlight: false,
        index: parts.length,
        text: value.slice(lastIndex, match.index),
      });
    }

    parts.push({
      highlight: true,
      index: parts.length,
      text: match[0] ?? '',
    });

    lastIndex = match.index + match[0].length;
    match = matcher.exec(value);
  }

  if (lastIndex < value.length) {
    parts.push({
      highlight: false,
      index: parts.length,
      text: value.slice(lastIndex),
    });
  }

  return parts;
};

const listOptionLabels = (item: SettingsItem): string[] => {
  if (!item.list) return [];

  if (item.list === 'appLanguages') {
    return localeOptions.flatMap((language) => [
      language.englishName,
      language.label,
    ]);
  }

  if (item.list === 'darkModes') return [t('automatic'), t('dark'), t('light')];

  if (item.list === 'days') return t('days-long').split('_');

  if (item.list === 'fontSizes') {
    return [t('small'), t('medium'), t('large'), t('extra-large'), t('huge')];
  }

  if (item.list === 'jwLanguages') {
    return (jwLanguages.value?.list ?? []).flatMap((language) => [
      language.name,
      language.vernacularName,
      language.langcode,
    ]);
  }

  if (item.list?.startsWith('obs')) {
    return (scenes.value ?? []).flatMap((scene) => [
      scene.sceneName?.toString() ?? '',
      scene.sceneUuid?.toString() ?? '',
    ]);
  }

  if (item.list === 'resolutions') return [...RESOLUTIONS];

  if (item.list === 'timerDisplayFormats') {
    return [t('digital'), t('analog'), t('analog-digital')];
  }

  if (item.list === 'timerHourFormats') return [t('24-hour'), t('12-hour')];

  if (item.list === 'timerModes') return [t('count-up'), t('count-down')];

  return [];
};

const settingMatchesFilter = (
  settingId: keyof SettingsValues,
  item: SettingsItem,
): boolean => {
  const needle = normalizedSettingsFilter.value;
  if (!needle) return true;

  const group = settingsGroups[item.group];
  const haystack = [
    t(settingId),
    t(`${settingId}-explain`),
    t(group.name),
    t(group.description),
    item.subgroup ? t(item.subgroup) : '',
    ...listOptionLabels(item),
  ];

  return haystack.some((value) => value.toLocaleLowerCase().includes(needle));
};

const exportCurrentProfileSettings = async () => {
  try {
    if (!currentSettings.value) return;

    const exported = await exportProfileSettingsToFile(currentSettings.value);

    if (exported) {
      createTemporaryNotification({
        message: t('profile-settings-exported'),
        type: 'positive',
      });
    }
  } catch (error) {
    errorCatcher(error);
    createTemporaryNotification({
      message: t('profile-settings-export-failed'),
      type: 'negative',
    });
  }
};

const importCurrentProfileSettings = async () => {
  try {
    if (!currentSettings.value) return;

    const importedSettings = await importProfileSettingsFromFile();
    if (!importedSettings) return;

    Object.assign(currentSettings.value, importedSettings);
    validateSettingsLocal();
    createTemporaryNotification({
      message: t('profile-settings-imported'),
      type: 'positive',
    });
  } catch (error) {
    errorCatcher(error);
    createTemporaryNotification({
      message: t('profile-settings-import-failed'),
      type: 'negative',
    });
  }
};

// Validation function
const validateSettingsLocal = () => {
  try {
    if (settingsFormDynamic.value) {
      settingsFormDynamic.value
        .validate()
        .then((success: boolean) => {
          settingsValid.value = success;
        })
        .catch(() => {
          settingsValid.value = false;
        });
    }
    for (const invalidSetting of getInvalidSettings()) {
      expansionState.value[settingsDefinitions[invalidSetting].group] = true;
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const shouldShowSetting = (
  item: SettingsItem,
  settingId: keyof SettingsValues,
): boolean => {
  if (item.hidden) return false;

  // Pinyin settings are only available when congregation language is CHS
  if (
    ['enablePinyinSongs', 'pinyinSongFolder'].includes(settingId) &&
    currentSettings.value?.lang !== 'CHS'
  )
    return false;

  // Check dependencies
  const dependenciesSatisfied =
    !item.depends ||
    (Array.isArray(item.depends)
      ? item.depends.every((dep) => currentSettings.value?.[dep])
      : currentSettings.value?.[item.depends]);

  if (!dependenciesSatisfied) return false;

  // Check invalid settings filter
  const shouldShowInvalid =
    !onlyShowInvalidSettings.value ||
    !invalidSettingsLength.value ||
    invalidSettings.value.includes(settingId);

  if (!shouldShowInvalid) return false;

  // Check unless logic
  if (!item.unless) return true;

  const checkUnlessEffective = (unlessKey: keyof SettingsValues): boolean => {
    const unlessSetting = settingsDefinitions[unlessKey];
    if (!currentSettings.value?.[unlessKey]) return false; // disabled, so not effective
    // enabled, check if dependencies are satisfied
    return (
      !unlessSetting?.depends ||
      (Array.isArray(unlessSetting.depends)
        ? unlessSetting.depends.every((d) => currentSettings.value?.[d])
        : !!currentSettings.value?.[unlessSetting.depends])
    );
  };

  if (Array.isArray(item.unless)) {
    // All unless settings must NOT be effective for the item to be shown
    return item.unless.every((dep) => !checkUnlessEffective(dep));
  } else {
    // Single unless setting must NOT be effective for the item to be shown
    return !checkUnlessEffective(item.unless);
  }
};

const settingParam = useRouteParams<keyof SettingsValues | undefined>(
  'setting',
);

const invalidSettings = computed(() => getInvalidSettings());
const invalidSettingsLength = computed(() => invalidSettings.value?.length > 0);

// Lifecycle hooks
onMounted(() => {
  updateJwLanguages(online.value);
  validateSettingsLocal();

  if (invalidSettings.value.length === 1) {
    setTimeout(() => {
      const el = document.getElementById(invalidSettings.value[0] ?? '');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  }
});

whenever(
  settingParam,
  (setting) => {
    expansionState.value[settingsDefinitions[setting].group] = true;
    setTimeout(() => {
      if (!setting) return;
      const el = document.getElementById(setting);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  },
  { immediate: true },
);

watch(
  [
    () => currentSettings.value?.lang,
    () => currentSettings?.value?.langFallback,
  ],
  () =>
    updateYeartext({
      isSignLanguage: currentLangObject.value?.isSignLanguage,
      lang: currentSettings.value?.lang,
      langFallback: currentSettings.value?.langFallback,
      online: online.value,
    }),
);
</script>

<style scoped>
.settings-filter-overlay {
  border-radius: 0 0 8px 8px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  margin-top: 57px;
  max-width: calc(100vw - 32px);
  width: fit-content;
}

body.body--dark .settings-filter-overlay {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-top: 0;
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.62),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.settings-filter-overlay :deep(.q-field) {
  width: min(320px, calc(100vw - 96px));
}

body.body--dark
  .settings-filter-overlay
  :deep(.q-field--outlined .q-field__control::before) {
  border-color: rgba(255, 255, 255, 0.34);
}

body.body--dark
  .settings-filter-overlay
  :deep(.q-field--outlined .q-field__control:hover::before) {
  border-color: rgba(255, 255, 255, 0.52);
}

.settings-filter-empty-state {
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 220px);
  text-align: center;
}

.settings-filter-empty-state :deep(.q-item__section) {
  flex: 0 1 auto;
}

:deep(.settings-filter__highlight) {
  animation: settings-filter-bounce 320ms ease;
  background: #ffeb70;
  border-radius: 3px;
  color: inherit;
  display: inline-block;
  padding: 0 0.08em;
}

@keyframes settings-filter-bounce {
  0% {
    transform: scale(1);
  }

  45% {
    transform: scale(1.12);
  }

  100% {
    transform: scale(1);
  }
}
</style>
