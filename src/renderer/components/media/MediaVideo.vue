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
            v-mask="'##:##.###'"
            :rules="[(v) => /\d{2}:\d{2}.\d{3}/.test(v) || 'mm:ss.SSS']"
            placeholder="00:00.000"
            dense
            hide-details="auto"
          >
            <template #prepend-icon>
              <v-icon>fas fa-fw fa-backward-step</v-icon>
            </template>
          </v-text-field>
          <v-text-field
            v-model="clipped.end"
            v-mask="'##:##.###'"
            :rules="[(v) => /\d{2}:\d{2}.\d{3}/.test(v) || 'mm:ss.SSS']"
            placeholder="00:00.000"
            dense
            hide-details="auto"
          >
            <template #prepend-icon>
              <v-icon>fas fa-fw fa-forward-step</v-icon>
            </template>
          </v-text-field>
        </v-col>
        <v-col align-self="end" class="d-flex flex-column">
          <v-btn icon @click="resetClipped()">
            <v-icon>fas fa-fw fa-rotate-left</v-icon>
          </v-btn>
          <v-btn icon @click="setTime()">
            <v-icon color="error">fas fa-fw fa-square-check</v-icon>
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
          v-bind="attrs"
          style="bottom: 4px"
          :class="{ 'pulse-danger': isClipped }"
          v-on="on"
          @click="atClick()"
        >
          <v-icon x-small class="mr-1">fas fa-film</v-icon>
          {{
            (playing || isClipped) && duration !== '00:00'
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
      style="bottom: 4px"
      :class="{ 'pulse-danger': isClipped }"
      @click="atClick()"
    >
      <v-icon x-small class="mr-1">fas fa-film</v-icon>
      {{
        (playing || isClipped) && duration !== '00:00'
          ? `${progress[0] ?? limits.start}/${limits.end}`
          : `${duration}`
      }}
    </v-btn>
  </div>
</template>
<script lang="ts">
import { pathToFileURL } from 'url'
import { basename } from 'upath'
import Vue from 'vue'
import { ipcRenderer } from 'electron'
import { AUDIO_ICON, VIDEO_ICON } from '~/constants/general'
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
      return (
        basename(this.src)
          .replaceAll(' ', '')
          .replaceAll('-', '')
          .replaceAll('.', '')
          .replaceAll(/\d/g, '') + 'video'
      )
    },
    duration(): string {
      return this.$dayjs
        .duration(this.clippedMs.end - this.clippedMs.start, 'ms')
        .format('mm:ss')
    },
    limits(): { start: string; end: string } {
      return {
        start: this.$dayjs.duration(this.clippedMs.start, 'ms').format('mm:ss'),
        end: this.$dayjs.duration(this.clippedMs.end, 'ms').format('mm:ss'),
      }
    },
    originalString(): { start: string; end: string } {
      return {
        start: this.$dayjs
          .duration(this.original.start, 'ms')
          .format('mm:ss.SSS'),
        end: this.$dayjs.duration(this.original.end, 'ms').format('mm:ss.SSS'),
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
              minutes: parseInt(this.clipped.start.split(':')[0]),
              seconds: parseInt(this.clipped.start.split(':')[1]),
              milliseconds: parseInt(this.clipped.start.split('.')[1]),
            })
            .asMilliseconds()
            .toFixed(0)
        ),
        end: parseInt(
          this.$dayjs
            .duration({
              minutes: parseInt(this.clipped.end.split(':')[0]),
              seconds: parseInt(this.clipped.end.split(':')[1]),
              milliseconds: parseInt(this.clipped.end.split('.')[1]),
            })
            .asMilliseconds()
            .toFixed(0)
        ),
      }
    },
  },
  watch: {
    playing(val) {
      if (!val) {
        this.current = 0
        this.progress = []
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
    video.onloadedmetadata = () => {
      this.original.end = parseInt(
        this.$dayjs.duration(video.duration, 's').asMilliseconds().toFixed(0)
      )
      this.clipped = {
        start: this.$dayjs
          .duration(this.original.start, 'ms')
          .format('mm:ss.SSS'),
        end: this.$dayjs.duration(this.original.end, 'ms').format('mm:ss.SSS'),
      }
      this.$emit('clipped', {
        original: this.original,
        clipped: this.clippedMs,
        formatted: this.originalString,
      })
    }
    div?.replaceChild(video, div.firstChild as ChildNode)

    ipcRenderer.on('videoProgress', (_e, progress) => {
      const percentage = (100 * 1000 * progress[0]) / this.original.end
      this.progress = progress.map((seconds: number) => {
        return this.$dayjs.duration(seconds, 's').format('mm:ss')
      })
      if (this.playing) this.$emit('progress', percentage)
    })
  },
  methods: {
    atClick(): void {
      if (this.playing || this.duration === '00:00') return
      if (this.clickedOnce) this.changeTime = true
      else {
        this.clickedOnce = true
        setTimeout(() => {
          this.clickedOnce = false
        }, 3000)
      }
    },
    setTime(): void {
      this.changeTime = false
      this.$emit('clipped', {
        original: this.original,
        clipped: this.clippedMs,
        formatted: this.clipped,
      })
    },
    resetClipped(): void {
      this.clipped = JSON.parse(JSON.stringify(this.originalString))
    },
  },
})
</script>
