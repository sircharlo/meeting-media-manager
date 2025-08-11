<template>
  <DialogCacheClear
    v-model="cacheClearConfirmPopup"
    v-model:cache-clear-type="cacheClearType"
    :cache-analysis="cacheAnalysis"
    :dialog-id="'header-settings-cache-clear'"
  />
  <q-btn v-if="selectedDate" color="white-transparent" unelevated>
    <q-icon class="q-mr-sm" name="mmm-tools" size="xs" />
    {{ t('tools') }}
    <q-tooltip v-if="!moreOptionsMenuActive" :delay="1000">
      {{ t('tools') }}
    </q-tooltip>
    <q-menu
      v-model="moreOptionsMenuActive"
      :offset="[0, 11]"
      @before-show="calculateCacheSize()"
    >
      <q-list>
        <template v-if="invalidSettings()">
          <q-item-label header>{{ t('invalid-settings') }}</q-item-label>
          <q-item
            clickable
            @click="onlyShowInvalidSettings = !onlyShowInvalidSettings"
          >
            <q-item-section avatar>
              <q-icon
                :color="onlyShowInvalidSettings ? 'accent-400' : 'negative'"
                :name="onlyShowInvalidSettings ? 'mmm-menu' : 'mmm-error'"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{
                  onlyShowInvalidSettings
                    ? t('show-all-settings')
                    : t('only-show-settings-that-are-not-valid')
                }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <q-item-label header>{{ t('cache') }}</q-item-label>
        <q-item
          v-close-popup
          clickable
          :disable="
            calculatingCacheSize || !cacheAnalysis?.unusedCacheFoldersSize
          "
          @click="confirmDeleteCacheFiles('smart')"
        >
          <q-item-section avatar>
            <q-icon color="accent-400" name="mmm-delete-smart" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('remove-unused-cache') }} </q-item-label>
            <q-item-label caption>{{
              calculatingCacheSize ? $t('calculating') : unusedCacheFoldersSize
            }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          :disable="calculatingCacheSize"
          @click="confirmDeleteCacheFiles('all')"
        >
          <q-item-section avatar>
            <q-icon color="accent-400" name="mmm-delete-all" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('remove-all-cache') }} </q-item-label>
            <q-item-label caption>{{
              calculatingCacheSize ? $t('calculating') : allCacheFilesSize
            }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
import type { CacheAnalysis } from 'src/types';

import DialogCacheClear from 'components/dialog/DialogCacheClear.vue';
import { storeToRefs } from 'pinia';
import prettyBytes from 'pretty-bytes';
import { analyzeCacheFiles } from 'src/helpers/cleanup';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const currentState = useCurrentStateStore();
const { invalidSettings } = currentState;
const { onlyShowInvalidSettings, selectedDate } = storeToRefs(currentState);

const moreOptionsMenuActive = ref(false);
const calculatingCacheSize = ref(false);
const cacheClearConfirmPopup = ref(false);
const cacheClearType = ref<'' | 'all' | 'smart'>('');
const cacheAnalysis = ref<CacheAnalysis | null>(null);

const confirmDeleteCacheFiles = (type: 'all' | 'smart') => {
  cacheClearType.value = type;
  cacheClearConfirmPopup.value = true;
};

const unusedCacheFoldersSize = computed(() => {
  try {
    if (!cacheAnalysis.value) return prettyBytes(0);
    return prettyBytes(cacheAnalysis.value.unusedCacheFoldersSize);
  } catch (error) {
    errorCatcher(error);
    return prettyBytes(0);
  }
});

const allCacheFilesSize = computed(() => {
  try {
    if (!cacheAnalysis.value) return prettyBytes(0);
    return prettyBytes(cacheAnalysis.value.allCacheFilesSize);
  } catch (error) {
    errorCatcher(error);
    return prettyBytes(0);
  }
});

const calculateCacheSize = async () => {
  calculatingCacheSize.value = true;
  cacheAnalysis.value = null;

  try {
    cacheAnalysis.value = await analyzeCacheFiles();
  } catch (error) {
    errorCatcher(error);
  }

  calculatingCacheSize.value = false;
};
</script>
