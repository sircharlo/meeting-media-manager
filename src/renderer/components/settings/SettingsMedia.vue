<!-- eslint-disable vue/no-v-html -->
<template>
  <v-form ref="form" v-model="valid">
    <form-input
      v-model="media.lang"
      field="autocomplete"
      :label="$t('mediaLang')"
      :items="langs"
      item-text="name"
      item-value="langcode"
      :loading="loading"
      :locked="locked('media.lang')"
      auto-select-first
      required
    />
    <form-input
      v-model="media.maxRes"
      field="btn-group"
      :group-label="$t('maxRes')"
      :locked="locked('media.maxRes')"
      :group-items="resolutions"
    />
    <v-divider class="mb-6" />
    <form-input
      v-model="media.enableMp4Conversion"
      field="switch"
      :locked="locked('media.enableMp4Conversion')"
      :label="$t('convertDownloaded')"
    />
    <form-input
      v-if="media.enableMp4Conversion"
      v-model="media.keepOriginalsAfterConversion"
      field="switch"
      :locked="locked('media.keepOriginalsAfterConversion')"
      :label="$t('keepOriginalsAfterConversion')"
    />
    <v-divider class="mb-6" />
    <form-input
      v-model="media.enableMediaDisplayButton"
      field="switch"
      :locked="locked('media.enableMediaDisplayButton')"
      :label="$t('enableMediaDisplayButton')"
    />
    <template v-if="media.enableMediaDisplayButton">
      <form-input
        v-if="screens.length > 0"
        v-model="media.preferredOutput"
        field="select"
        item-value="id"
        :items="[{ id: 'window', text: $t('window') }, ...screens]"
        :locked="locked('media.preferredOutput')"
        :label="$t('preferredOutput')"
      />
      <v-row v-if="bg" class="mb-4">
        <v-col align-self="center" class="text-left">
          {{ $t('mediaWindowBackground') }}
        </v-col>
        <v-col
          id="mediaWindowBackground"
          :style="
            bg === 'yeartext'
              ? 'background-color: black; color: white'
              : 'color: white'
          "
        >
          <v-img
            v-if="bg === 'custom'"
            :src="background"
            alt="Custom Background"
            contain
            max-width="300px"
            max-height="100px"
          />
          <span v-else>{{ background }}</span>
        </v-col>
        <v-col cols="auto" align-self="center">
          <v-btn
            v-if="bg === 'yeartext'"
            color="primary"
            class="mb-2"
            @click="uploadBg()"
          >
            {{ $t('browse') }}
          </v-btn>
          <v-btn v-else color="error" class="mb-2" @click="removeBg()">{{
            $t('delete')
          }}</v-btn>
          <v-btn
            color="warning"
            class="mb-2"
            min-width="32px"
            @click="$refreshBackgroundImgPreview(true)"
          >
            <font-awesome-icon :icon="faArrowsRotate" class="black--text" />
          </v-btn>
        </v-col>
      </v-row>
      <form-input
        v-if="isWindows"
        v-model="media.hideMediaLogo"
        field="switch"
        :locked="locked('media.hideMediaLogo')"
        :label="$t('hideMediaLogo')"
      />
      <form-input
        v-model="media.enablePp"
        field="switch"
        :locked="locked('media.enablePp')"
        :label="$t('enablePp')"
      />
      <template v-if="media.enablePp">
        <form-input
          v-model="media.ppForward"
          :locked="locked('media.ppForward')"
          placeholder="pageDown"
          :label="$t('ppForward')"
          :required="media.enablePp"
        />
        <form-input
          v-model="media.ppBackward"
          placeholder="pageUp"
          :locked="locked('media.ppBackward')"
          :label="$t('ppBackward')"
          :required="media.enablePp"
        />
      </template>
    </template>
    <v-divider class="mb-6" />
    <form-input
      v-model="media.enableVlcPlaylistCreation"
      field="switch"
      :locked="locked('media.enableVlcPlaylistCreation')"
    >
      <template #label>
        <span v-html="$t('enableVlcPlaylistCreation')" />
      </template>
    </form-input>
    <v-divider class="mb-6" />
    <form-input
      v-model="media.excludeTh"
      field="switch"
      :locked="locked('media.excludeTh')"
    >
      <template #label>
        <span v-html="$t('excludeTh')" />
      </template>
    </form-input>
    <form-input
      v-model="media.excludeLffi"
      field="switch"
      :locked="locked('media.excludeLffi')"
    >
      <template #label>
        <span v-html="$t('excludeLffi')" />
      </template>
    </form-input>
    <form-input
      v-model="media.excludeLffiImages"
      field="switch"
      :locked="locked('media.excludeLffiImages')"
    >
      <template #label>
        <span v-html="$t('excludeLffiImages')" />
      </template>
    </form-input>
  </v-form>
