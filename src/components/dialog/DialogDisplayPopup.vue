<template>
  <q-menu
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div class="column action-popup q-py-md">
      <div class="card-title col-shrink full-width q-px-md q-mb-none">
        {{ $t('media-display-settings') }}
      </div>
      <template v-if="screenList.length > 1">
        <template
          v-if="!screenPreferences.preferWindowed && screenList.length > 2"
        >
          <div class="card-section-title col-shrink full-width q-px-md">
            {{ $t('display') }}
          </div>
          <div class="col-shrink full-width q-px-md q-pb-sm">
            <div class="row q-col-gutter-sm">
              <template v-for="(screen, index) in screenList" :key="screen.id">
                <div class="col">
                  <q-btn
                    class="full-width"
                    color="primary"
                    :disable="screen.mainWindow"
                    :outline="screen.mainWindow || !screen.mediaWindow"
                    @click="screenPreferences.preferredScreenNumber = index"
                  >
                    <q-icon
                      class="q-mr-sm"
                      :name="
                        screen.mainWindow
                          ? 'mmm-display-current'
                          : 'mmm-media-display-active'
                      "
                      size="xs"
                    />
                    {{
                      screen.mainWindow
                        ? $t('current')
                        : $t('display') + ' ' + (index + 1)
                    }}
                  </q-btn>
                </div>
              </template>
            </div>
          </div>
          <q-separator class="bg-accent-200 q-mb-md" />
        </template>
        <div class="card-section-title col-shrink full-width q-px-md">
          {{ $t('window-type') }}
        </div>
        <div class="col-shrink full-width q-px-md q-pb-sm">
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-btn
                class="full-width"
                color="primary"
                :disable="screenList.length < 2"
                :outline="
                  screenList.length < 2 || screenPreferences.preferWindowed
                "
                unelevated
                @click="screenPreferences.preferWindowed = false"
              >
                <q-icon class="q-mr-sm" name="mmm-fullscreen" size="xs" />
                {{ $t('full-screen') }}
              </q-btn>
            </div>
            <div class="col-6">
              <q-btn
                class="full-width"
                color="primary"
                :disable="screenList.length < 2"
                :outline="
                  !(screenList.length < 2 || screenPreferences.preferWindowed)
                "
                :text-color="
                  screenList.length < 2 || screenPreferences.preferWindowed
                    ? ''
                    : 'primary'
                "
                unelevated
                @click="screenPreferences.preferWindowed = true"
              >
                <q-icon class="q-mr-sm" name="mmm-window" size="xs" />
                {{ $t('windowed') }}
              </q-btn>
            </div>
          </div>
        </div>
        <q-separator class="bg-accent-200 q-mb-md" />
      </template>
      <div class="card-section-title col-shrink full-width q-px-md q-pb-sm">
        {{ $t('custom-background') }}
      </div>
      <div class="col-shrink full-width q-px-md q-pb-sm">
        <q-btn
          class="full-width"
          color="primary"
          :outline="!mediaWindowCustomBackground"
          unelevated
          @click="chooseCustomBackground(!!mediaWindowCustomBackground)"
        >
          <q-icon
            class="q-mr-sm"
            :name="
              'mmm-background' + (mediaWindowCustomBackground ? '-remove' : '')
            "
            size="xs"
          />
          {{
            mediaWindowCustomBackground
              ? $t('reset-custom-background')
              : $t('set-custom-background')
          }}
        </q-btn>
      </div>
      <div class="col-shrink full-width q-px-md q-pt-md row">
        <div class="col">
          <div class="row text-subtitle1 text-weight-medium">
            {{ mediaWindowVisible ? $t('projecting') : $t('inactive') }}
          </div>
          <div class="row text-dark-grey">
            {{
              $t(
                screenList.length < 2 || screenPreferences.preferWindowed
                  ? 'windowed'
                  : 'external-screen',
              )
            }}
          </div>
        </div>
        <div class="col-grow">
          <q-btn
            v-if="mediaWindowVisible"
            class="full-width"
            color="primary"
            unelevated
            @click="showMediaWindow(false)"
          >
            {{ $t('hide-media-display') }}
          </q-btn>
          <q-btn
            v-else
            class="full-width"
            color="primary"
            unelevated
            @click="showMediaWindow(true)"
          >
            {{ $t('show-media-display') }}
          </q-btn>
        </div>
      </div>
    </div>
  </q-menu>
  <q-dialog v-model="showCustomBackgroundPicker">
    <div class="bg-secondary-contrast column fit-snugly q-px-none">
      <div class="text-h6 col-shrink full-width q-px-md q-pt-lg">
        {{ $t('choose-an-image') }}
      </div>
      <div class="col-shrink full-width q-px-md q-py-md">
        {{ $t('select-a-custom-background') }}
      </div>
      <div class="q-px-md overflow-auto col full-width flex">
        <template
          v-for="(jwpubImage, index) in jwpubImages"
          :key="jwpubImage.FilePath"
        >
          <q-item
            class="row items-center full-width"
            clickable
            @click="setMediaBackground(jwpubImage.FilePath)"
          >
            <div class="col-shrink q-mr-md">
              <q-img
                v-ripple
                class="rounded-borders"
                fit="contain"
                :src="pathToFileURL(jwpubImage.FilePath)"
                style="width: 150px"
              />
            </div>
            <div class="col">
              <div class="row">{{ path.basename(jwpubImage.FilePath) }}</div>
            </div>
          </q-item>
          <q-separator
            v-if="index < jwpubImages.length - 1"
            class="bg-accent-200 q-mt-md"
          />
        </template>
        <q-inner-loading
          :showing="!!jwpubImportFilePath && !jwpubImages.length"
        />
      </div>
      <div class="row q-px-md q-py-md col-shrink full-width justify-end">
        <q-btn
          color="negative"
          flat
          @click="
            jwpubImportFilePath = '';
            jwpubImages = [];
          "
        >
          {{ $t('cancel') }}
        </q-btn>
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import type { Display, MultimediaItem, ScreenPreferences } from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  watchImmediate,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { decompressJwpub, showMediaWindow } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useAppSettingsStore } from 'src/stores/app-settings';
import { useCurrentStateStore } from 'src/stores/current-state';
import { convertImageIfNeeded } from 'src/utils/converters';
import { getTempPath } from 'src/utils/fs';
import { isImage, isJwpub } from 'src/utils/media';
import { findDb } from 'src/utils/sqlite';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const {
  executeQuery,
  fs,
  getAllScreens,
  moveMediaWindow,
  openFileDialog,
  path,
  pathToFileURL,
  setScreenPreferences,
} = window.electronApi;

