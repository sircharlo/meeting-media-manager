<!-- Video in presentation mode -->
<template>
  <div :id="id">
    <div />
    <v-overlay
      absolute
      :value="changeTime"
      :opacity="1"
      class="d-flex justify-start"
    >
      <v-row>
        <v-col align-self="start" class="ml-2">
          <v-text-field
            v-model="clipped.start"
            v-mask="'##:##:##.###'"
            :rules="[
              (v) => /\d{2}:\d{2}:\d{2}.\d{3}/.test(v) || 'hh:mm:ss.SSS',
            ]"
            placeholder="00:00:00.000"
            dense
            hide-details="auto"
          >
            <template #prepend-icon>
              <font-awesome-icon :icon="faBackwardStep" />
            </template>
          </v-text-field>
          <v-text-field
            v-model="clipped.end"
            v-mask="'##:##:##.###'"
            :rules="[
              (v) => /\d{2}:\d{2}:\d{2}.\d{3}/.test(v) || 'hh:mm:ss.SSS',
            ]"
            placeholder="00:00:00.000"
            dense
            hide-details="auto"
          >
            <template #prepend-icon>
              <font-awesome-icon :icon="faForwardStep" />
            </template>
          </v-text-field>
        </v-col>
        <v-col align-self="end" class="d-flex flex-column">
          <v-btn icon @click="resetClipped()">
            <font-awesome-icon :icon="faRotateLeft" />
          </v-btn>
          <v-btn icon @click="setTime()">
            <font-awesome-icon :icon="faSquareCheck" class="error--text" />
          </v-btn>
        </v-col>
      </v-row>
    </v-overlay>
    <v-tooltip v-if="clickedOnce" right>
      <template #activator="{ on, attrs }">
        <v-btn
          x-small
          absolute
          left
          tile
          depressed
          v-bind="attrs"
          style="bottom: 7.5px"
          :class="{ 'pulse-danger': isClipped }"
          v-on="on"
          @click="atClick()"
        >
          <font-awesome-icon :icon="faFilm" pull="left" />
          {{
            (playing || isClipped) && !isShortVideo
              ? `${progress[0] ?? limits.start}/${limits.end}`
              : `${duration}`
          }}
        </v-btn>
      </template>
      <span>{{ $t('clickAgain') }}</span>
    </v-tooltip>
    <v-btn
      v-else
      x-small
      absolute
      left
      tile
      depressed
      style="bottom: 7.5px"
      :class="{ 'pulse-danger': isClipped }"
      @click="atClick()"
    >
      <font-awesome-icon :icon="faFilm" pull="left" />
      {{
        (playing || isClipped) && !isShortVideo
          ? `${progress[0] ?? limits.start}/${limits.end}`
          : `${duration}`
      }}
    </v-btn>
  </div>
