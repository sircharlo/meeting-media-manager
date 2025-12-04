<template>
  <q-item
    v-show="!media.hidden"
    ref="mediaItem"
    :class="{
      'items-center': true,
      'justify-center': true,
      'q-px-sm': child,
      'sortable-selected': props.selected,
    }"
    :data-id="media.uniqueId"
    :style="{
      'padding: 8px 6px': child,
      'flex-direction': 'column',
    }"
    @mouseup.left.passive="(evt: MouseEvent) => emit('click', evt)"
  >
    <div class="row full-width items-center justify-center">
      <div class="col-shrink">
        <div
          class="q-pr-none rounded-borders overflow-hidden relative-position bg-black"
          :style="{ opacity: isFileUrl(media.fileUrl) ? undefined : 0.64 }"
        >
          <template v-if="media.isImage">
            <VueZoomable
              v-if="media.isImage"
              v-model:pan="mediaPan"
              v-model:zoom="mediaZoom"
              :button-pan-step="15"
              :button-zoom-step="0.2"
              :dbl-click-zoom-step="0.2"
              :enable-control-button="false"
              :initial-pan-x="0"
              :initial-pan-y="0"
              :initial-zoom="1"
              :max-zoom="5"
              :min-zoom="1"
              :pan-enabled="false"
              :selector="'#' + randomId"
              style="width: 150px; height: 84px"
              :wheel-zoom-step="0.1"
            >
              <div
                :id="randomId"
                class="media-image-container"
                style="
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                <q-img
                  ref="mediaImage"
                  fit="contain"
                  :ratio="16 / 9"
                  :src="
                    thumbnailFromMetadata ||
                    (media.isImage ? media.fileUrl : media.thumbnailUrl)
                  "
                  width="150px"
                  @error="imageLoadingError"
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
                        !!hoveringMediaItem || customDurationIsSet
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
                </q-img>
              </div>
            </VueZoomable>

            <transition
              appear
              enter-active-class="animated fadeIn"
              leave-active-class="animated fadeOut"
              mode="out-in"
              name="fade"
            >
              <template
                v-if="media.isImage && (hoveringMediaItem || mediaZoom > 1.01)"
              >
                <div>
                  <template v-if="mediaZoom > 1.01">
                    <div class="absolute-top-right q-mr-xs q-mt-xs row">
                      <div class="bg-semi-black row rounded-borders">
                        <q-badge
                          color="transparent"
                          style="padding: 5px !important; cursor: pointer"
                          @mousedown="startPan('up')"
                          @mouseleave="stopPan"
                          @mouseup="stopPan"
                        >
                          <q-icon color="white" name="mmm-up" />
                        </q-badge>
                        <q-separator class="bg-grey-8 q-my-xs" vertical />
                        <q-badge
                          color="transparent"
                          style="padding: 5px !important; cursor: pointer"
                          @mousedown="startPan('down')"
                          @mouseleave="stopPan"
                          @mouseup="stopPan"
                        >
                          <q-icon color="white" name="mmm-down" />
                        </q-badge>
                        <q-separator class="bg-grey-8 q-my-xs" vertical />
                        <q-badge
                          color="transparent"
                          style="padding: 5px !important; cursor: pointer"
                          @mousedown="startPan('left')"
                          @mouseleave="stopPan"
                          @mouseup="stopPan"
                        >
                          <q-icon color="white" name="mmm-left" />
                        </q-badge>
                        <q-separator class="bg-grey-8 q-my-xs" vertical />
                        <q-badge
                          color="transparent"
                          style="padding: 5px !important; cursor: pointer"
                          @mousedown="startPan('right')"
                          @mouseleave="stopPan"
                          @mouseup="stopPan"
                        >
                          <q-icon color="white" name="mmm-right" />
                        </q-badge>
                      </div>
                    </div>
                  </template>
                  <div class="absolute-bottom-right q-mr-xs q-mb-xs row">
                    <template v-if="mediaZoom > 1.01">
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
                        :disabled="!mediaZoom || mediaZoom < 1.01 || undefined"
                        style="padding: 5px !important; cursor: pointer"
                        @mousedown="startZoom('out')"
                        @mouseleave="stopZoom"
                        @mouseup="stopZoom"
                      >
                        <q-icon color="white" name="mmm-minus" />
                      </q-badge>
                      <q-separator class="bg-grey-8 q-my-xs" vertical />
                      <q-badge
                        color="transparent"
                        :disabled="!mediaZoom || mediaZoom > 4.99 || undefined"
                        style="padding: 5px !important; cursor: pointer"
                        @mousedown="startZoom('in')"
                        @mouseleave="stopZoom"
                        @mouseup="stopZoom"
                      >
                        <q-icon color="white" name="mmm-plus" />
                      </q-badge>
                    </div>
                  </div>
                </div>
              </template>
            </transition>
          </template>

          <q-img
            v-else
            ref="mediaImage"
            fit="contain"
            :ratio="16 / 9"
            :src="
              thumbnailFromMetadata ||
              (media.isImage ? media.fileUrl : media.thumbnailUrl)
            "
            width="150px"
            @error="imageLoadingError"
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
                  !!hoveringMediaItem || customDurationIsSet
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
            <BaseDialog
              v-model="mediaDurationPopup"
              :dialog-id="'media-duration-popup-' + props.media.uniqueId"
              persistent
            >
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
            </BaseDialog>
          </q-img>
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
                        ? media.tag.value !== FOOTNOTE_TARGET_PARAGRAPH
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
                  media.tag?.type === 'paragraph' &&
                  media.tag.value === FOOTNOTE_TARGET_PARAGRAPH
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
                  {{ t('this-song-is-duplicated') }}
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
            v-if="
              isCurrentlyPlaying &&
              (media.duration ||
                (imageDuration && media.isImage && isInRepeatedSection))
            "
            class="absolute duration-slider"
          >
            <div class="row flex-center">
              <div
                class="col-shrink text-caption text-accent-400 q-mx-sm text-left"
                style="min-width: 40px"
              >
                {{
                  formatTime(
                    Math.max(mediaElapsed - (mediaCustomDuration.min || 0), 0),
                  )
                }}
              </div>
              <div class="col" style="height: 28px">
                <q-slider
                  v-model="mediaElapsed"
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
                      ? formatTime(mediaElapsed)
                      : t('pause-to-adjust-time')
                  "
                  :max="media.duration || imageDuration"
                  :min="0"
                  :readonly="mediaPlaying.action !== 'pause'"
                  :step="0.1"
                  :thumb-size="
                    mediaPlaying.action === 'pause' ? undefined : '0'
                  "
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
                      (mediaCustomDuration.max ||
                        media.duration ||
                        imageDuration) - mediaElapsed,
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
        <template v-if="!media.markers || media.markers.length <= 1">
          <div class="row items-center q-gutter-xs">
            <!-- Duration dropdown for images in repeated sections -->
            <q-select
              v-if="media.isImage && isInRepeatedSection"
              v-model="imageDuration"
              dense
              :display-value="
                imageDuration < 60
                  ? imageDuration + 's'
                  : imageDuration / 60 + 'm'
              "
              :options="imageDurationOptions"
              outlined
              style="min-width: 80px"
              @update:model-value="updateImageDuration"
            >
              <q-tooltip :delay="1000">
                {{ t('image-duration-explain') }}
              </q-tooltip>
            </q-select>

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
          </div>
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
            :outline="markersPanelOpen"
            push
            rounded
            @click="markersPanelOpen = !markersPanelOpen"
          />
        </template>
      </div>
      <template v-else>
        <div class="col-shrink items-center justify-center flex">
          <q-btn
            v-if="
              isImage(mediaPlaying.url) && obsConnectionState === 'connected'
            "
            :color="currentSceneType === 'media' ? 'negative' : 'primary'"
            icon="mmm-picture-for-zoom-participants"
            rounded
            @click="
              sendObsSceneEvent(
                currentSceneType === 'media' ? 'camera' : 'media',
              )
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
          <template v-if="selectedMediaItems && multipleMediaItemsSelected">
            <q-item-label header>
              {{ t('selected-media-items') }} ({{
                selectedMediaItems?.length || 0
              }})
            </q-item-label>
            <q-item
              v-if="canDeleteSelected"
              v-close-popup
              clickable
              :disable="isCurrentlyPlaying"
              @click="confirmDeleteSelectedMedia()"
            >
              <q-item-section avatar>
                <q-icon color="negative" name="mmm-delete-smart" />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{
                    t('delete-selected-media', selectedMediaItems?.length || 0)
                  }}
                </q-item-label>
                <q-item-label caption>
                  {{ t('delete-selected-media-explain') }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              v-close-popup
              clickable
              :disable="isCurrentlyPlaying"
              @click="
                hideMediaItems(
                  selectedMediaItems,
                  currentCongregation,
                  selectedDateObject,
                )
              "
            >
              <q-item-section avatar>
                <q-icon name="mmm-file-hidden" />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{
                    t('hide-selected-media', selectedMediaItems?.length || 0)
                  }}
                </q-item-label>
                <q-item-label caption>
                  {{ t('hide-selected-media-explain') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template v-else>
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
                    repeat
                      ? t('stop-repeat-media-item')
                      : t('repeat-media-item')
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
          </template>
        </q-list>
      </q-menu>
    </div>
    <div class="row full-width items-center justify-center">
      <q-slide-transition>
        <div
          v-show="markersPanelOpen"
          ref="markersPanel"
          class="q-mt-md full-width"
        >
          <q-list bordered class="q-mb-lg">
            <q-item class="clip" clickable @click="onPlayEntireFileClick()">
              <q-item-section>{{ t('entireFile') }}</q-item-section>
            </q-item>
          </q-list>
          <q-list bordered class="q-mb-lg" separator>
            <q-item
              v-for="marker in media.markers"
              :key="marker.VideoMarkerId"
              :active="
                (startSelectedMarker &&
                  startSelectedMarker.VideoMarkerId === marker.VideoMarkerId) ||
                (endSelectedMarker &&
                  endSelectedMarker.VideoMarkerId === marker.VideoMarkerId)
              "
              :class="{
                'bg-accent-200': playedMarkerIds.has(marker.VideoMarkerId),
                'bg-accent-100':
                  startSelectedMarker &&
                  startSelectedMarker.VideoMarkerId === marker.VideoMarkerId,
                'bg-accent-100-transparent':
                  isBetweenSelectedAndHovered(marker),
                clip: true,
              }"
              clickable
              @click="onMarkerClick(marker)"
              @mouseenter="hoveredMarker = marker"
              @mouseleave="hoveredMarker = null"
            >
              <q-item-section>
                <q-item-label>{{ marker.Label }}</q-item-label>
                <q-item-label caption>
                  {{ getMarkerDuration(marker) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  v-if="
                    hoveredMarker === marker &&
                    (!startSelectedMarker ||
                      (startSelectedMarker &&
                        !endSelectedMarker &&
                        startSelectedMarker.VideoMarkerId ===
                          marker.VideoMarkerId))
                  "
                  color="primary"
                  outline
                  push
                  rounded
                  size="sm"
                  @click.stop="playMarkerOnly(marker)"
                >
                  <q-icon name="mmm-play" />
                  <q-icon name="mmm-numeric-1" />
                  <q-tooltip>{{ t('play-only-this-clip') }}</q-tooltip>
                </q-btn>
              </q-item-section>
              <q-item-section
                v-if="playedMarkerIds.has(marker.VideoMarkerId)"
                side
              >
                <q-icon name="mmm-check" size="xs">
                  <q-tooltip>{{ t('clip-played') }}</q-tooltip>
                </q-icon>
              </q-item-section>
              <q-item-section
                v-if="
                  hoveredMarker !== startSelectedMarker &&
                  hoveredMarker !== endSelectedMarker &&
                  isBetweenSelectedAndHovered(marker)
                "
                side
              >
                <q-icon name="mmm-play" size="xs">
                  <q-tooltip>{{
                    t('all-clips-with-this-icon-will-play')
                  }}</q-tooltip>
                </q-icon>
              </q-item-section>
            </q-item>
          </q-list>
          <q-separator />
        </div>
      </q-slide-transition>
    </div>
  </q-item>

  <BaseDialog
    v-model="mediaEditTagDialog"
    :dialog-id="'media-edit-tag-dialog-' + props.media.uniqueId"
  >
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
        <q-btn
          color="negative"
          flat
          :label="t('dismiss')"
          @click="mediaEditTagDialog = false"
        />
        <q-btn
          color="primary"
          flat
          :label="t('save')"
          @click="
            emit('update:tag', mediaTag);
            mediaEditTagDialog = false;
          "
        />
      </q-card-actions>
    </q-card>
  </BaseDialog>
  <BaseDialog
    v-model="mediaStopPending"
    :dialog-id="'media-stop-pending-' + props.media.uniqueId"
  >
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
  </BaseDialog>
  <BaseDialog
    v-model="mediaDeletePending"
    :dialog-id="'media-delete-pending-' + props.media.uniqueId"
  >
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
  </BaseDialog>
</template>

<script setup lang="ts">
import type { MediaItem, Tag, VideoMarker } from 'src/types';

import {
  onClickOutside,
  useBroadcastChannel,
  useElementHover,
  useEventListener,
  useTimeoutPoll,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { type QBtn, type QImg, QItem, useQuasar } from 'quasar';
import { useMediaSectionRepeat } from 'src/composables/useMediaSectionRepeat';
import { FOOTNOTE_TARGET_PARAGRAPH } from 'src/constants/jw';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getThumbnailUrl } from 'src/helpers/fs';
import { showMediaWindow } from 'src/helpers/mediaPlayback';
import { triggerZoomScreenShare } from 'src/helpers/zoom';
import { isFileUrl } from 'src/utils/fs';
import { throttleWithTrailing, uuid } from 'src/utils/general';
import { isAudio, isImage, isVideo } from 'src/utils/media';
import { sendObsSceneEvent } from 'src/utils/obs';
import { formatTime, timeToSeconds } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { useObsStateStore } from 'stores/obs-state';
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VueZoomable from 'vue-zoomable';

const currentState = useCurrentStateStore();
const {
  currentCongregation,
  currentLangObject,
  currentSettings,
  mediaPlaying,
  mediaWindowVisible,
  selectedDateObject,
} = storeToRefs(currentState);

const currentlySpotlit = computed(
  () =>
    props.selectedMediaItems?.length === 1 &&
    props.selectedMediaItems[0] === props.media.uniqueId,
);

const multipleMediaItemsSelected = computed(() => {
  return (props.selectedMediaItems?.length || 0) >= 2;
});

const deletableSelectedMediaItems = computed(() => {
  if (!props.selectedMediaItems || !selectedDateObject.value) return [];
  const mediaItemsForDay = Object.values(
    selectedDateObject.value.mediaSections,
  ).flatMap((sectionMedia) =>
    sectionMedia.items?.filter((item) => item.source === 'additional'),
  );

  return props.selectedMediaItems
    ?.map((selectedId) =>
      mediaItemsForDay.find((item) => item?.uniqueId === selectedId),
    )
    ?.filter((item) => item && item.source === 'additional')
    .map((item) => item?.uniqueId)
    .filter((id): id is string => !!id);
});

const canDeleteSelected = computed(() => {
  return deletableSelectedMediaItems.value.length >= 1;
});

const jwStore = useJwStore();
const { deleteMediaItems, hideMediaItems, removeFromAdditionMediaMap } =
  jwStore;

const obsState = useObsStateStore();
const { currentSceneType, obsConnectionState } = storeToRefs(obsState);

const mediaDurationPopup = ref(false);
const mediaToStop = ref('');
const mediaStopPending = computed(() => !!mediaToStop.value);
const mediaToDelete = ref('');
const mediaDeletePending = computed(() => !!mediaToDelete.value);

// Section repeat functionality
const {
  getSectionRepeatSettings,
  isSectionRepeating,
  updateSectionRepeatInterval,
} = useMediaSectionRepeat();

// Image duration control for repeated sections
const imageDuration = ref(10); // Default 10 seconds

// Initialize image duration from section settings
const initializeImageDuration = () => {
  if (props.media.originalSection) {
    const sectionSettings = getSectionRepeatSettings(
      props.media.originalSection,
    );
    if (sectionSettings?.repeatInterval) {
      imageDuration.value = sectionSettings.repeatInterval;
    }
  }
};
const imageDurationOptions = [
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '10m', value: 600 },
];

// Check if this media item is in a repeated section
const isInRepeatedSection = computed(() => {
  if (!props.media.originalSection) return false;
  return isSectionRepeating(props.media.originalSection);
});

// Image progress for repeated sections
const imageProgressPercentage = ref(0);
const imageStartTime = ref<null | number>(null);

const props = defineProps<{
  child?: boolean;
  media: MediaItem;
  selected?: boolean;
  selectedMediaItems?: string[];
}>();

const repeat = defineModel<boolean | undefined>('repeat', { required: true });

const emit = defineEmits<{
  (e: 'update:hidden', value: boolean): void;
  (e: 'update:tag', value: Tag): void;
  (e: 'update:customDuration' | 'update:title', value: string): void;
  (e: 'click', value: Event): void;
}>();

const mediaItem = useTemplateRef<QItem>('mediaItem');
const hoveringMediaItem = useElementHover(() => mediaItem.value?.$el, {
  delayEnter: 300,
  delayLeave: 0,
});

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

const markersPanelOpen = ref(false);
const startSelectedMarker = ref<null | VideoMarker>(null);
const endSelectedMarker = ref<null | VideoMarker>(null);
const skipCustomDurationUpdateOnce = ref(false);
const hoveredMarker = ref<null | VideoMarker>(null);
const playedMarkerIds = ref<Set<number>>(new Set());
const markersPanel = ref<HTMLElement | null>(null);

const setMediaPlaying = async (
  media: MediaItem,
  signLanguage = false,
  marker?: VideoMarker,
) => {
  if (!mediaPlaying.value.url) {
    // Start Zoom screen sharing when media starts playing and no media was playing before
    triggerZoomScreenShare(true);
  } else if (isImage(mediaPlaying.value.url)) {
    stopMedia(true);
  }
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
      if (!skipCustomDurationUpdateOnce.value) {
        updateMediaCustomDuration();
      }
    }
  }
  skipCustomDurationUpdateOnce.value = false;
  localFile.value = fileIsLocal();
  mediaPlaying.value = {
    action:
      isImage(props.media.fileUrl) ||
      !currentSettings.value?.beginPlaybackPaused
        ? 'play'
        : 'pause',
    currentPosition: 0,
    pan: calculatedPan.value,
    seekTo: 0,
    subtitlesUrl: media.subtitlesUrl ?? '',
    uniqueId: media.uniqueId,
    url: localFile.value
      ? (media.fileUrl ?? '')
      : (media.streamUrl ?? media.fileUrl ?? ''),
    zoom: mediaZoom.value,
  };

  nextTick(() => {
    window.dispatchEvent(new CustomEvent('scrollToSelectedMedia'));
  });
};

