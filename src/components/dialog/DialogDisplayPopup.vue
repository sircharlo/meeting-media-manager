<template>
  <q-menu
    ref="displayPopup"
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div class="flex action-popup q-py-md" style="flex-flow: column">
      <div class="card-title row q-px-md q-mb-none">
        {{ t('media-display-settings') }}
      </div>
      <template v-if="screenList?.length > 1">
        <div class="card-section-title row q-px-md">
          {{ t('window-type') }}
        </div>
        <div class="row q-px-md q-pb-sm q-col-gutter-sm">
          <div class="col-6">
            <q-btn
              class="full-width full-height"
              color="primary"
              :disable="screenList?.length < 2"
              :outline="
                screenList?.length < 2 || screenPreferences.preferWindowed
              "
              unelevated
              @click="
                () => {
                  console.log('🔍 [Full Screen Button] Clicked');
                  screenPreferences.preferWindowed = false;
                  console.log(
                    '🔍 [Full Screen Button] Calling moveMediaWindow with:',
                    {
                      screen: screenPreferences.preferredScreenNumber,
                      fullscreen: true,
                    },
                  );
                  moveMediaWindow(
                    screenPreferences.preferredScreenNumber,
                    true,
                  );
                }
              "
            >
              <q-icon class="q-mr-sm" name="mmm-fullscreen" size="xs" />
              {{ t('full-screen') }}
            </q-btn>
          </div>
          <div class="col-6">
            <q-btn
              class="full-width full-height"
              color="primary"
              :disable="screenList?.length < 2"
              :outline="
                !(screenList?.length < 2 || screenPreferences.preferWindowed)
              "
              :text-color="
                screenList?.length < 2 || screenPreferences.preferWindowed
                  ? ''
                  : 'primary'
              "
              unelevated
              @click="
                () => {
                  console.log('🔍 [Windowed Button] Clicked');
                  screenPreferences.preferWindowed = true;
                  console.log(
                    '🔍 [Windowed Button] Calling moveMediaWindow with:',
                    {
                      screen: screenPreferences.preferredScreenNumber,
                      fullscreen: false,
                    },
                  );
                  moveMediaWindow(
                    screenPreferences.preferredScreenNumber,
                    false,
                  );
                }
              "
            >
              <q-icon class="q-mr-sm" name="mmm-window" size="xs" />
              {{ t('windowed') }}
              <q-tooltip
                v-if="screenPreferences.preferWindowed && mediaWindowSize"
                floating
              >
                {{ mediaWindowSize?.width }} x
                {{ mediaWindowSize?.height }}
              </q-tooltip>
            </q-btn>
          </div>
        </div>
        <q-separator class="bg-accent-200 q-mb-md" />
        <template
          v-if="!screenPreferences.preferWindowed && screenList?.length > 2"
        >
          <div class="card-section-title row q-px-md">
            {{ t('display') }}
          </div>
          <div class="q-px-md q-pb-sm">
            <div
              class="display-map"
              :style="{
                position: 'relative',
                width: '100%',
                aspectRatio: virtualBounds.width + ' / ' + virtualBounds.height,
                overflow: 'hidden',
                '--screen-gap': '1%',
              }"
            >
              <template v-for="(screen, index) in screenList" :key="screen.id">
                <q-btn
                  class="screen-rect column items-center justify-center"
                  :class="{
                    'border-dashed': screen.mainWindow,
                  }"
                  :color="!screen.mainWindow ? 'primary' : 'secondary'"
                  :disable="screen.mainWindow"
                  :outline="!isScreenSelected(index, screen)"
                  :style="{
                    position: 'absolute',
                    left:
                      'calc(' +
                      (screenRects[index]?.left ?? 0) +
                      '% + var(--screen-gap))',
                    top:
                      'calc(' +
                      (screenRects[index]?.top ?? 0) +
                      '% + var(--screen-gap))',
                    width:
                      'calc(' +
                      (screenRects[index]?.width ?? 0) +
                      '% - (var(--screen-gap) * 2))',
                    height:
                      'calc(' +
                      (screenRects[index]?.height ?? 0) +
                      '% - (var(--screen-gap) * 2))',
                    borderRadius: '6px',
                  }"
                  unelevated
                  @click="
                    () => {
                      if (screen.mainWindow) return;
                      console.log('🔍 [Screen Map] Clicked for index:', index);
                      screenPreferences.preferredScreenNumber = index;
                      const isFullscreen = !screenPreferences.preferWindowed;
                      console.log(
                        '🔍 [Screen Map] Calling moveMediaWindow with:',
                        { index, isFullscreen },
                      );
                      moveMediaWindow(index, isFullscreen);
                    }
                  "
                >
                  <q-tooltip v-if="screen.mainWindow" :delay="1000">
                    {{ t('main-window-is-on-this-screen') }}
                  </q-tooltip>
                  <div
                    v-if="screen.mainWindow && scaledMainWindowRect(index)"
                    :style="{
                      position: 'absolute',
                      left: scaledMainWindowRect(index)?.left + '%',
                      top: scaledMainWindowRect(index)?.top + '%',
                      width: scaledMainWindowRect(index)?.width + '%',
                      height: scaledMainWindowRect(index)?.height + '%',
                      border: '2px dashed var(--q-primary)',
                      borderRadius: '4px',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }"
                  >
                    <q-icon
                      name="mmm-logo"
                      size="sm"
                      style="pointer-events: none; color: var(--q-primary)"
                    />
                  </div>
                  <q-icon
                    v-if="!screen.mainWindow"
                    class="q-mr-sm"
                    name="mmm-media-display-active"
                    size="xs"
                  />
                  {{
                    !screen.mainWindow ? t('display') + ' ' + (index + 1) : ''
                  }}
                </q-btn>
              </template>
            </div>
          </div>
          <q-separator class="bg-accent-200 q-mb-md" />
        </template>
      </template>
      <div class="card-section-title row q-px-md q-pb-sm">
        {{ t('custom-background') }}
      </div>
      <div class="row q-px-md q-pb-sm">
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
              ? t('reset-custom-background')
              : t('set-custom-background')
          }}
        </q-btn>
      </div>
      <template v-if="currentLangObject?.isSignLanguage && cameras.length">
        <q-separator class="bg-accent-200 q-mb-md" />
        <div class="card-section-title row q-px-md q-pb-sm">
          {{ t('camera-as-background') }}
        </div>
        <div class="row q-px-md q-pb-sm">
          <q-select
            v-model="displayCameraId"
            clearable
            emit-value
            :label="t('select-camera')"
            map-options
            :options="cameras"
            outlined
            style="width: 100%"
          />
        </div>
      </template>
      <div class="q-px-md q-pt-md row">
        <div class="col">
          <div class="row text-subtitle1 text-weight-medium">
            {{ mediaWindowVisible ? t('projecting') : t('inactive') }}
          </div>
          <div class="row text-dark-grey">
            {{
              t(
                screenList?.length < 2 || screenPreferences.preferWindowed
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
            {{ t('hide-media-display') }}
          </q-btn>
          <q-btn
            v-else
            class="full-width"
            color="primary"
            unelevated
            @click="showMediaWindow(true)"
          >
            {{ t('show-media-display') }}
          </q-btn>
        </div>
      </div>
    </div>
  </q-menu>
  <BaseDialog v-model="showCustomBackgroundPicker" :dialog-id="props.dialogId">
    <div class="bg-secondary-contrast flex q-px-none" style="flex-flow: column">
      <div class="text-h6 row q-px-md q-pt-lg">
        {{ t('choose-an-image') }}
      </div>
      <div class="row q-px-md q-py-md">
        {{ t('select-a-custom-background') }}
      </div>
      <div class="q-px-md overflow-auto row flex">
        <template
          v-for="(jwpubImage, index) in jwpubImages"
          :key="jwpubImage.FilePath"
        >
          <q-item
            class="row items-center full-width"
            clickable
            @click="setMediaBackground(jwpubImage.FilePath)"
          >
            <div class="row q-mr-md">
              <q-img
                v-ripple
                class="rounded-borders"
                fit="contain"
                :src="getFileUrlFromPath(jwpubImage.FilePath)"
                style="width: 150px"
              />
            </div>
            <div class="col">
              <div class="row">{{ getBasename(jwpubImage.FilePath) }}</div>
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
      <div class="q-px-md q-py-md row justify-end">
        <q-btn
          color="negative"
          flat
          @click="
            jwpubImportFilePath = '';
            jwpubImages = [];
            showCustomBackgroundPicker = false;
          "
        >
          {{ t('cancel') }}
        </q-btn>
      </div>
    </div>
  </BaseDialog>
</template>
<script setup lang="ts">
import type { Display, MultimediaItem } from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  watchImmediate,
} from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { QMenu } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getMemorialBackground } from 'src/helpers/jw-media';
import { decompressJwpub, showMediaWindow } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { convertImageIfNeeded } from 'src/utils/converters';
import { getTempPath } from 'src/utils/fs';
import { isImage, isJwpub } from 'src/utils/media';
import { findDb } from 'src/utils/sqlite';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const displayPopup = useTemplateRef<QMenu>('displayPopup');

const { t } = useI18n();

const screenList = ref<Display[]>([]);

const appSettings = useAppSettingsStore();
const { displayCameraId, screenPreferences } = storeToRefs(appSettings);

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentLangObject,
  currentSettings,
  mediaWindowCustomBackground,
  mediaWindowVisible,
} = storeToRefs(currentState);

