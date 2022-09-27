<template>
  <v-row justify="center" class="fill-height">
    <action-preview
      v-if="action"
      :text="action | text"
      :icon="action | icon"
      @abort="action = ''"
      @perform="execute(action)"
    />
    <v-row class="pa-4">
      <v-col cols="5" sm="4" md="3" />
      <v-col cols="2" sm="4" md="6" class="text-center">
        <font-awesome-icon
          :icon="statusIcon"
          size="3x"
          :flip="loading"
          :class="{
            'primary--text': loading,
            'secondary--text': !loading && !isDark,
            'accent--text': !loading && isDark,
          }"
        />
      </v-col>
      <v-col cols="5" sm="4" md="3">
        <v-select
          id="cong-select"
          v-model="cong"
          :items="congs"
          item-text="name"
          item-value="path"
          :disabled="loading || musicPlaying"
          :label="$t('congregationName')"
          dense
          solo
          @change="changeCong($event)"
        >
          <template #item="{ item }">
            <v-list-item-action v-if="congs.length > 1" class="me-0">
              <font-awesome-icon
                v-if="item.color === 'warning'"
                :icon="faSquareMinus"
                class="warning--text"
                size="xs"
                @click.stop="atCongClick(item)"
              />
              <v-tooltip v-else right>
                <template #activator="{ on, attrs }">
                  <font-awesome-icon
                    v-bind="attrs"
                    :icon="faSquareMinus"
                    class="error--text"
                    size="xs"
                    v-on="on"
                    @click.stop="atCongClick(item)"
                  />
                </template>
                <span>{{ $t('clickAgain') }}</span>
              </v-tooltip>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>{{ item.name }}</v-list-item-title>
            </v-list-item-content>
          </template>
          <template #append-item>
            <v-list-item id="add-cong-option" @click="addCong()">
              <v-list-item-action>
                <font-awesome-icon
                  :icon="faSquarePlus"
                  class="success--text"
                  size="xs"
                />
              </v-list-item-action>
              <v-list-item-content />
            </v-list-item>
          </template>
        </v-select>
      </v-col>
    </v-row>
    <v-col cols="12">
      <v-col cols="12" class="d-flex pb-0">
        <v-col
          v-for="(day, i) in daysOfWeek"
          :key="day.formatted"
          class="text-center flex-shrink-1 px-1 pb-0"
        >
          <v-card
            :color="dayColors[i]"
            class="fill-height d-flex justify-center flex-column"
            @click="openDate(day.formatted)"
          >
            <v-card-text class="pb-0 pt-2">{{ day.first }}</v-card-text>
            <v-card-text class="pt-0 pb-2">{{ day.second }}</v-card-text>
          </v-card>
        </v-col>
        <v-col class="pb-0 px-1">
          <v-card
            class="fill-height d-flex align-center"
            :color="recurringColor"
            @click="openDate('Recurring')"
          >
            <v-card-text class="text-center py-2">
              {{ $t('recurring') }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-col>
      <v-col cols="12" class="d-flex py-0">
        <v-col class="text-center flex-shrink-1 px-1 pb-0">
          <v-card
            class="fill-height d-flex justify-center flex-column pb-0"
            :color="jwSyncColor"
          >
            <v-card-text class="text-center py-2">{{ jwSync }}</v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="congSync" class="text-center flex-shrink-1 px-1 pb-0">
          <v-card
            class="fill-height d-flex justify-center flex-column pb-0"
            :color="congSyncColor"
          >
            <v-card-text class="text-center py-2">
              {{ $t('congMedia') }}
            </v-card-text>
          </v-card>
        </v-col>
        <v-col
          v-if="$getPrefs('media.enableMp4Conversion')"
          class="text-center flex-shrink-1 px-1 pb-0"
        >
          <v-card
            class="fill-height d-flex justify-center flex-column pb-0"
            :color="mp4Color"
          >
            <v-card-text class="text-center py-2">
              {{ $t('convertDownloaded') }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-col>
    </v-col>
    <v-col cols="12" class="text-center">
      <v-btn
        color="primary"
        :disabled="!online"
        :loading="loading"
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
          @change="resetColors()"
        />
      </v-col>
      <v-col class="d-flex justify-end">
        <icon-btn
          v-if="$getPrefs('meeting.enableMusicButton')"
          variant="shuffle"
          click-twice
          class="mr-2"
        />
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
import Vue from 'vue'
import { Dayjs } from 'dayjs'
import { basename, join } from 'upath'
import { ipcRenderer } from 'electron'
import {
  faPhotoVideo,
  faSquareMinus,
  faDownload,
  faCloud,
  faSquarePlus,
  faGlobeAmericas,
} from '@fortawesome/free-solid-svg-icons'
// eslint-disable-next-line import/named
import { existsSync } from 'fs-extra'
import { ShortJWLang } from '~/types'

export default Vue.extend({
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
          return 'quitAfterSync'
        case 'startMediaSync':
          return 'syncOnLaunch'
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    },
  },
  data() {
    return {
      cong: '',
      action: '',
      congs: [] as { name: string; path: string; color: string }[],
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
    statusIcon() {
      if (this.congSyncColor === 'warning') {
        return faCloud
      } else if (this.jwSyncColor === 'warning') {
        return faDownload
      } else if (this.loading) {
        return faGlobeAmericas
      } else {
        return faPhotoVideo
      }
    },
    faSquareMinus() {
      return faSquareMinus
    },
    faSquarePlus() {
      return faSquarePlus
    },
    initialLoad(): boolean {
      return this.$store.state.stats.initialLoad as boolean
    },
    congSync(): boolean {
      return !!this.$store.state.cong.client
    },
    mediaScreenVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
    isDark() {
      return this.$vuetify.theme.dark
    },
    online(): boolean {
      return this.$store.state.stats.online
    },
    musicPlaying(): boolean {
      return !!this.$store.state.media.musicFadeOut
    },
    congParam(): string {
      return this.$route.query.cong as string
    },
    jwSync(): string {
      const lang = (this.$getLocalJWLangs() as ShortJWLang[]).find(
        (lang) => lang.langcode === (this.$getPrefs('media.lang') as string)
      ) as ShortJWLang
      if (lang?.vernacularName) {
        return `${this.$t('syncJwOrgMedia')} (${lang?.vernacularName})`
      }
      return ''
    },
    upcomingWeeks(): { iso: number; label: string }[] {
      const weeks: { iso: number; label: string }[] = []

      for (let i = 0; i < 5; i++) {
        const monday = (this.$dayjs() as Dayjs)
          .add(i, 'weeks')
          .startOf('week')
          .format(
            (this.$getPrefs('app.outputFolderDateFormat') as string).replace(
              ' - dddd',
              ''
            )
          )
        const sunday = (this.$dayjs() as Dayjs)
          .add(i, 'weeks')
          .endOf('week')
          .format(
            (this.$getPrefs('app.outputFolderDateFormat') as string).replace(
              ' - dddd',
              ''
            )
          )
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
        .add(y, 'years')
        .isoWeek(this.currentWeek)
      return week.startOf('week')
    },
    daysOfWeek(): { first: string; second: string; formatted: string }[] {
      const days: { first: string; second: string; formatted: string }[] = []
      for (let i = 0; i < 7; i++) {
        const day = this.baseDate.add(i, 'days')
        if (day.isBefore(this.now)) continue
        const weekDay = day.day() === 0 ? 6 : day.day() - 1 // day is 0 indexed and starts with Sunday

        // Add meeting day
        if (
          !this.$getPrefs('meeting.specialCong') &&
          (weekDay === this.$getPrefs('meeting.mwDay') ||
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
  },
  async mounted() {
    if (!this.jwSync) {
      this.$router.push({
        path: this.localePath('/settings'),
        query: this.$route.query,
      })
    }
    if (!this.$getPrefs('meeting.specialCong')) {
      this.setDayColor(this.$getPrefs('meeting.mwDay'), 'secondary')
      this.setDayColor(this.$getPrefs('meeting.weDay'), 'secondary')
    }

    // Get all congregations
    this.congs = (await this.$getCongPrefs()).map(
      (cong: { name: string; path: string }) => {
        return {
          name: cong.name,
          path: cong.path,
          color: 'warning',
        }
      }
    )
    this.cong = this.$storePath() as string
    this.loading = false
    this.$log.debug('v' + (await this.$appVersion()))
    if (this.initialLoad && this.$getPrefs('app.autoStartSync')) {
      this.action = 'startMediaSync'
    }
    this.$store.commit('stats/setInitialLoad', false)
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
      this.dayColors[this.daysOfWeek.length + day - 7] = color
    },
    openDate(date: string) {
      this.$router.push({
        path: this.localePath('/add'),
        query: { ...this.$route.query, date },
      })
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
          this.setDayColor(this.$getPrefs('meeting.mwDay'), 'secondary')
          this.setDayColor(this.$getPrefs('meeting.weDay'), 'secondary')
        } else {
          this.dayColors[this.$getPrefs('meeting.mwDay')] = 'secondary'
          this.dayColors[this.$getPrefs('meeting.weDay')] = 'secondary'
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
      T: Portugese (Brazil)
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
    addCong() {
      if (this.$store.state.present.mediaScreenInit) {
        this.$toggleMediaWindow('close')
      }
      this.$store.commit('cong/clear')
      this.$store.commit('obs/clear')

      // Create new cong and switch to it
      const id = Math.random().toString(36).substring(2, 15)
      this.$switchCong(join(this.$appPath(), 'prefs-' + id + '.json'))
      this.$router.push({
        path: this.localePath('/settings'),
        query: { cong: id },
      })
    },
    changeCong(path: string) {
      this.$router.push({
        query: {
          cong: basename(path, '.json').replace('prefs-', ''),
        },
      })
    },
    atCongClick(item: { name: string; path: string; color: string }): void {
      if (item.color === 'warning') {
        item.color = 'error'
        setTimeout(() => {
          item.color = 'warning'
        }, 3000)
      }
      // Remove current congregation
      else if (this.cong === item.path) {
        this.$removeCong(item.path)

        // Switch to the first other congregation found
        this.$router.push({
          query: {
            cong: basename(
              this.congs.find((c) => c.path !== item.path)?.path as string,
              '.json'
            ).replace('prefs-', ''),
          },
        })
      } else {
        this.$removeCong(item.path)
        window.location.reload()
      }
    },
    isMeetingDay(day: number): boolean {
      const date = (this.$dayjs() as Dayjs).add(day, 'days')
      const weekDay = date.day() === 0 ? '6' : (date.day() - 1).toString() // day is 0 indexed and starts with Sunday
      return (
        weekDay === this.$getPrefs('meeting.mwDay') ||
        weekDay === this.$getPrefs('meeting.weDay')
      )
    },
    setProgress(loaded: number, total: number, global: boolean = false) {
      if (global) {
        this.totalProgress = (100 * loaded) / total
      } else {
        this.currentProgress = (100 * loaded) / total
      }
      if (this.currentProgress === 100) this.currentProgress = 0
      if (this.totalProgress === 100) this.totalProgress = 0
    },
    async getMwMedia(mwDay: Dayjs, filter: string = 'all') {
      if (filter !== 'we' && this.now.isSameOrBefore(mwDay)) {
        this.setDayColor(this.$getPrefs('meeting.mwDay'), 'warning')
        try {
          await this.$getMwMedia(
            mwDay.format(
              this.$getPrefs('app.outputFolderDateFormat') as string
            ),
            this.setProgress
          )
          this.setDayColor(this.$getPrefs('meeting.mwDay'), 'success')
        } catch (e: any) {
          this.$error('errorGetMwMedia', e)
          this.setDayColor(this.$getPrefs('meeting.mwDay'), 'error')
        }
      }
    },
    async getWeMedia(weDay: Dayjs, filter: string = 'all') {
      if (filter !== 'mw' && this.now.isSameOrBefore(weDay)) {
        this.setDayColor(this.$getPrefs('meeting.weDay'), 'warning')
        try {
          await this.$getWeMedia(
            weDay.format(
              this.$getPrefs('app.outputFolderDateFormat') as string
            ),
            this.setProgress
          )
          this.setDayColor(this.$getPrefs('meeting.weDay'), 'success')
        } catch (e: any) {
          this.$error('errorGetWeMedia', e)
          this.setDayColor(this.$getPrefs('meeting.weDay'), 'error')
        }
      }
    },
    async syncJWorgMedia(dryrun: boolean = false) {
      this.$store.commit('stats/startPerf', {
        func: 'syncJWorgMedia',
        start: performance.now(),
      })
      this.jwSyncColor = 'warning'

      try {
        await this.$syncJWMedia(dryrun, this.baseDate, this.setProgress)
        this.jwSyncColor = 'success'
      } catch (e: any) {
        this.$log.error(e)
        this.jwSyncColor = 'error'
      }
      this.$store.commit('stats/stopPerf', {
        func: 'syncJWorgMedia',
        stop: performance.now(),
      })
    },
    async startMediaSync(dryrun: boolean = false, filter: string = 'all') {
      this.loading = true
      this.$store.commit('stats/startPerf', {
        func: 'total',
        start: performance.now(),
      })
      try {
        const mwDay = this.baseDate.add(this.$getPrefs('meeting.mwDay'), 'days')
        const weDay = this.baseDate.add(this.$getPrefs('meeting.weDay'), 'days')

        // Remove old and invalid date directories
        if (!dryrun) {
          this.$rm(
            this.$findAll(join(this.$mediaPath(), '*/'), {
              ignore: [join(this.$mediaPath(), 'Recurring')],
              onlyDirectories: true,
            }).filter((dir: string) => {
              const date = this.$dayjs(
                basename(dir),
                this.$getPrefs('app.outputFolderDateFormat')
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
          } catch (e: any) {
            this.$error('errorGetCongMedia', e)
            this.congSyncColor = 'error'
          }
        }

        // If not dryrun, download all media
        if (!dryrun) {
          if (this.congSync) {
            try {
              await this.$syncCongMedia(this.baseDate, this.setProgress)
              if (this.congSyncColor === 'warning') {
                this.congSyncColor = 'success'
              }
            } catch (e: any) {
              this.congSyncColor = 'error'
              this.$error('errorSyncCongMedia', e)
            }
          }

          await this.syncJWorgMedia(dryrun)

          try {
            this.recurringColor = 'warning'
            if (
              !this.congSync &&
              existsSync(join(this.$mediaPath(), 'Recurring'))
            ) {
              await this.$syncLocalRecurringMedia(this.baseDate)
            }
            this.recurringColor = 'success'
          } catch (e: any) {
            this.$log.error(e)
            this.recurringColor = 'error'
          }
        }

        await this.$convertUnusableFiles(this.$mediaPath())

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
          } catch (e: any) {
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
          ipcRenderer.send(
            'openPath',
            fileURLToPath(pathToFileURL(this.$mediaPath()).href)
          )
        }

        this.$store.commit('stats/stopPerf', {
          func: 'total',
          stop: performance.now(),
        })
        this.$printStats()

        if (this.$getPrefs('app.autoQuitWhenDone')) {
          this.action = 'quitApp'
        }
      } catch (e: any) {
        this.$error('error', e)
      } finally {
        this.loading = false
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

  .accent *,
  .success * {
    color: #000 !important;
  }
}
.theme--dark {
  .secondary * {
    color: #fff !important;
  }

  .accent *,
  .success * {
    color: #000 !important;
  }
}
</style>