const getMarkerTimes = (m: VideoMarker) => {
  const max =
    (m.StartTimeTicks + m.DurationTicks - m.EndTransitionDurationTicks) /
    10000 /
    1000;
  const min = m.StartTimeTicks / 10000 / 1000;
  return { max, min };
};

const setRangeAndPlay = (min: number, max: number) => {
  updateMediaCustomDuration({ max, min });
  skipCustomDurationUpdateOnce.value = true;
  setMediaPlaying(props.media, true);
  // mark all markers in this range as played
  if (props.media.markers && props.media.markers.length) {
    props.media.markers.forEach((m) => {
      const { max: mMax, min: mMin } = getMarkerTimes(m);
      if (mMin >= min && mMax <= max) {
        playedMarkerIds.value.add(m.VideoMarkerId);
      }
    });
  }
  startSelectedMarker.value = null;
  endSelectedMarker.value = null;
};

const playMarkerOnly = (marker: VideoMarker) => {
  const playMarker = () => {
    const { max, min } = getMarkerTimes(marker);
    setRangeAndPlay(min, max);
    playedMarkerIds.value.add(marker.VideoMarkerId);
  };
  if (!playedMarkerIds.value.has(marker.VideoMarkerId)) {
    playMarker();
    return;
  }
  $q.dialog({
    cancel: { label: t('cancel') },
    message: t('play-only-this-clip-question'),
    ok: { label: t('confirm') },
    persistent: true,
    title: t('confirm'),
  }).onOk(() => {
    playMarker();
  });
};