const { t } = useI18n();

const screenList = ref<Display[]>([]);

const appSettings = useAppSettingsStore();
const { screenPreferences } = storeToRefs(appSettings);

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  mediaWindowCustomBackground,
  mediaWindowVisible,
} = storeToRefs(currentState);

const open = defineModel<boolean>({ default: false });

const jwpubImportFilePath = ref('');
const jwpubImages = ref<MultimediaItem[]>([]);

const showCustomBackgroundPicker = computed(
  () => !!jwpubImportFilePath.value || jwpubImages.value.length > 0,
);

const chooseCustomBackground = async (reset?: boolean) => {
  try {
    if (reset) {
      mediaWindowCustomBackground.value = '';
      notifyCustomBackgroundRemoved();
      return;
    } else {
      try {
        const backgroundPicker = await openFileDialog(true, 'jwpub+image+pdf');
        if (backgroundPicker?.canceled) return;
        if (!backgroundPicker || backgroundPicker.filePaths?.length === 0) {
          notifyInvalidBackgroundFile();
        } else {
          const filepath = backgroundPicker.filePaths[0];
          if (isJwpub(filepath)) {
            jwpubImportFilePath.value = filepath;
            const unzipDir = await decompressJwpub(filepath);
            const db = await findDb(unzipDir);
            if (!db) throw new Error('No db file found: ' + filepath);
            jwpubImages.value = executeQuery<MultimediaItem>(
              db,
              "SELECT * FROM Multimedia WHERE CategoryType >= 0 AND CategoryType <> 9 AND FilePath <> '';",
            ).map((multimediaItem) => {
              return {
                ...multimediaItem,
                FilePath: path.join(unzipDir, multimediaItem.FilePath),
              };
            });
            if (jwpubImages.value?.length === 0) {
              notifyInvalidBackgroundFile();
            }
          } else {
            const tempDirectory = await getTempPath();
            const tempFilepath = path.join(
              tempDirectory,
              path.basename(filepath),
            );
            await fs.copyFile(filepath, tempFilepath);
            const workingTempFilepath =
              await convertImageIfNeeded(tempFilepath);
            if (isImage(workingTempFilepath)) {
              setMediaBackground(workingTempFilepath);
            } else {
              throw new Error(
                'Invalid file type: ' + workingTempFilepath.split('/').pop(),
              );
            }
          }
        }
      } catch (error) {
        if (
          error instanceof Error &&
          !error.message.includes('Invalid file type')
        ) {
          errorCatcher(error);
        }
        notifyInvalidBackgroundFile();
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const windowScreenListener = (event: CustomEvent<ScreenPreferences>) => {
  try {
    screenPreferences.value = event.detail;
  } catch (error) {
    errorCatcher(error);
  }
};

const fetchScreens = async () => {
  try {
    screenList.value = await getAllScreens();
  } catch (error) {
    errorCatcher(error);
  }
};

onMounted(() => {
  fetchScreens();
});

const notifyInvalidBackgroundFile = () => {
  createTemporaryNotification({
    icon: 'mmm-error',
    message: t('please-use-image-or-jwpub'),
    type: 'negative',
  });
  mediaWindowCustomBackground.value = '';
  jwpubImportFilePath.value = '';
};

const notifyCustomBackgroundSet = () => {
  createTemporaryNotification({
    caption: t('custom-background-will-not-persist'),
    icon: 'mmm-check',
    message: t('custom-background-set'),
    type: 'positive',
  });
};

const notifyCustomBackgroundRemoved = () => {
  createTemporaryNotification({
    icon: 'mmm-reset',
    message: t('custom-background-removed'),
    type: 'positive',
  });
};
const setMediaBackground = (filepath: string) => {
  try {
    if (!filepath) {
      throw new Error('Problem with image file');
    } else {
      mediaWindowCustomBackground.value = pathToFileURL(filepath);
      notifyCustomBackgroundSet();
    }
  } catch (error) {
    errorCatcher(error);
    if (filepath) notifyInvalidBackgroundFile();
    mediaWindowCustomBackground.value = '';
  } finally {
    jwpubImages.value = [];
    jwpubImportFilePath.value = '';
  }
};

watchImmediate(
  () => [
    currentSettings.value?.enableMediaDisplayButton,
    currentCongregation.value,
  ],
  ([newMediaDisplayEnabled, newCongregation]) => {
    showMediaWindow(!!newCongregation && !!newMediaDisplayEnabled);
  },
);

watch(
  () => mediaWindowCustomBackground.value,
  (newMediaBackground) => {
    const { post } = useBroadcastChannel<string, string>({
      name: 'custom-background',
    });
    post(newMediaBackground);
  },
);

watchImmediate(
  screenPreferences,
  (newScreenPreferences) => {
    try {
      setScreenPreferences(JSON.stringify(newScreenPreferences));
      moveMediaWindow(
        newScreenPreferences.preferredScreenNumber,
        newScreenPreferences.preferWindowed,
        true,
      );
      fetchScreens();
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: { name: 'ScreenPreferencesWatcher', newScreenPreferences },
        },
      });
    }
  },
  { deep: true },
);

useEventListener(window, 'windowScreen-update', windowScreenListener);
useEventListener(window, 'screen-trigger-update', fetchScreens);
</script>
