<template>
  <v-form ref="form" v-model="valid">
    <form-input
      id="meeting.specialCong"
      v-model="meeting.specialCong"
      field="switch"
      :locked="$isLocked('meeting.specialCong')"
      :label="$t('specialCong')"
    />
    <template v-if="!meeting.specialCong">
      <form-input
        id="meeting.mwDay"
        v-model="meeting.mwDay"
        field="btn-group"
        :group-label="$t('mwMeetingDay')"
        :group-items="localeDays"
        :locked="$isLocked('meeting.mwDay')"
        height="56px"
        :mandatory="meeting.mwDay !== null"
        required
      >
        <form-time-picker
          id="meeting.mwStartTime"
          v-model="meeting.mwStartTime"
          :label="''"
          required
          :locked="$isLocked('meeting.mwStartTime')"
        />
      </form-input>
      <form-input
        id="meeting.weDay"
        v-model="meeting.weDay"
        field="btn-group"
        :group-label="$t('weMeetingDay')"
        :locked="$isLocked('meeting.weDay')"
        :group-items="localeDays"
        height="56px"
        :mandatory="meeting.weDay !== null"
        required
      >
        <form-time-picker
          id="meeting.weStartTime"
          v-model="meeting.weStartTime"
          :label="''"
          required
          :locked="$isLocked('meeting.weStartTime')"
        />
      </form-input>
    </template>
    <v-divider class="mb-6" />
    <v-col class="d-flex pa-0 pb-2 align-center justify-space-between">
      <form-input
        id="meeting.enableMusicButton"
        v-model="meeting.enableMusicButton"
        field="switch"
        :locked="$isLocked('meeting.enableMusicButton')"
        :label="$t('enableMusicButton')"
      />
      <v-btn
        v-if="meeting.enableMusicButton"
        small
        :loading="status === 'loading'"
        :disabled="!online"
        :color="
          status ? (status === 'loading' ? 'primary' : status) : 'primary'
        "
        @click="downloadShuffleMusic()"
      >
        {{ $t('downloadShuffleMusic') }}
      </v-btn>
    </v-col>
    <template v-if="meeting.enableMusicButton">
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
  </v-form>
</template>
<script lang="ts">
import Vue from 'vue'
import { extname, join } from 'upath'
import { MeetingPrefs, ElectronStore, VideoFile } from '~/types'
import { HUNDRED_PERCENT, NR_OF_KINGDOM_SONGS } from '~/constants/general'
const { PREFS } = require('~/constants/prefs') as { PREFS: ElectronStore }
export default Vue.extend({
  data() {
    return {
      status: '',
      valid: true,
      meeting: {
        ...PREFS.meeting,
      } as MeetingPrefs,
    }
  },
  computed: {
    online() {
      return this.$store.state.stats.online
    },
    localeDays() {
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
        (this.meeting.musicFadeOutTime as number).toString()
      )
    },
    musicFadeOutTimer(): string {
      return (this.$t('musicFadeOutTimer') as string).replace(
        '<span>XX</span>',
        (this.meeting.musicFadeOutTime as number).toString()
      )
    },
    shuffleMusicCached() {
      return (
        this.$findAll(join(this.$pubPath(), 'sjjm', '**', '*.mp3')).length ===
        NR_OF_KINGDOM_SONGS
      )
    },
  },
  watch: {
    valid(val: boolean) {
      this.$emit(
        'valid',
        (val && this.meeting.specialCong) ||
          (this.meeting.mwDay !== null &&
            this.meeting.weDay !== null &&
            this.meeting.mwStartTime &&
            this.meeting.weStartTime)
      )
    },
    meeting: {
      handler(val: MeetingPrefs) {
        this.$setPrefs('meeting', val)
        this.$emit(
          'valid',
          (val && this.meeting.specialCong) ||
            (this.meeting.mwDay !== null &&
              this.meeting.weDay !== null &&
              this.meeting.mwStartTime &&
              this.meeting.weStartTime)
        )
      },
      deep: true,
    },
    'meeting.enableMusicButton': {
      // Set or unset the music shuffle shortcut
      async handler(val: boolean) {
        if (val) {
          await this.$setShortcut('ALT+K', 'toggleMusicShuffle', 'music')
        } else {
          await this.$unsetShortcuts('music')
        }
      },
    },
    'meeting.musicVolume': {
      handler(val: number) {
        const audio = document.querySelector(
          '#meetingMusic'
        ) as HTMLAudioElement
        if (audio) {
          audio.volume = val / HUNDRED_PERCENT
        }
      },
    },
  },
  mounted() {
    Object.assign(this.meeting, this.$getPrefs('meeting'))
    this.$emit('valid', this.valid)

    if (this.shuffleMusicCached) {
      this.status = 'success'
    }

    if (this.$refs.form) {
      this.$refs.form.validate()
    }
  },
  methods: {
    async downloadShuffleMusic() {
      this.status = 'loading'
      try {
        const songs = (await this.$getMediaLinks({
          pubSymbol: 'sjjm',
          format: 'MP3',
          lang: 'E',
        })) as VideoFile[]

        const promises: Promise<void>[] = []

        songs
          .filter((item) => extname(item.url) === '.mp3')
          .forEach((s) => promises.push(this.$downloadIfRequired(s)))

        await Promise.allSettled(promises)
        this.status = 'success'
      } catch (e: any) {
        this.status = 'error'
      }
    },
  },
})
</script>
