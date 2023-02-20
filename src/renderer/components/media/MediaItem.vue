<!-- eslint-disable vue/no-v-html -->
<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<!-- Media item in presentation mode -->
<template>
  <div>
    <v-list-item
      :id="id"
      link
      three-line
      :class="{
        'media-played': played,
        'current-media-item': current,
      }"
    >
      <div v-if="isImage" class="lightBg">
        <img
          :id="id + '-preview'"
          :src="url"
          style="
            width: 142px;
            height: 80px;
            aspect-ratio: 16 / 9;
            object-fit: contain;
            vertical-align: middle;
          "
          @click="zoomByClick"
          @wheel.prevent="zoom"
        />
      </div>

      <media-video
        v-else
        :src="!!streamingFile && streamDownloaded ? localStreamPath : src"
        :playing="active"
        :cc-enable="ccEnable"
        :stream="!!streamingFile && !streamDownloaded"
        :temp-clipped="tempClipped"
        @clipped="setTime($event)"
        @reset-clipped="tempClipped = null"
        @progress="progress = $event"
      />
      <v-list-item-content class="mx-3">
        <v-list-item-subtitle class="media-title">
          <runtime-template-compiler :template="title" :parent="parent" />
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action class="align-self-center d-flex flex-row">
        <template v-if="active">
          <icon-btn
            v-if="isVideo || (scene && !zoomPart)"
            variant="pause"
            :toggled="paused"
            :is-video="isVideo"
            :disabled="isVideo && !videoStarted"
            tooltip="top"
            @click="togglePaused()"
          />
          <div class="ml-2">
            <icon-btn
              variant="stop"
              tooltip="top"
              :click-twice="isVideo"
              @click="stop()"
            />
          </div>
        </template>
        <icon-btn
          v-else
          class="ml-2"
          variant="play"
          :disabled="videoActive"
          @click="play()"
        />
        <v-btn
          v-if="sortable"
          color="info"
          class="sort-btn ml-2"
          aria-label="Sort items"
        >
          <font-awesome-icon :icon="faSort" />
        </v-btn>
      </v-list-item-action>
      <template v-if="!isImage">
        <v-slider
          v-if="active && paused"
          v-model="newProgress"
          color="primary"
          dense
          aria-label="Video scrubber"
          hide-details="auto"
          step="any"
          :min="clippedStart"
          :max="100 - clippedEnd"
          class="video-scrubber"
          :style="`left: ${clippedStart}%; right: ${clippedEnd}%; width: ${
            100 - clippedStart - clippedEnd
          }%`"
        />
        <v-progress-linear
          v-else
          :value="progress"
          absolute
          bottom
          aria-label="Video progress"
          color="primary"
          :background-opacity="0"
        />
        <v-progress-linear
          v-if="clippedStart > 0"
          :value="clippedStart"
          absolute
          bottom
          aria-label="Video clipped start"
          color="rgb(231, 76, 60)"
          :background-opacity="0"
        />
        <v-progress-linear
          v-if="clippedEnd > 0"
          :value="clippedEnd"
          absolute
          bottom
          aria-label="Video clipped end"
          color="rgb(231, 76, 60)"
          reverse
          :background-opacity="0"
        />
      </template>
    </v-list-item>
    <div class="mx-4">
      <v-btn
        v-for="marker in markers"
        :key="id + marker.label"
        class="mr-2 mb-2"
        :color="
          marker.playing ? 'primary' : marker.played ? 'info darken-2' : 'info'
        "
        @click="play(marker)"
      >
        {{ marker.label }}
      </v-btn>
    </div>
  </div>
</template>
<script lang="ts">
import { pathToFileURL } from 'url'
// eslint-disable-next-line import/named
import { existsSync, readFileSync } from 'fs-extra'
import { basename, changeExt, join } from 'upath'
import { ipcRenderer } from 'electron'
import { defineComponent, PropType } from 'vue'
import Panzoom, { PanzoomObject } from '@panzoom/panzoom'
// @ts-ignore: RuntimeTemplateCompiler implicitly has an 'any' type
import { RuntimeTemplateCompiler } from 'vue-runtime-template-compiler'
import {
  faMusic,
  faParagraph,
  faSort,
  faDownload,
} from '@fortawesome/free-solid-svg-icons'
import { Marker, VideoFile } from '~/types'
import { MS_IN_SEC } from '~/constants/general'
export default defineComponent({
  components: {
    RuntimeTemplateCompiler,
  },
  props: {
    src: {
      type: String,
      required: true,
    },
    playNow: {
      type: Boolean,
      default: false,
    },
    stopNow: {
      type: Boolean,
      default: false,
    },
    deactivate: {
      type: Boolean,
      default: false,
    },
    showPrefix: {
      type: Boolean,
      default: false,
    },
    sortable: {
      type: Boolean,
      default: false,
    },
    ccEnable: {
      type: Boolean,
      default: true,
    },
    mediaActive: {
      type: Boolean,
      default: false,
    },
    videoActive: {
      type: Boolean,
      default: false,
    },
    streamingFile: {
      type: Object as PropType<VideoFile>,
      default: null,
    },
    zoomPart: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      scale: 1,
      downloading: false,
      streamDownloaded: false,
      clickedOnce: false,
      panzoom: null as null | PanzoomObject,
      current: false,
      active: false as boolean,
      played: false,
      video: null as {
        original: { start: number; end: number }
        clipped: { start: number; end: number }
      } | null,
      paused: false as boolean,
      progress: 0,
      newProgress: 0,
      videoStarted: false,
      stopClicked: false as boolean,
      start: undefined as string | undefined,
      end: undefined as string | undefined,
      parent: this,
      markers: [] as Marker[],
      tempClipped: null as { start?: string; end?: string } | null,
    }
  },
  computed: {
    id(): string {
      return this.$strip('mediaitem-' + basename(this.src as string))
    },
    url(): string {
      return pathToFileURL(this.src).href
    },
    mediaVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
    faParagraph() {
      return faParagraph
    },
    faMusic() {
      return faMusic
    },
    faDownload() {
      return faDownload
    },
    faSort() {
      return faSort
    },
    localStreamPath(): string {
      if (!this.streamingFile) return ''
      return join(
        this.$pubPath(this.streamingFile),
        basename(this.streamingFile.url)
      )
    },
    scene(): string {
      return this.$store.state.obs.currentScene as string
    },
    zoomScene(): string | null {
      return this.$getPrefs('app.obs.zoomScene') as string | null
    },
    clippedStart(): number {
      if (!this.video) return 0
      return (this.video.clipped.start * 100) / this.video.original.end
    },
    clippedEnd(): number {
      if (!this.video) return 0
      return 100 - (this.video.clipped.end * 100) / this.video.original.end
    },
    isVideo(): boolean {
      return !this.isImage && !this.end?.startsWith('00:00:00')
    },
    isImage(): boolean {
      return this.$isImage(this.src)
    },
    title(): string {
      const filenameArray = (
        this.streamingFile?.safeName ?? basename(this.src)
      ).split(
        new RegExp(
          `^((?:\\d{1,2}-?){0,2})[ -]*(${this.$translate(
            'song'
          )} (\\d+)[ -]*){0,1}(${this.$translate(
            'paragraph'
          )} (\\d+)[ -]*){0,1}(.*)(\\.[0-9a-z]+$)`
        )
      )
      return `<div class="d-flex align-center">
          <span class='sort-prefix text-nowrap' style='display: none;'>${
            filenameArray[1]
          }</span>
          ${
            filenameArray[3]
              ? `<div class='mr-3' style='flex: 0 0 62px;' title='${this.$translate(
                  'song'
                )} ${filenameArray[3].replace(/'/g, '&#39;')}'>
              <span class='song v-btn pa-1'>
              <font-awesome-icon :icon='faMusic' size='sm' pull='left'/>
              ${filenameArray[3]}
              </span></div>`
              : ''
          }
          ${
            filenameArray[5]
              ? `<div class='mr-3' style='flex: 0 0 62px;' title='${this.$translate(
                  'paragraph'
                )} ${filenameArray[5].replace(/'/g, '&#39;')}'>
              <span class='paragraph v-btn pa-1'>
              <font-awesome-icon :icon='faParagraph' size='sm' pull='left'/>
              ${filenameArray[5]}
              </span></div>`
              : ''
          }
          <div class='clamp-lines' title='${(
            filenameArray[6] + filenameArray[7]
          ).replace(/'/g, '&#39;')}'>${
        filenameArray[6]
      }<span class="grey--text">${filenameArray[7]}</span></div>
        </div>`
    },
  },
  watch: {
    newProgress() {
      if (this.paused) {
        this.scrubVideo()
      }
    },
    progress(val: number) {
      if (this.active && val > 0) {
        this.videoStarted = true
      }
    },
    async playNow(val: boolean) {
      if (val) {
        this.current = true
        await this.play()
      }
    },
    stopNow(val: boolean) {
      if (val) {
        this.stop()
      }
    },
    deactivate(val: boolean) {
      if (val) {
        this.active = false
        this.current = false
        this.$emit('deactivated')
      }
    },
    mediaActive(val: boolean) {
      if (val && !this.active) {
        this.current = false
      } else if (!val) {
        this.active = false
      }
    },
    active(val: boolean) {
      if (this.panzoom) this.resetZoom()
      const imgPreview = document.querySelector(
        `#${this.id}-preview`
      ) as HTMLElement

      if (imgPreview) {
        imgPreview.style.cursor = val ? 'zoom-in' : 'default'
      }

      if (val) {
        this.current = true
        ipcRenderer.on('videoEnd', () => {
          this.active = false
        })
        ipcRenderer.on('resetZoom', () => {
          this.resetZoom()
        })
      } else {
        this.markers.forEach((m) => {
          m.playing = false
        })
        this.progress = 0
        this.newProgress = 0
        this.videoStarted = false
        this.paused = false

        ipcRenderer.removeAllListeners('videoEnd')
        ipcRenderer.removeAllListeners('resetZoom')
      }
    },
    showPrefix(val: boolean) {
      const prefix = document.querySelector(
        `#${this.id} .sort-prefix`
      ) as HTMLSpanElement
      if (prefix) {
        if (val) {
          prefix.style.display = 'inline'
        } else {
          prefix.style.display = 'none'
        }
      }
    },
  },
  mounted() {
    this.getMarkers()
    if (this.streamingFile) {
      this.streamDownloaded = existsSync(this.localStreamPath)
      if (!this.streamDownloaded) {
        this.downloadSong()
      }
    }

    if (this.isImage) {
      this.panzoom = Panzoom(
        document.querySelector(`#${this.id}-preview`) as HTMLElement,
        {
          animate: true,
          canvas: true,
          contain: 'outside',
          cursor: 'default',
          panOnlyWhenZoomed: true,
          setTransform: (
            el: HTMLElement,
            { scale, x, y }: { scale: number; x: number; y: number }
          ) => {
            this.pan({
              x: x / el.clientWidth,
              y: y / el.clientHeight,
            })
            if (this.panzoom) {
              this.panzoom.setStyle(
                'transform',
                `scale(${scale}) translate(${scale === 1 ? 0 : x}px, ${
                  scale === 1 ? 0 : y
                }px)`
              )
            }
          },
        }
      )
      this.resetZoom()
    }
  },
  methods: {
    async downloadSong() {
      if (!this.streamingFile) return
      this.downloading = true
      await this.$downloadIfRequired(this.streamingFile)
      this.downloading = false
      this.streamDownloaded = existsSync(this.localStreamPath)
    },
    pan({ x, y }: { x: number; y: number }) {
      ipcRenderer.send('pan', { x, y })
    },
    zoom(e: WheelEvent) {
      if (this.active) {
        ipcRenderer.send('zoom', e.deltaY)
        this.zoomPreview(e.deltaY)
      }
    },
    resetZoom() {
      if (this.panzoom) {
        this.scale = 1
        this.panzoom.zoom(1)
      }
    },
    zoomByClick() {
      if (!this.panzoom || !this.active) return
      if (!this.clickedOnce) {
        this.clickedOnce = true
        setTimeout(() => {
          this.clickedOnce = false
        }, 1 * MS_IN_SEC)
        return
      } else {
        this.clickedOnce = false
      }

      let deltaY = 1000
      if (this.scale < 4) {
        // eslint-disable-next-line no-magic-numbers
        deltaY = (-1.5 * this.scale + this.scale) * 100
      }

      ipcRenderer.send('zoom', deltaY)
      this.zoomPreview(deltaY)
    },
    zoomPreview(deltaY: number) {
      if (this.panzoom) {
        this.scale += (-1 * deltaY) / 100

        // Restrict scale
        // eslint-disable-next-line no-magic-numbers
        this.scale = Math.min(Math.max(0.125, this.scale), 4)
        if (this.scale > 1) {
          this.panzoom.zoom(this.scale)
        } else {
          this.resetZoom()
        }
      }
    },
    async play(marker?: Marker) {
      if (!this.mediaVisible) {
        ipcRenderer.send('toggleMediaWindowFocus')
      }

      // If it's a marker, set custom start and end times
      if (marker) {
        marker.played = true
        marker.playing = true
        this.tempClipped = {
          start: marker.customStartTime,
          end: marker.customEndTime,
        }
      }
      this.$emit('playing')
      this.active = true
      this.played = true

      // Set OBS scene
      if (this.scene) {
        const mediaScene = this.$getPrefs('app.obs.mediaScene') as string
        if (mediaScene) {
          await this.$setScene(mediaScene)
        } else {
          this.$warn('errorObsMediaScene')
        }
      }

      // Show media
      ipcRenderer.send('showMedia', {
        src:
          !!this.streamingFile && this.streamDownloaded
            ? this.localStreamPath
            : this.src,
        stream: !!this.streamingFile && !this.streamDownloaded,
        start: marker ? marker.customStartTime : this.start,
        end: marker ? marker.customEndTime : this.end,
      })
    },
    async togglePaused() {
      if (this.scene) {
        if (this.paused) {
          const mediaScene = this.$getPrefs('app.obs.mediaScene') as string
          if (mediaScene) {
            await this.$setScene(mediaScene)
          } else {
            this.$warn('errorObsMediaScene')
          }
        } else {
          await this.$setScene(
            this.zoomPart ? this.zoomScene ?? this.scene : this.scene
          )
        }
      }
      if (this.isVideo) {
        this.newProgress = this.progress
        ipcRenderer.send(this.paused ? 'playVideo' : 'pauseVideo')
      }
      this.paused = !this.paused
    },
    stop() {
      this.active = false
      if (this.isImage) {
        ipcRenderer.send('showMedia', null)
      } else {
        ipcRenderer.send('hideMedia')
      }
    },
    getMarkers() {
      if (!this.isImage && existsSync(changeExt(this.src, '.json'))) {
        const markers = JSON.parse(
          readFileSync(changeExt(this.src, '.json'), 'utf8')
        ) as Marker[]

        // For each marker, calculate the custom start and end time
        markers.forEach((marker) => {
          marker.playing = false
          const startTime = this.$dayjs(marker.startTime, 'HH:mm:ss.SSS')
          const duration = this.$dayjs(marker.duration, 'HH:mm:ss.SSS')
          const transition = this.$dayjs(
            marker.endTransitionDuration,
            'HH:mm:ss.SSS'
          )

          marker.customStartTime = this.$dayjs
            .duration({
              hours: +startTime.format('H'),
              minutes: +startTime.format('m'),
              seconds: +startTime.format('s'),
              milliseconds: +startTime.format('SSS'),
            })
            .format('HH:mm:ss.SSS')

          marker.customEndTime = startTime
            .add(
              this.$dayjs.duration({
                hours: +duration.format('H'),
                minutes: +duration.format('m'),
                seconds: +duration.format('s'),
                milliseconds: +duration.format('SSS'),
              })
            )
            .subtract(
              this.$dayjs.duration({
                hours: +transition.format('H'),
                minutes: +transition.format('m'),
                seconds: +transition.format('s'),
                milliseconds: +transition.format('SSS'),
              })
            )
            .format('HH:mm:ss.SSS')
        })
        this.markers = markers
      }
    },
    scrubVideo() {
      ipcRenderer.send('videoScrub', this.newProgress)
    },
    setTime({
      original,
      clipped,
      formatted,
    }: {
      original: { start: number; end: number }
      clipped: { start: number; end: number }
      formatted: { start: string; end: string }
    }) {
      this.start = formatted.start
      this.end = formatted.end
      this.video = { original, clipped }
    },
  },
})
</script>
<style lang="scss">
.media-title {
  font-size: 1rem !important;
}

