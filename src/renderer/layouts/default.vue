<template>
  <v-app>
    <notify-user />
    <v-main>
      <v-container fluid fill-height>
        <nuxt v-if="cong" />
        <cong-select v-else @selected="initPrefs($event)" />
      </v-container>
    </v-main>
  </v-app>
</template>
<script lang="ts">
import { fileURLToPath, pathToFileURL } from 'url'
import { platform, userInfo } from 'os'
// eslint-disable-next-line import/named
import { existsSync, readFileSync, removeSync } from 'fs-extra'
import { basename, join } from 'upath'
import { defineComponent } from 'vue'
import getUsername from 'fullname'
import { ipcRenderer } from 'electron'
import { LocaleObject } from '@nuxtjs/i18n'
import {
  ShortJWLang,
  CongPrefs,
  Release,
  Asset,
  ElectronStore,
  ObsPrefs,
} from '~/types'
import { LAST_JWMMF_VERSION } from '~/constants/general'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { STALE_LANGS } = require('./../constants/lang') as {
  STALE_LANGS: string[]
}
export default defineComponent({
  name: 'DefaultLayout',
  head() {
    return {
      htmlAttrs: {
        lang: this.$i18n.localeProperties.iso ?? this.$i18n.locale,
      },
    }
  },
  computed: {
    isDark(): boolean {
      return window.matchMedia('(prefers-color-scheme:dark)').matches
    },
    online(): boolean {
      return this.$store.state.stats.online as boolean
    },
    cong() {
      return this.$route.query.cong
    },
    scenes(): string[] {
      return (this.$store.state.obs.scenes as string[]).filter(
        (s) =>
          s !== this.$getPrefs('app.obs.mediaScene') &&
          s !== this.$getPrefs('app.obs.zoomScene')
      )
    },
  },
  watch: {
    cong: {
      handler(val: string, oldVal: string | null) {
        if (oldVal && val) {
          this.initPrefs('prefs-' + val)
        }
      },
      immediate: true,
    },
    online(val: boolean) {
      if (val) {
        ipcRenderer.send('checkForUpdates')
        this.$store.commit('notify/deleteByMessage', 'errorOffline')
      } else {
        this.$warn('errorOffline')
      }
    },
    isDark(val: boolean) {
      if (this.$getPrefs('app.theme') === 'system') {
        this.$vuetify.theme.dark = val
      }
    },
  },
  async beforeMount() {
    if (this.cong) {
      this.initPrefs('prefs-' + this.cong)
    } else {
      const congs = (await this.$getCongPrefs()) as {
        name: string
        path: string
      }[]

      // If not congs, make a new one
      if (congs.length === 0) {
        // eslint-disable-next-line no-magic-numbers
        const id = Math.random().toString(36).substring(2, 15)
        if (this.$route.path === this.localePath('/')) {
          this.initPrefs('prefs-' + id, true)
        } else {
          this.initPrefs('prefs-' + id)
        }
      }
      // If one congregation, open that one
      else if (congs.length === 1) {
        this.initPrefs(basename(congs[0].path, '.json'))
      }
      // If computer username matches congregation name, auto login
      else {
        const username = (await getUsername()) ?? userInfo().username
        const match = congs.find(
          (c) => c.name?.toLowerCase().trim() === username.toLowerCase().trim()
        )
        if (match) {
          this.initPrefs(basename(match.path, '.json'))
        }
      }
    }
  },
  async mounted() {
    console.debug('sentry', this.$config.sentryEnabled)
    const mediaWinOpen = await ipcRenderer.invoke('mediaWinOpen')
    this.$store.commit('present/setMediaScreenInit', mediaWinOpen)
    if (mediaWinOpen) {
      const mediaWinVisible = await ipcRenderer.invoke('mediaWinVisible')
      this.$store.commit('present/setMediaScreenVisible', mediaWinVisible)
    }
    ipcRenderer.on('mediaWindowShown', () => {
      this.$store.commit('present/setMediaScreenInit', true)
      ipcRenderer.send('startMediaDisplay', this.$getAllPrefs())
    })
    ipcRenderer.on('mediaWindowVisibilityChanged', (_e, status: string) => {
      this.$store.commit('present/setMediaScreenVisible', status === 'shown')
    })
    ipcRenderer.on('log', (_e, msg) => {
      console.log('main', msg)
    })
    ipcRenderer.on('readyToListen', () => {
      ipcRenderer.send('startMediaDisplay', this.$getAllPrefs())
    })
    ipcRenderer.on('moveMediaWindowToOtherScreen', async () => {
      if (this.$store.state.present.mediaScreenInit) {
        const dest = await this.$getMediaWindowDestination()
        ipcRenderer.send('showMediaWindow', dest)
      }
    })
    ipcRenderer.on('displaysChanged', async () => {
      if (this.$store.state.present.mediaScreenInit) {
        ipcRenderer.send(
          'showMediaWindow',
          await this.$getMediaWindowDestination()
        )
      }
    })
    ipcRenderer.on('toggleMusicShuffle', async () => {
      await this.$shuffleMusic(!!this.$store.state.media.musicFadeOut)
    })
    ipcRenderer.on('setObsScene', async (_e, key: number) => {
      console.debug('Set obs scene via shortcut', key)
      const index = key === 0 ? 9 : key - 1
      await this.$setScene(this.scenes[index])
    })
    ipcRenderer.on('themeUpdated', (_e, isDark) => {
      if (this.$getPrefs('app.theme') === 'system') {
        this.$vuetify.theme.dark = isDark
      }
    })
    ipcRenderer.on('notifyUser', (_e, msg: any[]) => {
      if (msg[0]) {
        this.$notify(msg[0], msg[1], msg[3])
      } else {
        console.warn('Notify message is empty: ', msg)
      }
      if (msg[0] === 'updateNotDownloaded') {
        this.$store.commit('stats/setUpdateSuccess', false)
      }
    })
    ipcRenderer.on('openPresentMode', () => {
      if (
        this.$getPrefs('media.enableMediaDisplayButton') &&
        this.$route.path !== this.localePath('/present')
      ) {
        console.debug('Trigger present mode via shortcut')
        this.$router.push({
          path: this.localePath('/present'),
          query: this.$route.query,
        })
      }
    })

    ipcRenderer.on('macUpdate', async () => {
      try {
        const latestRelease = (await this.$ghApi.$get(
          `releases/latest`
        )) as Release

        const macDownload = latestRelease.assets.find(({ name }) =>
          name.includes('dmg')
        ) as Asset

        this.$notify('updateDownloading', {
          identifier: latestRelease.tag_name,
        })

        const downloadsPath = join(
          (await ipcRenderer.invoke('downloads')) as string,
          macDownload.name
        )

        // Download the latest release
        this.$write(
          downloadsPath,
          Buffer.from(
            new Uint8Array(
              await this.$axios.$get(macDownload.browser_download_url, {
                responseType: 'arraybuffer',
              })
            )
          )
        )

        // Open the downloaded file
        ipcRenderer.send(
          'openPath',
          fileURLToPath(pathToFileURL(downloadsPath).href)
        )
      } catch (e: unknown) {
        this.$error('updateNotDownloaded', e)
        this.$store.commit('stats/setUpdateSuccess', false)
      }
    })

    // Listen for online status
    if (navigator.onLine) {
      this.$store.commit('stats/setOnline', true)
    } else {
      this.$warn('errorOffline')
    }
    window.addEventListener('offline', (_e) => {
      this.$store.commit('stats/setOnline', false)
    })

    window.addEventListener('online', (_e) => {
      this.$store.commit('stats/setOnline', true)
    })
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('error')
    ipcRenderer.removeAllListeners('setObsScene')
    ipcRenderer.removeAllListeners('themeUpdated')
    ipcRenderer.removeAllListeners('openPresentMode')
    ipcRenderer.removeAllListeners('readyToListen')
    ipcRenderer.removeAllListeners('openPresentMode')
    ipcRenderer.removeAllListeners('mediaWindowShown')
    ipcRenderer.removeAllListeners('mediaWindowVisibilityChanged')
    ipcRenderer.removeAllListeners('toggleMusicShuffle')
    ipcRenderer.removeAllListeners('displaysChanged')
    ipcRenderer.removeAllListeners('moveMediaWindowToOtherScreen')
    ipcRenderer.removeAllListeners('macUpdate')
  },
  methods: {
    async initPrefs(name: string, isNew = false) {
      this.$initStore(name)
      let newCong = false
      let lang = this.$getPrefs('app.localAppLang') as string
      if (!lang) {
        lang = this.$i18n.getBrowserLocale() ?? this.$i18n.defaultLocale
        this.$setPrefs('app.localAppLang', lang)
        console.debug(`Setting app lang to ${lang}`)
      }

      let path = this.$route.path

      // If current cong does not equal new cong, set new cong
      if ('prefs-' + this.cong !== name) {
        newCong = true
        if (lang && lang !== this.$i18n.locale) {
          path = this.switchLocalePath(lang)
        }
        if (isNew || !this.$mediaPath()) {
          path = this.localePath('/settings', lang)
        }
        console.debug('Set correct lang and/or open settings for new cong')
        this.$router.replace({
          path,
          query: {
            cong: name.replace('prefs-', ''),
          },
        })
      }
      // If congs lang is different from current lang, set new lang
      else if (lang && lang !== this.$i18n.locale) {
        console.debug(`Change lang from ${this.$i18n.locale} to ${lang}`)
        path = this.switchLocalePath(lang)

        if (!this.$mediaPath()) {
          path = this.localePath('/settings', lang)
        }

        this.$router.replace(path)
      }

      const locales = this.$i18n.locales as LocaleObject[]
      const locale = locales.find((l) => l.code === lang)
      this.$dayjs.locale(locale?.dayjs ?? lang ?? 'en')
      this.$log.debug(this.$appPath())

      // Set disabledHardwareAcceleration to user pref
      const disableHA = this.$getPrefs('app.disableHardwareAcceleration')
      const haPath = join(this.$appPath(), 'disableHardwareAcceleration')
      const haExists = existsSync(haPath)

      // Only do something if the value is not in sync with the presence of the file
      if (disableHA && !haExists) {
        this.$write(haPath, '')
      } else if (!disableHA && haExists) {
        this.$rm(haPath)
      }

      if (disableHA !== haExists) {
        ipcRenderer.send('restart')
      }

      // Set app theme
      const themePref = this.$getPrefs('app.theme')
      ipcRenderer.send('setTheme', themePref)
      if (themePref === 'system') {
        this.$vuetify.theme.dark = this.isDark
      } else {
        this.$vuetify.theme.dark = themePref === 'dark'
      }

      // Setup Sentry context
      this.$sentry.setUser({
        username: this.$getPrefs('app.congregationName') as string,
      })

      this.$sentry.setContext('prefs', {
        ...this.$getAllPrefs(),
        obs: this.$getPrefs('app.obs'),
      })

      // Open or close the media window depending on prefs
      if (
        this.$getPrefs('media.enableMediaDisplayButton') &&
        !this.$store.state.present.mediaScreenInit
      ) {
        this.$toggleMediaWindow('open')
      } else if (
        !this.$getPrefs('media.enableMediaDisplayButton') &&
        this.$store.state.present.mediaScreenInit
      ) {
        this.$toggleMediaWindow('close')
      }

      // Check if the app is available in the current media lang
      const langs = (await this.$getJWLangs()) as ShortJWLang[]
      const mediaLang = langs.find(
        (l) => l.langcode === this.$getPrefs('media.lang')
      )
      const appLang = langs.find(
        (l) => l.symbol === this.$getPrefs('app.localAppLang')
      )

      if (
        newCong &&
        mediaLang &&
        !this.$i18n.locales
          .map((l: any) => l.code)
          .includes(this.convertSignLang(mediaLang.symbol))
      ) {
        this.$notify('wannaHelpExplain', {
          type: 'wannaHelp',
          identifier: `${mediaLang.name} (${mediaLang.langcode}/${mediaLang.symbol})`,
          action: {
            type: 'link',
            label: 'wannaHelpForSure',
            url: `${this.$config.repo}/discussions/new?category=translations&labels=translations&title=New+translation+in+${mediaLang.name}&body=I+would+like+to+help+translate+M³+into+a+language+I+speak,+${mediaLang.name} (${mediaLang.langcode}/${mediaLang.symbol}).`,
          },
        })
      } else if (newCong && appLang && STALE_LANGS.includes(appLang.symbol)) {
        this.$notify('wannaHelpExisting', {
          type: 'wannaHelp',
          identifier: `${appLang.name} (${appLang.langcode}/${appLang.symbol})`,
          action: {
            type: 'link',
            label: 'wannaHelpForSure',
            url: `${this.$config.repo}/discussions/new?category=translations&labels=translations&title=New+translator+for+${appLang.name}&body=I+would+like+to+help+translate+M³+into+a+language+I+speak,+${appLang.name} (${appLang.langcode}/${appLang.symbol}).`,
          },
        })
      }

      // Set runAtBoot depending on prefs and platform
      if (platform() !== 'linux') {
        ipcRenderer.send('runAtBoot', this.$getPrefs('app.autoRunAtBoot'))
      }

      // Set disable auto update depending on prefs
      ipcRenderer.send(
        'toggleAutoUpdate',
        !this.$getPrefs('app.disableAutoUpdate')
      )

      // Set music shuffle shortcut if enabled
      if (this.$getPrefs('meeting.enableMusicButton')) {
        await this.$setShortcut(
          this.$getPrefs('meeting.shuffleShortcut') as string,
          'toggleMusicShuffle',
          'music'
        )
      }

      // If all cong fields are filled in, try to connect to the server
      this.$store.commit('cong/clear')
      console.log('online', this.online)
      if (!this.$getPrefs('app.offline')) {
        const { server, user, password, dir } = this.$getPrefs(
          'cong'
        ) as CongPrefs
        console.log('cong prefs complete', server && user && password && dir)
        if (server && user && password && dir) {
          const error = await this.$connect(server, user, password, dir)
          console.log('result', error)
          if (error === 'success') {
            await this.$forcePrefs()
          } else {
            this.$warn('errorWebdavLs', { identifier: dir })
          }
        }
      }

      // Connect to OBS depending on prefs
      this.$store.commit('obs/clear')
      const { enable, port, password } = this.$getPrefs('app.obs') as ObsPrefs
      if (enable && port && password) {
        await this.$getScenes()
      }

      // Regular Cleanup
      await this.cleanup()
    },
    async cleanup() {
      let lastVersion = '0'
      const versionPath = join(this.$appPath(), 'lastRunVersion.json')
      const appDataPath = await ipcRenderer.invoke('appData')
      const JWMMF = join(appDataPath, 'jw-meeting-media-fetcher')

      // Cleanup old JWMMF/M3 files
      try {
        // Try to get previous version
        if (existsSync(versionPath)) {
          lastVersion = readFileSync(versionPath, 'utf8')
        } else if (existsSync(join(JWMMF, 'lastRunVersion.json'))) {
          lastVersion = readFileSync(join(JWMMF, 'lastRunVersion.json'), 'utf8')
        }
      } catch (e: unknown) {
        this.$error('warnUnknownLastVersion', e)
      } finally {
        if (lastVersion !== this.$config.version) {
          try {
            // One-time migrate from JWMMF to mmm
            if (
              parseInt(lastVersion.replace(/\D/g, '')) <= LAST_JWMMF_VERSION &&
              parseInt(this.$config.version.replace(/\D/g, '')) >
                LAST_JWMMF_VERSION
            ) {
              const files = this.$findAll([
                join(JWMMF, 'pref*.json'),
                join(JWMMF, 'Publications'),
              ]) as string[]

              files.forEach((file) => {
                this.$move(file, join(this.$appPath(), basename(file)), true)
              })
              removeSync(JWMMF)
            }

            if (lastVersion !== '0') {
              this.$notify('updateInstalled', {
                identifier: this.$config.version,
                action: {
                  type: 'link',
                  label: 'moreInfo',
                  url: `${this.$config.repo}/releases/latest`,
                },
              })
            }
            this.$write(versionPath, this.$config.version)
          } catch (e: unknown) {
            this.$log.error(e)
          }
        }
      }

      // Cleanup old pref files
      if (this.cong) {
        ;(
          this.$findAll(join(this.$appPath(), 'prefs-*.json'), {
            ignore: [join(this.$appPath(), `prefs-${this.cong}.json`)],
          }) as string[]
        ).forEach((file) => {
          const prefs = JSON.parse(readFileSync(file, 'utf8')) as ElectronStore
          // @ts-ignore: congregationName doesn't exist in ElectronStore
          if (!prefs.congregationName && !prefs.app?.congregationName) {
            this.$rm(file)
          }
        })
      }
    },
    convertSignLang(symbol: string) {
      return symbol
        .replace('ase', 'en') // American Sign Language
        .replace('bfi', 'en') // British Sign Language
        .replace('bzs', 'pt')
        .replace('rsl', 'ru')
        .replace('gsg', 'de')
        .replace('ssp', 'es')
        .replace('fse', 'fi')
        .replace('fsl', 'fr')
        .replace('ise', 'it')
        .replace('dse', 'nl')
        .replace('hsh', 'hu')
        .replace('psr', 'pt-pt')
        .replace('swl', 'sv')
        .replace('mzc', 'mg')
    },
  },
})
</script>
