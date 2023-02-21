<!-- eslint-disable vue/no-v-html -->
<template>
  <v-form ref="appForm" v-model="valid">
    <form-input
      id="app.offline"
      v-model="app.offline"
      field="switch"
      :label="$t('offlineMode')"
      :locked="$isLocked('app.offline')"
    />
    <form-input
      id="app.theme"
      v-model="app.theme"
      field="select"
      :items="[
        { text: $t('light'), value: 'light' },
        { text: $t('dark'), value: 'dark' },
        { text: $t('system'), value: 'system' },
      ]"
      :label="$t('themePreference')"
      :locked="$isLocked('app.theme')"
    />
    <form-input
      id="app.congregationName"
      v-model="app.congregationName"
      :label="$t('congregationName')"
      :locked="$isLocked('app.congregationName')"
      required
      @blur="renameBg()"
    />
    <form-input
      id="app.localAppLang"
      v-model="app.localAppLang"
      field="autocomplete"
      :label="$t('localAppLang')"
      :items="$i18n.locales"
      item-text="name"
      item-value="code"
      required
      auto-select-first
      :locked="$isLocked('app.localAppLang')"
    />
    <v-row>
      <v-col cols="auto" class="pr-0 text-left">
        <v-btn
          id="app.localOutputPathBtn"
          color="primary"
          style="height: 40px"
          :disabled="$isLocked('app.localOutputPath')"
          @click="setLocalOutputPath"
        >
          {{ $t('browse') }}
        </v-btn>
      </v-col>
      <v-col class="pl-0">
        <form-input
          id="app.localOutputPath"
          v-model="app.localOutputPath"
          :label="$t('mediaSaveFolder')"
          readonly
          required
          :locked="$isLocked('app.localOutputPath')"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="auto" class="pr-0 text-left">
        <v-btn
          id="app.customCachePathBtn"
          color="primary"
          style="height: 40px"
          :disabled="$isLocked('app.customCachePath')"
          @click="setCustomCachePath"
        >
          {{ $t('browse') }}
        </v-btn>
      </v-col>
      <v-col class="pl-0">
        <form-input
          id="app.customCachePath"
          v-model="app.customCachePath"
          :label="$t('customCachePath')"
          readonly
          clearable
          :locked="$isLocked('app.customCachePath')"
        />
      </v-col>
    </v-row>
    <form-input
      id="app.outputFolderDateFormat"
      v-model="app.outputFolderDateFormat"
      field="select"
      :label="$t('outputFolderDateFormat')"
      :items="dateFormats"
      item-text="label"
      item-value="value"
      :locked="$isLocked('app.outputFolderDateFormat')"
    />
    <v-divider class="mb-6" />
    <form-input
      v-if="!isLinux"
      id="app.autoRunAtBoot"
      v-model="app.autoRunAtBoot"
      field="switch"
      :label="$t('autoRunAtBoot')"
      :locked="$isLocked('app.autoRunAtBoot')"
    />
    <template v-for="(option, i) in automationOptions">
      <v-divider v-if="option === 'div'" :key="'div-' + i" class="mb-6" />
      <form-input
        v-else
        :id="`app.auto${option}`"
        :key="option"
        v-model="app[`auto${option}`]"
        field="switch"
        :label="$t(`auto${option}`)"
        :locked="$isLocked(`app.auto${option}`)"
      />
    </template>
    <form-input
      id="app.obs.enable"
      v-model="app.obs.enable"
      field="switch"
      :locked="$isLocked('app.obs.enable')"
    >
      <template #label>
        <span v-html="$t('enableObs')" />
      </template>
    </form-input>
    <template v-if="app.obs.enable">
      <form-input
        id="app.obs.useV4"
        v-model="app.obs.useV4"
        field="switch"
        :locked="$isLocked('app.obs.useV4')"
      >
        <template #label>
          <span v-html="$t('obsUseV4')" />
        </template>
      </form-input>
      <form-input
        id="app.obs.port"
        v-model="app.obs.port"
        :label="$t('port')"
        :locked="$isLocked('app.obs.port')"
        required
        :rules="[(v) => !v || isValidPort(v) || $t('fieldInvalid')]"
        @blur="refreshOBS()"
        @keydown.enter.prevent="refreshOBS()"
      />
      <form-input
        id="app.obs.password"
        v-model="app.obs.password"
        field="password"
        :label="$t('password')"
        :locked="$isLocked('app.obs.password')"
        hide-details="auto"
        required
        @blur="refreshOBS()"
        @keydown.enter.prevent="refreshOBS()"
      />
      <v-col cols="12" class="text-right pr-0">
        <v-btn
          id="app.obs.refreshOBS"
          :disabled="!obsComplete"
          :color="scenes.length > 0 ? 'success' : 'primary'"
          @click="refreshOBS()"
        >
          <font-awesome-icon :icon="faGlobe" />
        </v-btn>
      </v-col>
      <form-input
        id="app.obs.cameraScene"
        v-model="app.obs.cameraScene"
        field="select"
        :items="cameraScenes"
        :label="$t('obsCameraScene')"
        :disabled="cameraScenes.length === 0"
        :locked="$isLocked('app.obs.cameraScene')"
        required
      />
      <form-input
        id="app.obs.mediaScene"
        v-model="app.obs.mediaScene"
        field="select"
        :items="mediaScenes"
        :label="$t('obsMediaScene')"
        :disabled="cameraScenes.length === 0"
        :locked="$isLocked('app.obs.mediaScene')"
        required
      />
      <form-input
        id="app.obs.zoomScene"
        v-model="app.obs.zoomScene"
        field="select"
        :items="zoomScenes"
        :label="$t('obsZoomScene')"
        explanation="obsZoomSceneExplain"
        :disabled="cameraScenes.length === 0"
        :locked="$isLocked('app.obs.zoomScene')"
        clearable
      />
    </template>
    <v-divider class="mb-6" />
    <form-input
      id="app.betaUpdates"
      v-model="app.betaUpdates"
      field="switch"
      :locked="$isLocked('app.betaUpdates')"
    >
      <template #label>
        <span v-html="$t('betaUpdates')" />
      </template>
    </form-input>
    <form-input
      v-for="option in disableOptions"
      :id="`app.disable${option}`"
      :key="option"
      v-model="app[`disable${option}`]"
      field="switch"
      :locked="$isLocked(`app.disable${option}`)"
    >
      <template #label>
        <span v-html="$t(`disable${option}`)" />
      </template>
    </form-input>
  </v-form>
