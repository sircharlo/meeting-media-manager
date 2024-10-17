<template>
  <q-item class="items-center justify-center">
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
                ? 'negative'
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
        <template v-if="mediaPlayingUrl === media.fileUrl && media.isImage">
          <transition
            appear
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
            mode="out-in"
            name="fade"
          >
            <div
              class="absolute-bottom-right q-mr-xs q-mb-xs bg-semi-black row rounded-borders"
            >
              <q-badge
                style="background: transparent; padding: 5px !important"
                @click="zoomOut(media.uniqueId)"
              >
                <q-icon color="white" name="mmm-minus" />
              </q-badge>
              <q-separator class="bg-grey-8 q-my-xs" vertical />
              <q-badge
                style="background: transparent; padding: 5px !important"
                @click="zoomIn(media.uniqueId)"
              >
                <q-icon color="white" name="mmm-plus" />
              </q-badge>
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
                class="q-pl-md q-pr-none col-shrink"
                side
              >
                <q-chip :clickable="false" class="media-tag bg-accent-200">
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
                class="q-pl-md q-pr-none col-shrink"
                side
              >
                <q-chip
                  :clickable="false"
                  class="media-tag bg-accent-400"
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
                  inner-track-color="accent-300"
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
                  if (isImage(mediaPlayingUrl)) {
                    initiatePanzoom(media.uniqueId);
                  }
                "
              />
            </template>
            <template v-else>
              <q-btn
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
                color="negative"
                icon="mmm-pause"
                outline
                rounded
                @click="mediaPlayingAction = 'pause'"
              />
              <q-btn
                v-if="mediaPlayingAction !== '' || mediaPlayingAction === ''"
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
        <q-btn :label="$t('stop')" color="negative" flat @click="stopMedia()" />
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
import { storeToRefs } from 'pinia';
import { electronApi } from 'src/helpers/electron-api';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getThumbnailUrl } from 'src/helpers/fs';
import { formatTime, isImage, isVideo } from 'src/helpers/mediaPlayback';
import { sendObsSceneEvent } from 'src/helpers/obs';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { useObsStateStore } from 'src/stores/obs-state';
import { computed, onUnmounted, ref } from 'vue';

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

const bc = new BroadcastChannel('mediaPlayback');

const jwStore = useJwStore();
const { removeFromAdditionMediaMap } = jwStore;
const { customDurations } = storeToRefs(jwStore);
const hoveredBadges = ref({} as Record<string, boolean>);

const obsState = useObsStateStore();
const { currentSceneType, obsConnectionState } = storeToRefs(obsState);

const { fileUrlToPath, fs, path } = electronApi;

const mediaDurationPopups = ref({} as Record<string, boolean>);
const panzooms: Record<string, PanzoomObject> = {};
const mediaToStop = ref('');
const mediaStopPending = computed(() => !!mediaToStop.value);
const mediaToDelete = ref('');
const mediaDeletePending = computed(() => !!mediaToDelete.value);

const props = defineProps<{
  list: DynamicMediaObject[];
  media: DynamicMediaObject;
}>();

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

const seekTo = (newSeekTo: null | number) => {
  if (newSeekTo !== null) bc.postMessage({ seekTo: newSeekTo });
};

function zoomIn(elemId: string) {
  try {
    panzooms[elemId]?.zoomIn();
  } catch (error) {
    errorCatcher(error);
  }
}

function zoomOut(elemId: string) {
  try {
    panzooms[elemId]?.zoomOut();
    zoomReset(elemId);
  } catch (error) {
    errorCatcher(error);
  }
}

const zoomReset = (elemId: string, forced = false, animate = true) => {
  if (panzooms[elemId]?.getScale() <= 1.25 || forced)
    panzooms[elemId]?.reset({ animate });
};

function stopMedia() {
  destroyPanzoom(mediaPlayingUniqueId.value);
  mediaPlayingAction.value = 'pause';
  mediaPlayingUrl.value = '';
  mediaPlayingUniqueId.value = '';
  mediaPlayingCurrentPosition.value = 0;
  mediaPlayingAction.value = '';
  mediaToStop.value = '';
}

const destroyPanzoom = (elemId: string) => {
  try {
    if (!panzooms[elemId] || !elemId) return;
    panzooms[elemId].resetStyle();
    panzooms[elemId].reset({ animate: false });
    panzooms[elemId].destroy();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete panzooms[elemId];
  } catch (e) {
    errorCatcher(e);
  }
};

const initiatePanzoom = (elemId: string) => {
  try {
    const elem = document.getElementById(elemId);
    const width = elem?.clientWidth || 0;
    const height = elem?.clientHeight || 0;
    if (!elem) return;
    panzooms[elemId] = Panzoom(elem, {
      animate: true,
      contain: 'outside',
      maxScale: 5,
      minScale: 1,
      panOnlyWhenZoomed: true,
      pinchAndPan: true,
    } as PanzoomOptions);

    elem.addEventListener('dblclick', () => {
      zoomIn(elemId);
    });

    elem.addEventListener('panzoomend', () => {
      zoomReset(elemId);
    });

    elem.addEventListener('wheel', function(e) {
        if (!e.ctrlKey) return;
        panzooms[elemId]?.zoomWithWheel(e);
    });

    elem.addEventListener(
      'panzoomchange',
      (e: HTMLElementEventMap['panzoomchange']) => {
        mediaPlayingPanzoom.value = {
          scale: e.detail.scale,
          x: e.detail.x / (width ?? 1),
          y: e.detail.y / (height ?? 1),
        };
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

onUnmounted(() => {
  Object.keys(panzooms).forEach((key) => {
    destroyPanzoom(key);
  });
});
</script>
