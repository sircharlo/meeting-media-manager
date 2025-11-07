<template>
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
          v-if="
            !invalidSettingsLength ||
            !onlyShowInvalidSettings ||
            settingDefinitionEntries
              .filter(([, item]) => item.group === groupId)
              .map(([settingId, _]) => settingId)
              .some((settingId) => invalidSettings.includes(settingId))
          "
          v-model="expansionState[groupId]"
          :caption="t(description)"
          class="media-section text-subtitle2 text-weight-medium q-pr-md"
          :icon="icon"
          :label="t(name)"
        >
          <div>
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
                    {{ t(settingId) }}
                    <q-badge v-if="item.beta" align="top">beta</q-badge>
                  </q-item-label>
                  <q-item-label caption :class="{ 'q-pb-sm': $q.screen.lt.sm }">
                    {{ t(settingId + '-explain') }}
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
                  />
                </q-item-section>
              </q-item>
            </template>
          </div>
        </q-expansion-item>
      </template>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import type {
  SettingsGroup,
  SettingsGroupKey,
  SettingsItem,
  SettingsItems,
  SettingsValues,
} from 'src/types';

import { whenever } from '@vueuse/core';
import { useRouteParams } from '@vueuse/router';
import BaseInput from 'components/form-inputs/BaseInput.vue';
import { storeToRefs } from 'pinia';
import { type QForm, useMeta, useQuasar } from 'quasar';
import { settingsDefinitions, settingsGroups } from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
useMeta({ title: t('titles.settings') });

const $q = useQuasar();

// Store initializations
const currentState = useCurrentStateStore();
const { currentSettings, onlyShowInvalidSettings } = storeToRefs(currentState);
const { getInvalidSettings } = currentState;

const jwStore = useJwStore();
const { updateJwLanguages, updateYeartext } = jwStore;

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

// Computed property for filtered settings by group
const filteredSettingsByGroup = computed(() => {
  const result: Record<string, [keyof SettingsItems, SettingsItem][]> = {};

  for (const [settingId, item] of settingDefinitionEntries) {
    if (shouldShowSetting(item, settingId)) {
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

// Helper method to check if this is the first item in a subgroup
const isFirstInSubgroup = (index: number, groupId: string) => {
  if (index === 0) return true;
  const groupSettings = filteredSettingsByGroup.value[groupId] || [];
  const prevItem = groupSettings[index - 1]?.[1];
  return prevItem && prevItem.subgroup !== groupSettings[index]?.[1].subgroup;
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

// Lifecycle hooks
onMounted(() => {
  updateJwLanguages(currentState.online);
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
    updateYeartext(
      currentState.online,
      currentSettings.value,
      currentState.currentLangObject,
    ),
);

const invalidSettings = computed(() => getInvalidSettings());
const invalidSettingsLength = computed(() => invalidSettings.value?.length > 0);
</script>