</template>
<script lang="ts">
import { pathToFileURL } from 'url'
import { Duration } from 'dayjs/plugin/duration'
import { basename } from 'upath'
import Vue, { PropOptions } from 'vue'
import { ipcRenderer } from 'electron'
import {
  faBackwardStep,
  faForwardStep,
  faSquareCheck,
  faRotateLeft,
  faFilm,
} from '@fortawesome/free-solid-svg-icons'
import {
  AUDIO_ICON,
  HUNDRED_PERCENT,
  MS_IN_SEC,
  VIDEO_ICON,
} from '~/constants/general'
export default Vue.extend({
  props: {
    src: {
      type: String,
      required: true,
    },
    playing: {
      type: Boolean,
      default: false,
    },
    tempClipped: {
      type: Object,
      default: null,
    } as PropOptions<{ start: string; end: string }>,
  },
  data() {
    return {
      progress: [] as string[],
      clickedOnce: false,
      changeTime: false,
      audioIcon: AUDIO_ICON,
      videoIcon: VIDEO_ICON,
      original: {
        start: 0,
        end: 0,
      },
      clipped: {
        start: '0',
        end: '0',
      },
      current: 0,
    }
  },
  computed: {
    faForwardStep() {
      return faForwardStep
    },
    faBackwardStep() {
      return faBackwardStep
    },
    faRotateLeft() {
      return faRotateLeft
    },
    faSquareCheck() {
      return faSquareCheck
    },
    faFilm() {
      return faFilm
    },
    url(): string {
      return pathToFileURL(this.src).href + '#t=5'
    },
    poster(): string {
      return this.$isVideo(this.src) ? this.videoIcon : this.audioIcon
    },
    isDark(): boolean {
      return this.$vuetify.theme.dark
    },
    id(): string {
      return this.$strip('video-' + basename(this.src))
    },
    duration(): string {
      return this.format(
        this.$dayjs.duration(this.clippedMs.end - this.clippedMs.start, 'ms')
      )
    },
    isShortVideo(): boolean {
      return this.duration === '00:00:00' || this.duration === '00:00'
    },
    limits(): { start: string; end: string } {
      return {
        start: this.format(this.$dayjs.duration(this.clippedMs.start, 'ms')),
        end: this.format(this.$dayjs.duration(this.clippedMs.end, 'ms')),
      }
    },
    originalString(): { start: string; end: string } {
      return {
        start: this.$dayjs
          .duration(this.original.start, 'ms')
          .format('HH:mm:ss.SSS'),
        end: this.$dayjs
          .duration(this.original.end, 'ms')
          .format('HH:mm:ss.SSS'),
      }
    },
    isClipped(): boolean {
      return !(
        this.original.start === this.clippedMs.start &&
        this.original.end === this.clippedMs.end
      )
    },
    clippedMs(): { start: number; end: number } {
      return {
        start: parseInt(
          this.$dayjs
            .duration({
              hours: parseInt(this.clipped.start.split(':')[0]),
              minutes: parseInt(this.clipped.start.split(':')[1]),
              seconds: parseInt(this.clipped.start.split(':')[2]),
              milliseconds: parseInt(this.clipped.start.split('.')[1]),
            })
            .asMilliseconds()
            .toFixed(0)
        ),
        end: parseInt(
          this.$dayjs
            .duration({
              hours: parseInt(this.clipped.end.split(':')[0]),
              minutes: parseInt(this.clipped.end.split(':')[1]),
              seconds: parseInt(this.clipped.end.split(':')[2]),
              milliseconds: parseInt(this.clipped.end.split('.')[1]),
            })
            .asMilliseconds()
            .toFixed(0)
        ),
      }
    },
  },
  watch: {
    tempClipped(val: { start: string; end: string }) {
      if (val) {
        this.clipped = this.tempClipped
        this.setTime()
      }
    },
    playing(val: boolean) {
      if (!val) {
        this.current = 0
        this.progress = []
        if (this.tempClipped) {
          this.resetClipped()
          this.$emit('resetClipped')
        }
      }
    },
  },
  mounted(): void {
    const div = document.querySelector(`#${this.id}`)
    const source = document.createElement('source')
    source.src = this.url
    const video = document.createElement('video')
    video.width = 144
    video.height = 80
    video.preload = 'metadata'
    video.poster = this.poster
    video.appendChild(source)

    // When video has been loaded, set clipped to original
    video.onloadedmetadata = () => {
      this.original.end = parseInt(
        this.$dayjs.duration(video.duration, 's').asMilliseconds().toFixed(0)
      )
      this.clipped = {
        start: this.$dayjs
          .duration(this.original.start, 'ms')
          .format('HH:mm:ss.SSS'),
        end: this.$dayjs
          .duration(this.original.end, 'ms')
          .format('HH:mm:ss.SSS'),
      }
      this.$emit('clipped', {
        original: this.original,
        clipped: this.clippedMs,
        formatted: this.originalString,
      })
    }
    div?.replaceChild(video, div.firstChild as ChildNode)

    // Get video progress
    ipcRenderer.on('videoProgress', (_e, progress) => {
      const percentage =
        (HUNDRED_PERCENT * MS_IN_SEC * progress[0]) / this.original.end
      this.progress = progress.map((seconds: number) => {
        return this.format(this.$dayjs.duration(seconds, 's'))
      })
      if (this.playing) this.$emit('progress', percentage)
    })
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('videoProgress')
  },
  methods: {
    format(duration: Duration) {
      if (duration.hours() > 0) {
        return duration.format('HH:mm:ss')
      } else {
        return duration.format('mm:ss')
      }
    },
    atClick(): void {
      if (this.playing || this.isShortVideo) return
      if (this.clickedOnce) this.changeTime = true
      else {
        this.clickedOnce = true
        setTimeout(() => {
          this.clickedOnce = false
        }, 3 * MS_IN_SEC)
      }
    },
    setTime(): void {
      if (
        this.clippedMs.end < MS_IN_SEC ||
        this.clippedMs.end > this.original.end
      ) {
        this.resetClipped()
      } else {
        this.$emit('clipped', {
          original: this.original,
          clipped: this.clippedMs,
          formatted: this.clipped,
        })
      }
      this.changeTime = false
    },
    resetClipped(): void {
      this.clipped = JSON.parse(JSON.stringify(this.originalString))
      this.$emit('clipped', {
        original: this.original,
        clipped: this.clippedMs,
        formatted: this.clipped,
      })
    },
  },
})
</script>
