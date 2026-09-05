<template>
  <q-dialog
    v-model="settingsFilterVisible"
    class="settings-filter-dialog"
    position="top"
    seamless
    style="z-index: 1500 !important"
    @show="focusSettingsFilter"
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
          @keydown.escape="closeSettingsFilter"
        >
          <template #prepend>
            <q-icon name="mmm-search" />
          </template>
        </q-input>
        <q-btn
          :aria-label="t('close')"
          color="primary"
          dense
          flat
          icon="mmm-clear"
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
      <div
        class="settings-two-pane"
        :class="{ 'settings-two-pane--drilled': drilledIn }"
      >
        <div class="settings-rail">
          <template
            v-for="[groupId, group] in settingsGroupsEntries"
            :key="groupId"
          >
            <button
              v-if="hasVisibleSettings(groupId)"
              class="settings-rail-item"
              :class="{
                'settings-rail-item--active':
                  !filterActive && activeGroup === groupId,
              }"
              type="button"
              @click="selectGroup(groupId)"
            >
              <span class="icon-chip settings-rail-item__icon text-primary">
                <q-icon :name="group.icon" size="17px" />
              </span>
              <span class="settings-rail-item__label">{{ t(group.name) }}</span>
              <q-badge
                v-if="invalidSettingsByGroup[groupId]"
                class="settings-rail-item__badge"
                color="negative"
                rounded
              >
                {{ invalidSettingsByGroup[groupId] }}
              </q-badge>
            </button>
          </template>
        </div>

        <div class="settings-detail">
          <button
            class="settings-back-btn"
            type="button"
            @click="drilledIn = false"
          >
            <q-icon name="mmm-left" size="16px" />
            {{ t('back') }}
          </button>

          <div
            v-if="!filterActive && activeGroupData"
            class="settings-detail-header"
          >
            <span class="icon-chip settings-detail-header__icon text-primary">
              <q-icon :name="activeGroupData.icon" size="22px" />
            </span>
            <div>
              <div class="settings-detail-header__title">
                {{ t(activeGroupData.name) }}
              </div>
              <div class="settings-detail-header__desc">
                {{ t(activeGroupData.description) }}
              </div>
            </div>
          </div>

          <div class="settings-detail-body">
            <template v-for="[groupId, group] in groupsToRender" :key="groupId">
              <div v-if="filterActive" class="settings-detail-group-header">
                <span
                  class="icon-chip settings-detail-group-header__icon text-primary"
                >
                  <q-icon :name="group.icon" size="15px" />
                </span>
                <span>{{ t(group.name) }}</span>
              </div>

              <div v-if="groupId === 'advanced'" class="subgroup-card">
                <q-item-label class="settings-subgroup-label" header>
                  {{ t('profile-settings') }}
                </q-item-label>
                <q-item
                  class="rounded-borders"
                  :style="$q.screen.lt.sm ? 'flex-direction: column' : ''"
                >
                  <q-item-section>
                    <q-item-label>{{
                      t('profile-settings-export')
                    }}</q-item-label>
                    <q-item-label
                      caption
                      :class="{ 'q-pb-sm': $q.screen.lt.sm }"
                    >
                      {{ t('profile-settings-export-explain') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section
                    side
                    :style="
                      ($q.screen.lt.sm ? 'padding-left: 0' : '') +
                      ';align-items: end'
                    "
                  >
                    <q-btn
                      class="btn-tonal"
                      color="primary"
                      flat
                      :label="t('export-profile-settings')"
                      @click="exportCurrentProfileSettings"
                    />
                  </q-item-section>
                </q-item>
                <q-item
                  class="rounded-borders"
                  :style="$q.screen.lt.sm ? 'flex-direction: column' : ''"
                >
                  <q-item-section>
                    <q-item-label>{{
                      t('profile-settings-import')
                    }}</q-item-label>
                    <q-item-label
                      caption
                      :class="{ 'q-pb-sm': $q.screen.lt.sm }"
                    >
                      {{ t('profile-settings-import-explain') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section
                    side
                    :style="
                      ($q.screen.lt.sm ? 'padding-left: 0' : '') +
                      ';align-items: end'
                    "
                  >
                    <q-btn
                      class="btn-tonal"
                      color="primary"
                      flat
                      :label="t('import-profile-settings')"
                      @click="importCurrentProfileSettings"
                    />
                  </q-item-section>
                </q-item>
              </div>

              <div
                v-if="groupId === 'advanced'"
                class="subgroup-card subgroup-card--global"
              >
                <q-item-label class="settings-subgroup-label" header>
                  <q-icon class="q-mr-xs" name="mmm-groups" size="14px" />
                  {{ t('global-preferences') }}
                </q-item-label>
                <div class="settings-global-note">
                  {{ t('global-preferences-explain') }}
                </div>
                <q-item
                  id="autoUpdateApp"
                  class="rounded-borders"
                  :style="$q.screen.lt.sm ? 'flex-direction: column' : ''"
                  tag="label"
                >
                  <q-item-section>
                    <q-item-label>{{ t('auto-update-app') }}</q-item-label>
                    <q-item-label
                      caption
                      :class="{ 'q-pb-sm': $q.screen.lt.sm }"
                    >
                      {{ t('auto-update-app-explain') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section
                    side
                    :style="
                      ($q.screen.lt.sm ? 'padding-left: 0' : '') +
                      ';align-items: end'
                    "
                  >
                    <q-toggle
                      v-model="autoUpdateEnabled"
                      checked-icon="mmm-check"
                      :color="autoUpdateEnabled ? 'primary' : 'negative'"
                      keep-color
                      name="autoUpdateApp"
                    />
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="autoUpdateEnabled"
                  id="receiveBetaUpdates"
                  class="rounded-borders"
                  :style="$q.screen.lt.sm ? 'flex-direction: column' : ''"
                  tag="label"
                >
                  <q-item-section>
                    <q-item-label>{{ t('receive-beta-updates') }}</q-item-label>
                    <q-item-label
                      caption
                      :class="{ 'q-pb-sm': $q.screen.lt.sm }"
                    >
                      {{ t('receive-beta-updates-explain') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section
                    side
                    :style="
                      ($q.screen.lt.sm ? 'padding-left: 0' : '') +
                      ';align-items: end'
                    "
                  >
                    <q-toggle
                      v-model="betaUpdatesEnabled"
                      checked-icon="mmm-check"
                      color="negative"
                      name="receiveBetaUpdates"
                    />
                  </q-item-section>
                </q-item>
              </div>

              <div
                v-for="run in getGroupRuns(groupId)"
                :key="`${groupId}-${run.subgroup ?? 'none'}-${run.items[0]?.[0]}`"
                class="subgroup-card"
              >
                <q-item-label
                  v-if="run.subgroup"
                  class="settings-subgroup-label"
                  header
                >
                  {{ t(run.subgroup) }}
                </q-item-label>
                <template
                  v-for="[settingId, item] in run.items"
                  :key="settingId"
                >
                  <q-item
                    :id="settingId"
                    :class="{
                      'bg-error': invalidSettings.includes(settingId),
                      'bg-accent-300': settingParam === settingId,
                      'rounded-borders': true,
                    }"
                    :style="
                      $q.screen.lt.sm && item.type !== 'toggle'
                        ? 'flex-direction: column'
                        : ''
                    "
                    tag="label"
                    @keydown.capture="stopSpaceForEditableTarget"
                    @keyup.capture="stopSpaceForEditableTarget"
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
                        <q-badge v-if="item.beta" align="top" class="q-ml-sm">
                          <q-tooltip>{{ t('beta-tooltip') }}</q-tooltip>
                          {{ t('beta') }}
                        </q-badge>
                      </q-item-label>
                      <q-item-label
                        caption
                        :class="{ 'q-pb-sm': $q.screen.lt.sm }"
                      >
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
                      <q-item-label
                        v-if="
                          settingId === 'obsPassword' &&
                          !isSecretEncryptionAvailable
                        "
                        caption
                        class="text-warning"
                      >
                        <q-icon name="mmm-warning" size="xs" />
                        {{ t('obs-password-not-encrypted-warning') }}
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
                        :style="
                          $q.screen.lt.sm ? 'width: 100%;max-width:100%' : ''
                        "
                        v-bind="$attrs"
                      />
                    </q-item-section>
                  </q-item>
                </template>
              </div>
              <SettingsMeetingChecklists
                v-if="groupId === 'interfaceShortcuts' && !filterActive"
              />
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
          </div>
        </div>
      </div>
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
import SettingsMeetingChecklists from 'components/settings/SettingsMeetingChecklists.vue';
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
  betaUpdatesDisabled,
  toggleAutoUpdates,
  toggleBetaUpdates,
  updatesDisabled,
} from 'src/utils/fs';
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

// SEC-5 (full-audit-2026-09-04.md): a fixed, OS-level capability that can't
// change during the app's lifetime, so a plain constant (not a ref) is
// enough - used to warn next to the obsPassword field below when it's
// false, since the password is then stored as plain text rather than
// OS-keychain-encrypted, with no other indication of that to the user.
const isSecretEncryptionAvailable =
  globalThis.electronApi.isSecretEncryptionAvailableSync();

const showCongregationLookup = ref(false);
const settingsFilter = ref<null | string | undefined>('');
const settingsFilterInput = useTemplateRef<QInput>('settingsFilterInput');
const settingsFilterVisible = ref(false);
let settingsFilterClosedAt = 0;

// Global preferences (auto-update / beta updates) are app-wide, not part of
// any congregation profile - they live as filesystem marker files read via
// IPC (src/utils/fs.ts), not in currentSettings, so they can't be driven by
// the normal settingsDefinitions/BaseInput v-model pattern.
const autoUpdateEnabled = ref(true);
const betaUpdatesEnabled = ref(false);

// Set while loadGlobalPreferences() syncs the refs above from disk, so the
// watch(betaUpdatesEnabled, ...) below can tell a user-initiated toggle
// apart from that initial sync and only warn on the former.
let isSyncingGlobalPreferences = false;

const loadGlobalPreferences = async () => {
  isSyncingGlobalPreferences = true;
  autoUpdateEnabled.value = !(await updatesDisabled());
  betaUpdatesEnabled.value = !(await betaUpdatesDisabled());
  await nextTick();
  isSyncingGlobalPreferences = false;
};

const openCongregationLookup = () => {
  showCongregationLookup.value = true;
};

const focusSettingsFilter = () => {
  settingsFilterInput.value?.focus();
  settingsFilterInput.value?.select();
};

const openSettingsFilter = () => {
  settingsFilterVisible.value = true;
  void nextTick(focusSettingsFilter);
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

const EDITABLE_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

// Every settings row is a QItem rendered with tag="label", which makes Quasar
// treat it as clickable and swallow the Space key at the row level (so Space
// can activate the row, e.g. for toggle settings) before it ever reaches a
// focused control nested inside it. That breaks typing a literal space into
// text/select inputs, so stop it from bubbling past the control that's
// actually focused.
const stopSpaceForEditableTarget = (event: KeyboardEvent) => {
  if (
    event.code === 'Space' &&
    event.target instanceof HTMLElement &&
    (EDITABLE_TAGS.has(event.target.tagName) || event.target.isContentEditable)
  ) {
    event.stopPropagation();
  }
};

onMounted(() => {
  globalThis.addEventListener('openCongregationLookup', openCongregationLookup);
  void loadGlobalPreferences();
});

onBeforeUnmount(() => {
  globalThis.removeEventListener(
    'openCongregationLookup',
    openCongregationLookup,
  );
});

useEventListener(globalThis, 'keydown', (event: KeyboardEvent) => {
  if (
    event.repeat ||
    event.key.toLowerCase() !== 'f' ||
    (!event.ctrlKey && !event.metaKey)
  ) {
    return;
  }

  event.preventDefault();
  openSettingsFilter();
});

useEventListener(globalThis, 'toggleSettingsFilter', toggleSettingsFilter);

// Store initializations
const currentState = useCurrentStateStore();
const {
  activeSettingsGroup,
  currentCongregation,
  currentLangObject,
  currentSettings,
  online,
  onlyShowInvalidSettings,
} = storeToRefs(currentState);
const { getInvalidSettings } = currentState;

const jwStore = useJwStore();
const { updateJwLanguages, updateYeartext } = jwStore;
const { jwLanguages } = storeToRefs(jwStore);

const obsState = useObsStateStore();
const { scenes } = storeToRefs(obsState);

// Ref and reactive initializations
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

const filterActive = computed(() => !!normalizedSettingsFilter.value);

const addFilteredSettingToGroup = (
  result: Record<string, [keyof SettingsItems, SettingsItem][]>,
  settingId: keyof SettingsItems,
  item: SettingsItem,
) => {
  result[item.group] ??= [];
  for (const subgroup of getSettingSubgroups(item)) {
    result[item.group]?.push([settingId, { ...item, subgroup }]);
  }
};

const getSettingSubgroups = (item: SettingsItem) =>
  Array.isArray(item.subgroup) ? item.subgroup : [item.subgroup || ''];

// Computed property for filtered settings by group
const filteredSettingsByGroup = computed(() => {
  const result: Record<string, [keyof SettingsItems, SettingsItem][]> = {};

  for (const [settingId, item] of settingDefinitionEntries) {
    if (!shouldShowSetting(item, settingId)) continue;
    if (!settingMatchesFilter(settingId, item)) continue;

    addFilteredSettingToGroup(result, settingId, item);
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

const visibleGroupKeys = computed(() =>
  settingsGroupsEntries
    .map(([groupId]) => groupId)
    .filter((groupId) => hasVisibleSettings(groupId)),
);

// Two-pane layout state: which category (rail item) is currently active,
// remembered per congregation profile (session-only, see current-state.ts).
const activeGroup = ref<SettingsGroupKey>(
  (currentCongregation.value &&
    activeSettingsGroup.value[currentCongregation.value]) ||
    (settingsGroupsEntries[0]?.[0] as SettingsGroupKey),
);

// Whether the mobile drill-down view is showing the detail pane instead of
// the category list. Irrelevant above the narrow-window breakpoint (CSS
// shows both panes side by side there regardless of this flag).
const drilledIn = ref(false);

const activeGroupData = computed<SettingsGroup | undefined>(
  () => settingsGroups[activeGroup.value],
);

// When searching, every category with a match is shown flattened in the
// detail pane (grouped under its own header); otherwise, only the active
// category's settings are shown.
const groupsToRender = computed<[SettingsGroupKey, SettingsGroup][]>(() =>
  filterActive.value
    ? settingsGroupsEntries.filter(([groupId]) => hasVisibleSettings(groupId))
    : settingsGroupsEntries.filter(
        ([groupId]) => groupId === activeGroup.value,
      ),
);

const invalidSettingsByGroup = computed(() => {
  const result: Partial<Record<SettingsGroupKey, number>> = {};
  for (const settingId of invalidSettings.value) {
    const groupId = settingsDefinitions[settingId].group;
    result[groupId] = (result[groupId] ?? 0) + 1;
  }
  return result;
});

interface SettingRun {
  items: [keyof SettingsItems, SettingsItem][];
  subgroup?: SettingsItem['subgroup'];
}

// Groups a category's settings into contiguous runs sharing the same
// subgroup, so each run can be rendered as its own card - a setting with no
// subgroup still gets its own run(s) whenever it's not adjacent to another
// setting sharing the same (undefined) subgroup value.
const getGroupRuns = (groupId: SettingsGroupKey): SettingRun[] => {
  const runs: SettingRun[] = [];
  for (const entry of filteredSettingsByGroup.value[groupId] || []) {
    const subgroup = entry[1].subgroup;
    const lastRun = runs.at(-1);
    if (lastRun && lastRun.subgroup === subgroup) {
      lastRun.items.push(entry);
    } else {
      runs.push({ items: [entry], subgroup });
    }
  }
  return runs;
};

const selectGroup = (groupId: SettingsGroupKey) => {
  activeGroup.value = groupId;
  settingsFilter.value = undefined;
  if (currentCongregation.value) {
    activeSettingsGroup.value[currentCongregation.value] = groupId;
  }
  drilledIn.value = true;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

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

// Global preferences (see loadGlobalPreferences below) aren't part of
// settingsDefinitions, so the /settings/:setting deep-link below can't
// resolve their group from there - map their ids (which match the elements'
// DOM ids in the template) to the group that hosts them instead.
const GLOBAL_PREFERENCE_GROUPS: Partial<Record<string, SettingsGroupKey>> = {
  autoUpdateApp: 'advanced',
  receiveBetaUpdates: 'advanced',
};

const invalidSettings = computed(() => getInvalidSettings());
const invalidSettingsLength = computed(() => invalidSettings.value?.length > 0);

// Lifecycle hooks
onMounted(() => {
  updateJwLanguages(online.value);
  validateSettingsLocal();

  const onlyInvalidId = invalidSettings.value[0];
  if (invalidSettings.value.length === 1 && onlyInvalidId) {
    selectGroup(settingsDefinitions[onlyInvalidId].group);
    setTimeout(() => {
      const el = document.getElementById(onlyInvalidId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  }
});

watch(visibleGroupKeys, (keys) => {
  if (keys.length && !keys.includes(activeGroup.value)) {
    activeGroup.value = keys[0] as SettingsGroupKey;
  }
});

whenever(
  settingParam,
  (setting) => {
    if (setting) {
      const group =
        settingsDefinitions[setting]?.group ??
        GLOBAL_PREFERENCE_GROUPS[setting];
      if (group) selectGroup(group);
    }
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

let dismissUpdatesDisabledWarning: (() => void) | undefined;

watch(autoUpdateEnabled, (enabled) => {
  void toggleAutoUpdates(enabled);

  if (isSyncingGlobalPreferences) return;

  if (enabled) {
    dismissUpdatesDisabledWarning?.();
    dismissUpdatesDisabledWarning = undefined;
  } else {
    dismissUpdatesDisabledWarning = createTemporaryNotification({
      message: t('updates-disabled-warning'),
      timeout: 10000,
      type: 'info',
    });
  }
});

let dismissBetaUpdatesWarning: (() => void) | undefined;

watch(betaUpdatesEnabled, (enabled) => {
  void toggleBetaUpdates(enabled);

  if (isSyncingGlobalPreferences) return;

  if (enabled) {
    dismissBetaUpdatesWarning = createTemporaryNotification({
      caption: t('receive-beta-updates-explain'),
      message: t('beta-updates-are-dangerous'),
      timeout: 10000,
      type: 'warning',
    });
  } else {
    dismissBetaUpdatesWarning?.();
    dismissBetaUpdatesWarning = undefined;
  }
});
</script>

<style scoped>
/* Normal-case, medium-weight in place of the old all-caps treatment - the
   group header above it (icon + label) already reads as the primary
   heading, so this subgroup label just needs enough weight to separate
   from the setting rows below it, not full shouting caps. */
.settings-subgroup-label {
  font-weight: 650;
  letter-spacing: 0.02em;
  padding: 0.75rem 1rem 0.25rem;
}

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
  color: #1d1d1d;
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

/* Two-pane master-detail layout */
.settings-two-pane {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.settings-rail {
  border: 1px solid color-mix(in srgb, rgb(170, 188, 227) 45%, transparent);
  border-radius: 14px;
  box-shadow:
    0px 2px 12px 0px rgba(35, 60, 120, 0.06),
    0px 6px 20px 0px rgba(35, 60, 120, 0.05);
  background: white;
  flex: 0 0 240px;
  padding: 0.6rem;
  position: sticky;
  top: 1rem;
}

body.body--dark .settings-rail {
  background: #1d1d1d;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.35),
    0 6px 20px rgba(0, 0, 0, 0.25);
}

.settings-rail-item {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  /* Native <button> elements don't inherit the page's text color by
     default - they fall back to the browser's own default button text
     color (dark, regardless of app theme) unless told otherwise. Every
     other custom button on this page (e.g. .settings-back-btn) already
     sets one explicitly; this one was missed, which is why inactive rail
     items rendered black-on-dark in dark mode. */
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  gap: 0.65rem;
  margin-bottom: 2px;
  padding: 0.55rem 0.6rem;
  position: relative;
  text-align: left;
  width: 100%;
}

.settings-rail-item:hover {
  background: rgb(237, 243, 255);
}

body.body--dark .settings-rail-item:hover {
  background: rgb(60, 67, 90);
}

.settings-rail-item--active {
  background: rgb(218, 229, 251);
  color: var(--q-primary);
}

body.body--dark .settings-rail-item--active {
  background: rgb(60, 67, 90);
}

.settings-rail-item--active::before {
  background: var(--q-primary);
  border-radius: 3px;
  bottom: 8px;
  content: '';
  left: -0.35rem;
  position: absolute;
  top: 8px;
  width: 3px;
}

.settings-rail-item__label {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 600;
}

.settings-rail-item__badge {
  flex-shrink: 0;
}

.settings-detail {
  flex: 1;
  min-width: 0;
}

.settings-back-btn {
  align-items: center;
  background: none;
  border: none;
  color: var(--q-primary);
  cursor: pointer;
  display: none;
  font-weight: 700;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
  padding: 0;
}

.settings-detail-header {
  align-items: center;
  display: flex;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.settings-detail-header__icon {
  flex-shrink: 0;
  height: 42px;
  width: 42px;
}

.settings-detail-header__title {
  font-size: 1.05rem;
  font-weight: 700;
}

.settings-detail-header__desc {
  color: rgba(77, 77, 77, 1);
  font-size: 0.82rem;
  margin-top: 0.15rem;
}

body.body--dark .settings-detail-header__desc {
  color: rgba(170, 170, 170, 1);
}

.settings-detail-group-header {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  margin: 1.1rem 0 0.4rem;
}

.settings-detail-group-header:first-child {
  margin-top: 0;
}

.settings-detail-group-header__icon {
  flex-shrink: 0;
  height: 26px;
  width: 26px;
}

.settings-detail-group-header span:last-child {
  font-size: 0.85rem;
  font-weight: 700;
}

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

/* Distinguishes settings that apply to the whole app (all profiles) from
   the rest of this page's per-congregation-profile settings - a tinted
   background plus a colored left rail, rather than reusing $primary/
   $negative (which already mean "active"/"dangerous" elsewhere on this
   page) so this reads as "different kind of setting", not "risky". */
.subgroup-card--global {
  background: color-mix(in srgb, #9c27b0 6%, white);
  border-left: 3px solid #9c27b0;
}

body.body--dark .subgroup-card--global {
  background: color-mix(in srgb, #9c27b0 14%, #1d1d1d);
  border-left: 3px solid #9c27b0;
}

.settings-global-note {
  color: rgba(77, 77, 77, 1);
  font-size: 0.76rem;
  font-style: italic;
  padding: 0 1rem 0.5rem;
}

body.body--dark .settings-global-note {
  color: rgba(170, 170, 170, 1);
}

@media (max-width: 900px) {
  .settings-rail {
    flex-basis: 64px;
  }

  .settings-rail-item {
    justify-content: center;
  }

  .settings-rail-item__label,
  .settings-rail-item__badge {
    display: none;
  }

  .settings-rail-item--active::before {
    left: -0.6rem;
  }
}

@media (max-width: 640px) {
  .settings-two-pane:not(.settings-two-pane--drilled) .settings-detail {
    display: none;
  }

  .settings-two-pane.settings-two-pane--drilled .settings-rail {
    display: none;
  }

  .settings-two-pane.settings-two-pane--drilled .settings-back-btn {
    display: flex;
  }

  .settings-two-pane:not(.settings-two-pane--drilled) .settings-rail {
    flex-basis: auto;
    position: static;
    width: 100%;
  }

  .settings-two-pane:not(.settings-two-pane--drilled) .settings-rail-item {
    justify-content: flex-start;
  }

  .settings-two-pane:not(.settings-two-pane--drilled)
    .settings-rail-item__label,
  .settings-two-pane:not(.settings-two-pane--drilled)
    .settings-rail-item__badge {
    display: initial;
  }
}
</style>
