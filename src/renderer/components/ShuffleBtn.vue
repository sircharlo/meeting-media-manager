<!-- eslint-disable vue/no-unused-vars -->
<template>
  <v-tooltip v-if="clickedOnce" top :value="true">
    <template #activator="data">
      <v-btn
        id="shuffle"
        ref="btn"
        v-model="$attrs.value"
        v-click-outside="revertClickedOnce"
        aria-label="shuffle"
        :color="musicFadeOut ? 'error' : 'warning'"
        @click="atClick()"
      >
        <font-awesome-icon v-if="musicFadeOut" pull="left" :icon="faStop" />
        <template v-else>
          <font-awesome-icon
            v-for="(icon, i) in icons"
            :key="i"
            size="lg"
            :pull="i == 0 ? 'left' : 'right'"
            :icon="icon"
            :style="{
              color: isDark ? 'white !important' : 'black !important',
            }"
          />
        </template>

        {{ timeRemaining }}
      </v-btn>
    </template>
    <span>{{ $t('clickAgain') }}</span>
  </v-tooltip>
  <v-btn
    v-else-if="musicFadeOut || loading"
    id="shuffle"
    aria-label="shuffle"
    color="warning"
    :title="$getPrefs('meeting.shuffleShortcut')"
    :loading="loading"
    :style="{ color: isDark ? 'white' : 'black' }"
    @click="atClick()"
  >
    <font-awesome-icon
      :icon="faStop"
      pull="left"
      :style="{ color: isDark ? 'white' : 'black' }"
    />
    {{ timeRemaining }}
  </v-btn>
  <v-btn
    v-else
    id="shuffle"
    ref="btn"
    v-model="$attrs.value"
    aria-label="shuffle"
    :title="$getPrefs('meeting.shuffleShortcut')"
    color="info"
    @click.stop="atClick()"
  >
    <font-awesome-icon
      v-for="(icon, i) in icons"
      :key="i"
      size="lg"
      :pull="i == 0 ? 'left' : 'right'"
      :icon="icon"
    />
  </v-btn>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { Dayjs } from 'dayjs'
import {
  faStop,
  faShuffle,
  faMusic,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { MS_IN_SEC, SEC_IN_MIN } from '~/constants/general'

export default defineComponent({
  data() {
    return {
      loading: false,
      clickedOnce: false,
      timeRemaining: '',
      interval: null as null | NodeJS.Timer,
      icons: [faMusic, faShuffle],
    }
  },
  computed: {
    faStop(): IconDefinition {
      return faStop
    },
    isDark(): boolean {
      return this.$vuetify.theme.dark as boolean
    },
    musicFadeOut(): Dayjs {
      return this.$store.state.media.musicFadeOut as Dayjs
    },
  },
  watch: {
    musicFadeOut(val: Dayjs) {
      if (!!val !== !!this.interval) {
        this.setTimeRemaining()
      }
    },
  },
  mounted() {
    if (!!this.musicFadeOut !== !!this.interval) {
      this.setTimeRemaining()
    }
  },
  methods: {
    revertClickedOnce() {
      this.clickedOnce = false
    },
    async atClick(): Promise<void> {
      // If click twice is enabled, wait for second click
      if (!this.clickedOnce) {
        this.clickedOnce = true
        setTimeout(() => {
          this.clickedOnce = false
        }, 3 * MS_IN_SEC)
      } else {
        this.loading = true
        this.clickedOnce = false
        await this.$shuffleMusic(!!this.musicFadeOut)
      }
    },
    // Set time remaining for music shuffle
    setTimeRemaining() {
      this.loading = true
      if (this.musicFadeOut) {
        this.interval = setInterval(async () => {
          if (typeof this.musicFadeOut === 'string') {
            this.timeRemaining = this.musicFadeOut
          } else {
            const timeLeft = this.$dayjs.duration(
              this.musicFadeOut.diff(this.$dayjs()),
              'ms'
            )

            const twoDigits = (num: number) =>
              num < 10 ? `0${num}` : num.toString()

            this.timeRemaining = `${twoDigits(
              timeLeft.hours() * SEC_IN_MIN + timeLeft.minutes()
            )}:${twoDigits(timeLeft.seconds())}`

            // Stop music shuffle at 0
            if (this.timeRemaining === '00:00') {
              this.loading = true
              await this.$shuffleMusic(true)
              this.loading = false
            }
          }
        }, MS_IN_SEC) as NodeJS.Timeout
        setTimeout(() => {
          this.loading = false
        }, MS_IN_SEC)
        // Stop the interval if music stopped
      } else if (this.interval) {
        clearInterval(this.interval as NodeJS.Timeout)
        this.timeRemaining = ''
        this.interval = null
        this.loading = false
      }
    },
  },
})
</script>