const props = defineProps<{
  dialogId: string;
}>();

const open = defineModel<boolean>({ default: false });

const {
  fs,
  getAllScreens,
  moveMediaWindow,
  openFileDialog,
  path,
  pathToFileURL,
} = window.electronApi;
const { basename, join } = path;

const { copyFile } = fs;

const getBasename = (filename: string) => {
  if (!filename) return '';
  return basename(filename);
};

const getFileUrlFromPath = (filepath: string) => {
  if (!filepath) return '';
  return pathToFileURL(filepath);
};

// Virtual desktop extents across all displays (in physical pixels as provided by Electron)
const virtualBounds = computed(() => {
  const list = screenList.value;
  if (!list || list.length === 0) {
    return { height: 9, width: 16, x: 0, y: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const d of list) {
    const b = d.bounds;
    if (!b) continue;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return { height, width, x: minX, y: minY };
});

// Percentage-based rectangles for each screen relative to the virtual desktop
const screenRects = computed(() => {
  const vb = virtualBounds.value;
  const list = screenList.value ?? [];
  return list.map((d) => {
    const b = d.bounds;
    const left = ((b.x - vb.x) / vb.width) * 100;
    const top = ((b.y - vb.y) / vb.height) * 100;
    const width = (b.width / vb.width) * 100;
    const height = (b.height / vb.height) * 100;
    return {
      height: Number.isFinite(height) ? height : 0,
      left: Number.isFinite(left) ? left : 0,
      top: Number.isFinite(top) ? top : 0,
      width: Number.isFinite(width) ? width : 0,
    };
  });
});

const scaledMainWindowRect = (index: number) => {
  const list = screenList.value ?? [];
  const screen = list[index];
  if (!screen || !screen.mainWindowBounds) return undefined;

  const b = screen.bounds;
  const mw = screen.mainWindowBounds;

  const inset = 3;
  const minSize = 4;

  let left = ((mw.x - b.x) / b.width) * 100 + inset;
  let top = ((mw.y - b.y) / b.height) * 100 + inset;
  let width = (mw.width / b.width) * 100 - inset * 2;
  let height = (mw.height / b.height) * 100 - inset * 2;

  left = Math.max(inset, Math.min(left, 100 - inset));
  top = Math.max(inset, Math.min(top, 100 - inset));
  width = Math.max(minSize, Math.min(width, 100 - left - inset));
  height = Math.max(minSize, Math.min(height, 100 - top - inset));

  return { height, left, top, width };
};

// Selected when media window is on this screen and it's not the app's main window
const isScreenSelected = (index: number, screen: Display) => {
  void index; // index kept for potential future preference logic
  return !!screen.mediaWindow && !screen.mainWindow;
};

const jwpubImportFilePath = ref('');
const jwpubImages = ref<{ FilePath: string }[]>([]);

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
        if (!backgroundPicker?.filePaths.length) {
          notifyInvalidBackgroundFile();
        } else {
          const filepath = backgroundPicker.filePaths[0];
          if (filepath && isJwpub(filepath)) {
            jwpubImportFilePath.value = filepath;
            const unzipDir = await decompressJwpub(filepath);
            const db = await findDb(unzipDir);
            if (!db) throw new Error('No db file found: ' + filepath);
            jwpubImages.value = window.electronApi
              .executeQuery<
                Partial<MultimediaItem>
              >(db, "SELECT FilePath FROM Multimedia WHERE CategoryType >= 0 AND CategoryType <> 9 AND FilePath <> '';")
              .map((multimediaItem) => {
                return {
                  FilePath: join(unzipDir, multimediaItem.FilePath),
                };
              });
            if (jwpubImages.value?.length === 0) {
              notifyInvalidBackgroundFile();
            }
          } else if (filepath) {
            const tempDirectory = await getTempPath();
            const tempFilepath = join(tempDirectory, basename(filepath));
            await copyFile(filepath, tempFilepath);
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

const fetchScreens = async () => {
  try {
    screenList.value = await getAllScreens();
  } catch (error) {
    errorCatcher(error);
  }
};

onMounted(() => {
  fetchScreens();
  getCameras();
});

const cameras = ref<{ label: string; value: string }[]>([]);

const getCameras = async () => {
  try {
    cameras.value = (await navigator.mediaDevices.enumerateDevices())
      .filter((d) => d.kind === 'videoinput')
      .map((d) => ({ label: d.label, value: d.deviceId }));
  } catch (error) {
    errorCatcher(error);
  }
};

const { post: postCameraStream } = useBroadcastChannel<
  null | string,
  null | string
>({
  name: 'camera-stream',
});

// Listen for requests to get current media window variables
const { data: getCurrentMediaWindowVariables } = useBroadcastChannel<
  string,
  string
>({
  name: 'get-current-media-window-variables',
});

watchImmediate(
  () => getCurrentMediaWindowVariables.value,
  () => {
    // Push current camera stream when requested
    if (displayCameraId.value) {
      postCameraStream(displayCameraId.value);
    }
  },
);

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

const { post: postCustomBackground } = useBroadcastChannel<string, string>({
  name: 'custom-background',
});

const loadMemorialBackground = async (newMediaBackground?: string) => {
  let bg: string | undefined = newMediaBackground;
  if (
    !newMediaBackground &&
    currentState.selectedDate &&
    currentState.selectedDate === currentSettings.value?.memorialDate
  ) {
    bg = await getMemorialBackground();
  }
  postCustomBackground(bg ?? '');
};

watch(
  () => mediaWindowCustomBackground.value,
  (newMediaBackground) => {
    loadMemorialBackground(newMediaBackground);
  },
);

useEventListener(window, 'screen-trigger-update', fetchScreens, {
  passive: true,
});

const { data: mediaWindowSize } = useBroadcastChannel<
  Record<string, number>,
  Record<string, number>
>({
  name: 'media-window-size',
});

// UI update handler
watch(
  () => [screenPreferences.value.preferWindowed],
  () => {
    setTimeout(() => {
      if (displayPopup.value) {
        displayPopup.value.updatePosition();
      }
    }, 10);
  },
);
</script>
<style scoped>
.border-dashed::before {
  border-style: dashed;
}
</style>
