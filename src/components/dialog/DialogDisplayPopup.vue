<template>
  <q-menu
    ref="displayPopup"
    v-model="open"
    :offset="[0, 8]"
    anchor="top middle"
    no-parent-event
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <q-card flat>
      <q-card-section>
        <div class="card-title">
          {{ $t('media-display-settings') }}
        </div>
        <template v-if="screenList.length > 1">
          <template
            v-if="!screenPreferences.preferWindowed && screenList.length > 2"
          >
            <div>
              <p class="card-section-title text-dark-grey">
                {{ $t('display') }}
              </p>
            </div>
            <div class="row items-center q-col-gutter-sm q-mb-md">
              <template v-for="(screen, index) in screenList" :key="screen.id">
                <div class="col">
                  <q-btn
                    :disable="screen.mainWindow"
                    :outline="screen.mainWindow || !screen.mediaWindow"
                    class="full-width"
                    color="primary"
                    @click="screenPreferences.preferredScreenNumber = index"
                  >
                    <q-icon
                      :name="
                        screen.mainWindow
                          ? 'mmm-display-current'
                          : 'mmm-media-display-active'
                      "
                      class="q-mr-sm"
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
            <q-separator class="bg-accent-200 q-mb-md" />
          </template>
          <div>
            <p class="card-section-title text-dark-grey">
              {{ $t('window-type') }}
            </p>
          </div>
          <div class="row items-center q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <q-btn
                :disable="screenList.length < 2"
                :outline="
                  screenList.length < 2 || screenPreferences.preferWindowed
                "
                class="full-width"
                color="primary"
                unelevated
                @click="screenPreferences.preferWindowed = false"
              >
                <q-icon class="q-mr-sm" name="mmm-fullscreen" size="xs" />
                {{ $t('full-screen') }}
              </q-btn>
            </div>
            <div class="col-6">
              <q-btn
                :disable="screenList.length < 2"
                :outline="
                  !(screenList.length < 2 || screenPreferences.preferWindowed)
                "
                :text-color="
                  screenList.length < 2 || screenPreferences.preferWindowed
                    ? ''
                    : 'primary'
                "
                class="full-width"
                color="primary"
                unelevated
                @click="screenPreferences.preferWindowed = true"
              >
                <q-icon class="q-mr-sm" name="mmm-window" size="xs" />
                {{ $t('windowed') }}
              </q-btn>
            </div>
          </div>
          <q-separator class="bg-accent-200 q-mb-md" />
        </template>
        <div>
          <p class="card-section-title text-dark-grey">
            {{ $t('custom-background') }}
          </p>
        </div>
        <div class="col q-mb-md">
          <q-btn
            :outline="!mediaWindowCustomBackground"
            class="full-width"
            color="primary"
            unelevated
            @click="chooseCustomBackground(!!mediaWindowCustomBackground)"
          >
            <q-icon
              :name="
                'mmm-background' +
                (mediaWindowCustomBackground ? '-remove' : '')
              "
              class="q-mr-sm"
              size="xs"
            />
            {{
              mediaWindowCustomBackground
                ? $t('reset-custom-background')
                : $t('set-custom-background')
            }}
          </q-btn>
        </div>
        <q-separator class="bg-accent-200 q-mb-md" />
        <div class="row items-center">
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
              >{{ $t('hide-media-display') }}</q-btn
            >
            <q-btn
              v-else
              class="full-width"
              color="primary"
              unelevated
              @click="showMediaWindow(true)"
              >{{ $t('show-media-display') }}</q-btn
            >
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-menu>
  <q-dialog v-model="showCustomBackgroundPicker">
    <div
      class="items-center col q-pb-lg q-px-lg q-gutter-y-md bg-secondary-contrast"
    >
      <div class="text-h6 row">{{ $t('choose-an-image') }}</div>
      <div class="row">
        {{ $t('select-a-custom-background') }}
      </div>
      <q-scroll-area
        :bar-style="barStyle"
        :thumb-style="thumbStyle"
        style="height: 40vh; width: -webkit-fill-available"
      >
        <template
          v-for="(jwpubImage, index) in jwpubImages"
          :key="jwpubImage.FilePath"
        >
          <div class="col items-center q-pb-md">
            <div
              class="row cursor-pointer items-center q-gutter-x-md"
              @click="setMediaBackground(jwpubImage.FilePath)"
            >
              <div class="col-shrink">
                <q-img
                  v-ripple
                  :src="pathToFileURL(jwpubImage.FilePath)"
                  class="rounded-borders"
                  fit="contain"
                  style="width: 150px"
                />
              </div>
              <div class="col">
                <div class="row">{{ path.basename(jwpubImage.FilePath) }}</div>
              </div>
            </div>
            <q-separator
              v-if="index < jwpubImages.length - 1"
              class="bg-accent-200 q-mt-md"
            />
          </div>
        </template>
        <q-inner-loading
          :showing="!!jwpubImportFilePath && !jwpubImages.length"
        />
      </q-scroll-area>
      <div class="row justify-end">
        <q-btn
          color="negative"
          flat
          @click="
            jwpubImportFilePath = '';
            jwpubImages = [];
          "
          >{{ $t('cancel') }}</q-btn
        >
      </div>
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import type { Display } from 'src/types';
import type { MultimediaItem } from 'src/types/sqlite';