</template>
<script lang="ts">
import { platform } from 'os'
import Vue from 'vue'
import { ipcRenderer } from 'electron'
import { join, extname } from 'upath'
// eslint-disable-next-line import/named
import { readFileSync } from 'fs-extra'
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
import { WebDAVClient } from 'webdav'
import { MediaPrefs, ElectronStore, ShortJWLang } from '~/types'
import { Res } from '~/types/prefs'
const { PREFS } = require('~/constants/prefs') as { PREFS: ElectronStore }
export default Vue.extend({
  data() {
    return {
      bg: '',
      valid: true,
      loading: true,
      media: {
        ...PREFS.media,
      } as MediaPrefs,
      jwLangs: [] as ShortJWLang[],
    }
  },
  computed: {
    faArrowsRotate() {
      return faArrowsRotate
    },
    langs(): { name: string; langcode: string }[] {
      return this.jwLangs.map((lang) => {
        return {
          name: `${lang.vernacularName} (${lang.name})`,
          langcode: lang.langcode,
        }
      })
    },
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    resolutions(): { label: Res; value: Res }[] {
      return Object.values(Res).map((val) => {
        return {
          label: val,
          value: val,
        }
      })
    },
    isWindows() {
      return platform() === 'win32'
    },
    forcedPrefs() {
      return this.$store.state.cong.prefs
    },
    background() {
      return this.$store.state.present.background
    },
    screens() {
      return this.$store.state.present.screens as {
        id: string
        class: string
        text: string
      }[]
    },
  },
  watch: {
    valid(val) {
      this.$emit('valid', val)
    },
    media: {
      handler(val) {
        this.$setPrefs('media', val)
      },
      deep: true,
    },
    'media.lang': {
      async handler() {
        // Clear the db and media store and refresh the langs from jw.org
        this.$store.commit('db/clear')
        this.$store.commit('media/clear')
        await this.$getJWLangs()
      },
    },
    'media.preferredOutput': {
      async handler() {
        // Change the position of the media window to the preferred output
        ipcRenderer.send(
          'setMediaWindowPosition',
          await this.$getMediaWindowDestination()
        )
      },
    },
    'media.enableMediaDisplayButton': {
      async handler(val) {
        // If value is not in sync with the state of the media window, toggle it
        if (val !== this.$store.state.present.mediaScreenInit) {
          await this.$toggleMediaWindow(val ? 'open' : 'close')
        }

        // Initialize the media screen background
        this.bg = await this.$refreshBackgroundImgPreview()
      },
    },
    bg(val) {
      if (val === 'yeartext') {
        const col = document.querySelector(
          '#mediaWindowBackground'
        ) as HTMLDivElement
        if (col) {
          col.style.backgroundColor = 'black'
        }
      }
    },
  },
  async mounted(): Promise<void> {
    Object.assign(this.media, this.$getPrefs('media'))
    this.jwLangs = await this.$getJWLangs()
    this.loading = false
    if (this.$refs.form) {
      // @ts-ignore
      this.$refs.form.validate()
    }
    this.bg = await this.$refreshBackgroundImgPreview()
  },
  methods: {
    async uploadBg() {
      const result = await ipcRenderer.invoke('openDialog', {
        properties: ['openFile'],
        filters: [
          { name: 'Image', extensions: ['jpg', 'png', 'jpeg', 'gif', 'svg'] },
        ],
      })
      if (result && !result.canceled) {
        if (this.$isImage(result.filePaths[0])) {
          const bg = result.filePaths[0]
          this.$rm(
            this.$findAll(
              join(this.$appPath(), 'media-window-background-image*')
            )
          )
          this.$copy(
            bg,
            join(this.$appPath(), 'media-window-background-image' + extname(bg))
          )

          // Upload the background to the cong server
          if (this.client) {
            await this.client.putFileContents(
              join(
                this.$getPrefs('cong.dir'),
                'media-window-background-image' + extname(bg)
              ),
              readFileSync(bg),
              {
                overwrite: true,
              }
            )
          }

          this.bg = await this.$refreshBackgroundImgPreview()
        } else {
          this.$warn('notAnImage')
        }
      }
    },
    async removeBg() {
      this.$rm(
        this.$findAll(join(this.$appPath(), 'media-window-background-image*'))
      )

      // Remove the background from the cong server
      if (this.client) {
        await this.client.deleteFile(
          join(
            this.$getPrefs('cong.dir'),
            'media-window-background-image' + extname(this.background)
          )
        )
      }

      // Refresh the media screen background
      this.bg = await this.$refreshBackgroundImgPreview()
    },
    locked(key: string) {
      if (!this.forcedPrefs) return false
      const keys = key.split('.')
      if (!this.forcedPrefs[keys[0]]) return false
      if (keys.length === 2) {
        return this.forcedPrefs[keys[0]][keys[1]] !== undefined
      } else if (keys.length === 3) {
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
