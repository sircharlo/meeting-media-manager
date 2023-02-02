<template>
  <v-row justify="center" class="fill-height">
    <action-preview
      v-if="action"
      :text="action | text"
      :icon="action | icon"
      @abort="action = ''"
      @perform="execute(action)"
    />
    <home-header :loading="loading" :jw="jwSyncColor" :cong="congSyncColor" />
    <v-col cols="12">
      <home-week-tiles
        :current-week="currentWeek"
        :day-colors="dayColors"
        :recurring-color="recurringColor"
      />
      <home-feature-tiles
        :jw="jwSyncColor"
        :cong="congSyncColor"
        :mp4="mp4Color"
      />
    </v-col>
    <v-col cols="12" class="text-center">
      <v-btn
        color="primary"
        :disabled="!online"
        :loading="loading"
        large
        @click="startMediaSync()"
      >
        {{ $t('fetchMedia') }}
      </v-btn>
      <v-btn
        v-if="$config.isDev"
        color="warning"
        :disabled="!online"
        :loading="loading"
        @click="testApp()"
      >
        Test App
      </v-btn>
    </v-col>
    <v-col cols="12" align-self="end" class="d-flex pa-0">
      <v-col class="text-center">
        <v-select
          id="week-select"
          v-model="currentWeek"
          :items="upcomingWeeks"
          item-text="label"
          item-value="iso"
          :disabled="loading"
          :label="$t('meeting')"
          solo
          dense
          hide-details="auto"
          class="justify-center"
          style="max-width: 250px"
          @change="resetColors()"
        />
      </v-col>
      <v-col class="d-flex justify-end">
        <div class="mr-2">
          <shuffle-btn v-if="$getPrefs('meeting.enableMusicButton')" />
        </div>
        <template v-if="$getPrefs('media.enableMediaDisplayButton')">
          <icon-btn variant="toggleScreen" class="mr-2" />
          <icon-btn variant="present" :disabled="loading" class="mr-2" />
        </template>
        <icon-btn variant="settings" :disabled="loading" />
      </v-col>
      <v-progress-linear
        v-if="currentProgress || totalProgress"
        fixed
        bottom
        stream
        striped
        :height="8"
        :buffer-value="currentProgress"
        :value="totalProgress"
      />
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { fileURLToPath, pathToFileURL } from 'url'
// eslint-disable-next-line import/named
import { existsSync } from 'fs-extra'
import { defineComponent } from 'vue'
import { Dayjs } from 'dayjs'
import { basename, join } from 'upath'
import { ipcRenderer } from 'electron'
import { ShortJWLang } from '~/types'
import { DAYS_IN_WEEK, HUNDRED_PERCENT } from '~/constants/general'