const onPlayEntireFileClick = () => {
  $q.dialog({
    cancel: { label: t('cancel') },
    message: t('entireFile-question'),
    ok: { label: t('play-entire-file') },
    persistent: true,
    title: t('confirm'),
  }).onOk(() => {
    setMediaPlaying(props.media, true);
  });
};

const getMarkerDuration = (marker: VideoMarker) => {
  try {
    const { max, min } = getMarkerTimes(marker);
    return formatTime(max - min);
  } catch (error) {
    errorCatcher(error);
    return '';
  }
};

const onMarkerClick = (marker: VideoMarker) => {
  if (!startSelectedMarker.value) {
    startSelectedMarker.value = marker;
    endSelectedMarker.value = null;
    return;
  }
  if (!endSelectedMarker.value) {
    if (startSelectedMarker.value.VideoMarkerId === marker.VideoMarkerId) {
      playMarkerOnly(marker);
      return;
    }
    const aStart = startSelectedMarker.value.StartTimeTicks;
    const bStart = marker.StartTimeTicks;
    const first = aStart <= bStart ? startSelectedMarker.value : marker;
    const last = aStart <= bStart ? marker : startSelectedMarker.value;
    const firstTimes = getMarkerTimes(first);
    const lastTimes = getMarkerTimes(last);
    endSelectedMarker.value = last;
    setRangeAndPlay(firstTimes.min, lastTimes.max);
    return;
  }
  startSelectedMarker.value = marker;
  endSelectedMarker.value = null;
};

