<template>
  <q-item
    v-show="!media.hidden"
    ref="mediaItem"
    :class="{
      'items-center': true,
      'justify-center': true,
      'bg-accent-100-transparent': currentlyHighlighted,
      'bg-accent-100': mediaPlaying.uniqueId === '' && currentlyHighlighted,
      'q-px-sm': child,
    }"
    :style="child ? 'padding: 8px 6px' : undefined"
  >
    <div class="col-shrink">
      <div
        class="q-pr-none rounded-borders overflow-hidden relative-position bg-black"
        :style="{ opacity: isFileUrl(media.fileUrl) ? undefined : 0.64 }"
      >
        <q-img
          :id="media.uniqueId"
          ref="mediaImage"
          fit="contain"
          :ratio="16 / 9"
          :src="
            thumbnailFromMetadata ||
            (media.isImage ? media.fileUrl : media.thumbnailUrl)
          "
          width="150px"
          @dblclick="zoomIn($event)"
          @error="imageLoadingError"
          @mouseenter="setHoveredBadge(true)"
          @mouseleave="setHoveredBadge(false)"
        >
          <q-badge
            v-if="media.duration"
            class="q-mt-sm q-ml-sm cursor-pointer rounded-borders-sm bg-semi-black"
            style="padding: 5px !important"
            @click="showMediaDurationPopup()"
          >
            <q-icon
              class="q-mr-xs"
              color="white"
              :name="
                !!hoveredBadge || customDurationIsSet
                  ? 'mmm-edit'
                  : media.isAudio
                    ? 'mmm-music-note'
                    : 'mmm-play'
              "
            />
            {{
              customDurationIsSet
                ? formatTime(mediaCustomDuration.min ?? 0) + ' - '
                : ''
            }}
            {{ formatTime(mediaCustomDuration.max ?? media.duration) }}
          </q-badge>
          <q-dialog v-model="mediaDurationPopup" persistent>
            <q-card>
              <q-card-section
                class="row items-center text-bigger text-semibold q-pb-none"
              >
                {{ t('set-custom-durations') }}
              </q-card-section>
              <q-card-section>
                {{
                  t(
                    'use-the-slider-below-to-adjust-the-start-and-end-time-of-this-media-item',
                  )
                }}
              </q-card-section>
              <q-card-section>
                <div class="text-subtitle1 q-pb-sm">
                  {{ displayMediaTitle }}
                </div>
                <div class="row items-center q-mt-lg">
                  <div class="col-shrink q-pr-md time-duration">
                    <q-input
                      v-model="customDurationMinUserInput"
                      class="text-center q-pa-none"
                      dense
                      style="width: 3.5em"
                      @update:model-value="
                        if ($event && media.duration) {
                          let val = Math.max(
                            Math.min(
                              timeToSeconds($event.toString()),
                              media.duration,
                            ),
                            0,
                          );
                          if (val >= media.duration) val = 0;
                          customDurationMinUserInput = formatTime(val);
                          mediaCustomDuration.min = val;
                        }
                      "
                    />
                  </div>
                  <div class="col flex">
                    <q-range
                      v-model="mediaCustomDuration"
                      :max="media.duration"
                      :min="0"
                      :step="0.1"
                      @change="updateMediaCustomDuration($event)"
                      @update:model-value="
                        customDurationMinUserInput = formatTime($event.min);
                        customDurationMaxUserInput = formatTime($event.max);
                      "
                    />
                  </div>
                  <div class="col-shrink q-pl-md time-duration">
                    <q-input
                      v-model="customDurationMaxUserInput"
                      class="text-center q-pa-none"
                      dense
                      style="width: 3.5em"
                      @update:model-value="
                        if ($event && media.duration) {
                          let val = Math.max(
                            Math.min(
                              timeToSeconds($event.toString()),
                              media.duration,
                            ),
                            0,
                          );
                          customDurationMaxUserInput = formatTime(val);
                          mediaCustomDuration.max = val;
                        }
                      "
                    />
                  </div>
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn
                  color="negative"
                  flat
                  :label="t('reset')"
                  @click="resetMediaDuration()"
                />
                <q-btn
                  color="primary"
                  flat
                  :label="t('save')"
                  @click="saveMediaDuration()"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </q-img>
        <transition
          appear
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
          mode="out-in"
          name="fade"
        >
          <template v-if="media.isImage && (hoveredBadge || getScale() > 1.01)">
            <div
              class="absolute-bottom-right q-mr-xs q-mb-xs row"
              @mouseenter="setHoveredBadge(true)"
              @mouseleave="setHoveredBadge(false)"
            >
              <template v-if="mediaPanzoom.scale && mediaPanzoom.scale > 1.01">
                <q-badge
                  class="q-mr-xs"
                  color="warning"
                  style="padding: 5px !important; cursor: pointer"
                  @click="zoomReset(true)"
                >
                  <q-icon color="white" name="mmm-refresh" />
                </q-badge>
              </template>
              <div class="bg-semi-black row rounded-borders">
                <q-badge
                  color="transparent"
                  :disabled="
                    !mediaPanzoom.scale ||
                    mediaPanzoom.scale < 1.01 ||
                    undefined
                  "
                  style="padding: 5px !important; cursor: pointer"
                  @click="zoomOut()"
                >
                  <q-icon color="white" name="mmm-minus" />
                </q-badge>
                <q-separator class="bg-grey-8 q-my-xs" vertical />
                <q-badge
                  color="transparent"
                  :disabled="
                    !mediaPanzoom.scale ||
                    mediaPanzoom?.scale > 4.99 ||
                    undefined
                  "
                  style="padding: 5px !important; cursor: pointer"
                  @click="zoomIn()"
                >
                  <q-icon color="white" name="mmm-plus" />
                </q-badge>
              </div>
            </div>
          </template>
        </transition>
      </div>
    </div>
    <div class="col">
      <div class="row items-center">
        <div
          v-if="
            (media.source !== 'dynamic' &&
              !currentSettings?.disableMediaFetching &&
              isFileUrl(media.fileUrl)) ||
            media.tag?.type
          "
          :class="mediaTagClasses"
          side
        >
          <q-chip
            :class="[
              'media-tag full-width',
              media.tag?.type === 'song'
                ? currentSongIsDuplicated
                  ? 'bg-warning'
                  : 'bg-accent-400'
                : 'bg-accent-200',
            ]"
            :clickable="false"
            :ripple="false"
            :text-color="media.tag?.type === 'song' ? 'white' : undefined"
          >
            <q-icon
              :class="{ 'q-mr-xs': media.tag?.type }"
              :name="
                media.source === 'watched'
                  ? 'mmm-watched-media'
                  : media.source === 'additional' &&
                      !currentSettings?.disableMediaFetching &&
                      isFileUrl(media.fileUrl)
                    ? 'mmm-add-media'
                    : media.tag?.type === 'paragraph'
                      ? media.tag.value !== 9999
                        ? 'mmm-paragraph'
                        : 'mmm-footnote'
                      : 'mmm-music-note'
              "
            />
            <q-tooltip v-if="tagTooltipText" :delay="500">
              {{ tagTooltipText }}
            </q-tooltip>
            <template v-if="media?.tag?.type">
              {{
                media.tag?.type === 'paragraph' && media.tag.value === 9999
                  ? t('footnote')
                  : media.tag?.value
              }}
            </template>
          </q-chip>
        </div>
        <div
          :class="{
            'q-px-md': true,
            col: true,
            'text-grey': !isFileUrl(media.fileUrl),
          }"
        >
          <q-input
            v-if="isEditingTitle"
            ref="titleInput"
            v-model="mediaTitle"
            dense
            @blur="handleTitleEdit(false)"
            @keyup.enter="handleTitleEdit(false)"
            @keyup.esc="handleTitleEdit(false)"
          />
          <div
            v-else
            :class="
              ($q.screen.gt.xs || !media.tag) &&
              (displayMediaTitle.match(/\s/g) || []).length
                ? 'ellipsis-3-lines'
                : 'ellipsis'
            "
            @dblclick="handleTitleEdit(true)"
          >
            {{ displayMediaTitle }}
            <q-tooltip v-if="!$q.screen.gt.xs" :delay="1000">
              {{ displayMediaTitle }}
            </q-tooltip>
          </div>
          <div v-if="!isFileUrl(media.fileUrl)" class="text-caption">
            {{ t('media-item-missing-explain') }}
          </div>
        </div>
        <div class="col-shrink">
          <div class="row q-gutter-sm items-center q-mr-sm">
            <q-icon
              v-if="currentSongIsDuplicated"
              class="q-mr-sm"
              color="warning"
              name="mmm-warning"
              size="sm"
            >
              <q-tooltip :delay="500">
                {{ $t('this-song-is-duplicated') }}
              </q-tooltip>
            </q-icon>
            <q-btn
              ref="moreButton"
              color="accent-400"
              flat
              icon="mmm-dots"
              round
              size="sm"
              :style="`visibility: ${hoveringMediaItem || contextMenu ? 'visible' : 'hidden'}`"
              @click="
                () => {
                  menuTarget = moreButton?.$el;
                  contextMenu = true;
                }
              "
            />
            <q-icon v-if="repeat" color="warning" name="mmm-repeat" size="sm">
              <q-tooltip :delay="500">
                {{ t('repeat') }}
              </q-tooltip>
            </q-icon>
          </div>
        </div>
      </div>
      <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
        mode="out-in"
        name="fade"
      >
        <div
          v-if="isCurrentlyPlaying && media.duration"
          class="absolute duration-slider"
        >
          <div class="row flex-center">
            <div
              class="col-shrink text-caption text-accent-400 q-mx-sm text-left"
              style="min-width: 40px"
            >
              {{
                formatTime(
                  Math.max(
                    (mediaPlaying.currentPosition || 0) -
                      (mediaCustomDuration.min || 0),
                    0,
                  ),
                )
              }}
            </div>
            <div class="col" style="height: 28px">
              <q-slider
                v-model="mediaPlaying.currentPosition"
                color="primary"
                :inner-max="mediaCustomDuration.max"
                :inner-min="mediaCustomDuration.min"
                inner-track-color="accent-400"
                label
                :label-color="
                  mediaPlaying.action === 'pause' ? undefined : 'accent-400'
                "
                :label-value="
                  mediaPlaying.action === 'pause'
                    ? formatTime(mediaPlaying.currentPosition)
                    : t('pause-to-adjust-time')
                "
                :max="media.duration"
                :min="0"
                :readonly="mediaPlaying.action !== 'pause'"
                :step="0.1"
                :thumb-size="mediaPlaying.action === 'pause' ? undefined : '0'"
                track-color="negative"
                @update:model-value="seekTo"
              />
            </div>
            <div
              class="col-shrink text-caption text-accent-400 q-mx-sm text-right"
              style="min-width: 40px"
            >
              {{
                '-' +
                formatTime(
                  Math.max(
                    (mediaCustomDuration.max || media.duration) -
                      (mediaPlaying.currentPosition || 0),
                    0,
                  ),
                )
              }}
            </div>
          </div>
        </div>
      </transition>
    </div>
    <div
      v-if="!isCurrentlyPlaying"
      class="col-shrink"
      style="align-content: center"
    >
      <template v-if="!media.markers || media.markers.length === 0">
        <q-btn
          ref="playButton"
          :color="isFileUrl(media.fileUrl) ? 'primary' : 'grey'"
          :disable="
            (mediaPlaying.url !== '' &&
              (isVideo(mediaPlaying.url) || isAudio(mediaPlaying.url))) ||
            !isFileUrl(media.fileUrl)
          "
          :icon="localFile ? 'mmm-play' : 'mmm-stream-play'"
          rounded
          :unelevated="!isFileUrl(media.fileUrl)"
          @click="setMediaPlaying(media)"
        >
          <q-tooltip v-if="!localFile" :delay="1000">
            {{ t('play-while-downloading') }}
          </q-tooltip>
        </q-btn>
      </template>
      <template v-else>
        <q-btn
          ref="playButton"
          color="primary"
          :disable="
            mediaPlaying.url !== '' &&
            (isVideo(mediaPlaying.url) || isAudio(mediaPlaying.url))
          "
          icon="mmm-play-sign-language"
          push
          rounded
        >
          <q-menu>
            <q-list>
              <q-item clickable @click="setMediaPlaying(media, true)">
                <q-item-section>{{ t('entireFile') }}</q-item-section>
              </q-item>
              <q-separator />
              <q-item
                v-for="marker in media.markers"
                :key="marker.VideoMarkerId"
                clickable
                @click="setMediaPlaying(media, true, marker)"
              >
                <q-item-section>{{ marker.Label }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
    </div>
    <template v-else>
      <div class="col-shrink items-center justify-center flex">
        <q-btn
          v-if="isImage(mediaPlaying.url) && obsConnectionState === 'connected'"
          :color="currentSceneType === 'media' ? 'negative' : 'primary'"
          icon="
                    mmm-picture-for-zoom-participants
                "
          rounded
          @click="
            sendObsSceneEvent(currentSceneType === 'media' ? 'camera' : 'media')
          "
        >
          <q-tooltip :delay="1000">
            {{
              t(
                currentSceneType === 'media'
                  ? 'hide-image-for-zoom-participants'
                  : 'show-image-for-zoom-participants',
              )
            }}
          </q-tooltip>
        </q-btn>
        <q-btn
          v-if="mediaPlaying.action === 'pause'"
          ref="pauseResumeButton"
          color="primary"
          icon="mmm-play"
          outline
          rounded
          @click="mediaPlaying.action = 'play'"
        />
        <q-btn
          v-else-if="
            localFile &&
            media.duration &&
            (mediaPlaying.action === 'play' || !mediaPlaying.action)
          "
          ref="pauseResumeButton"
          color="negative"
          icon="mmm-pause"
          outline
          rounded
          @click="mediaPlaying.action = 'pause'"
        />
        <q-btn
          v-if="mediaPlaying.action !== '' || mediaPlaying.action === ''"
          ref="stopButton"
          class="q-ml-sm"
          color="negative"
          :icon="
            !localFile && mediaPlaying.currentPosition === 0
              ? undefined
              : 'mmm-stop'
          "
          rounded
          @click="
            media.isVideo || media.isAudio
              ? (mediaToStop = media.uniqueId)
              : stopMedia()
          "
        >
          <q-spinner
            v-if="!localFile && mediaPlaying.currentPosition === 0"
            size="xs"
          />
        </q-btn>
      </div>
    </template>
    <q-menu
      v-model="contextMenu"
      context-menu
      style="overflow-x: hidden"
      :target="menuTarget"
      touch-position
    >
      <q-list>
        <q-item-label header>{{ displayMediaTitle }}</q-item-label>
        <q-item
          v-close-popup
          clickable
          :disable="isCurrentlyPlaying"
          @click="emit('update:hidden', true)"
        >
          <q-item-section avatar>
            <q-icon name="mmm-file-hidden" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('hide-from-list') }}</q-item-label>
            <q-item-label caption>
              {{ t('hide-from-list-explain') }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          :disable="isCurrentlyPlaying"
          @click="handleTitleEdit(true)"
        >
          <q-item-section avatar>
            <q-icon name="mmm-edit" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('rename') }}</q-item-label>
            <q-item-label caption>{{ t('rename-explain') }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="mediaEditTagDialog = true">
          <q-item-section avatar>
            <q-icon name="mmm-tag" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('change-tag') }}</q-item-label>
            <q-item-label caption>
              {{ t('change-tag-explain') }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="media.duration" clickable @click="repeat = !repeat">
          <q-item-section avatar>
            <q-icon :name="repeat ? 'mmm-repeat-off' : 'mmm-repeat'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{
                repeat ? t('stop-repeat-media-item') : t('repeat-media-item')
              }}
            </q-item-label>
            <q-item-label caption>
              {{
                repeat
                  ? t('stop-repeat-media-item-explain')
                  : t('repeat-media-item-explain')
              }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-if="media.source === 'additional'"
          v-close-popup
          clickable
          :disable="isCurrentlyPlaying"
          @click="mediaToDelete = media.uniqueId"
        >
          <q-item-section avatar>
            <q-icon color="negative" name="mmm-delete" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('delete-media') }}</q-item-label>
            <q-item-label caption>
              {{ t('delete-media-explain') }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-item>

  <q-dialog v-model="mediaEditTagDialog">
    <q-card class="modal-confirm">
      <q-card-section class="items-center">
        <q-option-group
          v-model="mediaTag.type"
          color="primary"
          inline
          name="tagType"
          :options="tagTypes"
        />
        <q-input
          v-model="mediaTag.value"
          dense
          :disable="!mediaTag.type"
          focused
          outlined
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup color="negative" flat :label="t('dismiss')" />
        <q-btn
          v-close-popup
          color="primary"
          flat
          :label="t('save')"
          @click="emit('update:tag', mediaTag)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="mediaStopPending">
    <q-card class="modal-confirm">
      <q-card-section
        class="row items-center text-bigger text-semibold text-negative q-pb-none"
      >
        <q-icon class="q-mr-sm" name="mmm-stop" />
        {{ t('stop-media') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{ t('sureStopVideo') }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn flat :label="t('cancel')" @click="mediaToStop = ''" />
        <q-btn
          ref="stopButton"
          color="negative"
          flat
          :label="t('stop')"
          @click="stopMedia()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="mediaDeletePending">
    <q-card class="modal-confirm">
      <q-card-section
        class="row items-center text-bigger text-semibold text-negative q-pb-none"
      >
        <q-icon class="q-mr-sm" name="mmm-delete" />
        {{ t('delete-media') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{
          t('are-you-sure-delete', {
            mediaToDelete:
              props.media.title ||
              (props.media.fileUrl ? getBasename(props.media.fileUrl) : ''),
          })
        }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn flat :label="t('cancel')" @click="mediaToDelete = ''" />
        <q-btn
          color="negative"
          flat
          :label="t('delete')"
          @click="deleteMedia()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { DynamicMediaObject, Tag, VideoMarker } from 'src/types';

import Panzoom, {
  type PanzoomObject,
  type PanzoomOptions,
} from '@panzoom/panzoom';
import {
  useBroadcastChannel,
  useElementHover,
  useEventListener,
  useTimeoutPoll,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { debounce, type QBtn, type QImg, QItem, useQuasar } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getThumbnailUrl } from 'src/helpers/fs';
import { showMediaWindow } from 'src/helpers/mediaPlayback';
import { isFileUrl } from 'src/utils/fs';
import { isAudio, isImage, isVideo } from 'src/utils/media';
import { sendObsSceneEvent } from 'src/utils/obs';
import { formatTime, timeToSeconds } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const { currentSettings, highlightedMediaId, mediaPlaying } =
  storeToRefs(currentState);

const currentlyHighlighted = computed(
  () => highlightedMediaId.value === props.media.uniqueId,
);

const jwStore = useJwStore();
const { removeFromAdditionMediaMap } = jwStore;
const hoveredBadge = ref(false);

const setHoveredBadge = debounce((value: boolean) => {
  hoveredBadge.value = value;
}, 300);

const obsState = useObsStateStore();
const { currentSceneType, obsConnectionState } = storeToRefs(obsState);

const mediaDurationPopup = ref(false);
const panzoom = ref<null | PanzoomObject>(null);
const mediaToStop = ref('');
const mediaStopPending = computed(() => !!mediaToStop.value);
const mediaToDelete = ref('');
const mediaDeletePending = computed(() => !!mediaToDelete.value);

const props = defineProps<{
  child?: boolean;
  media: DynamicMediaObject;
}>();

const repeat = defineModel<boolean | undefined>('repeat', { required: true });

const emit = defineEmits<{
  (e: 'update:hidden', value: boolean): void;
  (e: 'update:tag', value: Tag): void;
  (e: 'update:customDuration' | 'update:title', value: string): void;
  (e: 'media-stopped'): void;
}>();

const mediaItem = useTemplateRef<QItem>('mediaItem');
const hoveringMediaItem = useElementHover(() => mediaItem.value?.$el);

const moreButton = useTemplateRef<QBtn>('moreButton');
const contextMenu = ref(false);
const menuTarget = ref<boolean | string | undefined>(true);

watch(contextMenu, (val) => {
  if (!val) menuTarget.value = true;
});

const isEditingTitle = ref(false);
const titleInput = ref<HTMLInputElement>();
const mediaTitle = ref(props.media.title);

const { fileUrlToPath, fs, path } = window.electronApi;
const { basename } = path;

const { pathExists, pathExistsSync, statSync } = fs;

const displayMediaTitle = computed(() => {
  // When editing, use the local mediaTitle to avoid reactivity delays
  if (isEditingTitle.value) {
    return mediaTitle.value || '';
  }
  return (
    props.media.title ||
    (props.media.fileUrl && basename(props.media.fileUrl)) ||
    props.media.extractCaption ||
    ''
  );
});

const mediaEditTagDialog = ref(false);
const { t } = useI18n();

const mediaTag = ref<Tag>({
  ...(props.media.tag || {
    type: '',
    value: '',
  }),
});

const tagTypes = [
  {
    label: t('none'),
    value: '',
  },
  {
    label: t('song'),
    value: 'song',
  },
  {
    label: t('paragraph'),
    value: 'paragraph',
  },
];

const $q = useQuasar();
const mediaTagClasses = computed(() => {
  return {
    'col-12': !$q.screen.gt.xs,
    'col-shrink': $q.screen.gt.xs,
    'q-pl-md': $q.screen.gt.xs,
    'q-pr-none': $q.screen.gt.xs,
    'q-px-md': !$q.screen.gt.xs,
  };
});

const handleTitleEdit = (value: boolean) => {
  if (value) {
    // Start editing
    isEditingTitle.value = true;
    // Initialize mediaTitle with current title when starting to edit
    mediaTitle.value = props.media.title || '';
    nextTick(() => {
      if (titleInput.value) {
        titleInput.value.focus();
      }
    });
  } else {
    // End editing - emit the updated title
    isEditingTitle.value = false;
    // Use nextTick to ensure the input disappears first, then emit
    nextTick(() => {
      emit('update:title', mediaTitle.value);
    });
  }
};

const updateMediaCustomDuration = (customDuration?: {
  max: number;
  min: number;
}) => {
  emit('update:customDuration', JSON.stringify(customDuration || ''));
  mediaCustomDuration.value = {
    max: customDuration?.max ?? props.media.duration,
    min: customDuration?.min ?? 0,
  };
};

const customDurationIsSet = computed(() => {
  return (
    props.media.duration &&
    props.media.customDuration &&
    (props.media.customDuration.min > 0 ||
      props.media.customDuration.max < props.media.duration)
  );
});

const mediaCustomDuration = ref({
  max: props.media.duration
    ? props.media.customDuration?.max || props.media.duration
    : undefined,
  min: props.media.duration ? props.media.customDuration?.min || 0 : undefined,
});

const customDurationMinUserInput = ref(
  formatTime(mediaCustomDuration.value.min),
);

const customDurationMaxUserInput = ref(
  formatTime(mediaCustomDuration.value.max),
);

const getBasename = (fileUrl: string) => {
  if (!fileUrl) return '';
  return basename(fileUrl);
};

const fileIsLocal = () => {
  const filePath = fileUrlToPath(props.media.fileUrl);
  const fileExists = pathExistsSync(filePath);
  const remoteSizeKnown = props.media.filesize !== undefined;
  const localSize = fileExists ? statSync(filePath).size : 0;

  if (!fileExists) return false;
  if (!remoteSizeKnown) return true;
  if (localSize !== props.media.filesize) return false;
  return true;
};

const localFile = ref(fileIsLocal());

const { pause } = useTimeoutPoll(() => {
  localFile.value = fileIsLocal();
}, 1000);

whenever(
  () => localFile.value,
  () => {
    pause();
  },
  { immediate: true },
);

const setMediaPlaying = async (
  media: DynamicMediaObject,
  signLanguage = false,
  marker?: VideoMarker,
) => {
  if (isImage(mediaPlaying.value.url)) stopMedia(true);
  if (signLanguage) {
    if (marker) {
      updateMediaCustomDuration({
        max:
          (marker.StartTimeTicks +
            marker.DurationTicks -
            marker.EndTransitionDurationTicks) /
          10000 /
          1000,
        min: marker.StartTimeTicks / 10000 / 1000,
      });
    } else {
      updateMediaCustomDuration();
    }
  } else {
    if (mediaPanzoom.value) mediaPlaying.value.panzoom = mediaPanzoom.value;
  }
  mediaPlaying.value.action = 'play';
  localFile.value = fileIsLocal();
  mediaPlaying.value.url = localFile.value
    ? (media.fileUrl ?? '')
    : (media.streamUrl ?? media.fileUrl ?? '');
  mediaPlaying.value.uniqueId = media.uniqueId;
  mediaPlaying.value.subtitlesUrl = media.subtitlesUrl ?? '';
};

const { post: postRepeat } = useBroadcastChannel<string, boolean>({
  name: 'repeat',
});

watchImmediate(
  () => [repeat.value, mediaPlaying.value.uniqueId],
  ([newMediaRepeat, newMediaPlayingUniqueId]) => {
    if (newMediaPlayingUniqueId !== props.media.uniqueId) return;
    postRepeat(!!newMediaRepeat);
  },
);

const thumbnailFromMetadata = ref('');

const imageLoadingError = () => {
  findThumbnailUrl();
};

async function findThumbnailUrl() {
  let fileRetryCount = 0;
  let thumbnailRetryCount = 0;

  const runThumbnailCheck = async () => {
    const filePath = fileUrlToPath(props.media.fileUrl);
    const fileExists = await pathExists(filePath);

    if (!fileExists) {
      if (fileRetryCount < 30) {
        fileRetryCount++;
        setTimeout(runThumbnailCheck, 2000); // Retry after 2 seconds
      }
      return;
    }

    if (fileExists) {
      const thumbnailUrl = await getThumbnailUrl(props.media.fileUrl);
      if (!thumbnailFromMetadata.value) {
        thumbnailFromMetadata.value = thumbnailUrl;
      }
      if (!thumbnailFromMetadata.value && thumbnailRetryCount < 5) {
        thumbnailRetryCount++;
        setTimeout(runThumbnailCheck, 2000); // Retry after 2 seconds
      }
    }
  };

  // Run immediately
  await runThumbnailCheck();
}

if (props.media.duration && !props.media.thumbnailUrl) findThumbnailUrl();

const showMediaDurationPopup = () => {
  try {
    mediaCustomDuration.value = props.media.customDuration || {
      max: props.media.duration,
      min: 0,
    };
    mediaDurationPopup.value = true;
  } catch (error) {
    errorCatcher(error);
  }
};

const resetMediaDuration = () => {
  try {
    mediaDurationPopup.value = false;
    updateMediaCustomDuration();
    customDurationMinUserInput.value = formatTime(
      mediaCustomDuration.value.min,
    );
    customDurationMaxUserInput.value = formatTime(
      mediaCustomDuration.value.max,
    );
  } catch (error) {
    errorCatcher(error);
  }
};

const saveMediaDuration = () => {
  try {
    mediaDurationPopup.value = false;
  } catch (error) {
    errorCatcher(error);
  }
};

const { post } = useBroadcastChannel<number, number>({ name: 'seek-to' });

const seekTo = (newSeekTo: null | number) => {
  if (newSeekTo !== null) {
    post(newSeekTo);
    if (!currentState.mediaWindowVisible) {
      showMediaWindow(true);
    }
  }
};

function zoomIn(click?: MouseEvent) {
  if (!panzoom.value) return;
  const zoomFactor = 0.2;
  try {
    const scale = getScale();
    if (!click?.clientX && !click?.clientY) {
      if (scale === 1) {
        panzoom.value.zoomIn({ step: 0.001 });
        setTimeout(() => {
          zoomIn();
        }, 100);
      } else {
        panzoom.value.zoomIn({ step: zoomFactor });
      }
    } else {
      panzoom.value.zoomToPoint(scale * (1 + zoomFactor), {
        clientX: click?.clientX || 0,
        clientY: click?.clientY || 0,
      });
    }
  } catch (error) {
    errorCatcher(error);
  }
}

function zoomOut() {
  try {
    panzoom.value?.zoomOut();
    zoomReset();
  } catch (error) {
    errorCatcher(error);
  }
}

const zoomReset = (forced = false, animate = true) => {
  if (!panzoom.value) return;
  if (getScale() < 1.05 || forced) {
    panzoom.value.reset({ animate });
  }
};

function stopMedia(forOtherMediaItem = false) {
  mediaPlaying.value.action = 'pause';
  mediaPlaying.value.url = '';
  mediaPlaying.value.uniqueId = '';
  mediaPlaying.value.currentPosition = 0;
  mediaPlaying.value.action = '';
  mediaToStop.value = '';
  localFile.value = fileIsLocal();
  if (!forOtherMediaItem) {
    zoomReset(true);

    // Emit event to notify parent that media was stopped
    console.log('🛑 [stopMedia] Emitting media-stopped event');
    emit('media-stopped');
  }
}

const isCurrentlyPlaying = computed(() => {
  return (
    (mediaPlaying.value.url === props.media.fileUrl ||
      mediaPlaying.value.url === props.media.streamUrl) &&
    mediaPlaying.value.uniqueId === props.media.uniqueId
  );
});

const destroyPanzoom = () => {
  try {
    if (!panzoom.value || !props.media.uniqueId) return;
    panzoom.value.resetStyle();
    panzoom.value.reset({ animate: false });
    panzoom.value.destroy();
    panzoom.value = null;
  } catch (e) {
    errorCatcher(e);
  }
};

const mediaPanzoom = ref<{ scale: number; x: number; y: number }>({
  scale: 1,
  x: 0,
  y: 0,
});

const mediaImage = useTemplateRef<QImg>('mediaImage');

const getScale = () => {
  if (!panzoom.value) return 1;
  return panzoom.value.getScale();
};

const initiatePanzoom = () => {
  try {
    if (
      !props.media.uniqueId ||
      !isImage(props.media.fileUrl) ||
      !mediaImage.value?.$el
    )
      return;

    const options: PanzoomOptions = {
      animate: true,
      contain: 'outside',
      handleStartEvent: (e) => {
        if (getScale() > 1.01) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      maxScale: 5,
      minScale: 1,
      panOnlyWhenZoomed: true,
      pinchAndPan: true,
      step: 0.1, // for wheel / trackpad zoom
    };
    panzoom.value = Panzoom(mediaImage.value.$el, options);

    useEventListener(
      mediaImage.value.$el,
      'panzoomend',
      () => {
        zoomReset();
      },
      { passive: true },
    );

    useEventListener(
      mediaImage.value.$el,
      'wheel',
      (e) => {
        if (!e.ctrlKey) return;
        panzoom.value?.zoomWithWheel(e);
      },
      { passive: true },
    );

    useEventListener(
      mediaImage.value.$el,
      'panzoomchange',
      (e: HTMLElementEventMap['panzoomchange']) => {
        const width = mediaImage.value?.$el?.clientWidth;
        const height = mediaImage.value?.$el?.clientHeight;
        if (!width || !height) return;
        mediaPanzoom.value = {
          scale: e.detail.scale,
          x: e.detail.x / width,
          y: e.detail.y / height,
        };
        if (!isCurrentlyPlaying.value) return;
        mediaPlaying.value.panzoom = mediaPanzoom.value;
      },
      { passive: true },
    );
  } catch (error) {
    errorCatcher(error);
  }
};

function deleteMedia() {
  if (!mediaToDelete.value) return;
  removeFromAdditionMediaMap(
    mediaToDelete.value,
    currentState.currentCongregation,
    currentState.selectedDateObject,
  );
  mediaToDelete.value = '';
}

onMounted(async () => {
  await nextTick();
  initiatePanzoom();
});

onUnmounted(() => {
  destroyPanzoom();
});

const playButton = useTemplateRef<QBtn>('playButton');
const pauseResumeButton = useTemplateRef<QBtn>('pauseResumeButton');
const stopButton = useTemplateRef<QBtn>('stopButton');

useEventListener(
  window,
  'shortcutMediaPauseResume',
  () => {
    if (currentlyHighlighted.value) {
      if (pauseResumeButton.value) {
        pauseResumeButton.value.click();
      } else if (playButton.value) {
        playButton.value.click();
      } else if (isImage(props.media.fileUrl) && stopButton.value) {
        stopButton.value.click();
      }
    }
  },
  { passive: true },
);
useEventListener(
  window,
  'shortcutMediaStop',
  () => {
    if (stopButton.value && currentlyHighlighted) stopButton.value.click();
  },
  { passive: true },
);
whenever(
  () => currentlyHighlighted,
  () => {
    if (currentlyHighlighted.value && mediaItem.value) {
      mediaItem.value.$el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  },
);
const currentSongIsDuplicated = computed(() => {
  const currentSong = props.media.tag?.value?.toString();
  if (!currentSong) return false;

  const songNumbers =
    currentState.selectedDateObject?.dynamicMedia?.filter(
      (m) =>
        !m.hidden &&
        m.tag?.type === 'song' &&
        m.tag?.value?.toString() === currentSong,
    ) ?? [];

  return songNumbers.length > 1;
});

const tagTooltipText = computed(() => {
  if (currentSongIsDuplicated.value) {
    return t('this-song-is-duplicated');
  }

  if (props.media.source === 'watched') {
    return t('watched-media-item-explain');
  }

  if (
    props.media.source === 'additional' &&
    !currentSettings.value?.disableMediaFetching &&
    isFileUrl(props.media.fileUrl)
  ) {
    return t('extra-media-item-explain');
  }

  return null;
});
</script>
