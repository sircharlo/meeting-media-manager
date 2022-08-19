<!-- eslint-disable vue/no-v-html -->
<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<template>
  <div>
    <v-list-item :id="id" three-line :class="{ 'media-played': played }">
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
        @clipped="setTime($event)"
        @progress="progress = $event"
      />
      <v-list-item-content class="ml-2">
        <v-list-item-subtitle class="media-title">
          <runtime-template-compiler :template="title" :parent="parent" />
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action class="d-flex flex-row">
        <template v-if="active">
          <icon-btn
            v-if="!isImage && !end.startsWith('00:00')"
            variant="pause"
            class="mr-2"
            @click="togglePaused()"
          />
          <icon-btn
            variant="stop"
            tooltip="top"
            :click-twice="!isImage && !end.startsWith('00:00')"
            @click="stop()"
          />
        </template>
        <icon-btn
          v-else
          variant="play"
          :disabled="mediaActive"
          @click="play()"
        />
        <icon-btn v-if="sortable" variant="sort" class="ml-2" />
      </v-list-item-action>
      <v-progress-linear
        v-if="!isImage"
        v-model="progress"
        absolute
        bottom
        aria-label="Video progress"
        color="primary"
        :background-opacity="0"
      />
      <v-progress-linear
        v-if="!isImage"
        v-model="clippedStart"
        absolute
        bottom
        aria-label="Video clipped start"
        color="rgb(231, 76, 60)"
        :background-opacity="0"
      />
      <v-progress-linear
        v-if="!isImage"
        v-model="clippedEnd"
        absolute
        bottom
        aria-label="Video clipped end"
        color="rgb(231, 76, 60)"
        reverse
        :background-opacity="0"
      />
    </v-list-item>
    <div class="mx-4">
      <v-btn
        v-for="marker in markers"
        :key="id + marker.label"
        class="mr-2 mb-2"
        color="info"
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
import { faMusic, faParagraph } from '@fortawesome/free-solid-svg-icons'
// eslint-disable-next-line import/named
import { existsSync, readFileSync } from 'fs-extra'
import { Marker } from '~/types'
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
  },
  data() {
    return {
      active: false as boolean,
      played: false,
      video: null as any,
      paused: false as boolean,
      progress: 0,
      stopClicked: false as boolean,
      start: undefined as string | undefined,
      end: undefined as string | undefined,
      parent: this,
      markers: [] as Marker[],
    }
  },
  computed: {
    id(): string {
      return (
        basename(this.src as string)
          .replaceAll(' ', '')
          .replaceAll('-', '')
          .replaceAll('.', '')
          .replaceAll("'", '') + 'mediaitem'
      )
    },
    url(): string {
      return pathToFileURL(this.src).href
    },
    faParagraph() {
      return faParagraph
    },
    faMusic() {
      return faMusic
    },
    scene(): string {
      return this.$store.state.obs.currentScene as string
    },
    clippedStart(): number {
      if (!this.video) return 0
      return (this.video.clipped.start * 100) / this.video.original.end
    },
    clippedEnd(): number {
      if (!this.video) return 0
      return 100 - (this.video.clipped.end * 100) / this.video.original.end
    },
    isImage(): boolean {
      return this.$isImage(this.src)
    },
    title(): string {
      return (
        `<div>` +
        basename(this.src)
          .replace(
            /^((\d{1,2}-?)* ?- )/,
            "<span class='sort-prefix text-nowrap' style='display: none;'>$1</span>"
          )
          .replace(
            new RegExp(`${this.$t('song')} (\\d+) -`, 'g'),
            `<span class="song v-btn pa-1"><font-awesome-icon :icon="faMusic" size="sm" pull="left"/>$1</span>`
          )
          .replace(
            new RegExp(`${this.$t('paragraph')} (\\d+) -`, 'g'),
            `<span class="paragraph v-btn pa-1"><font-awesome-icon :icon="faParagraph" size="sm" pull="left"/>$1</span>`
          ) +
        `</div>`
      )
    },
  },
  watch: {
    async playNow(val) {
      if (val) {
        await this.play()
      }
    },
    stopNow(val) {
      if (val) {
        this.stop()
      }
    },
    async active(val) {
      if (!val) {
        this.progress = 0
        if (this.scene) {
          await this.$setScene(this.scene)
        }
      }
    },
    showPrefix(val) {
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
      this.$emit('playing')
      this.active = true
      this.played = true
      if (this.scene) {
        await this.$setScene(this.$getPrefs('app.obs.mediaScene') as string)
      }
      ipcRenderer.send('showMedia', {
        path: this.src,
        start: marker ? marker.customStartTime : this.start,
        end: marker ? marker.customEndTime : this.end,
      })
    },
    togglePaused(): void {
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
        markers.forEach((marker) => {
          const startTime = this.$dayjs(marker.startTime, 'hh:mm:ss.SSS')
          const duration = this.$dayjs(marker.duration, 'hh:mm:ss.SSS')
          const transition = this.$dayjs(
            marker.endTransitionDuration,
            'hh:mm:ss.SSS'
          )

          marker.customStartTime = this.$dayjs
            .duration({
              hours: parseInt(startTime.format('h')),
              minutes: parseInt(startTime.format('m')),
              seconds: parseInt(startTime.format('s')),
              milliseconds: parseInt(startTime.format('SSS')),
            })
            .format('mm:ss.SSS')

          marker.customEndTime = startTime
            .add(
              this.$dayjs.duration({
                hours: parseInt(duration.format('h')),
                minutes: parseInt(duration.format('m')),
                seconds: parseInt(duration.format('s')),
                milliseconds: parseInt(duration.format('SSS')),
              })
            )
            .subtract(
              this.$dayjs.duration({
                hours: parseInt(transition.format('h')),
                minutes: parseInt(transition.format('m')),
                seconds: parseInt(transition.format('s')),
                milliseconds: parseInt(transition.format('SSS')),
              })
            )
            .format('mm:ss.SSS')
        })
        this.markers = markers
      }
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
.theme--light {
  .media-title {
    color: rgba(0, 0, 0, 0.87) !important;
  }
}

.theme--dark {
  .media-title {
    color: #ffffff !important;
  }
}

.media-title {
  font-size: 1rem !important;
}

.media-played {
  border-left: 8px solid rgba(55, 90, 127, 0.75) !important;
}

.song,
.paragraph {
  border: 1px solid transparent;
}

.theme--light {
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
