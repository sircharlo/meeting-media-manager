<!-- eslint-disable vue/no-unused-vars -->
<!-- Video in presentation mode -->
<template>
  <div :id="id">
    <div :id="id + '-container'" class="align-center d-flex" />
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
    <v-tooltip v-if="clickedOnce" right :value="true">
      <template #activator="data">
        <v-btn
          x-small
          absolute
          left
          tile
          depressed
          style="bottom: 4px"
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
      style="bottom: 4px"
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
    <v-btn
      v-if="ccAvailable"
      x-small
      absolute
      tile
      depressed
      :color="ccEnabled ? 'primary' : undefined"
      style="left: 123px; bottom: 4px"
      @click="ccEnabled = !ccEnabled"
    >
      <font-awesome-icon :icon="ccIcon" />
    </v-btn>
  </div>
</template>
<script lang="ts">
import { pathToFileURL } from 'url'
import { Duration } from 'dayjs/plugin/duration'
import { basename, changeExt } from 'upath'
import { defineComponent, PropOptions } from 'vue'
import { ipcRenderer } from 'electron'
import {
  faBackwardStep,
  faForwardStep,
  faSquareCheck,
  faRotateLeft,
  faFilm,
  faClosedCaptioning,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { faClosedCaptioning as farClosedCaptioning } from '@fortawesome/free-regular-svg-icons'
import { existsSync } from 'original-fs'
import {
  AUDIO_ICON,
  HUNDRED_PERCENT,
  MS_IN_SEC,
  VIDEO_ICON,
} from '~/constants/general'
import { MeetingFile, VideoFile } from '~/types'
export default defineComponent({
  props: {
    src: {
      type: String,
      required: true,
    },
    playing: {
      type: Boolean,
      default: false,
    },
    stream: {
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
      ccAvailable: false,
      ccEnabled: false,
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
    ccIcon(): IconDefinition {
      return this.ccEnabled ? faClosedCaptioning : farClosedCaptioning
    },
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
    meetings(): Map<string, Map<number, MeetingFile[]>> {
      return this.$store.state.media.meetings as Map<
        string,
        Map<number, MeetingFile[]>
      >
    },
    url(): string {
      return (
        (this.stream ? this.src : pathToFileURL(this.src).href) +
        (this.thumbnail ? '' : '#t=5')
      )
    },
    thumbnail(): string | null {
      let thumbnail: string | null | undefined

      const meetingMedia = this.meetings.get(this.$route.query.date as string)
      if (!meetingMedia) return null

      meetingMedia.forEach((media) => {
        if (thumbnail !== undefined) return
        const file = media.find((m) => m.safeName === basename(this.src))
        if (file?.pub?.startsWith('sjj')) {
          thumbnail = null
        } else if (file) {
          thumbnail = file.thumbnail || file.trackImage || null
        }
      })

      return thumbnail ?? null
    },
    poster(): string {
      return this.$isVideo(this.src) ? this.videoIcon : this.audioIcon
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
    date(): string {
      return this.$route.query.date as string
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
    playing(val: boolean) {
      if (val) {
        if (this.ccAvailable) {
          let top = false
          const meetingMap = this.meetings.get(this.date)
          if (meetingMap) {
            const values = [...meetingMap.values()]
            values.forEach((media) => {
              const file = media.find(
                (m) => m.safeName === basename(this.src)
              ) as VideoFile
              if (file) top = file.subtitled
            })
          }
          setTimeout(() => {
            this.toggleSubtitles(this.ccEnabled, top)
          }, MS_IN_SEC)
        }
        ipcRenderer.on('videoProgress', (_e, progress) => {
          const percentage =
            (HUNDRED_PERCENT * MS_IN_SEC * progress[0]) / this.original.end
          this.progress = progress.map((seconds: number) => {
            return this.format(this.$dayjs.duration(seconds, 's'))
          })
          if (val) this.$emit('progress', percentage)
        })
      } else {
        this.ccEnabled = this.ccAvailable
        this.current = 0
        this.progress = []
        if (this.tempClipped) {
          this.resetClipped()
          this.$emit('resetClipped')
        }
        ipcRenderer.removeAllListeners('videoProgress')
      }
    },
    ccEnabled(val: boolean) {
      this.toggleSubtitles(val, true)
    },
    tempClipped(val: { start: string; end: string }): void {
      if (val) {
        this.clipped = val
        this.setTime()
      }
    },
  },
  mounted(): void {
    this.setCCAvailable()
    this.ccEnabled = this.ccAvailable
    const div = document.querySelector(`#${this.id}-container`)
    const source = document.createElement('source')
    source.src = this.url
    const video = document.createElement('video')
    video.width = 142
    video.height = 80
    video.preload = 'metadata'
    video.poster = this.thumbnail ?? this.poster
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
    if (div) div.appendChild(video)
  },
  methods: {
    setCCAvailable() {
      this.ccAvailable =
        !!this.$getPrefs('media.enableSubtitles') &&
        existsSync(changeExt(this.src, '.vtt'))
    },
    toggleSubtitles(enabled: boolean, top = false) {
      ipcRenderer.send('toggleSubtitles', { enabled, top })
    },
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
