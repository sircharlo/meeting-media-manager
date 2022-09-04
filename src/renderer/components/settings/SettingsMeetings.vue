<template>
  <v-form ref="form" v-model="valid">
    <form-input
      v-model="meeting.mwDay"
      field="btn-group"
      :group-label="$t('mwMeetingDay')"
      :group-items="localeDays"
      :locked="locked('meeting.mwDay')"
      height="56px"
    >
      <form-time-picker
        v-model="meeting.mwStartTime"
        :label="''"
        required
        :locked="locked('meeting.mwStartTime')"
      />
    </form-input>
    <form-input
      v-model="meeting.weDay"
      field="btn-group"
      :group-label="$t('weMeetingDay')"
      :locked="locked('meeting.weDay')"
      :group-items="localeDays"
      height="56px"
    >
      <form-time-picker
        v-model="meeting.weStartTime"
        :label="''"
        required
        :locked="locked('meeting.weStartTime')"
      />
    </form-input>
    <v-divider class="mb-6" />
    <form-input
      v-model="meeting.enableMusicButton"
      field="switch"
      :locked="locked('meeting.enableMusicButton')"
      :label="$t('enableMusicButton')"
    />
    <template v-if="meeting.enableMusicButton">
      <form-input
        v-model="meeting.musicVolume"
        field="slider"
        :locked="locked('meeting.musicVolume')"
        :group-label="$t('musicVolume')"
        label-suffix="%"
        :min="1"
        :max="100"
      />
      <form-input
        v-model="meeting.enableMusicFadeOut"
        field="switch"
        :locked="locked('meeting.enableMusicFadeOut')"
        :label="$t('musicFadeOutType')"
      />
      <v-row
        v-if="meeting.enableMusicFadeOut"
        class="mb-4"
        justify="space-between"
      >
        <v-col align-self="center" class="text-left">
          <v-slider
            v-model="meeting.musicFadeOutTime"
            :min="5"
            :max="60"
            :step="5"
            :locked="locked('meeting.musicFadeOutTime')"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="auto" align-self="center" class="text-right">
          <v-btn-toggle
            v-model="meeting.musicFadeOutType"
            :locked="locked('meeting.musicFadeOutType')"
          >
            <v-btn value="smart" :disabled="locked('meeting.musicFadeOutType')">
              {{ musicFadeOutSmart }}
            </v-btn>
            <v-btn value="timer" :disabled="locked('meeting.musicFadeOutType')">
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
import { MeetingPrefs, ElectronStore } from '~/types'
const { PREFS } = require('~/constants/prefs') as { PREFS: ElectronStore }
export default Vue.extend({
  data() {
    return {
      valid: true,
      meeting: {
        ...PREFS.meeting,
      } as MeetingPrefs,
    }
  },
  computed: {
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
    forcedPrefs() {
      return this.$store.state.cong.prefs
    },
  },
  watch: {
    valid(val: boolean) {
      this.$emit(
        'valid',
        val && this.meeting.mwDay !== null && this.meeting.weDay !== null
      )
    },
    meeting: {
      handler(val: MeetingPrefs) {
        this.$setPrefs('meeting', val)
        this.$emit(
          'valid',
          val && this.meeting.mwDay !== null && this.meeting.weDay !== null
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
  },
  mounted() {
    Object.assign(this.meeting, this.$getPrefs('meeting'))
    if (this.$refs.form) {
      ;(this.$refs.form as HTMLFormElement).validate()
    }
  },
  methods: {
    locked(key: string) {
      if (!this.forcedPrefs) return false
      const keys = key.split('.')
      if (!this.forcedPrefs[keys[0]]) return false
      if (keys.length === 2) {
        return this.forcedPrefs[keys[0]][keys[1]] !== undefined
      } else if (keys.length === 3) {
        if (!this.forcedPrefs[keys[0]][keys[1]]) {
          return false
        }
        return this.forcedPrefs[keys[0]][keys[1]][keys[2]] !== undefined
      } else {
        throw new Error('Invalid key')
      }
    },
  },
})
</script>
