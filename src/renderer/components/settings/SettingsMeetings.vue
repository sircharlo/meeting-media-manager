<template>
  <v-form ref="meetingsForm" v-model="valid">
    <form-input
      id="meeting.specialCong"
      v-model="meeting.specialCong"
      field="switch"
      :locked="$isLocked('meeting.specialCong')"
      :label="$t('specialCong')"
    />
    <template v-if="!meeting.specialCong">
      <form-input
        v-for="day in ['mw', 'we']"
        :id="`meeting.${day}Day`"
        :key="day"
        v-model="meeting[`${day}Day`]"
        field="btn-group"
        :group-label="$t(`${day}MeetingDay`)"
        :group-items="localeDays"
        :locked="$isLocked(`meeting.${day}Day`)"
        height="56px"
        :mandatory="meeting[`${day}Day`] !== null"
        required
      >
        <form-time-picker
          :id="`meeting.${day}StartTime`"
          v-model="meeting[`${day}StartTime`]"
          label=""
          required
          :locked="$isLocked(`meeting.${day}StartTime`)"
        />
      </form-input>
      <form-date-picker
        id="meeting.coWeek"
        v-model="meeting.coWeek"
        :label="$t('coWeek')"
        :min="$dayjs().startOf('week').format('YYYY-MM-DD')"
        :locked="$isLocked('meeting.coWeek')"
        :allowed-dates="isTuesday"
        explanation="coWeekExplain"
        :format="prefs.app.outputFolderDateFormat"
      />
    </template>
    <v-divider :class="{ 'mb-6': true, 'mt-6': !meeting.specialCong }" />
    <v-col class="d-flex pa-0 pb-2 align-center justify-space-between">
      <form-input
        id="meeting.enableMusicButton"
        v-model="meeting.enableMusicButton"
        field="switch"
        :locked="$isLocked('meeting.enableMusicButton')"
        :label="$t('enableMusicButton')"
        class="mr-4"
      />
      <v-tooltip v-if="meeting.enableMusicButton" top>
        <template #activator="{ on, attrs }">
          <v-btn
            :loading="status === 'loading'"
            :disabled="!online"
            :color="
              status ? (status === 'loading' ? 'primary' : status) : 'primary'
            "
            v-bind="attrs"
            v-on="on"
            @click="downloadShuffleMusic()"
          >
            <font-awesome-icon :icon="faMusic" size="lg" pull="left" />
            <font-awesome-icon :icon="faDownload" size="lg" pull="right" />
          </v-btn>
        </template>
        <span>
          {{
            $t(
              status == 'success'
                ? 'shuffleMusicDownloaded'
                : 'downloadShuffleMusic'
            )
          }}
        </span>
      </v-tooltip>
    </v-col>
    <template v-if="meeting.enableMusicButton">
      <form-input
        id="meeting.shuffleShortcut"
        v-model="meeting.shuffleShortcut"
        :locked="$isLocked('meeting.shuffleShortcut')"
        placeholder="e.g. Alt+K"
        :label="$t('shuffleShortcut')"
        required
        :rules="getShortcutRules('toggleMusicShuffle')"
      />
      <form-input
        id="meeting.musicVolume"
        v-model="meeting.musicVolume"
        field="slider"
        :locked="$isLocked('meeting.musicVolume')"
        :group-label="$t('musicVolume')"
        label-suffix="%"
        :min="1"
        :max="100"
      />
      <form-input
        id="meeting.autoStartMusic"
        v-model="meeting.autoStartMusic"
        field="switch"
        :locked="$isLocked('meeting.autoStartMusic')"
        :label="$t('autoStartMusic')"
      />
      <form-input
        id="meeting.enableMusicFadeOut"
        v-model="meeting.enableMusicFadeOut"
        field="switch"
        :locked="$isLocked('meeting.enableMusicFadeOut')"
        :label="$t('musicFadeOutType')"
      />
      <v-row
        v-if="meeting.enableMusicFadeOut"
        class="mb-4"
        justify="space-between"
      >
        <v-col align-self="center" class="text-left">
          <v-slider
            id="meeting.musicFadeOutTime"
            v-model="meeting.musicFadeOutTime"
            :min="5"
            :max="60"
            :step="5"
            :locked="$isLocked('meeting.musicFadeOutTime')"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="auto" align-self="center" class="text-right">
          <v-btn-toggle
            id="meeting.musicFadeOutType"
            v-model="meeting.musicFadeOutType"
            color="primary"
            mandatory
            :locked="$isLocked('meeting.musicFadeOutType')"
          >
            <v-btn
              value="smart"
              :disabled="$isLocked('meeting.musicFadeOutType')"
            >
              {{ musicFadeOutSmart }}
            </v-btn>
            <v-btn
              value="timer"
              :disabled="$isLocked('meeting.musicFadeOutType')"
            >
              {{ musicFadeOutTimer }}
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
    </template>
    <v-progress-linear
      v-if="currentProgress || totalProgress"
      fixed
      bottom
      stream
      striped
      :height="8"
      style="bottom: 72px"
      :buffer-value="currentProgress"
      :value="totalProgress"
    />
  </v-form>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { extname, join } from 'upath'
