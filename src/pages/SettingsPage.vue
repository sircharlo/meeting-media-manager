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
          :caption="$t(description)"
          class="media-section text-subtitle2 text-weight-medium q-pr-md"
          :icon="icon"
          :label="$t(name)"
        >
          <div>
            <template
              v-for="([settingId, item], index) in settingDefinitionEntries
                .filter(
                  ([settingId, item]) =>
                    (!item.depends ||
                      (Array.isArray(item.depends)
                        ? item.depends.every((dep) => currentSettings?.[dep])
                        : currentSettings?.[item.depends])) &&
                    (!onlyShowInvalidSettings ||
                      !invalidSettingsLength ||
                      invalidSettings.includes(settingId)) &&
                    (!item.unless ||
                      (Array.isArray(item.unless)
                        ? item.unless.every((dep) => !currentSettings?.[dep])
                        : !currentSettings?.[item.unless])),
                )
                .filter(([, item]) => item.group === groupId)"
              :key="settingId"
            >
              <template
                v-if="
                  item.subgroup &&
                  (index === 0 ||
                    item.subgroup !==
                      settingDefinitionEntries
                        .filter(
                          ([settingId, item]) =>
                            (!item.depends ||
                              (Array.isArray(item.depends)
                                ? item.depends.every(
                                    (dep) => currentSettings?.[dep],
                                  )
                                : currentSettings?.[item.depends])) &&
                            (!onlyShowInvalidSettings ||
                              !invalidSettingsLength ||
                              invalidSettings.includes(settingId)) &&
                            (!item.unless ||
                              (Array.isArray(item.unless)
                                ? item.unless.every(
                                    (dep) => !currentSettings?.[dep],
                                  )
                                : !currentSettings?.[item.unless])),
                        )
                        .filter(([settingId, item]) => item.group === groupId)[
                        index - 1
                      ]?.[1].subgroup)
                "
              >
                <q-separator class="bg-accent-200" spaced />
                <q-item-label
                  class="q-pl-xl q-ml-lg text-accent-400 text-uppercase"
                  header
                  >{{ $t(item.subgroup) }}</q-item-label
                >
              </template>
              <q-separator
                v-if="index === 0 && !item.subgroup"
                class="bg-accent-200"
                spaced
              />
              <q-item
                v-if="
                  (!item.depends ||
                    (Array.isArray(item.depends)
                      ? item.depends.every((dep) => currentSettings?.[dep])
                      : currentSettings[item.depends])) &&
                  (!onlyShowInvalidSettings ||
                    !invalidSettingsLength ||
                    invalidSettings.includes(settingId)) &&
                  (!item.unless ||
                    (Array.isArray(item.unless)
                      ? item.unless.every((dep) => !currentSettings?.[dep])
                      : !currentSettings[item.unless]))
                "
                :id="settingId"
                :class="{
                  'bg-error': invalidSettings.includes(settingId),
                  'bg-accent-300': settingParam === settingId,
                  'q-mt-sm': index === 0,
                  'rounded-borders': true,
                }"
                :inset-level="1"
                tag="label"
              >
                <q-item-section>
                  <q-item-label>{{ $t(settingId) }}</q-item-label>
                  <q-item-label caption>
                    {{ $t(settingId + '-explain') }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side style="align-items: end">
                  <BaseInput
                    v-model="currentSettings[settingId]"
                    :item="item"
                    :setting-id="settingId"
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
import type { QForm } from 'quasar';
import type {
  SettingsGroup,
  SettingsGroupKey,
  SettingsItem,
  SettingsItems,
  SettingsValues,
} from 'src/types';

import { whenever } from '@vueuse/core';
import { useRouteParams } from '@vueuse/router';
import { storeToRefs } from 'pinia';
import BaseInput from 'src/components/form-inputs/BaseInput.vue';
import { settingsDefinitions, settingsGroups } from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';

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

const settingParam = useRouteParams<keyof SettingsValues | undefined>(
  'setting',
);

// Lifecycle hooks
onMounted(() => {
  updateJwLanguages();
  validateSettingsLocal();

  if (invalidSettings.value.length === 1) {
    setTimeout(() => {
      const el = document.getElementById(invalidSettings.value[0]);
      el?.scrollIntoView({ behavior: 'smooth' });
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
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  },
  { immediate: true },
);

watch(
  [
    () => currentSettings.value?.lang,
    () => currentSettings?.value?.langFallback,
  ],
  () => updateYeartext(),
);

const invalidSettings = computed(() => getInvalidSettings());
const invalidSettingsLength = computed(() => invalidSettings.value?.length > 0);
</script>
