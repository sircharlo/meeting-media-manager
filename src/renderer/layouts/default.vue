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
import { createConnection } from 'net'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'os'
import { basename, join } from 'upath'
import Vue from 'vue'
import { Scene } from 'obs-websocket-js'
import { ipcRenderer } from 'electron'
// eslint-disable-next-line import/named
import { existsSync, renameSync, readFileSync, removeSync } from 'fs-extra'
import { WebDAVClient } from 'webdav'
import { ShortJWLang, CongPrefs, Release, Asset } from '~/types'
export default Vue.extend({
  name: 'DefaultLayout',
  data() {
    return {}
  },
  head() {
    return {
      htmlAttrs: {
        lang: this.$i18n.locale,
      },
    }
  },
  computed: {
    isDark(): boolean {
      return window.matchMedia('(prefers-color-scheme:dark)').matches
    },
    cong() {
      return this.$route.query.cong
    },
    scenes() {
      return (this.$store.state.obs.scenes as Scene[]).map(({ name }) => name)
    },
    client() {
      return this.$store.state.cong.client as WebDAVClient | null
    },
    store() {
      return this.$storePath()
    },
    path() {
      return this.$route.path
    },
  },
  watch: {
    cong: {
      handler(val) {
        if (val) {
          this.initPrefs('prefs-' + val)
        }
      },
      immediate: true,
    },
    path(val) {
      ipcRenderer.send('allowQuit', val.split('/').pop() !== 'present') // Don't allow to quit when presenting
    },
    isDark(val) {
      if (this.$getPrefs('app.theme') === 'system') {
        this.$vuetify.theme.dark = val
      }
    },
  },
  async beforeMount() {
    const congs = await this.$getCongPrefs()

    // If not congs, make a new one
    if (congs.length === 0) {
      const id = Math.random().toString(36).substring(2, 15)
      if (this.$route.path === '/') {
        this.initPrefs('prefs-' + id, true)
      } else {
        this.initPrefs('prefs-' + id)
      }
    }
    // If one congregation, open that one
    else if (congs.length === 1) {
      this.initPrefs(basename(congs[0].path, '.json'))
    }
  },
  async mounted() {
    const mediaWinOpen = await ipcRenderer.invoke('mediaWinOpen')
    this.$store.commit('present/setMediaScreenInit', mediaWinOpen)
    ipcRenderer.on('mediaWindowShown', () => {
      this.$store.commit('present/setMediaScreenInit', true)
      ipcRenderer.send('startMediaDisplay', this.$getAllPrefs())
    })
    ipcRenderer.on('mediaWindowVisibilityChanged', (_e, status: string) => {
      this.$store.commit('present/setMediaScreenVisible', status === 'shown')
    })
    ipcRenderer.on('readyToListen', () => {
      ipcRenderer.send('startMediaDisplay', this.$getAllPrefs())
    })
    ipcRenderer.on('moveMediaWindowToOtherScreen', async () => {
      ipcRenderer.send(
        'setMediaWindowPosition',
        await this.$getMediaWindowDestination()
      )
    })
    ipcRenderer.on('displaysChanged', async () => {
      ipcRenderer.send(
        'setMediaWindowPosition',
        await this.$getMediaWindowDestination()
      )
    })
    ipcRenderer.on('toggleMusicShuffle', async () => {
      await this.$shuffleMusic(this.$store.state.media.musicFadeOut)
    })
    ipcRenderer.on('setObsScene', async (_e, i: number) => {
      await this.$setScene(this.scenes[i])
    })
    ipcRenderer.on('notifyUser', (_e, msg: string[]) => {
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
        this.$route.path !== '/present'
      ) {
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
        await ipcRenderer.invoke(
          'openPath',
          fileURLToPath(pathToFileURL(downloadsPath).href)
        )
      } catch (e: any) {
        this.$error('updateNotDownloaded', e, this.$config.version)
        this.$store.commit('stats/setUpdateSuccess', false)
      }
    })

    await this.updateCleanup()
    await this.updateOnlineStatus()
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('error')
    ipcRenderer.removeAllListeners('setObsScene')
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
      const lang = this.$getPrefs('app.localAppLang') as string
      let newCong = false

      // If current cong does not equal new cong, set new cong
      if ('prefs-' + this.cong !== name) {
        newCong = true
        let path = this.$route.path
        if (lang !== this.$i18n.locale) {
          path = this.switchLocalePath(lang)
        }
        if (isNew) {
          path = this.localePath('/settings', lang)
        }
        this.$router.replace({
          path,
          query: {
            cong: name.replace('prefs-', ''),
          },
        })
      }
      // If congs lang is different from current lang, set new lang
      else if (lang !== this.$i18n.locale) {
        this.$router.replace(this.switchLocalePath(lang))
      }

      this.$dayjs.locale(lang.split('-')[0])
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
      if (themePref === 'system') {
        this.$vuetify.theme.dark = this.isDark
      } else {
        this.$vuetify.theme.dark = themePref === 'dark'
      }

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
      const langs = this.$getLocalJWLangs() as ShortJWLang[]
      const mediaLang = langs.find(
        (l) => l.langcode === this.$getPrefs('media.lang')
      )
      if (
        newCong &&
        mediaLang &&
        !this.$i18n.locales.map((l: any) => l.code).includes(mediaLang.symbol)
      ) {
        this.$notify('wannaHelpExplain', {
          type: 'wannaHelp',
          identifier: `${mediaLang.name} (${mediaLang.langcode}/${mediaLang.symbol})`,
          action: {
            type: 'link',
            label: 'wannaHelpForSure',
            url: `${this.$config.repo}/discussions/new?category=translations&title=New+translation+in+${mediaLang.name}&body=I+would+like+to+help+to+translate+M³+into+a+language+I+speak,${mediaLang.name} (${mediaLang.langcode}/${mediaLang.symbol}).`,
          },
        })
      }

      // Set runAtBoot depending on prefs and platform
      if (platform() !== 'linux') {
        ipcRenderer.send('runAtBoot', this.$getPrefs('app.autoRunAtBoot'))
      }

      // Set music shuffle shortcut if enabled
      if (this.$getPrefs('meeting.enableMusicButton')) {
        await this.$setShortcut('ALT+K', 'toggleMusicShuffle', 'mainWindow')
      }

      // If all cong fields are filled in, try to connect to the server
      if (!this.client) {
        const { server, user, password, dir } = this.$getPrefs(
          'cong'
        ) as CongPrefs
        if (server && user && password && dir) {
          const error = await this.$connect(server, user, password, dir)
          if (error === 'success') {
            await this.$forcePrefs()
          }
        }
      }

      // Connect or disconnect to OBS depending on prefs
      if (this.$getPrefs('app.obs.enable')) {
        await this.$getScenes()
      } else {
        this.$store.commit('obs/clear')
      }
    },
    async updateOnlineStatus(firstTry: boolean = true) {
      this.checkInternet(await this.isReachable('www.jw.org', 443, firstTry))
    },
    checkInternet(online: boolean) {
      if (online) {
        ipcRenderer.send('checkForUpdates')
      } else {
        setTimeout(async () => {
          await this.updateOnlineStatus(false)
        }, 10000)
      }
      this.$store.commit('stats/setOnline', online)
    },
    isReachable(hostname: string, port: number, silent: boolean) {
      return new Promise<boolean>((resolve) => {
        try {
          const client = createConnection(port, hostname)
          client.setTimeout(3000)
          client.on('timeout', () => {
            client.destroy(new Error('Timeout: ' + hostname + ':' + port))
          })
          client.on('connect', () => {
            client.destroy()
            resolve(true)
          })
          client.on('error', (e) => {
            if (!silent) {
              this.$error('errorSiteCheck', e, `${hostname}:${port}`)
            }
            resolve(false)
          })
        } catch (e: any) {
          console.error(e)
          resolve(false)
        }
      })
    },
    async updateCleanup() {
      let lastVersion = '0'
      const versionPath = join(this.$appPath(), 'lastRunVersion.json')
      const appDataPath = await ipcRenderer.invoke('appData')
      const JWMMF = join(appDataPath, 'jw-meeting-media-fetcher')

      // Try to get previous version
      try {
        if (existsSync(versionPath)) {
          lastVersion = readFileSync(versionPath, 'utf8')
        } else if (existsSync(join(JWMMF, 'lastRunVersion.json'))) {
          lastVersion = readFileSync(join(JWMMF, 'lastRunVersion.json'), 'utf8')
        }
      } catch (e: any) {
        this.$error('warnUnknownLastVersion', e)
      } finally {
        if (lastVersion !== this.$config.version) {
          try {
            // one-time migrate from JWMMF to mmm
            if (
              parseInt(lastVersion.replace(/\D/g, '')) <= 2255 &&
              parseInt(this.$config.version.replace(/\D/g, '')) >= 2256
            ) {
              const files = this.$findAll([
                join(JWMMF, 'pref*.json'),
                join(JWMMF, 'Publications'),
              ]) as string[]

              files.forEach((file) => {
                renameSync(file, join(this.$appPath(), basename(file)))
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
          } catch (e: any) {
            this.$log.error(e)
          }
        }
      }
    },
  },
})
</script>
