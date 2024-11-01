<template>
  <q-item
    v-show="!media.hidden"
    :class="{
      'items-center': true,
      'justify-center': true,
      'bg-accent-100-transparent': playState === 'current',
      'bg-accent-100': mediaPlayingUniqueId === '' && playState === 'current',
    }"
  >
    <div class="q-pr-none rounded-borders">
      <div
        v-if="media.isAudio"
        class="bg-grey-9 rounded-borders text-white flex"
        style="width: 150px; height: 84px"
      >
        <q-icon name="mmm-music-note" size="lg" />
      </div>
      <div
        v-else
        class="q-pr-none rounded-borders overflow-hidden relative-position bg-black"
      >
        <q-img
          :id="media.uniqueId"
          ref="mediaImage"
          :ratio="16 / 9"
          :src="
            thumbnailFromMetadata ||
            (media.isImage ? media.fileUrl : media.thumbnailUrl)
          "
          fit="contain"
          width="150px"
          @error="imageLoadingError"
          @mouseleave="hoveredBadges[media.uniqueId] = false"
          @mouseover="hoveredBadges[media.uniqueId] = true"
        >
          <q-badge
            v-if="media.isVideo"
            :class="
              'q-mt-sm q-ml-sm cursor-pointer rounded-borders-sm ' +
              (customDurations[currentCongregation]?.[selectedDate]?.[
                media.uniqueId
              ] &&
              (customDurations[currentCongregation][selectedDate][
                media.uniqueId
              ].min > 0 ||
                customDurations[currentCongregation][selectedDate][
                  media.uniqueId
                ].max < media.duration)
                ? 'bg-semi-negative'
                : 'bg-semi-black')
            "
            style="padding: 5px !important"
            @click="showMediaDurationPopup(media)"
          >
            <q-icon
              :name="
                !!hoveredBadges[media.uniqueId] ||
                customDurations[currentCongregation]?.[selectedDate]?.[
                  media.uniqueId
                ]
                  ? 'mmm-edit'
                  : 'mmm-play'
              "
              class="q-mr-xs"
              color="white"
            />
            {{
              customDurations[currentCongregation]?.[selectedDate]?.[
                media.uniqueId
              ] &&
              (customDurations[currentCongregation][selectedDate][
                media.uniqueId
              ].min > 0 ||
                customDurations[currentCongregation][selectedDate][
                  media.uniqueId
                ].max < media.duration)
                ? formatTime(
                    customDurations[currentCongregation][selectedDate][
                      media.uniqueId
                    ].min,
                  ) + ' - '
                : ''
            }}
            {{
              formatTime(
                customDurations[currentCongregation]?.[selectedDate]?.[
                  media.uniqueId
                ]?.max ?? media.duration,
              )
            }}
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
                <div class="text-subtitle1 q-pb-sm">{{ mediaTitle }}</div>
                <div class="row items-center q-mt-lg">
                  <div class="col-shrink q-pr-md time-duration">
                    {{ formatTime(0) }}
                  </div>
                  <div class="col">
                    <q-range
                      v-model="
                        customDurations[currentCongregation][selectedDate][
                          media.uniqueId
                        ]
                      "
                      :left-label-value="
                        formatTime(
                          customDurations[currentCongregation]?.[
                            selectedDate
                          ]?.[media.uniqueId]?.min,
                        )
                      "
                      :max="media.duration"
                      :min="0"
                      :right-label-value="
                        formatTime(
                          customDurations[currentCongregation]?.[
                            selectedDate
                          ]?.[media.uniqueId]?.max,
                        )
                      "
                      :step="0.1"
                      label
                      label-always
                    />
                  </div>
                  <div class="col-shrink q-pl-md time-duration">
                    {{ formatTime(media.duration) }}
                  </div>
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn
                  :label="$t('reset')"
                  color="negative"
                  flat
                  @click="resetMediaDuration(media)"
                />
                <q-btn
                  :label="$t('save')"
                  color="primary"
                  flat
                  @click="mediaDurationPopups[media.uniqueId] = false"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </q-img>
        <template v-if="media.isImage">
          <transition
            appear
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
            mode="out-in"
            name="fade"
          >
            <div class="absolute-bottom-right q-mr-xs q-mb-xs row">
              <template v-if="mediaPanzoom?.scale > 1.01">
                <q-badge
                  class="q-mr-xs"
                  color="warning"
                  style="padding: 5px !important"
                  @click="zoomReset(true)"
                >
                  <q-icon color="white" name="mmm-refresh" />
                </q-badge>
              </template>
              <div class="bg-semi-black row rounded-borders">
                <q-badge
                  :disabled="mediaPanzoom?.scale < 1.01"
                  color="transparent"
                  style="padding: 5px !important"
                  @click="zoomOut()"
                >
                  <q-icon color="white" name="mmm-minus" />
                </q-badge>
                <q-separator class="bg-grey-8 q-my-xs" vertical />
                <q-badge
                  :disabled="mediaPanzoom?.scale > 4.99"
                  color="transparent"
                  style="padding: 5px !important"
                  @click="zoomIn()"
                >
                  <q-icon color="white" name="mmm-plus" />
                </q-badge>
              </div>
            </div>
          </transition>
        </template>
      </div>
    </div>
    <div class="row" style="flex-grow: 1; align-content: center">
      <div class="col-12">
        <div class="row items-center">
          <div class="col">
            <div class="row items-center">
              <div
                v-if="media.paragraph"
                :class="{
                  'q-pl-md': $q.screen.gt.xs,
                  'q-pr-none': $q.screen.gt.xs,
                  'col-shrink': $q.screen.gt.xs,
                  'col-12': !$q.screen.gt.xs,
                  'q-px-md': !$q.screen.gt.xs,
                }"
                side
              >
                <q-chip
                  :clickable="false"
                  class="media-tag bg-accent-200 full-width"
                >
                  <q-icon
                    :name="
                      media.paragraph !== 9999
                        ? 'mmm-paragraph'
                        : 'mmm-footnote'
                    "
                    class="q-mr-xs"
                  />
                  {{
                    media.paragraph !== 9999 ? media.paragraph : $t('footnote')
                  }}
                </q-chip>
              </div>
              <div
                v-else-if="media.song"
                :class="{
                  'q-pl-md': $q.screen.gt.xs,
                  'q-pr-none': $q.screen.gt.xs,
                  'col-shrink': $q.screen.gt.xs,
                  'col-12': !$q.screen.gt.xs,
                  'q-px-md': !$q.screen.gt.xs,
                }"
                side
              >
                <q-chip
                  :clickable="false"
                  class="media-tag bg-accent-400 full-width"
                  text-color="white"
                >
                  <q-icon class="q-mr-xs" name="mmm-music-note" />
                  {{ media.song.toString() }}
                </q-chip>
              </div>
              <div class="q-px-md col">
                <div
                  class="ellipsis-3-lines"
                  @dblclick="mediaEditTitleDialog = true"
                >
                  {{ mediaTitle }}
                </div>
              </div>
              <div
                v-if="media.isAdditional && mediaPlayingUrl !== media.fileUrl"
              >
                <q-btn
                  class="q-mr-md"
                  color="negative"
                  flat
                  icon="mmm-delete"
                  rounded
                  @click="mediaToDelete = media.uniqueId"
                />
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
                  media.isVideo
                "
                class="absolute duration-slider"
              >
                <q-slider
                  v-model="mediaPlayingCurrentPosition"
                  :inner-max="
                    customDurations?.[currentCongregation]?.[selectedDate]?.[
                      media.uniqueId
                    ]?.max ?? media.duration
                  "
                  :inner-min="
                    customDurations?.[currentCongregation]?.[selectedDate]?.[
                      media.uniqueId
                    ]?.min ?? 0
                  "
                  :label-value="formatTime(mediaPlayingCurrentPosition)"
                  :max="media.duration"
                  :min="0"
                  :readonly="mediaPlayingAction !== 'pause'"
                  :step="0.1"
                  inner-track-color="accent-400"
                  label
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
                :disable="mediaPlayingUrl !== '' && isVideo(mediaPlayingUrl)"
                color="primary"
                icon="mmm-play"
                rounded
                @click="
                  mediaPlayingUrl = fs.existsSync(fileUrlToPath(media.fileUrl))
                    ? media.fileUrl
                    : (media.streamUrl ?? media.fileUrl);
                  mediaPlayingUniqueId = media.uniqueId;
                  mediaPlayingSubtitlesUrl = media.subtitlesUrl ?? '';
                  if (mediaPanzoom) mediaPlayingPanzoom = mediaPanzoom;
                "
              />
            </template>
            <template v-else>
              <q-btn
                ref="playButton"
                :disable="mediaPlayingUrl !== '' && isVideo(mediaPlayingUrl)"
                color="primary"
                icon="mmm-play-sign-language"
                push
                rounded
              >
                <q-menu>
                  <q-list style="min-width: 100px">
                    <q-item
                      clickable
                      @click="
                        delete customDurations?.[currentCongregation]?.[
                          selectedDate
                        ]?.[media.uniqueId];
                        mediaPlayingUrl = fs.existsSync(
                          fileUrlToPath(media.fileUrl),
                        )
                          ? media.fileUrl
                          : (media.streamUrl ?? media.fileUrl);
                        mediaPlayingUniqueId = media.uniqueId;
                        mediaPlayingSubtitlesUrl = media.subtitlesUrl ?? '';
                        mediaPlayingAction = 'play';
                      "
                    >
                      <q-item-section>{{ $t('entireFile') }}</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item
                      v-for="marker in media.markers"
                      :key="marker.VideoMarkerId"
                      clickable
                      @click="
                        customDurations[currentCongregation] ??= {};
                        customDurations[currentCongregation][selectedDate] ??=
                          {};
                        customDurations[currentCongregation][selectedDate][
                          media.uniqueId
                        ] ??= {
                          min: 0,
                          max: media.duration,
                        };
                        customDurations[currentCongregation][selectedDate][
                          media.uniqueId
                        ].min = marker.StartTimeTicks / 10000 / 1000;
                        customDurations[currentCongregation][selectedDate][
                          media.uniqueId
                        ].max =
                          (marker.StartTimeTicks +
                            marker.DurationTicks -
                            marker.EndTransitionDurationTicks) /
                          10000 /
                          1000;
                        mediaPlayingUrl = fs.existsSync(
                          fileUrlToPath(media.fileUrl),
                        )
                          ? media.fileUrl
                          : (media.streamUrl ?? media.fileUrl);
                        mediaPlayingUniqueId = media.uniqueId;
                        mediaPlayingSubtitlesUrl = media.subtitlesUrl ?? '';
                        mediaPlayingAction = 'play';
                      "
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
                <q-tooltip :delay="1000">{{
                  $t(
                    currentSceneType === 'media'
                      ? 'hide-image-for-zoom-participants'
                      : 'show-image-for-zoom-participants',
                  )
                }}</q-tooltip>
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
                  media.isVideo &&
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
      <q-menu context-menu touch-position>
        <q-list>
          <q-item-label header>{{ media.title }}</q-item-label>
          <q-item v-close-popup clickable @click="emit('update:hidden', true)">
            <q-item-section>
              <q-item-label>{{ $t('hide-from-list') }}</q-item-label>
              <q-item-label caption>{{
                $t('hide-from-list-explain')
              }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="mediaEditTitleDialog = true">
            <q-item-section>
              <q-item-label>{{ $t('rename') }}</q-item-label>
              <q-item-label caption>{{ $t('rename-explain') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </div>
  </q-item>
  <q-dialog v-model="mediaEditTitleDialog">
    <q-card class="modal-confirm">
      <q-card-section class="items-center">
        <q-input v-model="mediaTitle" focused outlined type="textarea" />
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn
          v-close-popup
          :label="$t('reset')"
          color="negative"
          flat
          @click="resetMediaTitle()"
        />
        <q-btn v-close-popup :label="$t('save')" flat />
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
        <q-btn :label="$t('cancel')" flat @click="mediaToStop = ''" />
        <q-btn
          ref="stopButton"
          :label="$t('stop')"
          color="negative"
          flat
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
                    (
                      props.list.find(
                        (m) => m.uniqueId === mediaToDelete,
                      ) as any
                    ).fileUrl,
                  )
                : ''),
          })
        }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn :label="$t('cancel')" flat @click="mediaToDelete = ''" />
        <q-btn
          :label="$t('delete')"
          color="negative"
          flat
          @click="deleteMedia()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { DynamicMediaObject } from 'src/types';

