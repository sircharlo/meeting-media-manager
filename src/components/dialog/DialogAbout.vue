<template>
  <q-dialog v-model="open">
    <q-dialog v-model="releaseNotesOpen">
      <q-card>
        <q-card-section>
          <q-markdown no-heading-anchor-links :src="releaseNotes" />
        </q-card-section>
      </q-card>
    </q-dialog>
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
      </div>
      <div v-if="releaseNotes" class="row">
        <q-btn :label="t('whats-new')" @click="releaseNotesOpen = true" />
      </div>
      <div class="row">
        <div class="col">
          {{ t('app-description') }}
        </div>
      </div>
      <div class="row">
        <div class="col">
          {{ t('app-issues') }}
        </div>
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
      <div class="row">
        <div class="col text-right">
          <q-btn v-close-popup flat :label="t('close')" />
        </div>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { watchImmediate } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'src/stores/current-state';
import { fetchReleaseNotes } from 'src/utils/api';
import {
  betaUpdatesDisabled,
  toggleAutoUpdates,
  toggleBetaUpdates,
  updatesDisabled,
  wasUpdateInstalled,
} from 'src/utils/fs';
import { camelToKebabCase, sleep } from 'src/utils/general';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { openExternal } = window.electronApi;

const open = defineModel<boolean>({ default: false });

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
    open.value = true;
    releaseNotesOpen.value = true;
  }
};

onMounted(() => {
  getUpdatesEnabled();
  getBetaUpdatesEnabled();
});

const { currentCongregation } = storeToRefs(useCurrentStateStore());

watch(currentCongregation, (val) => {
  checkLastVersion(val);
});

const releaseNotes = ref('');
const releaseNotesOpen = ref(false);

watchImmediate(locale, async (val) => {
  const result = await fetchReleaseNotes(camelToKebabCase(val));
  releaseNotes.value = result ?? '';
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
