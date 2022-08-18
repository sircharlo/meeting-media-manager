<template>
  <v-app>
    <flash />
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
import { basename, join } from 'upath'
import Vue from 'vue'
import { Scene } from 'obs-websocket-js'
import { ipcRenderer } from 'electron'
// eslint-disable-next-line import/named
import { existsSync, renameSync, readFileSync, removeSync } from 'fs-extra'
import { WebDAVClient } from 'webdav/web'
import { ShortJWLang, CongPrefs } from '~/types'
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
      ipcRenderer.send('allowQuit', val.split('/').pop() !== 'present')
    },
    isDark(val) {
      if (this.$getPrefs('app.theme') === 'system') {
        this.$vuetify.theme.dark = val
      }
    },
  },
  async beforeMount() {
    const congs = await this.$getCongPrefs()
    if (congs.length === 0) {
      const id = Math.random().toString(36).substring(2, 15)
      if (this.$route.path === '/') {
        this.initPrefs('prefs-' + id, true)
      } else {
        this.initPrefs('prefs-' + id)
      }
    } else if (congs.length === 1) {
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
    ipcRenderer.on('error', (_e, err) => {
      this.$log.error(err)
    })
    ipcRenderer.on('setObsScene', async (_e, i: number) => {
      await this.$setScene(this.scenes[i])
    })
    ipcRenderer.on('notifyUser', (_e, msg: string[]) => {
      this.$flash(this.$t(msg[1]) as string, msg[0])
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
  },
  methods: {
    async initPrefs(name: string, isNew = false) {
      this.$initStore(name)
      const lang = this.$getPrefs('app.localAppLang') as string
      if ('prefs-' + this.cong !== name) {
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
      } else if (lang !== this.$i18n.locale) {
        this.$router.replace(this.switchLocalePath(lang))
      }

      this.$dayjs.locale(lang.split('-')[0])
      this.$log.debug(this.$appPath())

      const themePref = this.$getPrefs('app.theme')
      if (themePref === 'system') {
        this.$vuetify.theme.dark = this.isDark
      } else {
        this.$vuetify.theme.dark = themePref === 'dark'
      }

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

      const langs = this.$getLocalJWLangs() as ShortJWLang[]
      const mediaLang = langs.find(
        (l) => l.langcode === this.$getPrefs('media.lang')
      )
      if (
        mediaLang &&
        !this.$i18n.locales.map((l: any) => l.code).includes(mediaLang.symbol)
      ) {
        this.$flash(`${this.$t('wannaHelp')} ${this.$t('wannaHelpExplain')}`)
        /* notifyUser("wannaHelp", translate("wannaHelpExplain") + "<br/><small>" +  translate("wannaHelpWillGoAway") + "</small>", currentLang.name + " (" + currentLang.langcode + "/" + currentLang.symbol + ")", true, null, {
            desc: "wannaHelpForSure",
            url: constants.REPO_URL + "discussions/new?category=translations&title=New+translation+in+" + currentLang.name + "&body=I+would+like+to+help+to+translate+M³+into+a+language+I+speak,+" + currentLang.name + " (" + currentLang.langcode + "/" + currentLang.symbol + ")."
          }) */
      }

      if (this.$getPrefs('meeting.enableMusicButton')) {
        await this.$setShortcut('ALT+K', 'toggleMusicShuffle', 'mainWindow')
      }

      if (!this.client) {
        const { server, user, password, dir } = this.$getPrefs(
          'cong'
        ) as CongPrefs
        if (server && user && password && dir) {
          const error = await this.$connect(server, user, password, dir)
          if (error === 'success') {
            await this.$forcePrefs()
          } else {
            this.$error(this.$t('errorGetCongMedia') as string)
          }
        }
      }

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
            this.$log.error(e)
            if (!silent) {
              this.$error(this.$t('errorSiteCheck') as string)
              /* notifyUser(
                'error',
                'errorSiteCheck',
                hostname + ':' + port,
                false,
                err
              ) */
            }
            resolve(false)
          })
        } catch (e) {
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

      try {
        if (existsSync(versionPath)) {
          lastVersion = readFileSync(versionPath, 'utf8')
        } else if (existsSync(join(JWMMF, 'lastRunVersion.json'))) {
          lastVersion = readFileSync(join(JWMMF, 'lastRunVersion.json'), 'utf8')
        }
      } catch (e) {
        this.$log.error(e)
        this.$error(this.$t('warnUnknownLastVersion') as string)
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
              this.$flash(this.$t('updateInstalled') as string)
              // notifyUser("info", "updateInstalled", currentAppVersion, false, null, {desc: "moreInfo", url: constants.REPO_URL + "releases/latest"})
            }
          } catch (e) {
            this.$log.error(e)
          }
        }
      }
    },
  },
})
</script>