import { faDownload, faMusic } from '@fortawesome/free-solid-svg-icons'
import { MeetingPrefs, ElectronStore, VideoFile, ShortJWLang } from '~/types'
import { NR_OF_KINGDOM_SONGS } from '~/constants/general'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PREFS } = require('~/constants/prefs') as { PREFS: ElectronStore }
export default defineComponent({
  props: {
    prefs: {
      type: Object as PropType<ElectronStore>,
      required: true,
    },
    cache: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      status: '',
      cached: false,
      valid: true,
      processed: 0,
      currentProgress: 0,
      totalProgress: 0,
      meeting: {
        ...PREFS.meeting,
      } as MeetingPrefs,
    }
  },
  computed: {
    online(): boolean {
      return this.$store.state.stats.online
    },
    faMusic() {
      return faMusic
    },
    faDownload() {
      return faDownload
    },
    meetingDaysValid(): boolean {
      return (
        this.meeting.mwDay !== null &&
        this.meeting.weDay !== null &&
        !!this.meeting.mwStartTime &&
        !!this.meeting.weStartTime
      )
    },
    forcedPrefs(): ElectronStore {
      return this.$store.state.cong.prefs as ElectronStore
    },
    localeDays(): { label: string; value: number }[] {
      return this.$dayjs.weekdaysMin(true).map((day, i) => {
        return {
          label: day,
          value: i,
        }
      })
    },
    musicFadeOutSmart(): string {
      return (this.$t('musicFadeOutSmart') as string).replace(
        '<span>XX</span>',
        (this.meeting.musicFadeOutTime ?? 5).toString()
      )
    },
    musicFadeOutTimer(): string {
      return (this.$t('musicFadeOutTimer') as string).replace(
        '<span>XX</span>',
        (this.meeting.musicFadeOutTime ?? 5).toString()
      )
    },
    mediaLangObject(): ShortJWLang | null {
      return this.$store.state.media.mediaLang as ShortJWLang | null
    },
    isSignLanguage(): boolean {
      return !!this.mediaLangObject?.isSignLanguage
    },
  },
  watch: {
    valid(val: boolean) {
      this.$emit(
        'valid',
        val && (this.meeting.specialCong || this.meetingDaysValid)
      )
    },
    meeting: {
      handler(val: MeetingPrefs) {
        this.$setPrefs('meeting', val)
        this.$emit('refresh', val)
        this.$emit(
          'valid',
          this.valid && (val.specialCong || this.meetingDaysValid)
        )
      },
      deep: true,
    },
    forcedPrefs() {
      Object.assign(this.meeting, this.$getPrefs('meeting'))
    },
    cache() {
      this.cached = this.shuffleMusicCached()
    },
    cached(val: boolean) {
      if (!val && this.status === 'success') {
        this.status = ''
      }
    },
    'meeting.enableMusicButton': {
      // Set or unset the music shuffle shortcut
      async handler(val: boolean) {
        if (val && this.meeting.shuffleShortcut) {
          await this.$setShortcut(
            this.meeting.shuffleShortcut,
            'toggleMusicShuffle',
            'music'
          )
        } else {
          await this.$unsetShortcuts('music')
        }
      },
    },
    'meeting.shuffleShortcut': {
      handler(val: string) {
        if (
          this.$isShortcutValid(val) &&
          this.$isShortcutAvailable(val, 'toggleMusicShuffle')
        ) {
          this.$unsetShortcut('toggleMusicShuffle')
          this.$setShortcut(val, 'toggleMusicShuffle', 'music')
        }
      },
    },
    'meeting.musicVolume': {
      handler(val: number) {
        const audio = document.querySelector(
          '#meetingMusic'
        ) as HTMLAudioElement
        if (audio) {
          audio.volume = val / 100
        }
      },
    },
  },
  mounted() {
    Object.assign(this.meeting, this.$getPrefs('meeting'))
    if (this.meeting.coWeek) {
      const date = this.$dayjs(this.meeting.coWeek, 'YYYY-MM-DD')
      if (!date.isValid() || date.isBefore(this.$dayjs().startOf('week'))) {
        this.meeting.coWeek = null
      }
    }
    this.$emit('refresh', this.meeting)

    this.cached = this.shuffleMusicCached()
    if (this.cached) {
      this.status = 'success'
    }

    if (this.$refs.meetingsForm) {
      // @ts-ignore: validate is not a function on type Element
      this.$refs.meetingsForm.validate()
    }
    this.$emit(
      'valid',
      this.valid && (this.meeting.specialCong || this.meetingDaysValid)
    )
  },
  methods: {
    isTuesday(date: string) {
      return this.$dayjs(date, 'YYYY-MM-DD').day() === 2
    },
    shuffleMusicCached(): boolean {
      const pubPath = this.$pubPath()
      if (!pubPath) return false
      if (!this.prefs.media.lang) return false
      if (this.isSignLanguage) {
        return (
          this.$findAll(
            join(pubPath, '..', this.prefs.media.lang, 'sjj', '**', '*.mp4')
          ).length === NR_OF_KINGDOM_SONGS
        )
      } else {
        return (
          this.$findAll(join(pubPath, '..', 'E', 'sjjm', '**', '*.mp3'))
            .length === NR_OF_KINGDOM_SONGS
        )
      }
    },
    setProgress(loaded: number, total: number, global = false) {
      if (global) {
        this.totalProgress = (100 * loaded) / total
      } else {
        this.currentProgress = this.totalProgress
          ? this.totalProgress + ((100 - this.totalProgress) * loaded) / total
          : (100 * loaded) / total
      }
      if (this.currentProgress === 100) this.currentProgress = 0
      if (this.totalProgress === 100) this.totalProgress = 0
    },
    getShortcutRules(fn: string) {
      return [
        (v: string) =>
          this.$isShortcutValid(v) || this.$t('fieldShortcutInvalid'),
        (v: string) =>
          this.$isShortcutAvailable(v, fn) || this.$t('fieldShortcutTaken'),
      ]
    },
    async downloadSong(song: VideoFile) {
      await this.$downloadIfRequired(song, this.setProgress)
      this.setProgress(++this.processed, NR_OF_KINGDOM_SONGS, true)
    },
    async downloadShuffleMusic() {
      this.status = 'loading'
      if (!this.prefs.media.lang) {
        this.status = 'error'
        return
      }
      try {
        const songs = (await this.$getMediaLinks({
          pubSymbol: this.isSignLanguage ? 'sjj' : 'sjjm',
          format: this.isSignLanguage ? 'MP4' : 'MP3',
          lang: this.isSignLanguage ? this.prefs.media.lang : 'E',
        })) as VideoFile[]

        const promises: Promise<void>[] = []

        songs
          .filter(
            (item) =>
              extname(item.url) === (this.isSignLanguage ? '.mp4' : '.mp3')
          )
          .forEach((s) => promises.push(this.downloadSong(s)))

        await Promise.allSettled(promises)
        this.status = 'success'
        this.$emit('cache')
      } catch (e: unknown) {
        this.status = 'error'
      }
    },
  },
})
</script>
