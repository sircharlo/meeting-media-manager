<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId" persistent>
    <div class="bg-secondary-contrast flex q-px-none" style="flex-flow: column">
      <div
        class="row items-center no-wrap text-bigger text-semibold text-primary q-px-md q-pt-lg"
      >
        <div class="icon-chip q-mr-sm">
          <q-icon name="mmm-groups" size="xs" />
        </div>
        {{ t('congregation-lookup') }}
      </div>
      <div class="row q-px-md q-pt-md">
        {{ t('congregation-lookup-explain') }}
      </div>
      <div class="row q-px-md q-py-md">
        <q-input
          ref="congregationFilterInput"
          v-model="congregationFilter"
          clearable
          dense
          :label="t('congregation-lookup')"
          outlined
          spellcheck="false"
          @update:model-value="lookupCongregation"
        >
          <template #prepend>
            <q-icon name="mmm-search" />
          </template>
        </q-input>
      </div>
      <div class="q-pl-md overflow-auto row flex">
        <q-list
          class="q-pr-scroll full-width"
          padding
          separator
          style="max-height: min(40vh, 320px)"
        >
          <!-- Loading skeletons -->
          <template v-if="loading">
            <q-item
              v-for="skeletonIndex in 3"
              :key="skeletonIndex"
              class="items-center"
            >
              <q-item-section>
                <q-item-label>
                  <q-skeleton height="20px" type="text" width="50%" />
                </q-item-label>
                <q-item-label caption>
                  <q-skeleton height="10px" type="text" width="50%" />
                </q-item-label>
              </q-item-section>
              <q-item-section side top>
                <q-item-label caption>
                  <q-skeleton height="10px" type="text" width="50px" />
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <q-item v-else-if="lookupError">
            <q-item-section avatar>
              <q-icon color="negative" name="mmm-cloud-error" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('congregation-lookup-error') }}</q-item-label>
              <q-item-label caption>
                {{
                  online
                    ? t('congregation-lookup-error-explain-online')
                    : t('congregation-lookup-error-explain-offline')
                }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                dense
                flat
                icon="mmm-refresh"
                round
                @click="lookupCongregation"
              >
                <q-tooltip :delay="500">{{ t('try-again') }}</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-item v-else-if="!results?.length">
            <q-item-section>
              <q-item-label>
                {{
                  congregationFilter?.length > 2
                    ? t('no-results')
                    : t('no-results-short')
                }}
              </q-item-label>
              <q-item-label caption>
                {{
                  congregationFilter?.length > 2
                    ? t('no-results-explain')
                    : t('no-results-short-explain')
                }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <template
            v-for="congregation in results"
            :key="congregation.congregationGuid"
          >
            <q-item clickable @click="selectCongregation(congregation)">
              <q-item-section>
                <q-item-label>
                  {{ congregation.name }}
                </q-item-label>
                <q-item-label caption>
                  {{ congregation.formattedName }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </div>
      <div class="row q-px-md q-py-md row flex-center">
        <div class="col text-right">
          <q-btn flat @click="dismissPopup">
            {{ t('cancel') }}
          </q-btn>
        </div>
      </div>
    </div>
  </BaseDialog>

  <ConfirmDialog
    v-model="confirmPending"
    :confirm-label="t('confirm')"
    dialog-id="congregation-lookup-confirm"
    icon="mmm-groups"
    icon-color="primary"
    :message="
      t('congregation-lookup-confirm-explain', {
        congregationName: pendingCongregation?.name,
      })
    "
    persistent
    :title="t('congregation-lookup-confirm')"
    @cancel="pendingCongregation = null"
    @confirm="confirmCongregation"
  />
</template>
<script setup lang="ts">
import { whenever } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { storeToRefs } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import {
  applyScheduleToSettings,
  fetchCongregationSuggestions,
  fetchMeetingLocations,
  getMeetingLanguageMap,
  normalizeSchedule,
} from 'src/helpers/congregation-schedule';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const jwStore = useJwStore();
const { jwLanguages } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { currentSettings, online } = storeToRefs(currentState);

const props = defineProps<{
  dialogId: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  applied: [];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const congregationFilter = ref('');
const congregationFilterInput = ref();
const loading = ref(false);
interface CongregationSuggestion {
  congregationGuid: string;
  formattedName: string;
  name: string;
}

const results = ref<CongregationSuggestion[]>([]);
const lookupError = ref(false);
const lookupDebounce = ref<null | ReturnType<typeof setTimeout>>(null);
const pendingCongregation = ref<CongregationSuggestion | null>(null);
const confirmPending = computed({
  get: () => !!pendingCongregation.value,
  set: (value: boolean) => {
    if (!value) pendingCongregation.value = null;
  },
});

// Only worth confirming if there's actually meaningful, already-configured
// info this lookup would overwrite - a blank/default profile (nothing but
// the fallback language and no schedule yet) has nothing to lose, so
// applying the lookup result there should be immediate, not gated behind
// an extra "are you sure" step.
const hasConfiguredCongregationInfo = computed(() => {
  const settings = currentSettings.value;
  if (!settings) return false;

  const nameConfigured =
    !!settings.congregationName &&
    settings.congregationName !== defaultSettings.congregationName;
  const langConfigured =
    !!settings.lang && settings.lang !== defaultSettings.lang;
  const timesConfigured =
    settings.mwDay != null &&
    settings.weDay != null &&
    !!settings.mwStartTime &&
    !!settings.weStartTime;

  return nameConfigured && langConfigured && timesConfigured;
});

const applyCongregation = async (congregation: CongregationSuggestion) => {
  try {
    if (!currentSettings.value) return;

    currentState.lookupInProgress = true;
    const response = await fetchMeetingLocations(congregation.congregationGuid);
    const selectedLocation = response?.items?.find((location) =>
      location.congregationMeetings.some(
        (meeting) => meeting.name === congregation.name,
      ),
    );
    if (!selectedLocation) return;
    const selectedMeeting = selectedLocation.congregationMeetings.find(
      (meeting) => meeting.name === congregation.name,
    );
    if (!selectedMeeting) return;

    // Language
    if (selectedMeeting.languageGuid) {
      const languageMap = await getMeetingLanguageMap();
      const mappedLanguageCode =
        languageMap.get(selectedMeeting.languageGuid) || '';
      const resolvedLangCode =
        jwLanguages.value?.list.find((l) => l.langcode === mappedLanguageCode)
          ?.langcode || '';
      currentSettings.value.lang = resolvedLangCode || 'E';
      currentSettings.value.langSubtitles = resolvedLangCode || null;
    }

    // Schedule
    const normalized = normalizeSchedule({
      changeStamp: null,
      current: {
        midweek: {
          time: selectedMeeting.midweekMeetingTime.slice(
            0,
            5,
          ) as `${number}:${number}`,
          weekday:
            selectedMeeting.midweekMeetingDay === 0
              ? 7
              : selectedMeeting.midweekMeetingDay,
        },
        weekend: {
          time: selectedMeeting.weekendMeetingTime.slice(
            0,
            5,
          ) as `${number}:${number}`,
          weekday:
            selectedMeeting.weekendMeetingDay === 0
              ? 7
              : selectedMeeting.weekendMeetingDay,
        },
      },
      future: null,
      futureDate: null,
    });
    applyScheduleToSettings(currentSettings.value, normalized);

    if (congregation.name) {
      currentSettings.value.congregationName = congregation.name;
      currentSettings.value.congregationNameModified = false;
    }

    emit('applied');
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'DialogCongregationLookup.vue',
          subroutine: 'applyCongregation',
        },
      },
    });
  }
  currentState.lookupInProgress = false;
  dismissPopup();
};

