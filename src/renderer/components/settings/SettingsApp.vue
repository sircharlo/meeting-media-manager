<!-- eslint-disable vue/no-v-html -->
<template>
  <v-form ref="form" v-model="valid">
    <form-input
      v-model="app.theme"
      field="select"
      :items="[
        { text: $t('light'), value: 'light' },
        { text: $t('dark'), value: 'dark' },
        { text: $t('system'), value: 'system' },
      ]"
      :label="$t('themePreference')"
      :locked="locked('app.theme')"
    />
    <form-input
      v-model="app.congregationName"
      :label="$t('congregationName')"
      :locked="locked('app.congregationName')"
      required
    />
    <form-input
      v-model="app.localAppLang"
      field="select"
      :label="$t('localAppLang')"
      :items="$i18n.locales"
      item-text="name"
      item-value="code"
      required
      :locked="locked('app.localAppLang')"
    />
    <v-row>
      <v-col cols="auto" class="pr-0 text-left">
        <v-btn
          color="primary"
          style="height: 40px"
          :disabled="locked('app.localOutputPath')"
          @click="setLocalOutputPath"
        >
          {{ $t('browse') }}
        </v-btn>
      </v-col>
      <v-col class="pl-0">
        <form-input
          v-model="app.localOutputPath"
          :label="$t('mediaSaveFolder')"
          readonly
          required
          :locked="locked('app.localOutputPath')"
        />
      </v-col>
    </v-row>
    <form-input
      v-model="app.outputFolderDateFormat"
      field="select"
      :label="$t('outputFolderDateFormat')"
      :items="dateFormats"
      item-text="label"
      item-value="value"
      :locked="locked('app.outputFolderDateFormat')"
    />
    <v-divider class="mb-6" />
    <form-input
      v-if="!isLinux"
      v-model="app.autoRunAtBoot"
      field="switch"
      :label="$t('runAtStartup')"
      :locked="locked('app.runAtStartup')"
    />
    <form-input
      v-model="app.autoStartSync"
      field="switch"
      :label="$t('syncOnLaunch')"
      :locked="locked('app.autoStartSync')"
    />
    <v-divider class="mb-6" />
    <form-input
      v-model="app.autoOpenFolderWhenDone"
      field="switch"
      :label="$t('openTargetFolderAfterSync')"
      :locked="locked('app.openTargetFolderAfterSync')"
    />
    <form-input
      v-model="app.autoQuitWhenDone"
      field="switch"
      :label="$t('quitAfterSync')"
      :locked="locked('app.autoQuitWhenDone')"
    />
    <v-divider class="mb-6" />
    <form-input
      v-model="app.obs.enable"
      field="switch"
      :locked="locked('app.obs.enable')"
    >
      <template #label>
        <span v-html="$t('enableObs')" />
      </template>
    </form-input>
    <template v-if="app.obs.enable">
      <form-input
        v-model="app.obs.useV4"
        field="switch"
        :locked="locked('app.obs.useV4')"
      >
        <template #label>
          <span v-html="$t('obsUseV4')" />
        </template>
      </form-input>
      <form-input
        v-model="app.obs.port"
        :label="$t('port')"
        :locked="locked('app.obs.port')"
        :required="app.obs.enable"
      />
      <form-input
        v-model="app.obs.password"
        field="password"
        :label="$t('password')"
        :locked="locked('app.obs.password')"
        hide-details="auto"
        :required="app.obs.enable"
      />
      <v-col cols="12" class="text-right pr-0">
        <v-btn
          :color="scenes.length > 0 ? 'success' : 'primary'"
          @click="refreshOBS()"
        >
          <font-awesome-icon :icon="faGlobe" />
        </v-btn>
      </v-col>
      <form-input
        v-model="app.obs.cameraScene"
        field="select"
        :items="cameraScenes"
        :label="$t('obsCameraScene')"
        :disabled="cameraScenes.length === 0"
        :locked="locked('app.obs.cameraScene')"
        :required="app.obs.enable"
      />
      <form-input
        v-model="app.obs.mediaScene"
        field="select"
        :items="mediaScenes"
        :label="$t('obsMediaScene')"
        :disabled="cameraScenes.length === 0"
        :locked="locked('app.obs.mediaScene')"
        :required="app.obs.enable"
      />
    </template>
    <v-divider class="mb-6" />
    <form-input
      v-model="app.disableHardwareAcceleration"
      field="switch"
      :locked="locked('app.disableHardwareAcceleration')"
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
import { join } from 'upath'
import { ipcRenderer } from 'electron'
// eslint-disable-next-line import/named
import { existsSync } from 'fs-extra'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
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
    cameraScenes(): string[] {
      return this.scenes.filter((scene) => scene !== this.app.obs.mediaScene)
    },
    mediaScenes(): string[] {
      return this.scenes.filter((scene) => scene !== this.app.obs.cameraScene)
    },
    scenes(): string[] {
      return this.$store.state.obs.scenes as string[]
    },
    forcedPrefs() {
      return this.$store.state.cong.prefs
    },
  },
  watch: {
    valid(val) {
      this.$emit('valid', val)
    },
    app: {
      handler(val) {
        this.$setPrefs('app', val)
      },
      deep: true,
    },
    'app.theme': {
      async handler(val) {
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
        await this.$getScenes()
      },
    },
    'app.obs.useV4': {
      async handler() {
        await this.refreshOBS()
      },
    },
    'app.obs.cameraScene': {
      handler(val) {
        if (val) {
          this.$setScene(val)
        }
      },
    },
    'app.autoRunAtBoot': {
      handler(val) {
        if (!this.isLinux) {
          ipcRenderer.send('runAtBoot', val)
        }
      },
    },
    'app.localAppLang': {
      async handler(val, oldVal) {
        this.$dayjs.locale(val.split('-')[0])

        // Change the language of the app by changing it in the URL
        if (val !== this.$i18n.locale) {
          this.$router.replace(this.switchLocalePath(val))
        }

        // Rename all the local files with 'song' and 'paragraph' in the name
        if (val !== oldVal) {
          await this.$renamePubs(oldVal, val)
          this.$store.commit('media/clear')
        }
      },
    },
    'app.outputFolderDateFormat': {
      async handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          // Change the folder format of the current folders in the media path
          this.$renameAll(this.$mediaPath(), oldVal, newVal, 'rename', 'date')

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
      handler(val) {
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
  mounted() {
    Object.assign(this.app, this.$getPrefs('app'))
    this.app.localAppLang = this.$i18n.locale

    // Validate form (for new congregations)
    if (this.$refs.form) {
      ;(this.$refs.form as HTMLFormElement).validate()
    }
  },
  methods: {
    async refreshOBS() {
      this.$resetOBS()
      await this.$getScenes()
    },
    async setLocalOutputPath() {
      const result = await ipcRenderer.invoke('openDialog', {
        properties: ['openDirectory'],
      })
      if (result && !result.canceled) {
        this.app.localOutputPath = result.filePaths[0]
      }
    },
    locked(key: string) {
      // If no forced prefs, don't lock
      if (!this.forcedPrefs) return false
      const keys = key.split('.')

      // If app key is not in forcedPrefs, don't lock
      if (!this.forcedPrefs[keys[0]]) return false
      if (keys.length === 2) {
        return this.forcedPrefs[keys[0]][keys[1]] !== undefined
      }
      // If pref is in a sub object (e.g. app.obs.enable)
      else if (keys.length === 3) {
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