const isBetweenSelectedAndHovered = (marker: VideoMarker) => {
  if (!startSelectedMarker.value || !hoveredMarker.value) return false;
  const a = startSelectedMarker.value.StartTimeTicks;
  const b = hoveredMarker.value.StartTimeTicks;
  const m = marker.StartTimeTicks;
  return (m >= Math.min(a, b) && m <= Math.max(a, b)) as boolean;
};

// Cancel selection on click outside the markers panel
onClickOutside(markersPanel, () => {
  if (
    markersPanelOpen.value &&
    startSelectedMarker.value &&
    !endSelectedMarker.value
  ) {
    startSelectedMarker.value = null;
    endSelectedMarker.value = null;
  }
});

// Cancel selection on Escape
useEventListener(
  window,
  'keydown',
  (e: KeyboardEvent) => {
    if (
      e.key === 'Escape' &&
      markersPanelOpen.value &&
      startSelectedMarker.value
    ) {
      startSelectedMarker.value = null;
      endSelectedMarker.value = null;
    }
  },
  { passive: true },
);

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
    // Push current repeat state when requested (only if this media is currently playing)
    if (mediaPlaying.value.uniqueId === props.media.uniqueId) {
      postRepeat(!!repeat.value);
    }
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
    if (!mediaWindowVisible.value) {
      showMediaWindow(true);
    }
  }
};