const confirmCongregation = async () => {
  const congregation = pendingCongregation.value;
  pendingCongregation.value = null;
  if (!congregation) return;
  await applyCongregation(congregation);
};

const selectCongregation = (congregation: CongregationSuggestion) => {
  if (hasConfiguredCongregationInfo.value) {
    pendingCongregation.value = congregation;
  } else {
    applyCongregation(congregation);
  }
};

const lookupCongregation = async () => {
  if (lookupDebounce.value) clearTimeout(lookupDebounce.value);
  lookupDebounce.value = setTimeout(async () => {
    try {
      loading.value = true;
      lookupError.value = false;
      results.value = [];
      if (congregationFilter.value?.length > 2) {
        results.value = await fetchCongregationSuggestions(
          congregationFilter.value,
        );
      } else {
        results.value = [];
      }
    } catch (error) {
      errorCatcher(error);
      results.value = [];
      lookupError.value = true;
    } finally {
      loading.value = false;
    }
  }, 500);
};

const dismissPopup = () => {
  results.value = [];
  lookupError.value = false;
  congregationFilter.value = '';
  dialogValue.value = false;
};

// Focus the input when dialog opens
whenever(dialogValue, () => {
  congregationFilter.value = currentSettings.value?.congregationName || '';
  results.value = [];
  lookupCongregation();
  setTimeout(() => {
    log(
      '🔍 Focusing input',
      'congregationLookup',
      'log',
      congregationFilterInput.value,
    );
    congregationFilterInput.value?.focus();
  }, 100);
});
</script>