import Panzoom, {
  type PanzoomObject,
  type PanzoomOptions,
} from '@panzoom/panzoom';
import { useBroadcastChannel, useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getThumbnailUrl } from 'src/helpers/fs';
import { formatTime, isImage, isVideo } from 'src/helpers/mediaPlayback';
import { sendObsSceneEvent } from 'src/helpers/obs';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { useObsStateStore } from 'src/stores/obs-state';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const currentState = useCurrentStateStore();
const {
  currentCongregation,
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

const obsState = useObsStateStore();
const { currentSceneType, obsConnectionState } = storeToRefs(obsState);

const { fileUrlToPath, fs, path } = window.electronApi;

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

const emit = defineEmits(['update:hidden']);

const mediaEditTitleDialog = ref(false);
const mediaTitle = ref('');

const resetMediaTitle = () => {
  if (props?.media) {
    mediaTitle.value =
      props.media.title ||
      (props.media.fileUrl ? path.basename(props.media.fileUrl) : '');
  } else {
    mediaTitle.value = '';
  }
};

resetMediaTitle();

const thumbnailFromMetadata = ref('');

const imageLoadingError = () => {
  findThumbnailUrl();
};

function findThumbnailUrl() {
  if (!thumbnailFromMetadata.value) {
    setTimeout(() => {
      if (fs.existsSync(fileUrlToPath(props.media.fileUrl))) {
        getThumbnailUrl(props.media.fileUrl).then((thumbnailUrl) => {
          if (!thumbnailFromMetadata.value) {
            thumbnailFromMetadata.value = thumbnailUrl;
          }
          if (!thumbnailFromMetadata.value) {
            findThumbnailUrl();
          }
        });
      }
    }, 2000);
  }
}

if (props.media.isVideo && !props.media.thumbnailUrl) findThumbnailUrl();

const showMediaDurationPopup = (media: DynamicMediaObject) => {
  try {
    if (!currentCongregation.value) return;
    customDurations.value[currentCongregation.value] ??= {};
    customDurations.value[currentCongregation.value][selectedDate.value] ??= {};
    customDurations.value[currentCongregation.value][selectedDate.value][
      media.uniqueId
    ] ??= {
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

function stopMedia() {
  mediaPlayingAction.value = 'pause';
  mediaPlayingUrl.value = '';
  mediaPlayingUniqueId.value = '';
  mediaPlayingCurrentPosition.value = 0;
  mediaPlayingAction.value = '';
  mediaToStop.value = '';
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

const mediaImage = ref();

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

    useEventListener(mediaImage.value, 'dblclick', (e) => {
      zoomIn(e);
    });

    useEventListener(mediaImage.value, 'panzoomend', () => {
      zoomReset();
    });

    useEventListener(mediaImage.value, 'wheel', function (e) {
      if (!e.ctrlKey) return;
      panzooms[props.media.uniqueId]?.zoomWithWheel(e);
    });

    useEventListener(
      mediaImage.value,
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

const playButton = ref<HTMLButtonElement | undefined>();
const pauseResumeButton = ref<HTMLButtonElement | undefined>();
const stopButton = ref<HTMLButtonElement | undefined>();

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