export default defineComponent({
  name: 'HomePage',
  filters: {
    icon(action: string) {
      switch (action) {
        case 'quitApp':
          return 'faPersonRunning'
        case 'startMediaSync':
          return 'faPause'
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
    text(action: string) {
      switch (action) {
        case 'quitApp':
          return 'autoQuitWhenDone'
        case 'startMediaSync':
          return 'autoStartSync'
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },
  data() {
    return {
      action: '',
      loading: true,
      currentProgress: 0,
      totalProgress: 0,
      currentWeek: this.$dayjs().isoWeek(),
      jwSyncColor: 'secondary',
      congSyncColor: 'secondary',
      recurringColor: 'secondary',
      mp4Color: 'secondary',
      dayColors: {
        0: 'accent',
        1: 'accent',
        2: 'accent',
        3: 'accent',
        4: 'accent',
        5: 'accent',
        6: 'accent',
      } as { [key: number]: string },
    }
  },
  head() {
    return { title: 'Home' }
  },
  computed: {
    initialLoad(): boolean {
      return this.$store.state.stats.initialLoad as boolean
    },
    congSync(): boolean {
      return !!this.$store.state.cong.client
    },
    weekParam(): number {
      return parseInt((this.$route.query.week as string) ?? -1)
    },
    online(): boolean {
      return this.$store.state.stats.online && !this.$getPrefs('app.offline')
    },
    congParam(): string {
      return this.$route.query.cong as string
    },
    mediaLangObject(): ShortJWLang | null {
      return this.$store.state.media.mediaLang as ShortJWLang | null
    },
    fallbackLangObject(): ShortJWLang | null {
      return this.$store.state.media.fallbackLang as ShortJWLang | null
    },
    upcomingWeeks(): { iso: number; label: string }[] {
      const weeks: { iso: number; label: string }[] = []
      const dateFormat = this.$getPrefs('app.outputFolderDateFormat') as string
      if (!dateFormat) return []

      for (let i = 0; i < 5; i++) {
        const monday = (this.$dayjs() as Dayjs)
          .add(i, 'weeks')
          .startOf('week')
          .format(dateFormat.replace(' - dddd', ''))
        const sunday = (this.$dayjs() as Dayjs)
          .add(i, 'weeks')
          .endOf('week')
          .format(dateFormat.replace(' - dddd', ''))
        weeks.push({
          iso: (this.$dayjs() as Dayjs).add(i, 'weeks').isoWeek(),
          label: `${monday} - ${sunday}`,
        })
      }

      return weeks
    },
    now() {
      return (this.$dayjs() as Dayjs).hour(0).minute(0).second(0).millisecond(0)
    },
    baseDate(): Dayjs {
      let y = 0
      if (this.currentWeek < this.$dayjs().isoWeek()) y = 1
      const week = (this.$dayjs() as Dayjs)
        .startOf('week')
        .add(y, 'years')
        .isoWeek(this.currentWeek)
      return week.startOf('week')
    },
    daysOfWeek(): { first: string; second: string; formatted: string }[] {
      const days: { first: string; second: string; formatted: string }[] = []
      for (let i = 0; i < DAYS_IN_WEEK; i++) {
        const day = this.baseDate.add(i, 'days')
        if (day.isBefore(this.now)) continue
        const weekDay = day.day() === 0 ? 6 : day.day() - 1 // Day is 0 indexed and starts with Sunday

        // Add meeting day
        if (
          !this.$getPrefs('meeting.specialCong') &&
          (weekDay === this.$getMwDay(this.baseDate) ||
            weekDay === this.$getPrefs('meeting.weDay'))
        ) {
          days.push({
            first: day.format('D MMM'),
            second: day.format('dddd'),
            formatted: day.format(
              this.$getPrefs('app.outputFolderDateFormat') as string
            ),
          })
        }
        // Add normal day
        else {
          days.push({
            first: day.format('D'),
            second: day.format('dd.'),
            formatted: day.format(
              this.$getPrefs('app.outputFolderDateFormat') as string
            ),
          })
        }
      }
      return days
    },
  },
  watch: {
    congParam(val: string) {
      if (val) {
        window.location.reload()
      }
    },
    currentWeek(val: number, oldVal: number) {
      console.debug(`Change current week from ${oldVal} to ${val}`)
      if (val !== this.weekParam) {
        this.$router.replace({
          query: {
            ...this.$route.query,
            week: val.toString(),
          },
        })
      }
    },
  },
  async mounted() {
    const promise = this.$getJWLangs()
    this.$store.commit('notify/deleteByMessage', 'cantCloseMediaWindowOpen')
    if (this.weekParam > -1) {
      this.currentWeek = this.weekParam
    }

    if (!this.$mediaPath()) {
      console.debug('Open settings to fill in mediaLang/localOutputFolder')
      this.$router.push({
        path: this.localePath('/settings'),
        query: this.$route.query,
      })
    }

    if (!this.$getPrefs('meeting.specialCong')) {
      this.setDayColor(this.$getMwDay(this.baseDate), 'secondary')
      this.setDayColor(this.$getPrefs('meeting.weDay') as number, 'secondary')
    }
    this.loading = false
    this.$log.debug('v' + (await this.$appVersion()))
    if (this.initialLoad && this.$getPrefs('app.autoStartSync')) {
      this.action = 'startMediaSync'
    }
    this.$store.commit('stats/setInitialLoad', false)
    await promise
  },
  methods: {
    async execute(action: string) {
      this.action = ''
      switch (action) {
        case 'startMediaSync':
          await this.startMediaSync()
          break
        case 'quitApp':
          ipcRenderer.send('exit')
          break
        default:
          throw new Error('Unknown action')
      }
    },
    setDayColor(day: number, color: string) {
      this.dayColors[this.daysOfWeek.length + day - DAYS_IN_WEEK] = color
    },
    resetColors() {
      this.jwSyncColor =
        this.congSyncColor =
        this.recurringColor =
        this.mp4Color =
          'secondary'
      this.dayColors = {
        0: 'accent',
        1: 'accent',
        2: 'accent',
        3: 'accent',
        4: 'accent',
        5: 'accent',
        6: 'accent',
      }
      if (!this.$getPrefs('meeting.specialCong')) {
        if (this.currentWeek === this.$dayjs().isoWeek()) {
          this.setDayColor(this.$getMwDay(this.baseDate), 'secondary')
          this.setDayColor(
            this.$getPrefs('meeting.weDay') as number,
            'secondary'
          )
        } else {
          this.dayColors[this.$getMwDay(this.baseDate)] = 'secondary'
          this.dayColors[this.$getPrefs('meeting.weDay') as number] =
            'secondary'
        }
      }
    },
    async testApp() {
      const previousLang = this.$clone(this.$getPrefs('media.lang')) as string
      /*
      AML: American Sign Language
      E: English
      F: French
      O: Dutch
      M: Romanian
      R: Armenian (West)
      S: Spanish
      T: Portuguese (Brazil)
      U: Russian
      X: German
      */
      const testLangs = ['AML', 'E', 'F', 'M', 'O', 'R', 'S', 'T', 'U', 'X']
      for (const lang of testLangs) {
        this.$setPrefs('media.lang', lang)
        this.$store.commit('db/clear')
        this.$store.commit('media/clear')
        await this.startMediaSync(true)
      }
      this.$setPrefs('media.lang', previousLang)
      this.$store.commit('db/clear')
      this.$store.commit('media/clear')
      if (!testLangs.includes(previousLang)) {
        await this.startMediaSync(true)
      }
    },
    setProgress(loaded: number, total: number, global = false) {
      if (global) {
        this.totalProgress = (HUNDRED_PERCENT * loaded) / total
      } else {
        this.currentProgress = this.totalProgress
          ? this.totalProgress +
            ((HUNDRED_PERCENT - this.totalProgress) * loaded) / total
          : (HUNDRED_PERCENT * loaded) / total
      }
      if (this.currentProgress === HUNDRED_PERCENT) this.currentProgress = 0
      if (this.totalProgress === HUNDRED_PERCENT) this.totalProgress = 0
    },
    async getMwMedia(mwDay: Dayjs, filter = 'all') {
      if (
        this.mediaLangObject?.mwbAvailable === false &&
        (!this.fallbackLangObject ||
          this.fallbackLangObject?.mwbAvailable === false)
      ) {
        this.$warn('errorMwbUnavailable')
        this.setDayColor(this.$getMwDay(this.baseDate), 'error')
      } else if (filter !== 'we' && this.now.isSameOrBefore(mwDay)) {
        this.setDayColor(this.$getMwDay(this.baseDate), 'warning')
        try {
          await this.$getMwMedia(
            mwDay.format(
              this.$getPrefs('app.outputFolderDateFormat') as string
            ),
            this.setProgress
          )
          this.setDayColor(this.$getMwDay(this.baseDate), 'success')
        } catch (e: unknown) {
          this.$error('errorGetMwMedia', e)
          this.setDayColor(this.$getMwDay(this.baseDate), 'error')
        }
      }
    },
    async getWeMedia(weDay: Dayjs, filter = 'all') {
      if (
        this.mediaLangObject?.wAvailable === false &&
        (!this.fallbackLangObject ||
          this.fallbackLangObject?.wAvailable === false)
      ) {
        this.$warn('errorWUnavailable')
        this.setDayColor(this.$getPrefs('meeting.weDay') as number, 'error')
      } else if (filter !== 'mw' && this.now.isSameOrBefore(weDay)) {
        this.setDayColor(this.$getPrefs('meeting.weDay') as number, 'warning')
        try {
          await this.$getWeMedia(
            weDay.format(
              this.$getPrefs('app.outputFolderDateFormat') as string
            ),
            this.setProgress
          )
          this.setDayColor(this.$getPrefs('meeting.weDay') as number, 'success')
        } catch (e: unknown) {
          this.$error('errorGetWeMedia', e)
          this.setDayColor(this.$getPrefs('meeting.weDay') as number, 'error')
        }
      }
    },
    async syncCongMedia() {
      if (this.congSync) {
        try {
          await this.$syncCongMedia(this.baseDate, this.setProgress)
          if (this.congSyncColor === 'warning') {
            this.congSyncColor = 'success'
          }
        } catch (e: unknown) {
          this.congSyncColor = 'error'
          this.$error('errorSyncCongMedia', e)
        }
      }
    },
    async syncLocalRecurringMedia() {
      try {
        this.recurringColor = 'warning'
        if (
          !this.congSync &&
          existsSync(join(this.$mediaPath(), 'Recurring'))
        ) {
          await this.$syncLocalRecurringMedia(this.baseDate)
        }
        this.recurringColor = 'success'
      } catch (e: unknown) {
        this.$log.error(e)
        this.recurringColor = 'error'
      }
    },
    async syncJWorgMedia(dryrun = false) {
      this.$store.commit('stats/startPerf', {
        func: 'syncJWorgMedia',
        start: performance.now(),
      })
      this.jwSyncColor = 'warning'

      try {
        await this.$syncJWMedia(dryrun, this.baseDate, this.setProgress)
        this.jwSyncColor = 'success'
      } catch (e: unknown) {
        this.$log.error(e)
        this.jwSyncColor = 'error'
      }
      this.$store.commit('stats/stopPerf', {
        func: 'syncJWorgMedia',
        stop: performance.now(),
      })
    },
    async startMediaSync(dryrun = false, filter = 'all') {
      const mediaPath = this.$mediaPath()
      if (!mediaPath) return
      this.$store.commit('notify/deleteByMessage', 'dontForgetToGetMedia')
      this.loading = true
      this.$store.commit('stats/startPerf', {
        func: 'total',
        start: performance.now(),
      })
      try {
        const mwDay = this.baseDate.add(this.$getMwDay(this.baseDate), 'days')
        const weDay = this.baseDate.add(
          this.$getPrefs('meeting.weDay') as number,
          'days'
        )

        // Remove old and invalid date directories
        if (!dryrun) {
          this.$rm(
            this.$findAll(join(mediaPath, '*'), {
              ignore: [join(mediaPath, 'Recurring')],
              onlyDirectories: true,
            }).filter((dir: string) => {
              const date = this.$dayjs(
                basename(dir),
                this.$getPrefs('app.outputFolderDateFormat') as string
              ) as Dayjs
              return !date.isValid() || date.isBefore(this.now)
            })
          )
        }
        this.$store.commit('stats/startPerf', {
          func: 'getJwOrgMedia',
          start: performance.now(),
        })

        // Get media
        if (!this.$getPrefs('meeting.specialCong')) {
          await Promise.allSettled([
            this.getMwMedia(mwDay, filter),
            this.getWeMedia(weDay, filter),
          ])
        }

        this.$store.commit('stats/stopPerf', {
          func: 'getJwOrgMedia',
          stop: performance.now(),
        })

        // Create media names
        this.$createMediaNames()

        // Get cong media
        if (this.congSync) {
          try {
            this.congSyncColor = 'warning'
            this.$getCongMedia(this.baseDate, this.now)
            if (dryrun) {
              this.congSyncColor = 'success'
            }
          } catch (e: unknown) {
            this.$error('errorGetCongMedia', e)
            this.congSyncColor = 'error'
          }
        }

        // If not dryrun, download all media
        if (!dryrun) {
          await Promise.allSettled([
            this.syncCongMedia(),
            this.syncLocalRecurringMedia(),
            this.syncJWorgMedia(dryrun),
          ])
        }

        await this.$convertUnusableFiles(mediaPath)

        // Convert media to mp4 if enabled
        if (this.$getPrefs('media.enableMp4Conversion')) {
          this.$store.commit('stats/startPerf', {
            func: 'convertMP4',
            start: performance.now(),
          })
          this.mp4Color = 'warning'
          try {
            await this.$convertToMP4(this.baseDate, this.now, this.setProgress)
            this.mp4Color = 'success'
          } catch (e: unknown) {
            this.$log.error(e)
            this.mp4Color = 'error'
          } finally {
            this.$store.commit('stats/stopPerf', {
              func: 'convertMP4',
              stop: performance.now(),
            })
          }
        }

        // Create VLC playlist if enabled
        if (this.$getPrefs('media.enableVlcPlaylistCreation')) {
          this.$convertToVLC()
        }

        // Open media folder if enabled
        if (this.$getPrefs('app.autoOpenFolderWhenDone')) {
          try {
            ipcRenderer.send(
              'openPath',
              fileURLToPath(pathToFileURL(mediaPath).href)
            )
          } catch (e: unknown) {
            this.$warn('errorSetVars', { identifier: mediaPath }, e)
          }
        }

        this.$store.commit('stats/stopPerf', {
          func: 'total',
          stop: performance.now(),
        })
        this.$printStats()

        if (this.$getPrefs('app.autoQuitWhenDone')) {
          this.action = 'quitApp'
        }
      } catch (e: unknown) {
        this.$error('errorUnknown', e)
      } finally {
        this.loading = false
        this.$store.commit('stats/clearPerf')
        this.$store.commit('stats/clearDownloadStats')
        this.$store.commit('media/clearProgress')
      }
    },
  },
})
</script>
<style lang="scss">
.theme--light {
  .secondary * {
    color: #fff !important;
  }

  .accent * {
    color: #000 !important;
  }
}
.theme--dark {
  .secondary * {
    color: #fff !important;
  }

  .accent * {
    color: #000 !important;
  }

  .success * {
    color: #000 !important;
  }
}
</style>