const zoomReset = (forced = false) => {
  if (mediaZoom.value < 1.05 || forced) {
    // Reset zoom and pan to initial state
    mediaZoom.value = 1;
    mediaPan.value = { x: 0, y: 0 };
  }
};

function stopMedia(forOtherMediaItem = false) {
  mediaPlaying.value = {
    action: '',
    currentPosition: 0,
    pan: { x: 0, y: 0 },
    seekTo: 0,
    subtitlesUrl: '',
    uniqueId: '',
    url: '',
    zoom: 1,
  };
  mediaToStop.value = '';
  localFile.value = fileIsLocal();

  if (!forOtherMediaItem) {
    // Stop Zoom screen sharing when media is stopped (unless it's a media switch instead of a stop)
    triggerZoomScreenShare(false);
    zoomReset(true);
    nextTick(() => {
      window.dispatchEvent(new CustomEvent<undefined>('shortcutMediaNext'));
    });
  }
}

const isCurrentlyPlaying = computed(() => {
  return (
    (mediaPlaying.value.url === props.media.fileUrl ||
      mediaPlaying.value.url === props.media.streamUrl) &&
    mediaPlaying.value.uniqueId === props.media.uniqueId
  );
});

const mediaPan = ref<{ x: number; y: number }>({
  x: 0,
  y: 0,
});
const mediaZoom = ref(1);

