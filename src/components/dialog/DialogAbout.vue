<template>
  <q-dialog v-model="open">
    <div
      class="items-center q-pb-lg q-px-lg q-gutter-y-lg bg-secondary-contrast"
    >
      <div class="row items-center">
        <div class="col-shrink q-mr-md">
          <img col src="favicon.ico" style="max-height: 10vh; display: flex" />
        </div>
        <div class="col">
          <div class="row text-h6">
            {{ $t('meeting-media-manager') }}
          </div>
          <div class="row items-center">
            <div class="col">v{{ appVersion }}</div>
            <div
              :class="
                'col text-right ' +
                (!updatesEnabled ? 'text-negative text-weight-bold' : '')
              "
            >
              <q-toggle
                v-model="updatesEnabled"
                checked-icon="mmm-check"
                dense
                :label="$t('auto-updates')"
                left-label
                unchecked-icon="mmm-clear"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col">
          {{ $t('app-description') }}
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
                {{ $t('github-repo') }}
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
                {{ $t('user-guide') }}
              </div>
              <div class="col text-right text-accent-400">
                <q-icon name="mmm-arrow-outward" />
              </div>
            </div>
          </q-btn>
        </div>
      </div>
      <div class="row">
        <div class="col">
          {{ $t('app-issues') }}
        </div>
      </div>
      <div class="row justify-end">
        <q-btn v-close-popup flat>{{ $t('close') }}</q-btn>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { disableUpdates, enableUpdates, updatesDisabled } from 'src/utils/fs';
import { onMounted, ref, watch } from 'vue';

const { getAppVersion, openExternal } = window.electronApi;

const open = defineModel<boolean>({ default: false });

const appVersion = ref('');

const updatesEnabled = ref(true);

const loadAppVersion = async () => {
  appVersion.value = await getAppVersion();
};

const getUpdatesEnabled = async () => {
  updatesEnabled.value = !(await updatesDisabled());
};

onMounted(() => {
  loadAppVersion();
  getUpdatesEnabled();
});

watch(updatesEnabled, (newUpdatesEnabled) => {
  if (newUpdatesEnabled) {
    enableUpdates();
  } else {
    disableUpdates();
  }
});
</script>