import { useBroadcastChannel, useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useScrollbar } from 'src/composables/useScrollbar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getTempDirectory } from 'src/helpers/fs';
import {
  convertImageIfNeeded,
  decompressJwpub,
  findDb,
  isImage,
  isJwpub,
  showMediaWindow,
} from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useAppSettingsStore } from 'src/stores/app-settings';
import { useCurrentStateStore } from 'src/stores/current-state';
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
} = window.electronApi;

const { t } = useI18n();
const { barStyle, thumbStyle } = useScrollbar();

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
        const backgroundPicker = await openFileDialog(true, 'jwpub+image');
        if (backgroundPicker?.canceled) return;
        if (!backgroundPicker || backgroundPicker.filePaths?.length === 0) {
          notifyInvalidBackgroundFile();
        } else {
          const filepath = backgroundPicker.filePaths[0];
          if (isJwpub(filepath)) {
            jwpubImportFilePath.value = filepath;
            const unzipDir = await decompressJwpub(filepath);
            const db = findDb(unzipDir);
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
            const tempDirectory = getTempDirectory();
            const tempFilepath = path.join(
              tempDirectory,
              path.basename(filepath),
            );
            fs.copyFileSync(filepath, tempFilepath);
            const workingTempFilepath =
              await convertImageIfNeeded(tempFilepath);
            if (isImage(workingTempFilepath)) {
              setMediaBackground(workingTempFilepath);
            } else {
              throw new Error('Invalid file type: ' + workingTempFilepath);
            }
          }
        }
      } catch (error) {
        if (
          error instanceof Error &&
          !error.message.includes('Invalid file type')
        )
          errorCatcher(error);
        notifyInvalidBackgroundFile();
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const windowScreenListener = (event: CustomEventInit) => {
  try {
    screenPreferences.value.preferredScreenNumber =
      event.detail.targetScreenNumber;
    screenPreferences.value.preferWindowed = event.detail.windowedMode;
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
    console.error(error);
    if (filepath) notifyInvalidBackgroundFile();
    mediaWindowCustomBackground.value = '';
  } finally {
    jwpubImages.value = [];
    jwpubImportFilePath.value = '';
  }
};

watch(
  () => [
    currentSettings.value?.enableMediaDisplayButton,
    currentCongregation.value,
  ],
  ([newMediaDisplayEnabled, newCongregation]) => {
    showMediaWindow(!!newCongregation && !!newMediaDisplayEnabled);
  },
  { immediate: true },
);

watch(
  () => mediaWindowCustomBackground.value,
  (newMediaBackground) => {
    const { post } = useBroadcastChannel({ name: 'custom-background' });
    post(newMediaBackground);
  },
);

watch(
  () => screenPreferences.value,
  (newScreenPreferences) => {
    try {
      moveMediaWindow(
        newScreenPreferences.preferredScreenNumber,
        newScreenPreferences.preferWindowed,
        true,
      );
      fetchScreens();
    } catch (error) {
      errorCatcher(error + ': ' + JSON.stringify(newScreenPreferences));
    }
  },
  { deep: true, immediate: true },
);

useEventListener(window, 'windowScreen-update', windowScreenListener);
useEventListener(window, 'screen-trigger-update', fetchScreens);
</script>