const panTimeout = ref<NodeJS.Timeout | null>(null);
const panAnimationFrame = ref<null | number>(null);
const zoomTimeout = ref<NodeJS.Timeout | null>(null);
const zoomAnimationFrame = ref<null | number>(null);

const panStep = 1.5;

const pan = (direction: 'down' | 'left' | 'right' | 'up', step = panStep) => {
  // Calculate new pan values
  let newX = mediaPan.value.x || 0;
  let newY = mediaPan.value.y || 0;

  if (direction === 'up') newY += step;
  if (direction === 'down') newY -= step;
  if (direction === 'left') newX += step;
  if (direction === 'right') newX -= step;

  // Calculate maximum pan distance based on zoom level and image dimensions
  // At zoom level 1, no panning is allowed
  // At higher zoom levels, the max pan is half the difference between zoomed and original size
  const zoom = mediaZoom.value;
  const imageWidth = mediaImage.value?.$el?.clientWidth ?? 0;
  const imageHeight = mediaImage.value?.$el?.clientHeight ?? 0;

  if (zoom > 1 && imageWidth > 0 && imageHeight > 0) {
    // Maximum pan = (zoomed_size - viewport_size) / 2
    // Since zoomed_size = viewport_size * zoom, this becomes:
    // max_pan = viewport_size * (zoom - 1) / 2
    const maxPanX = (imageWidth * (zoom - 1)) / 2;
    const maxPanY = (imageHeight * (zoom - 1)) / 2;

    // Clamp pan values to prevent going past the edge
    mediaPan.value.x = Math.max(-maxPanX, Math.min(maxPanX, newX));
    mediaPan.value.y = Math.max(-maxPanY, Math.min(maxPanY, newY));
  } else {
    // No zoom or invalid dimensions - no panning allowed
    mediaPan.value.x = 0;
    mediaPan.value.y = 0;
  }
};

