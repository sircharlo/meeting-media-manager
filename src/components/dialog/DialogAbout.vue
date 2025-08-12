<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId" persistent>
    <div
      class="items-center q-pb-lg q-px-lg q-gutter-y-md bg-secondary-contrast"
    >
      <div class="row items-center">
        <div class="col-shrink q-mr-md">
          <q-img
            v-if="isBetaVersion"
            loading="lazy"
            src="~assets/img/beta-logo.svg"
            width="48px"
          />
          <q-img
            v-else
            loading="lazy"
            src="~assets/img/logo.svg"
            width="48px"
          />
        </div>
        <div class="col">
          <div class="row text-h6">
            {{ t('meeting-media-manager') }}
          </div>
          <div class="row items-center">
            <div class="col">v{{ appVersion }}</div>
          </div>
        </div>
        <div class="col-shrink">
          <q-btn flat icon="close" round @click="handleHide" />
        </div>
      </div>
      <div class="row">
        <q-expansion-item
          class="full-width bg-accent-200"
          default-opened
          dense
          group="about"
          icon="mmm-info"
          :label="t('about-this-app')"
        >
          <q-card>
            <q-card-section class="bg-accent-100">
              <p>
                {{ t('app-description') }}
              </p>
              <p>
                {{ t('app-issues') }}
              </p>
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-expansion-item
          v-if="releaseNotes"
          v-model="releaseNotesExpansionItem"
          class="full-width bg-accent-200"
          dense
          group="about"
          icon="mmm-shimmer"
          :label="t('whats-new')"
        >
          <q-card>
            <q-card-section class="bg-accent-100">
              <q-scroll-area style="height: 200px; max-width: 100%">
                <q-markdown no-heading-anchor-links :src="releaseNotes" />
              </q-scroll-area>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </div>
      <div class="row q-gutter-x-md">
        <div class="col">
          <q-btn
            class="q-pa-md full-width"
            color="accent-400"
            no-caps
            outline
            target="_blank"
            @click="openExternal('repo')"
          >
            <div class="row q-gutter-x-md full-width items-center">
              <div class="col-shrink text-primary q-ml-none">
                <q-icon name="mmm-github" />
              </div>
              <div class="col-shrink text-secondary">
                {{ t('github-repo') }}
              </div>
              <div class="col text-right text-accent-400">
                <q-icon name="mmm-arrow-outward" />
              </div>
            </div>
          </q-btn>
        </div>
        <div class="col">
          <q-btn
            class="q-pa-md full-width"
            color="accent-400"
            no-caps
            outline
            target="_blank"
            @click="openExternal('docs')"
          >
            <div class="row q-gutter-x-md full-width items-center">
              <div class="col-shrink text-primary q-ml-none">
                <q-icon name="mmm-guide" />
              </div>
              <div class="col-shrink text-secondary">
                {{ t('user-guide') }}
              </div>
              <div class="col text-right text-accent-400">
                <q-icon name="mmm-arrow-outward" />
              </div>
            </div>
          </q-btn>
        </div>
      </div>
      <div class="row text-subtitle1">
        {{ t('app-updates') }}
      </div>
      <div class="row">
        <div class="col">
          <q-toggle
            v-model="updatesEnabled"
            checked-icon="mmm-check"
            class="q-mr-sm"
            :color="!updatesEnabled ? 'negative' : 'primary'"
            dense
            keep-color
            :label="t('auto-update-app')"
            unchecked-icon="mmm-clear"
          />
          <q-btn
            v-if="!updatesEnabled"
            color="negative"
            flat
            icon="mmm-warning"
            round
            size="sm"
          >
            <q-tooltip>
              {{ t('auto-update-app-explain') }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>
      <div v-if="updatesEnabled" class="row">
        <div class="col">
          <q-toggle
            v-model="betaUpdatesEnabled"
            checked-icon="mmm-check"
            class="q-mr-sm"
            :color="betaUpdatesEnabled ? 'negative' : 'primary'"
            dense
            keep-color
            unchecked-icon="mmm-clear"
          >
            {{ t('receive-beta-updates') }}
          </q-toggle>
          <q-btn
            :color="betaUpdatesEnabled ? 'negative' : 'primary'"
            flat
            :icon="betaUpdatesEnabled ? 'mmm-warning' : 'mmm-info'"
            round
            size="sm"
          >
            <q-tooltip>
              {{ t('receive-beta-updates-explain') }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </BaseDialog>
</template>
<script setup lang="ts">
import { watchImmediate, whenever } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { fetchReleaseNotes } from 'src/utils/api';
import {
  betaUpdatesDisabled,
  toggleAutoUpdates,
  toggleBetaUpdates,
  updatesDisabled,
  wasUpdateInstalled,
} from 'src/utils/fs';
import { camelToKebabCase, sleep } from 'src/utils/general';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { openExternal } = window.electronApi;

interface Props {
  dialogId: string;
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  hide: [];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const handleHide = () => {
  emit('hide');
};

const { locale, t } = useI18n();
const appVersion = process.env.version;
const isBetaVersion = process.env.IS_BETA;

const updatesEnabled = ref(true);
const betaUpdatesEnabled = ref(false);

const getUpdatesEnabled = async () => {
  updatesEnabled.value = !(await updatesDisabled());
};

const getBetaUpdatesEnabled = async () => {
  betaUpdatesEnabled.value = !(await betaUpdatesDisabled());
};

const checkLastVersion = async (congId: string) => {
  if (await wasUpdateInstalled(congId)) {
    await sleep(1000);

    if (releaseNotes.value) {
      releaseNotesExpansionItem.value = true;
    }
  }
};

whenever(dialogValue, () => {
  getUpdatesEnabled();
  getBetaUpdatesEnabled();
});

const { currentCongregation } = storeToRefs(useCurrentStateStore());

watch(currentCongregation, (val) => {
  if (val) checkLastVersion(val);
});

const releaseNotes = ref('');
const releaseNotesExpansionItem = ref(false);

const loadReleaseNotes = async () => {
  const result = await fetchReleaseNotes(camelToKebabCase(locale.value));
  releaseNotes.value = result ?? '';
};

watchImmediate(locale, () => {
  loadReleaseNotes();
});

watch(updatesEnabled, (val) => {
  toggleAutoUpdates(val);
});

watch(betaUpdatesEnabled, (val) => {
  toggleBetaUpdates(val);
});

defineExpose({
  betaUpdatesEnabled,
  updatesEnabled,
});
</script>
