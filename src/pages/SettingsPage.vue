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
        v-for="[groupId, { name, description, icon }] in Object.entries(
          settingsGroups,
        )"
        :key="groupId"
      >
        <q-expansion-item
          v-if="
            !invalidSettingsLength ||
            !onlyShowInvalidSettings ||
            Object.entries(settingsDefinitions)
              .filter(([settingId, item]) => item.group === groupId)
              .map(([settingId, _]) => settingId)
              .some((settingId) =>
                invalidSettings.includes(settingId as keyof SettingsItems),
              )
          "
          v-model="expansionState[groupId as keyof SettingsItems]"
          :caption="$t(description)"
          :icon="icon"
          :label="$t(name)"
          class="media-section text-subtitle2 text-weight-medium q-pr-md"
        >
          <template
            v-for="([settingId, item], index) in Object.entries(
              settingsDefinitions,
            ).filter(([settingId, item]) => item.group === groupId)"
            :key="settingId"
          >
            <template
              v-if="
                item.subgroup &&
                (index === 0 ||
                  item.subgroup !==
                    Object.entries(settingsDefinitions).filter(
                      ([settingId, item]) => item.group === groupId,
                    )[index - 1]?.[1].subgroup)
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
                  currentSettings[item.depends as keyof SettingsItems]) &&
                (!onlyShowInvalidSettings ||
                  !invalidSettingsLength ||
                  invalidSettings.includes(settingId as keyof SettingsItems))
              "
              :id="settingId"
              :class="{
                'bg-error': invalidSettings.includes(
                  settingId as keyof SettingsItems,
                ),
                'bg-accent-300': route.params.setting === settingId,
                'q-mt-sm': index === 0,
                'rounded-borders': true,
              }"
              :inset-level="1"
              tag="label"
            >
              <q-item-section>
                <q-item-label>{{ $t(settingId) }}</q-item-label>
                <q-item-label caption>{{
                  $t(settingId + '-explain')
                }}</q-item-label>
              </q-item-section>
              <q-item-section side style="align-items: end">
                <ToggleInput
                  v-if="item.type === 'toggle'"
                  v-model="
                    currentSettings[settingId as keyof SettingsItems] as boolean
                  "
                  :actions="item.actions"
                />
                <TextInput
                  v-else-if="item.type === 'text'"
                  v-model="
                    currentSettings[settingId as keyof SettingsItems] as string
                  "
                  :actions="item.actions"
                  :rules="item.rules"
                />
                <SliderInput
                  v-else-if="item.type === 'slider'"
                  v-model="
                    currentSettings[settingId as keyof SettingsItems] as number
                  "
                  :actions="item.actions"
                  :max="item.max"
                  :min="item.min"
                  :step="item.step"
                />
                <DateInput
                  v-else-if="item.type === 'date'"
                  v-model="
                    currentSettings[settingId as keyof SettingsItems] as string
                  "
                  :options="item.options"
                  :rules="item.rules"
                />
                <TimeInput
                  v-else-if="item.type === 'time'"
                  v-model="
                    currentSettings[settingId as keyof SettingsItems] as string
                  "
                  :options="item.options"
                  :rules="item.rules"
                />
                <SelectInput
                  v-else-if="item.type === 'list'"
                  v-model="
                    currentSettings[settingId as keyof SettingsItems] as string
                  "
                  :options="item.list"
                  :rules="item.rules"
                  :use-input="settingId.toLowerCase().includes('lang')"
                />
                <ShortcutInput
                  v-else-if="item.type === 'shortcut'"
                  v-model="
                    currentSettings[settingId as keyof SettingsItems] as string
                  "
                  :shortcut-name="settingId as keyof SettingsItems"
                />
                <pre v-else>{{ item }}</pre>
              </q-item-section>
            </q-item>
          </template>
        </q-expansion-item>
      </template>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import type { SettingsItems } from 'src/types';

import { storeToRefs } from 'pinia';
import DateInput from 'src/components/form-inputs/DateInput.vue';
import SelectInput from 'src/components/form-inputs/SelectInput.vue';
import ShortcutInput from 'src/components/form-inputs/ShortcutInput.vue';
import SliderInput from 'src/components/form-inputs/SliderInput.vue';
import TextInput from 'src/components/form-inputs/TextInput.vue';
import TimeInput from 'src/components/form-inputs/TimeInput.vue';
import ToggleInput from 'src/components/form-inputs/ToggleInput.vue';
import { settingsDefinitions, settingsGroups } from 'src/defaults/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// Store initializations
const currentState = useCurrentStateStore();
const { currentSettings, onlyShowInvalidSettings } = storeToRefs(currentState);
const { getInvalidSettings } = currentState;

const jwStore = useJwStore();
const { updateYeartext } = jwStore;

// Ref and reactive initializations
const expansionState = ref({} as { [key in keyof SettingsItems]: boolean });
const settingsFormDynamic = ref();
const settingsValid = ref(true);

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
      expansionState.value[
        settingsDefinitions[invalidSetting as keyof SettingsItems]
          .group as keyof SettingsItems
      ] = true;
    }
  } catch (error) {
    errorCatcher(error);
  }
};

// Lifecycle hooks
onMounted(() => {
  validateSettingsLocal();
  watch(
    () => route.params.setting,
    (newWatchedSettings) => {
      if (!newWatchedSettings) return;
      if (!Array.isArray(newWatchedSettings))
        newWatchedSettings = [newWatchedSettings];
      newWatchedSettings.forEach((setting) => {
        if (setting)
          expansionState.value[
            settingsDefinitions[setting as keyof SettingsItems]
              .group as keyof SettingsItems
          ] = true;
      });
      setTimeout(() => {
        if (!newWatchedSettings[0]) return;
        document.getElementById(newWatchedSettings[0])?.scrollIntoView({
          behavior: 'smooth',
        });
      }, 500);
    },
    { immediate: true },
  );
});

watch(
  () => currentSettings.value?.lang,
  (newLang) => {
    if (newLang) updateYeartext();
  },
);

const invalidSettings = computed(() => getInvalidSettings());
const invalidSettingsLength = computed(() => invalidSettings.value?.length > 0);
</script>