const startPan = (direction: 'down' | 'left' | 'right' | 'up') => {
  stopPan();
  pan(direction, 5); // Initial big step

  panTimeout.value = setTimeout(() => {
    let currentStep = panStep;
    const minStep = 0.5;
    const decay = 1; // 0.95;

    const animate = () => {
      pan(direction, currentStep);
      if (currentStep > minStep) {
        currentStep *= decay;
      }
      panAnimationFrame.value = requestAnimationFrame(animate);
    };
    animate();
  }, 500);
};

const stopPan = () => {
  if (panTimeout.value) {
    clearTimeout(panTimeout.value);
    panTimeout.value = null;
  }
  if (panAnimationFrame.value) {
    cancelAnimationFrame(panAnimationFrame.value);
    panAnimationFrame.value = null;
  }
};

const zoom = (type: 'in' | 'out', factor = 1.1) => {
  if (type === 'in' && mediaZoom.value < 4.99) {
    mediaZoom.value = Math.min(mediaZoom.value * factor, 5);
  }
  if (type === 'out' && mediaZoom.value > 1.01) {
    mediaZoom.value = Math.max(mediaZoom.value / factor, 1);
  }
};

const startZoom = (type: 'in' | 'out') => {
  stopZoom();
  zoom(type, 1.2); // Initial big step

  zoomTimeout.value = setTimeout(() => {
    let currentFactor = 1.02;
    const minFactor = 1.002;
    const decay = 1; //0.95;

    const animate = () => {
      zoom(type, currentFactor);
      if (currentFactor > minFactor) {
        currentFactor = 1 + (currentFactor - 1) * decay;
      }
      zoomAnimationFrame.value = requestAnimationFrame(animate);
    };
    animate();
  }, 500);
};

const stopZoom = () => {
  if (zoomTimeout.value) {
    clearTimeout(zoomTimeout.value);
    zoomTimeout.value = null;
  }
  if (zoomAnimationFrame.value) {
    cancelAnimationFrame(zoomAnimationFrame.value);
    zoomAnimationFrame.value = null;
  }
};

const calculatedPan = computed(() => {
  return {
    x:
      ((mediaPan.value.x ?? 0) / (mediaImage.value?.$el?.clientWidth ?? 0)) *
      (1 / (mediaZoom.value ?? 1)),
    y:
      ((mediaPan.value.y ?? 0) / (mediaImage.value?.$el?.clientHeight ?? 0)) *
      (1 / (mediaZoom.value ?? 1)),
  };
});

const updateZoomPan = throttleWithTrailing(
  (values: [number, number, number]) => {
    const [newZoom] = values;
    mediaPlaying.value.zoom = newZoom ?? 1;
    mediaPlaying.value.pan = calculatedPan.value;
  },
  300,
);

watch(
  () => [mediaZoom.value, mediaPan.value.x, mediaPan.value.y],
  (newValues) => {
    updateZoomPan(newValues as [number, number, number]);
  },
);

const mediaImage = useTemplateRef<QImg>('mediaImage');
const randomId = ref('mediaImage-' + uuid());

function deleteMedia() {
  if (!mediaToDelete.value) return;
  removeFromAdditionMediaMap(
    mediaToDelete.value,
    currentCongregation.value,
    selectedDateObject.value,
  );
  mediaToDelete.value = '';
}

const confirmDeleteSelectedMedia = () => {
  $q.dialog({
    cancel: { label: t('cancel') },
    message: t('delete-selected-media-confirmation', {
      count: deletableSelectedMediaItems.value?.length || 0,
    }),
    ok: { color: 'negative', label: t('delete') },
    persistent: true,
    title: t('confirm'),
  }).onOk(() => {
    deleteMediaItems(
      deletableSelectedMediaItems.value,
      currentCongregation.value,
      selectedDateObject.value,
    );
  });
};

