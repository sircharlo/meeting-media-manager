<template>
  <q-item
    v-show="!media.hidden"
    ref="mediaItem"
    :class="{
      'items-center': true,
      'justify-center': true,
      'bg-accent-100-transparent': playState === 'current',
      'bg-accent-100': mediaPlayingUniqueId === '' && playState === 'current',
    }"
  >
    <div class="q-pr-none rounded-borders">
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
          @error="imageLoadingError"
          @mouseenter="setHoveredBadge(media.uniqueId, true)"
          @mouseleave="setHoveredBadge(media.uniqueId, false)"
        >
          <q-badge
            v-if="media.duration"
            :class="
              'q-mt-sm q-ml-sm cursor-pointer rounded-borders-sm ' +
              (customDurationIsSet ? 'bg-semi-negative' : 'bg-semi-black')
            "
            style="padding: 5px !important"
            @click="showMediaDurationPopup(media)"
          >
            <q-icon
              class="q-mr-xs"
              color="white"
              :name="
                !!hoveredBadges[media.uniqueId] ||
                customDurations[currentCongregation]?.[selectedDate]?.[
                  media.uniqueId
                ]
                  ? 'mmm-edit'
                  : props.media.isAudio
                    ? 'mmm-music-note'
                    : 'mmm-play'
              "
            />
            {{
              customDurationIsSet ? formatTime(customDurationMin) + ' - ' : ''
            }}
            {{ formatTime(customDurationMax) }}
          </q-badge>
          <q-dialog v-model="mediaDurationPopups[media.uniqueId]">
            <q-card>
              <q-card-section
                class="row items-center text-bigger text-semibold q-pb-none"
              >
                {{ $t('set-custom-durations') }}
              </q-card-section>
              <q-card-section>
                {{
                  $t(
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
                    {{ formatTime(0) }}
                  </div>
                  <div class="col">
                    <q-range
                      v-model="
                        customDurations[currentCongregation]![selectedDate]![
                          media.uniqueId
                        ]
                      "
                      label
                      label-always
                      :left-label-value="formatTime(customDurationMin)"
                      :max="media.duration"
                      :min="0"
                      :right-label-value="formatTime(customDurationMax)"
                      :step="0.1"
                    />
                  </div>
                  <div class="col-shrink q-pl-md time-duration">
                    {{ formatTime(media.duration) }}
                  </div>
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn
                  color="negative"
                  flat
                  :label="$t('reset')"
                  @click="resetMediaDuration(media)"
                />
                <q-btn
                  color="primary"
                  flat
                  :label="$t('save')"
                  @click="mediaDurationPopups[media.uniqueId] = false"
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
          <template v-if="media.isImage && hoveredBadges[media.uniqueId]">
            <div
              class="absolute-bottom-right q-mr-xs q-mb-xs row"
              @mouseenter="setHoveredBadge(media.uniqueId, true)"
              @mouseleave="setHoveredBadge(media.uniqueId, false)"
            >
              <template v-if="mediaPanzoom?.scale > 1.01">
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
                  :disabled="mediaPanzoom?.scale < 1.01 || undefined"
                  style="padding: 5px !important; cursor: pointer"
                  @click="zoomOut()"
                >
                  <q-icon color="white" name="mmm-minus" />
                </q-badge>
                <q-separator class="bg-grey-8 q-my-xs" vertical />
                <q-badge
                  color="transparent"
                  :disabled="mediaPanzoom?.scale > 4.99 || undefined"
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
    <div class="row" style="flex-grow: 1; align-content: center">
      <div class="col-12">
        <div class="row items-center">
          <div class="col">
            <div class="row items-center">
              <div
                v-if="
                  (media.isAdditional &&
                    !currentSettings?.disableMediaFetching &&
                    isFileUrl(media.fileUrl)) ||
                  media.paragraph ||
                  media.song ||
                  media.watched
                "
                :class="mediaTagClasses"
                side
              >
                <q-chip
                  :class="[
                    'media-tag full-width',
                    media.song ? 'bg-accent-400' : 'bg-accent-200',
                  ]"
                  :clickable="false"
                  :ripple="false"
                  :text-color="media.song ? 'white' : undefined"
                >
                  <q-icon
                    :class="{ 'q-mr-xs': media.song || media.paragraph }"
                    :name="
                      media.watched
                        ? 'mmm-watched-media'
                        : media.isAdditional &&
                            !currentSettings?.disableMediaFetching &&
                            isFileUrl(media.fileUrl)
                          ? 'mmm-add-media'
                          : media.paragraph
                            ? media.paragraph !== 9999
                              ? 'mmm-paragraph'
                              : 'mmm-footnote'
                            : 'mmm-music-note'
                    "
                  />
                  <q-tooltip v-if="media.watched" :delay="500">
                    {{ $t('watched-media-item-explain') }}
                  </q-tooltip>
                  <q-tooltip
                    v-if="
                      media.isAdditional &&
                      !currentSettings?.disableMediaFetching &&
                      isFileUrl(media.fileUrl)
                    "
                    :delay="1000"
                  >
                    {{ $t('extra-media-item-explain') }}
                  </q-tooltip>
                  <template v-if="media.paragraph || media.song">
                    {{
                      media.paragraph
                        ? media.paragraph !== 9999
                          ? media.paragraph
                          : $t('footnote')
                        : media.song?.toString()
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
                <div
                  class="ellipsis-3-lines row"
                  @dblclick="mediaEditTitleDialog = true"
                >
                  {{ displayMediaTitle }}
                </div>
                <div v-if="!isFileUrl(media.fileUrl)" class="text-caption">
                  {{ $t('media-item-missing-explain') }}
                </div>
              </div>
              <div class="col-shrink">
                <div class="row q-gutter-sm items-center q-mr-sm">
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
                  <q-icon
                    v-if="media.repeat"
                    color="warning"
                    name="mmm-repeat"
                    size="sm"
                  >
                    <q-tooltip :delay="500">
                      {{ media.repeat ? $t('repeat') : $t('repeat-off') }}
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
                v-if="
                  [media.fileUrl, media.streamUrl].includes(mediaPlayingUrl) &&
                  media.duration
                "
                class="absolute duration-slider"
              >
                <q-slider
                  v-model="mediaPlayingCurrentPosition"
                  :color="
                    mediaPlayingAction === 'pause' ? 'primary' : 'accent-400'
                  "
                  :inner-max="customDurationMax"
                  :inner-min="customDurationMin"
                  inner-track-color="accent-400"
                  label
                  :label-always="mediaPlayingAction === 'pause'"
                  :label-color="
                    mediaPlayingAction === 'pause' ? undefined : 'accent-400'
                  "
                  :label-value="
                    mediaPlayingAction === 'pause'
                      ? formatTime(mediaPlayingCurrentPosition)
                      : $t('pause-to-adjust-time')
                  "
                  :max="media.duration"
                  :min="0"
                  :readonly="mediaPlayingAction !== 'pause'"
                  :step="0.1"
                  track-color="negative"
                  @update:model-value="seekTo"
                />
              </div>
            </transition>
          </div>
          <div
            v-if="
              !(
                mediaPlayingUrl === media.fileUrl ||
                mediaPlayingUrl === media.streamUrl
              )
            "
            class="col-shrink"
            style="align-content: center"
          >
            <template v-if="!media.markers || media.markers.length === 0">
              <q-btn
                ref="playButton"
                :color="isFileUrl(media.fileUrl) ? 'primary' : 'grey'"
                :disable="
                  (mediaPlayingUrl !== '' &&
                    (isVideo(mediaPlayingUrl) || isAudio(mediaPlayingUrl))) ||
                  !isFileUrl(media.fileUrl)
                "
                icon="mmm-play"
                rounded
                :unelevated="!isFileUrl(media.fileUrl)"
                @click="setMediaPlaying(media)"
              />
            </template>
            <template v-else>
              <q-btn
                ref="playButton"
                color="primary"
                :disable="
                  mediaPlayingUrl !== '' &&
                  (isVideo(mediaPlayingUrl) || isAudio(mediaPlayingUrl))
                "
                icon="mmm-play-sign-language"
                push
                rounded
              >
                <q-menu>
                  <q-list>
                    <q-item clickable @click="setMediaPlaying(media, true)">
                      <q-item-section>{{ $t('entireFile') }}</q-item-section>
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
                v-if="
                  isImage(mediaPlayingUrl) && obsConnectionState === 'connected'
                "
                :color="currentSceneType === 'media' ? 'negative' : 'primary'"
                icon="
                    mmm-picture-for-zoom-participants
                "
                rounded
                @click="
                  sendObsSceneEvent(
                    currentSceneType === 'media' ? 'camera' : 'media',
                  )
                "
              >
                <q-tooltip :delay="1000">
                  {{
                    $t(
                      currentSceneType === 'media'
                        ? 'hide-image-for-zoom-participants'
                        : 'show-image-for-zoom-participants',
                    )
                  }}
                </q-tooltip>
              </q-btn>
              <q-btn
                v-if="mediaPlayingAction === 'pause'"
                ref="pauseResumeButton"
                color="primary"
                icon="mmm-play"
                outline
                rounded
                @click="mediaPlayingAction = 'play'"
              />
              <q-btn
                v-else-if="
                  media.duration &&
                  (mediaPlayingAction === 'play' || !mediaPlayingAction)
                "
                ref="pauseResumeButton"
                color="negative"
                icon="mmm-pause"
                outline
                rounded
                @click="mediaPlayingAction = 'pause'"
              />
              <q-btn
                v-if="mediaPlayingAction !== '' || mediaPlayingAction === ''"
                ref="stopButton"
                class="q-ml-sm"
                color="negative"
                icon="mmm-stop"
                rounded
                @click="
                  media.isVideo ? (mediaToStop = media.uniqueId) : stopMedia()
                "
              />
            </div>
          </template>
        </div>
      </div>
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
            :disable="
              mediaPlayingUrl === media.fileUrl ||
              mediaPlayingUrl === media.streamUrl
            "
            @click="emit('update:hidden', true)"
          >
            <q-item-section avatar>
              <q-icon name="mmm-file-hidden" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('hide-from-list') }}</q-item-label>
              <q-item-label caption>
                {{ $t('hide-from-list-explain') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup
            clickable
            :disable="
              mediaPlayingUrl === media.fileUrl ||
              mediaPlayingUrl === media.streamUrl
            "
            @click="mediaEditTitleDialog = true"
          >
            <q-item-section avatar>
              <q-icon name="mmm-edit" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('rename') }}</q-item-label>
              <q-item-label caption>{{ $t('rename-explain') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="mediaEditTagDialog = true">
            <q-item-section avatar>
              <q-icon name="mmm-tag" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('change-tag') }}</q-item-label>
              <q-item-label caption>
                {{ $t('change-tag-explain') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            v-if="media.duration"
            clickable
            @click="emit('update:repeat', !media.repeat)"
          >
            <q-item-section avatar>
              <q-icon :name="media.repeat ? 'mmm-repeat-off' : 'mmm-repeat'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{
                  media.repeat
                    ? $t('stop-repeat-media-item')
                    : $t('repeat-media-item')
                }}
              </q-item-label>
              <q-item-label caption>
                {{
                  media.repeat
                    ? $t('stop-repeat-media-item-explain')
                    : $t('repeat-media-item-explain')
                }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            v-if="media.isAdditional"
            v-close-popup
            clickable
            :disable="
              mediaPlayingUrl === media.fileUrl ||
              mediaPlayingUrl === media.streamUrl
            "
            @click="mediaToDelete = media.uniqueId"
          >
            <q-item-section avatar>
              <q-icon color="negative" name="mmm-delete" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('delete-media') }}</q-item-label>
              <q-item-label caption>
                {{ $t('delete-media-explain') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </div>
  </q-item>
  <q-dialog v-model="mediaEditTitleDialog">
    <q-card class="modal-confirm">
      <q-card-section class="items-center">
        <q-input
          v-model="mediaTitle"
          focused
          outlined
          type="textarea"
          @update:model-value="emit('update:title', mediaTitle)"
        />
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn
          v-close-popup
          color="negative"
          flat
          :label="$t('reset')"
          @click="resetMediaTitle()"
        />
        <q-btn v-close-popup flat :label="$t('save')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="mediaEditTagDialog">
    <q-card class="modal-confirm">
      <q-card-section class="items-center">
        <q-option-group
          v-model="tag.type"
          color="primary"
          inline
          name="tagType"
          :options="tagTypes"
          @update:model-value="emit('update:tag', tag)"
        />
        <q-input
          v-model="tag.value"
          dense
          :disable="tag.type === ''"
          focused
          outlined
          @update:model-value="emit('update:tag', tag)"
        />
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn v-close-popup flat :label="$t('dismiss')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="mediaStopPending">
    <q-card class="modal-confirm">
      <q-card-section
        class="row items-center text-bigger text-semibold text-negative q-pb-none"
      >
        <q-icon class="q-mr-sm" name="mmm-stop" />
        {{ $t('stop-media') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{ $t('sureStopVideo') }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn flat :label="$t('cancel')" @click="mediaToStop = ''" />
        <q-btn
          ref="stopButton"
          color="negative"
          flat
          :label="$t('stop')"
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
        {{ $t('delete-media') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{
          $t('are-you-sure-delete', {
            mediaToDelete:
              props.list.find((m) => m.uniqueId === mediaToDelete)?.title ||
              (props.list.find((m) => m.uniqueId === mediaToDelete)?.fileUrl
                ? path.basename(
                    props.list.find((m) => m.uniqueId === mediaToDelete)!
                      .fileUrl,
                  )
                : ''),
          })
        }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn flat :label="$t('cancel')" @click="mediaToDelete = ''" />
        <q-btn
          color="negative"
          flat
          :label="$t('delete')"
          @click="deleteMedia()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { DynamicMediaObject, VideoMarker } from 'src/types';

import Panzoom, {
  type PanzoomObject,
  type PanzoomOptions,
} from '@panzoom/panzoom';
import {
  useBroadcastChannel,
  useElementHover,
  useEventListener,
  watchImmediate,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { debounce, type QBtn, type QImg, useQuasar } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getThumbnailUrl } from 'src/helpers/fs';
import {
  formatTime,
  isAudio,
  isImage,
  isVideo,
} from 'src/helpers/mediaPlayback';
import { sendObsSceneEvent } from 'src/helpers/obs';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { useObsStateStore } from 'src/stores/obs-state';
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentSettings,
  mediaPlayingAction,
  mediaPlayingCurrentPosition,
  mediaPlayingPanzoom,
  mediaPlayingSubtitlesUrl,
  mediaPlayingUniqueId,
  mediaPlayingUrl,
  selectedDate,
} = storeToRefs(currentState);

const jwStore = useJwStore();
const { removeFromAdditionMediaMap } = jwStore;
const { customDurations } = storeToRefs(jwStore);
const hoveredBadges = ref<Record<string, boolean>>({});

const setHoveredBadge = debounce((key: string, value: boolean) => {
  hoveredBadges.value[key] = value;
}, 300);

const obsState = useObsStateStore();
const { currentSceneType, obsConnectionState } = storeToRefs(obsState);

const { fileUrlToPath, fs, isFileUrl, path } = window.electronApi;

const mediaDurationPopups = ref<Record<string, boolean>>({});
const panzooms: Record<string, PanzoomObject> = {};
const mediaToStop = ref('');
const mediaStopPending = computed(() => !!mediaToStop.value);
const mediaToDelete = ref('');
const mediaDeletePending = computed(() => !!mediaToDelete.value);

const props = defineProps<{
  list: DynamicMediaObject[];
  media: DynamicMediaObject;
  playState: string;
}>();

const emit = defineEmits([
  'update:hidden',
  'update:repeat',
  'update:tag',
  'update:title',
]);

const mediaItem = useTemplateRef<HTMLDivElement>('mediaItem');
const hoveringMediaItem = useElementHover(mediaItem);

const moreButton = useTemplateRef<QBtn>('moreButton');
const contextMenu = ref(false);
const menuTarget = ref<boolean | string | undefined>(true);

watch(contextMenu, (val) => {
  if (!val) menuTarget.value = true;
});

const mediaEditTitleDialog = ref(false);
const mediaTitle = ref(props.media.title);
const initialMediaTitle = ref(mediaTitle.value);

const displayMediaTitle = computed(() => {
  return props.media.title || path.basename(props.media.fileUrl);
});

const mediaEditTagDialog = ref(false);
const { t } = useI18n();
const tag = ref({
  type: props.media.song ? 'song' : props.media.paragraph ? 'paragraph' : '',
  value: (props.media.song || props.media.paragraph || '') as string,
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

const resetMediaTitle = () => {
  emit('update:title', initialMediaTitle.value);
};

const customDurationIsSet = computed(() => {
  return (
    customDurations.value[currentCongregation.value]?.[selectedDate.value]?.[
      props.media.uniqueId
    ] &&
    (customDurationMin.value > 0 ||
      customDurationMax.value < props.media.duration)
  );
});

const customDurationMin = computed(() => {
  return (
    customDurations.value[currentCongregation.value]?.[selectedDate.value]?.[
      props.media.uniqueId
    ]?.min ?? 0
  );
});

const customDurationMax = computed(() => {
  return (
    customDurations.value[currentCongregation.value]?.[selectedDate.value]?.[
      props.media.uniqueId
    ]?.max ?? props.media.duration
  );
});

const setMediaPlaying = async (
  media: DynamicMediaObject,
  signLanguage = false,
  marker?: VideoMarker,
) => {
  if (isImage(mediaPlayingUrl.value)) stopMedia(true);
  if (signLanguage) {
    if (marker) {
      const currentCong = currentCongregation.value;
      const currentDate = selectedDate.value;

      customDurations.value[currentCong] ??= {};
      customDurations.value[currentCong][currentDate] ??= {};
      customDurations.value[currentCong][currentDate][media.uniqueId] ??= {
        max: media.duration,
        min: 0,
      };
      customDurations.value[currentCong][currentDate][media.uniqueId].min =
        marker.StartTimeTicks / 10000 / 1000;
      customDurations.value[currentCong][currentDate][media.uniqueId].max =
        (marker.StartTimeTicks +
          marker.DurationTicks -
          marker.EndTransitionDurationTicks) /
        10000 /
        1000;
    } else {
      delete customDurations.value?.[currentCongregation.value]?.[
        selectedDate.value
      ]?.[media.uniqueId];
      mediaPlayingAction.value = 'play';
    }
  } else {
    if (mediaPanzoom.value) mediaPlayingPanzoom.value = mediaPanzoom.value;
  }
  const filePath = fileUrlToPath(media.fileUrl);
  const fileExists = await fs.pathExists(filePath);
  mediaPlayingUrl.value = fileExists
    ? media.fileUrl
    : (media.streamUrl ?? media.fileUrl);
  mediaPlayingUniqueId.value = media.uniqueId;
  mediaPlayingSubtitlesUrl.value = media.subtitlesUrl ?? '';
};

watchImmediate(
  () => [props.media.repeat, mediaPlayingUniqueId.value],
  ([newMediaRepeat, newMediaPlayingUniqueId]) => {
    if (newMediaPlayingUniqueId !== props.media.uniqueId) return;
    const { post } = useBroadcastChannel<string, boolean>({ name: 'repeat' });
    post(!!newMediaRepeat);
  },
);

const thumbnailFromMetadata = ref('');

const imageLoadingError = () => {
  findThumbnailUrl();
};

async function findThumbnailUrl() {
  const runThumbnailCheck = async () => {
    const filePath = fileUrlToPath(props.media.fileUrl);
    const fileExists = await fs.pathExists(filePath);
    if (fileExists) {
      const thumbnailUrl = await getThumbnailUrl(props.media.fileUrl);
      if (!thumbnailFromMetadata.value) {
        thumbnailFromMetadata.value = thumbnailUrl;
      }
      if (!thumbnailFromMetadata.value) {
        setTimeout(runThumbnailCheck, 2000); // Retry after 2 seconds if still not set
      }
    }
  };
  // Run immediately
  await runThumbnailCheck();
}

if (props.media.duration && !props.media.thumbnailUrl) findThumbnailUrl();

const showMediaDurationPopup = (media: DynamicMediaObject) => {
  try {
    const currentCong = currentCongregation.value;
    if (!currentCong) return;
    const currentDate = selectedDate.value;

    customDurations.value[currentCong] ??= {};
    customDurations.value[currentCong][currentDate] ??= {};
    customDurations.value[currentCong][currentDate][media.uniqueId] ??= {
      max: media.duration,
      min: 0,
    };
    mediaDurationPopups.value[media.uniqueId] = true;
  } catch (error) {
    errorCatcher(error);
  }
};

const resetMediaDuration = (media: DynamicMediaObject) => {
  try {
    delete customDurations.value?.[currentCongregation.value]?.[
      selectedDate.value
    ]?.[media.uniqueId];
    mediaDurationPopups.value[media.uniqueId] = false;
  } catch (error) {
    errorCatcher(error);
  }
};

const { post } = useBroadcastChannel<number, number>({ name: 'seek-to' });

const seekTo = (newSeekTo: null | number) => {
  if (newSeekTo !== null) post(newSeekTo);
};

function zoomIn(click?: MouseEvent) {
  try {
    if (!click?.clientX && !click?.clientY) {
      panzooms[props.media.uniqueId]?.zoomIn();
    } else {
      panzooms[props.media.uniqueId]?.zoomToPoint(
        (panzooms[props.media.uniqueId]?.getScale() || 1) * 1.35,
        {
          clientX: click?.clientX || 0,
          clientY: click?.clientY || 0,
        },
      );
    }
  } catch (error) {
    errorCatcher(error);
  }
}

function zoomOut() {
  try {
    panzooms[props.media.uniqueId]?.zoomOut();
    zoomReset();
  } catch (error) {
    errorCatcher(error);
  }
}

const zoomReset = (forced = false, animate = true) => {
  if (panzooms[props.media.uniqueId]?.getScale() <= 1.25 || forced)
    panzooms[props.media.uniqueId]?.reset({ animate });
};

function stopMedia(forOtherMediaItem = false) {
  mediaPlayingAction.value = 'pause';
  mediaPlayingUrl.value = '';
  mediaPlayingUniqueId.value = '';
  mediaPlayingCurrentPosition.value = 0;
  mediaPlayingAction.value = '';
  mediaToStop.value = '';
  if (!forOtherMediaItem) zoomReset(true);
}

const destroyPanzoom = () => {
  try {
    if (!panzooms[props.media.uniqueId] || !props.media.uniqueId) return;
    panzooms[props.media.uniqueId].resetStyle();
    panzooms[props.media.uniqueId].reset({ animate: false });
    panzooms[props.media.uniqueId].destroy();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete panzooms[props.media.uniqueId];
  } catch (e) {
    errorCatcher(e);
  }
};

const mediaPanzoom = ref<Record<string, number>>({
  scale: 1,
  x: 0,
  y: 0,
});

const mediaImage = useTemplateRef<QImg>('mediaImage');

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
      maxScale: 5,
      minScale: 1,
      panOnlyWhenZoomed: true,
      pinchAndPan: true,
    };
    panzooms[props.media.uniqueId] = Panzoom(mediaImage.value.$el, options);

    useEventListener(mediaImage.value.$el, 'dblclick', (e) => {
      zoomIn(e);
    });

    useEventListener(mediaImage.value.$el, 'panzoomend', () => {
      zoomReset();
    });

    useEventListener(mediaImage.value.$el, 'wheel', function (e) {
      if (!e.ctrlKey) return;
      panzooms[props.media.uniqueId]?.zoomWithWheel(e);
    });

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
        if (mediaPlayingUrl.value !== props.media.fileUrl) return;
        mediaPlayingPanzoom.value = mediaPanzoom.value;
      },
    );
  } catch (error) {
    errorCatcher(error);
  }
};

function deleteMedia() {
  if (!mediaToDelete.value) return;
  removeFromAdditionMediaMap(mediaToDelete.value);
  mediaToDelete.value = '';
}

onMounted(() => {
  initiatePanzoom();
});

onUnmounted(() => {
  destroyPanzoom();
});

const playButton = useTemplateRef<QBtn>('playButton');
const pauseResumeButton = useTemplateRef<QBtn>('pauseResumeButton');
const stopButton = useTemplateRef<QBtn>('stopButton');

useEventListener(window, 'shortcutMediaNext', () => {
  if (playButton.value && props.playState === 'next') playButton.value.click();
});
useEventListener(window, 'shortcutMediaPrevious', () => {
  if (playButton.value && props.playState === 'previous')
    playButton.value.click();
});
useEventListener(window, 'shortcutMediaPauseResume', () => {
  if (pauseResumeButton.value && props.playState === 'current')
    pauseResumeButton.value.click();
});
useEventListener(window, 'shortcutMediaStop', () => {
  if (stopButton.value && props.playState === 'current')
    stopButton.value.click();
});
</script>
