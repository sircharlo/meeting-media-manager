<!-- eslint-disable vue/no-v-html -->
<template>
  <v-form ref="form" v-model="valid">
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
      :label="$t('runAtStartup')"
      :locked="$isLocked('app.runAtStartup')"
    />
    <form-input
      id="app.autoStartSync"
      v-model="app.autoStartSync"
      field="switch"
      :label="$t('syncOnLaunch')"
      :locked="$isLocked('app.autoStartSync')"
    />
    <v-divider class="mb-6" />
    <form-input
      id="app.autoOpenFolderWhenDone"
      v-model="app.autoOpenFolderWhenDone"
      field="switch"
      :label="$t('openTargetFolderAfterSync')"
      :locked="$isLocked('app.openTargetFolderAfterSync')"
    />
    <form-input
      id="app.autoQuitWhenDone"
      v-model="app.autoQuitWhenDone"
      field="switch"
      :label="$t('quitAfterSync')"
      :locked="$isLocked('app.autoQuitWhenDone')"
    />
    <v-divider class="mb-6" />
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
        :required="app.obs.enable"
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
        :required="app.obs.enable"
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
        :required="app.obs.enable"
      />
      <form-input
        id="app.obs.mediaScene"
        v-model="app.obs.mediaScene"
        field="select"
        :items="mediaScenes"
        :label="$t('obsMediaScene')"
        :disabled="cameraScenes.length === 0"
        :locked="$isLocked('app.obs.mediaScene')"
        :required="app.obs.enable"
      />
    </template>
    <v-divider class="mb-6" />
    <form-input
      id="app.disableHardwareAcceleration"
      v-model="app.disableHardwareAcceleration"
      field="switch"
      :locked="$isLocked('app.disableHardwareAcceleration')"
    >
      <template #label>
        <span v-html="$t('disableHardwareAcceleration')" />
      </template>
    </form-input>
  </v-form>
</template>
<script lang="ts">
import { platform } from 'os'
import Vue from 'vue'
import { Dayjs } from 'dayjs'
import { extname, join } from 'upath'
import { ipcRenderer } from 'electron'
// eslint-disable-next-line import/named
import { existsSync, renameSync } from 'fs-extra'
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
const { PREFS } = require('~/constants/prefs') as { PREFS: ElectronStore }
export default Vue.extend({
  data() {
    return {
      valid: true,
      oldName: PREFS.app.congregationName,
      app: {
        ...PREFS.app,
      } as AppPrefs,
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
        this.app.obs.enable && !!this.app.obs.port && !!this.app.obs.password
      )
    },
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    cameraScenes(): string[] {
      return this.scenes.filter((scene) => scene !== this.app.obs.mediaScene)
    },
    mediaScenes(): string[] {
      return this.scenes.filter((scene) => scene !== this.app.obs.cameraScene)
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
      },
      deep: true,
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
      async handler() {
        if (this.obsComplete) {
          await this.$getScenes()
          if (this.$refs.form) {
            this.$refs.form.validate()
          }
        }
      },
    },
    'app.obs.useV4': {
      async handler() {
        if (this.obsComplete) {
          await this.refreshOBS()
        }
      },
    },
    'app.obs.cameraScene': {
      handler(val: string) {
        if (val && this.obsComplete) {
          this.$setScene(val)
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
        this.$dayjs.locale((val ?? oldVal).split('-')[0])

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
        const badCharacters = val.match(/(\\?)([()*?[\]{|}]|^!|[!+@](?=\())/g)
        if (badCharacters) {
          this.$warn('errorBadOutputPath', badCharacters.join(' '))
          this.app.localOutputPath = null
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
          if (this.$getPrefs('media.lang')) {
            // Change the folder format of the current folders in the media path
            this.$renameAll(this.$mediaPath(), oldVal, newVal, 'rename', 'date')
          }

          // Change the date keys in the media store
          await this.$store.dispatch('media/updateDateFormat', {
            locale: this.$i18n.locale.split('-')[0],
            newFormat: newVal,
            oldFormat: oldVal,
          })
        }
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
    this.$emit('valid', this.valid)

    if (this.obsComplete) {
      await this.refreshOBS()
    }

    // Validate form (for new congregations)
    if (this.$refs.form) {
      this.$refs.form.validate()
    }
  },
  methods: {
    async renameBg() {
      if (this.oldName && this.app.congregationName) {
        const bgName = (congName: string) =>
          `custom-background-image-${congName}`
        const bg = this.$findOne(
          join(this.$appPath(), bgName(this.oldName) + '*')
        )

        if (!bg) return

        renameSync(
          bg,
          join(this.$appPath(), bgName(this.app.congregationName) + extname(bg))
        )

        if (this.client) {
          await this.client.moveFile(
            join(
              this.$getPrefs('cong.dir'),
              bgName(this.oldName) + extname(bg)
            ),
            join(
              this.$getPrefs('cong.dir'),
              bgName(this.app.congregationName) + extname(bg)
            )
          )
        }
      }

      this.oldName = this.app.congregationName
    },
    async refreshOBS() {
      if (this.obsComplete) {
        this.$resetOBS()
        await this.$getScenes()
      }

      if (this.$refs.form) {
        this.$refs.form.validate()
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
  },
})
</script>