.lightBg {
  background: lightgray;
}

.v-list-item {
  border-left: 8px solid transparent;
  &:hover {
    cursor: default;
  }
  transition: border-left 0.5s;
}

.media-played {
  border-left: 8px solid rgba(55, 90, 127, 0.75) !important;
}

.current-media-item {
  border-left: 8px solid orange !important;
}

.v-progress-linear:not([aria-valuenow="0"]) div {
  transition: width 0.5s linear;
}

.video-scrubber {
  position: absolute;
  bottom: 0;
  margin-bottom: -14px;

  .v-slider {
    margin: 0;

    .v-slider__track-container {
      height: 4px !important;
    }
  }
}

.song,
.paragraph {
  border: 1px solid transparent;
}

.clamp-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.theme--light {
  .media-title {
    color: rgba(0, 0, 0, 0.87) !important;
  }

  .song,
  .paragraph {
    letter-spacing: 0px;
    width: 60px;
  }

  .song {
    color: #055160;
    background-color: #cff4fc;
    border-color: #b6effb;
  }

  .paragraph {
    color: #41464b;
    background-color: #e2e3e5;
    border-color: #d3d6d8;
  }
}

.theme--dark {
  .media-title {
    color: #ffffff !important;
  }

  .song {
    color: #5dbecd;
    background-color: #0c515c;
    border-color: #0e616e;
  }

  .paragraph {
    color: #c1c1c1;
    background-color: #313131;
    border-color: #3b3b3b;
  }
}
</style>
