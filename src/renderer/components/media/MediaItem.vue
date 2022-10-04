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
      <v-img
        v-if="isImage"
        :src="url"
        contain
        max-width="144"
        max-height="80"
      />
      <media-video
        v-else
        :src="src"
        :playing="active"
        :temp-clipped="tempClipped"
        @clipped="setTime($event)"
        @reset-clipped="tempClipped = null"
        @progress="progress = $event"
      />
      <v-list-item-content class="ml-2">
        <v-list-item-subtitle class="media-title">
          <runtime-template-compiler :template="title" :parent="parent" />
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action class="align-self-center d-flex flex-row">
        <template v-if="active">
          <icon-btn
            v-if="!isImage && !end.startsWith('00:00:00')"
            variant="pause"
            class="mr-2"
            :toggled="paused"
            @click="togglePaused()"
          />
          <icon-btn
            variant="stop"
            tooltip="top"
            :click-twice="!isImage && !end.startsWith('00:00:00')"
            @click="stop()"
          />
        </template>
        <icon-btn
          v-else
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
          :min="clippedStart"
          :max="100 - clippedEnd"
          class="video-scrubber"
          :style="`left: ${clippedStart}%; right: ${clippedEnd}%; width: ${
            100 - clippedStart - clippedEnd
          }%`"
        />
        <v-progress-linear
          v-else
          v-model="progress"
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
import { basename, changeExt } from 'upath'
import { ipcRenderer } from 'electron'
import Vue from 'vue'
// @ts-ignore
import { RuntimeTemplateCompiler } from 'vue-runtime-template-compiler'
import { faMusic, faParagraph, faSort } from '@fortawesome/free-solid-svg-icons'
// eslint-disable-next-line import/named
import { existsSync, readFileSync } from 'fs-extra'
import { Marker } from '~/types'
import { HUNDRED_PERCENT } from '~/constants/general'
export default Vue.extend({
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
    mediaActive: {
      type: Boolean,
      default: false,
    },
    videoActive: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      current: false,
      active: false as boolean,
      played: false,
      video: null as any,
      paused: false as boolean,
      progress: 0,
      newProgress: 0,
      stopClicked: false as boolean,
      start: undefined as string | undefined,
      end: undefined as string | undefined,
      parent: this,
      markers: [] as Marker[],
      tempClipped: null as any,
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
    faSort() {
      return faSort
    },
    scene(): string {
      return this.$store.state.obs.currentScene as string
    },
    clippedStart(): number {
      if (!this.video) return 0
      return (
        (this.video.clipped.start * HUNDRED_PERCENT) / this.video.original.end
      )
    },
    clippedEnd(): number {
      if (!this.video) return 0
      return (
        HUNDRED_PERCENT -
        (this.video.clipped.end * HUNDRED_PERCENT) / this.video.original.end
      )
    },
    isImage(): boolean {
      return this.$isImage(this.src)
    },
    title(): string {
      return (
        `<div style="line-break: anywhere">` +
        basename(this.src)
          .replace(
            /^((\d{1,2}-?)* ?- )/,
            "<span class='sort-prefix text-nowrap' style='display: none;'>$1</span>"
          )
          .replace(
            new RegExp(`${this.$translate('song')} (\\d+) -`, 'g'),
            `<span class="song v-btn pa-1"><font-awesome-icon :icon="faMusic" size="sm" pull="left"/>$1</span>`
          )
          .replace(
            new RegExp(`${this.$translate('paragraph')} (\\d+) -`, 'g'),
            `<span class="paragraph v-btn pa-1"><font-awesome-icon :icon="faParagraph" size="sm" pull="left"/>$1</span>`
          ) +
        `</div>`
      )
    },
  },
  watch: {
    newProgress() {
      if (this.paused) {
        this.scrubVideo()
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
      }
    },
    mediaActive(val: boolean) {
      if (val && !this.active) {
        this.current = false
      } else if (!val) {
        this.active = false
      }
    },
    async active(val: boolean) {
      if (val) {
        this.current = this.$getPrefs('media.enablePp') as boolean
      } else {
        this.markers.forEach((m) => {
          m.playing = false
        })
        this.progress = 0
        this.newProgress = 0
        this.paused = false
        if (this.scene && !this.deactivate) {
          await this.$setScene(this.scene)
        }
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
    ipcRenderer.on('videoEnd', () => {
      this.active = false
    })
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('videoEnd')
  },
  methods: {
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
        await this.$setScene(this.$getPrefs('app.obs.mediaScene') as string)
      }

      // Show media
      ipcRenderer.send('showMedia', {
        path: this.src,
        start: marker ? marker.customStartTime : this.start,
        end: marker ? marker.customEndTime : this.end,
      })
    },
    togglePaused(): void {
      if (this.scene) {
        this.$setScene(
          this.paused
            ? (this.$getPrefs('app.obs.mediaScene') as string)
            : this.scene
        )
      }
      this.newProgress = this.progress
      ipcRenderer.send(this.paused ? 'playVideo' : 'pauseVideo')
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
              hours: +startTime.format('h'),
              minutes: +startTime.format('m'),
              seconds: +startTime.format('s'),
              milliseconds: +startTime.format('SSS'),
            })
            .format('HH:mm:ss.SSS')

          marker.customEndTime = startTime
            .add(
              this.$dayjs.duration({
                hours: +duration.format('h'),
                minutes: +duration.format('m'),
                seconds: +duration.format('s'),
                milliseconds: +duration.format('SSS'),
              })
            )
            .subtract(
              this.$dayjs.duration({
                hours: +transition.format('h'),
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
      original: any
      clipped: any
      formatted: any
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

.v-list-item {
  border-left: 8px solid transparent;
  &:hover {
    cursor: default;
  }
}

.media-played {
  border-left: 8px solid rgba(55, 90, 127, 0.75) !important;
}

.current-media-item {
  border-left: 8px solid orange !important;
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

.theme--light {
  .media-title {
    color: rgba(0, 0, 0, 0.87) !important;
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
