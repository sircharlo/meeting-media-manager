<!-- eslint-disable vue/no-unused-vars -->
<template>
  <v-row justify="center" class="fill-height mb-0">
    <v-col cols="12" class="text-center" style="margin-bottom: 72px">
      <v-tabs v-model="tab" grow style="position: sticky; top: 0; z-index: 99">
        <v-tab>{{ $t('all') }}</v-tab>
        <v-tab
          v-for="h in headers"
          :key="h.component"
          :class="{ 'error--text': !mounting && !h.valid }"
        >
          {{ getInitials(h.name) }}
        </v-tab>
      </v-tabs>
      <v-skeleton-loader v-if="mounting" type="list-item@4" />
      <v-expansion-panels
        v-show="!mounting"
        v-model="panel"
        multiple
        focusable
        accordion
        :readonly="tab !== 0"
      >
        <v-expansion-panel
          v-for="(header, i) in headers"
          v-show="tab === 0 || tab === i + 1"
          :key="header.component"
        >
          <v-expansion-panel-header>
            {{ header.name }}
          </v-expansion-panel-header>
          <v-expansion-panel-content class="pt-4">
            <component
              :is="header.component"
              :prefs="prefs"
              :cache="cache"
              @valid="setValid(header.component, $event)"
              @refresh="refreshPrefs(header.key, $event)"
              @cache="calcCache()"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
    <v-footer fixed class="justify-space-between">
      <v-col cols="12" align-self="end" class="d-flex">
        <v-col class="d-flex pa-0 align-center" align-self="center">
          <v-btn
            :color="updateSuccess ? undefined : 'error'"
            :class="{ 'mr-2': true, 'pulse-danger': !updateSuccess }"
            @click="openReleases()"
          >
            <font-awesome-icon
              v-if="!updateSuccess"
              :icon="faHandPointRight"
              class="mr-1"
            />
            M³ {{ $config.isDev ? 'dev' : $config.version }}
          </v-btn>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn class="mr-2" v-bind="attrs" v-on="on" @click="report()">
                <font-awesome-icon :icon="faBug" />
              </v-btn>
            </template>
            <span>{{ $t('reportIssue') }}</span>
          </v-tooltip>
          <v-tooltip
            v-if="cacheColor === 'warning'"
            :open-on-click="false"
            :open-on-focus="false"
            top
          >
            <template #activator="{ on, attrs }">
              <v-btn
                :color="cacheColor"
                :loading="loading"
                class="black--text"
                v-bind="attrs"
                v-on="on"
                @click="removeCache()"
              >
                <font-awesome-icon :icon="faTrash" pull="left" />
                {{ `${cache}MB` }}
              </v-btn>
            </template>
            <span>{{ $t('cleanCache') }}</span>
          </v-tooltip>
          <v-tooltip v-else :value="true" top>
            <template #activator="data">
              <v-btn
                :color="cacheColor"
                :loading="loading"
                class="black--text"
                @click="removeCache()"
              >
                <font-awesome-icon :icon="faTrash" pull="left" />
                {{ `${cache}MB` }}
              </v-btn>
            </template>
            <span>{{ $t('clickAgain') }}</span>
          </v-tooltip>
        </v-col>
        <v-col align-self="end" class="text-right pa-0">
          <icon-btn
            v-if="cancel && isNew && !valid"
            variant="cancel"
            @click="goBack()"
          />
          <!-- <icon-btn
            v-else
            variant="home"
            :loading="mounting"
            :disabled="!valid"
            :style="
              valid || mounting
                ? undefined
                : 'background-color: #B71C1C !important'
            "
          /> -->
        </v-col>
      </v-col>
    </v-footer>
  </v-row>