</template>
<script lang="ts">
import { platform } from 'os'
// eslint-disable-next-line import/named
import { existsSync } from 'fs-extra'
import { defineComponent, PropType } from 'vue'
import { Dayjs } from 'dayjs'
import { extname, join } from 'upath'
import { ipcRenderer } from 'electron'
import { LocaleObject } from '@nuxtjs/i18n'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import { WebDAVClient } from 'webdav/dist/web/types'
import { AppPrefs, ElectronStore } from '~/types'
import { DateFormat } from '~/types/prefs'
const dateFormats = [
  'DD-MM-YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY - dddd',
  'YYYY-MM-DD - dddd',
] as DateFormat[]
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PREFS } = require('~/constants/prefs') as { PREFS: ElectronStore }
export default defineComponent({
  props: {
    prefs: {
      type: Object as PropType<ElectronStore>,
      required: true,
    },
  },
  data() {
    return {
      valid: true,
      mounted: false,
      oldName: PREFS.app.congregationName,
      app: {
        ...PREFS.app,
      } as AppPrefs,
      automationOptions: [
        'StartSync',
        'div',
        'OpenFolderWhenDone',
        'QuitWhenDone',
        'div',
      ],
      disableOptions: ['AutoUpdate', 'HardwareAcceleration'],
    }
  },
  computed: {
    faGlobe() {
      return faGlobe
    },
    dateFormats(): { label: string; value: DateFormat }[] {
      return dateFormats.map((val) => {
        return {
          label: (this.$dayjs() as Dayjs).format(val),
          value: val,
        }
      })
    },
    isLinux() {
      return platform() === 'linux'
    },
    obsComplete(): boolean {
      return (
        this.app.obs.enable &&
        this.isValidPort(this.app.obs.port) &&
        !!this.app.obs.password
      )
    },
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    forcedPrefs(): ElectronStore {
      return this.$store.state.cong.prefs as ElectronStore
    },
    cameraScenes(): string[] {
      return this.scenes.filter(
        (scene) =>
          scene !== this.app.obs.mediaScene && scene !== this.app.obs.zoomScene
      )
    },
    mediaScenes(): string[] {
      return this.scenes.filter(
        (scene) =>
          scene !== this.app.obs.cameraScene && scene !== this.app.obs.zoomScene
      )
    },
    zoomScenes(): string[] {
      const scenes = this.scenes.filter(
        (scene) =>
          scene !== this.app.obs.cameraScene &&
          scene !== this.app.obs.mediaScene
      )
      if (this.app.obs.zoomScene && !scenes.includes(this.app.obs.zoomScene)) {
        scenes.push(this.app.obs.zoomScene)
      }
      return scenes
    },
    scenes(): string[] {
      return this.$store.state.obs.scenes as string[]
    },
  },
  watch: {
    valid(val: boolean) {
      this.$emit('valid', val)
    },
    app: {
      handler(val: AppPrefs) {
        this.$setPrefs('app', val)
        this.$emit('refresh', val)
      },
      deep: true,
    },
    forcedPrefs() {
      Object.assign(this.app, this.$getPrefs('app'))
      this.oldName = this.app.congregationName
    },
    'app.theme': {
      async handler(val: 'light' | 'dark' | 'system') {
        ipcRenderer.send('setTheme', val)
        if (val === 'system') {
          this.$vuetify.theme.dark = await ipcRenderer.invoke('darkMode')
        } else {
          this.$vuetify.theme.dark = val === 'dark'
        }
      },
    },
    'app.obs.enable': {
      async handler(val: boolean) {
        if (val && this.obsComplete) {
          await this.$getScenes()
          if (this.$refs.appForm) {
            // @ts-ignore: validate is not a function on type Element
            this.$refs.appForm.validate()
          }
        } else {
          await this.$resetOBS()
        }
      },
    },
    'app.obs.useV4': {
      async handler() {
        if (this.obsComplete) {
          await this.$getScenes()
        }
      },
    },
    'app.obs.cameraScene': {
      async handler(val: string) {
        if (val && this.obsComplete) {
          await this.$setScene(val)
        }
      },
    },
    'app.autoRunAtBoot': {
      handler(val: boolean) {
        if (!this.isLinux) {
          ipcRenderer.send('runAtBoot', val)
        }
      },
    },
    'app.localAppLang': {
      async handler(val: string, oldVal: string) {
        const locales = this.$i18n.locales as LocaleObject[]
        const locale =
          locales.find((l) => l.code === val) ??
          locales.find((l) => l.code === oldVal)
        this.$dayjs.locale(locale?.dayjs ?? val ?? oldVal)

        // Change the language of the app by changing it in the URL
        if ((val ?? oldVal) !== this.$i18n.locale) {
          console.debug('Change localAppLang')
          this.$router.replace(this.switchLocalePath(val ?? oldVal))
        }

        // Rename all the local files with 'song' and 'paragraph' in the name
        if (val && oldVal && val !== oldVal) {
          await this.$renamePubs(oldVal, val)
          this.$store.commit('media/clear')
        }
      },
    },
    'app.localOutputPath': {
      handler(val: string) {
        if (val) {
          const badCharacters = val.match(/(\\?)([()*?[\]{|}]|^!|[!+@](?=\())/g)
          if (badCharacters) {
            this.$warn('errorBadOutputPath', {
              identifier: badCharacters.join(' '),
            })
            this.app.localOutputPath = null
          }
        }
      },
    },
    'app.customCachePath': {
      handler(val: string, oldVal: string) {
        if (!this.mounted) {
          this.mounted = true
          return
        }
        const defaultPath = (folder: string) => join(this.$appPath(), folder)
        if (val && !oldVal) {
          this.$move(defaultPath('Publications'), join(val, 'Publications'))
          this.$move(defaultPath('Fonts'), join(val, 'Fonts'))
        } else if (!val && oldVal) {
          this.$move(
            join(oldVal, 'Publications'),
            defaultPath('Publications'),
            true
          )
          this.$move(join(oldVal, 'Fonts'), defaultPath('Fonts'), true)
        } else {
          this.$move(join(oldVal, 'Publications'), join(val, 'Publications'))
          this.$move(join(oldVal, 'Fonts'), join(val, 'Fonts'))
        }
      },
    },
    'app.congregationName': {
      handler(val: string) {
        this.$sentry.setUser({
          username: val,
        })
      },
    },
    'app.outputFolderDateFormat': {
      async handler(newVal: string, oldVal: string) {
        if (newVal !== oldVal) {
          const mediaPath = this.$mediaPath()
          if (mediaPath) {
            // Change the folder format of the current folders in the media path
            this.$renameAll(mediaPath, oldVal, newVal, 'rename', 'date')
          }

          // Change the date keys in the media store
          await this.$store.dispatch('media/updateDateFormat', {
            locale: this.$i18n.localeProperties.dayjs ?? this.$i18n.locale,
            newFormat: newVal,
            oldFormat: oldVal,
          })
        }
      },
    },
    'app.betaUpdates': {
      handler(val: boolean, oldVal: boolean | null) {
        if (oldVal !== null && oldVal !== undefined) {
          ipcRenderer.send('toggleBetaUpdates', val)
        }
      },
    },
    'app.disableAutoUpdate': {
      handler(val: boolean) {
        ipcRenderer.send('toggleAutoUpdate', !val)
      },
    },
    'app.disableHardwareAcceleration': {
      handler(val: boolean) {
        const path = join(this.$appPath(), 'disableHardwareAcceleration')
        const fileExists = existsSync(path)
        // Only do something if the value is not in sync with the presence of the file
        if (val && !fileExists) {
          this.$write(path, '')
        } else if (!val && fileExists) {
          this.$rm(path)
        }

        if (val !== fileExists) {
          ipcRenderer.send('restart')
        }
      },
    },
  },
  async mounted() {
    Object.assign(this.app, this.$getPrefs('app'))
    this.oldName = this.app.congregationName
    this.app.localAppLang = this.$i18n.locale
    this.$emit('refresh', this.app)

    if (this.obsComplete) {
      await this.$getScenes()
    }

    // Validate form (for new congregations)
    if (this.$refs.appForm) {
      // @ts-ignore: validate is not a function on type Element
      this.$refs.appForm.validate()
    }
  },
  methods: {
    isValidPort(port: string | null) {
      if (!port) return false

      // Regular expression to check if number is a valid port number
      const regexExp =
        /^((6553[0-5])|(655[0-2]\d)|(65[0-4]\d{2})|(6[0-4]\d{3})|([1-5]\d{4})|([0-5]{0,5})|(\d{1,4}))$/gi

      return regexExp.test(port)
    },
    async renameBg() {
      if (this.oldName && this.app.congregationName) {
        const bgName = (congName: string) =>
          `custom-background-image-${congName}`
        const bg = this.$findOne(
          join(this.$appPath(), bgName(this.oldName) + '*')
        )

        if (!bg) return

        this.$move(
          bg,
          join(
            this.$appPath(),
            bgName(this.app.congregationName) + extname(bg)
          ),
          true
        )

        if (this.client && this.prefs.cong.dir) {
          await this.client.moveFile(
            join(this.prefs.cong.dir, bgName(this.oldName) + extname(bg)),
            join(
              this.prefs.cong.dir,
              bgName(this.app.congregationName) + extname(bg)
            )
          )
        }
      }

      this.oldName = this.app.congregationName
    },
    async refreshOBS() {
      if (this.obsComplete) {
        await this.$resetOBS()
        await this.$getScenes()
      }

      if (this.$refs.appForm) {
        // @ts-ignore: validate is not a function on type Element
        this.$refs.appForm.validate()
      }
    },
    async setLocalOutputPath() {
      const result = await ipcRenderer.invoke('openDialog', {
        properties: ['openDirectory'],
      })
      if (result && !result.canceled) {
        this.app.localOutputPath = result.filePaths[0]
      }
    },
    async setCustomCachePath() {
      const result = await ipcRenderer.invoke('openDialog', {
        properties: ['openDirectory'],
      })
      if (result && !result.canceled) {
        this.app.customCachePath = result.filePaths[0]
      }
    },
  },
})
</script>