onMounted(() => {
  initializeImageDuration();
});

const playButton = useTemplateRef<QBtn>('playButton');
const pauseResumeButton = useTemplateRef<QBtn>('pauseResumeButton');
const stopButton = useTemplateRef<QBtn>('stopButton');

useEventListener(
  window,
  'shortcutMediaPauseResume',
  () => {
    if (pauseResumeButton.value) {
      pauseResumeButton.value.click();
    } else if (isImage(props.media.fileUrl) && stopButton.value) {
      stopButton.value.click();
    } else if (currentlySpotlit.value && playButton.value) {
      playButton.value.click();
    }
  },
  { passive: true },
);
useEventListener(
  window,
  'shortcutMediaStop',
  () => {
    if (stopButton.value && currentlySpotlit.value) stopButton.value.click();
  },
  { passive: true },
);

window.addEventListener('scrollToSelectedMedia', () => {
  if (
    props.selected &&
    mediaItem.value?.$el &&
    !currentLangObject.value?.isSignLanguage
  ) {
    mediaItem.value.$el.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
});

const currentSongIsDuplicated = computed(() => {
  const currentSong = props.media.tag?.value?.toString();
  if (!currentSong) return false;

  const songNumbers: MediaItem[] = [];
  if (selectedDateObject.value?.mediaSections) {
    Object.values(selectedDateObject.value.mediaSections).forEach(
      (sectionMedia) => {
        sectionMedia.items?.forEach((m) => {
          if (
            !m.hidden &&
            m.tag?.type === 'song' &&
            m.tag?.value?.toString() === currentSong
          ) {
            songNumbers.push(m);
          }
        });
      },
    );
  }

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

// Image duration control functions
// const formatImageDuration = (seconds: number): string => {
//   if (seconds < 60) {
//     return `${seconds}s`;
//   } else if (seconds < 3600) {
//     const minutes = Math.floor(seconds / 60);
//     return `${minutes}m`;
//   } else {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     return `${hours}h${minutes}m`;
//   }
// };

const updateImageDuration = (newDuration: { label: string; value: number }) => {
  console.log(newDuration);
  imageDuration.value = newDuration.value;
  // Update the section's repeat interval
  if (props.media.originalSection) {
    updateSectionRepeatInterval(props.media.originalSection, newDuration.value);
  }
};

// Broadcast channel for posting last end timestamp (for images)
const { post: postLastEndTimestamp } = useBroadcastChannel<number, number>({
  name: 'last-end-timestamp',
});

// Watch for image playing in repeated sections to update progress
watch(
  () => [isCurrentlyPlaying.value, isInRepeatedSection.value],
  ([isPlaying, inRepeatedSection]) => {
    if (isPlaying && inRepeatedSection && props.media.isImage) {
      // Start progress tracking
      imageStartTime.value = Date.now();
      imageProgressPercentage.value = 0;

      const updateProgress = () => {
        if (!imageStartTime.value || !isCurrentlyPlaying.value) {
          console.debug(
            '[MediaItem.vue] Stopping updateProgress: imageStartTime or isCurrentlyPlaying falsy',
          );
          return;
        }

        const elapsed = (Date.now() - imageStartTime.value) / 1000;
        const percentage = Math.min((elapsed / imageDuration.value) * 100, 100);
        imageProgressPercentage.value = percentage;

        if (percentage < 100) {
          requestAnimationFrame(updateProgress);
        } else {
          postLastEndTimestamp(Date.now());
          console.debug('[MediaItem.vue] Image progress reached 100%');
        }
      };

      requestAnimationFrame(updateProgress);
    } else {
      // Reset progress
      imageStartTime.value = null;
      imageProgressPercentage.value = 0;
    }
  },
  { immediate: true },
);

const imageElapsed = ref(0);

// Update elapsed time for images
watch(
  () => [isCurrentlyPlaying.value, imageStartTime.value],
  ([isPlaying, startTime]) => {
    if (props.media.isImage && isPlaying && startTime) {
      const updateElapsed = () => {
        if (isCurrentlyPlaying.value && imageStartTime.value) {
          imageElapsed.value = (Date.now() - imageStartTime.value) / 1000;
          requestAnimationFrame(updateElapsed);
        }
      };
      updateElapsed();
    }
  },
  { immediate: true },
);

const mediaElapsed = computed(
  () => mediaPlaying.value.currentPosition || imageElapsed.value || 0,
);
</script>