</template>
<script lang="ts">
import { join } from 'upath'
import { defineComponent } from 'vue'
import {
  faHandPointRight,
  faBug,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { ShortJWLang, ElectronStore } from '~/types'
import { BYTES_IN_KIBIBYTE, MS_IN_SEC } from '~/constants/general'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PREFS } = require('~/constants/prefs') as { PREFS: ElectronStore }
export default defineComponent({
  name: 'SettingsPage',
  data() {
    return {
      cache: 0,
      tab: 0,
      prefs: {
        ...PREFS,
      } as ElectronStore,
      cancel: false,
      mounting: true,
      mounted: false,
      cacheColor: 'warning',
      loading: false,
      shuffleMusicFiles: '',
      panel: [0, 1, 2, 3] as number[],
      headers: [
        {
          key: 'app',
          name: this.$t('optionsApp'),
          component: 'settings-app',
          valid: false,
        },
        {
          key: 'cong',
          name: this.$t('optionsCongSync'),
          component: 'settings-cong',
          valid: false,
        },
        {
          key: 'media',
          name: this.$t('optionsMedia'),
          component: 'settings-media',
          valid: false,
        },
        {
          key: 'meeting',
          name: this.$t('optionsMeetings'),
          component: 'settings-meetings',
          valid: false,
        },
      ] as {
        key: keyof ElectronStore
        name: string
        component: string
        valid: boolean
      }[],
    }
  },
  head() {
    return { title: 'Settings' }
  },
  computed: {
    cong(): string {
      return this.$route.query.cong as string
    },
    isNew(): boolean {
      return !!this.$route.query.new
    },
    online(): boolean {
      return this.$store.state.stats.online && !this.prefs.app.offline
    },
    valid(): boolean {
      return this.headers.every(({ valid }) => valid)
    },
    faHandPointRight() {
      return faHandPointRight
    },
    faBug() {
      return faBug
    },
    faTrash() {
      return faTrash
    },
    updateSuccess(): boolean {
      return this.$store.state.stats.updateSuccess as boolean
    },
    mediaLangObject(): ShortJWLang | null {
      return this.$store.state.media.mediaLang as ShortJWLang | null
    },
    isSignLanguage(): boolean {
      if (!this.prefs.media.lang) return false
      return !!this.mediaLangObject?.isSignLanguage
    },
  },
  watch: {
    valid(val: boolean) {
      if (val) this.calcCache()

      if (this.prefs.media.enableMediaDisplayButton) {
        if (val && this.prefs.media.presentShortcut) {
          this.$setShortcut(this.prefs.media.presentShortcut, 'openPresentMode')
        } else {
          this.$unsetShortcut('openPresentMode')
        }
      }
    },
    prefs: {
      handler() {
        this.calcCache()
      },
      deep: true,
    },
    tab(val: number) {
      if (this.tab === 0) this.panel = []
      else if (val > 0) {
        if (!this.panel.includes(val - 1)) {
          this.panel.push(val - 1)
        }
      }
    },
    headers: {
      handler() {
        // Open invalid settings and close valid settings on first load
        this.headers.forEach(({ valid }, i) => {
          const match = this.panel.indexOf(i)
          if (!valid && match === -1) {
            this.panel.push(i)
          } else if (!this.mounted && valid && match > -1) {
            if (this.tab === 0) {
              this.panel.splice(match, 1)
            }
          }
        })
        this.mounted ||= this.valid
      },
      deep: true,
    },
  },
  async mounted() {
    let congs = await this.$getCongPrefs()
    congs = congs.filter((c: { name: string; path: string }) => {
      return c.path !== join(this.$appPath(), `prefs-${this.cong}.json`)
    })

    if (congs.length > 0) {
      this.cancel = true
    }

    this.calcCache()
    setTimeout(() => {
      this.mounting = false
    }, 0.5 * MS_IN_SEC)
  },
  methods: {
    refreshPrefs(key: keyof ElectronStore, val: any) {
      this.prefs[key] = val
    },
    getInitials(word: string) {
      return word
        .split(' ')
        .map((w) => w[0])
        .join('')
    },
    setShuffleMusicFiles() {
      const pubPath = this.$pubPath()
      if (!pubPath) return ''
      this.shuffleMusicFiles = this.isSignLanguage
        ? join(pubPath, '..', this.prefs.media.lang, 'sjj', '**', '*.mp4')
        : join(pubPath, '..', 'E', 'sjjm', '**', '*.mp3')
    },
    setValid(component: string, valid: boolean) {
      const header = this.headers.find((h) => h.component === component)
      if (header) header.valid = valid
    },
    goBack() {
      console.debug('Go back')
      this.$removeCong(join(this.$appPath(), `prefs-${this.cong}.json`))
      this.$router.back()
    },
    calcCache(): void {
      this.setShuffleMusicFiles()
      if (!this.prefs.app.localOutputPath && !this.prefs.media.lang) {
        this.cache = 0
        return
      }

      const folders = []
      const pubPath = this.$pubPath()
      const mediaPath = this.$mediaPath()

      if (pubPath) {
        folders.push(join(pubPath, '**'))
        if (this.prefs.media.langFallback) {
          folders.push(join(pubPath, '..', this.prefs.media.langFallback, '**'))
        }
        folders.push(this.shuffleMusicFiles)
      }

      if (mediaPath) {
        folders.push(join(mediaPath, '**'))
      }

      this.cache = parseFloat(
        (
          this.$findAllStats(folders, {
            ignore: mediaPath ? [join(mediaPath, 'Recurring')] : [],
          })
            .map((file) => file.stats?.size ?? 0)
            .reduce((a: number, b: number) => a + b, 0) /
          BYTES_IN_KIBIBYTE /
          BYTES_IN_KIBIBYTE
        ).toFixed(1)
      )
    },
    async removeCache(): Promise<void> {
      if (this.cacheColor === 'warning') {
        this.cacheColor = 'error'
        setTimeout(() => {
          this.cacheColor = 'warning'
        }, 3 * MS_IN_SEC)
      } else {
        this.loading = true
        const folders = []

        const pubPath = this.$pubPath()
        const mediaPath = this.$mediaPath()

        if (pubPath) {
          folders.push(pubPath)
          if (this.prefs.media.langFallback) {
            folders.push(
              join(pubPath, '..', this.prefs.media.langFallback, '**')
            )
          }
          this.$rm(this.$findAll(this.shuffleMusicFiles))
        }

        if (mediaPath) {
          folders.push(join(mediaPath, '*'))
        }

        // Remove cache
        this.$rm(
          this.$findAll(folders, {
            ignore: mediaPath ? [join(mediaPath, 'Recurring')] : [],
            onlyDirectories: true,
          })
        )

        // Force refresh jw langs
        if (this.online) {
          await this.$getJWLangs(true)
          await this.$getYearText(true)
        }
        this.cacheColor = 'warning'
        this.calcCache()

        this.$store.commit('media/clear')
        this.$store.commit('db/clear')
      }
      this.loading = false
    },
    openReleases() {
      window.open(
        `${this.$config.repo}/releases/${
          this.updateSuccess ? 'tag/' + this.$config.version : ''
        }`,
        '_blank'
      )
    },
    report(): void {
      window.open(this.$bugURL(), '_blank')
    },
  },
})
</script>
