<!-- eslint-disable vue/no-v-html -->
<template>
  <v-form ref="form" v-model="valid">
    <form-input
      id="media.lang"
      v-model="media.lang"
      field="autocomplete"
      :label="$t('mediaLang')"
      :items="langs"
      item-text="name"
      item-value="langcode"
      :loading="loading"
      :locked="$isLocked('media.lang')"
      auto-select-first
      required
    />
    <form-input
      id="media.maxRes"
      v-model="media.maxRes"
      field="btn-group"
      :group-label="$t('maxRes')"
      :locked="$isLocked('media.maxRes')"
      :group-items="resolutions"
    />
    <v-divider class="mb-6" />
    <form-input
      id="media.enableMp4Conversion"
      v-model="media.enableMp4Conversion"
      field="switch"
      :locked="$isLocked('media.enableMp4Conversion')"
      :label="$t('convertDownloaded')"
    />
    <form-input
      v-if="media.enableMp4Conversion"
      id="media.keepOriginalsAfterConversion"
      v-model="media.keepOriginalsAfterConversion"
      field="switch"
      :locked="$isLocked('media.keepOriginalsAfterConversion')"
      :label="$t('keepOriginalsAfterConversion')"
    />
    <v-divider class="mb-6" />
    <form-input
      id="media.enableMediaDisplayButton"
      v-model="media.enableMediaDisplayButton"
      field="switch"
      :locked="$isLocked('media.enableMediaDisplayButton')"
      :label="$t('enableMediaDisplayButton')"
    />
    <template v-if="media.enableMediaDisplayButton">
      <form-input
        v-if="screens.length > 0"
        id="media.preferredOutput"
        v-model="media.preferredOutput"
        field="select"
        item-value="id"
        :items="[{ id: 'window', text: $t('window') }, ...screens]"
        :locked="$isLocked('media.preferredOutput')"
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
          <v-btn v-else color="error" class="mb-2" @click="removeBg()">
            {{ $t('delete') }}
          </v-btn>
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
        id="media.hideMediaLogo"
        v-model="media.hideMediaLogo"
        field="switch"
        :locked="$isLocked('media.hideMediaLogo')"
        :label="$t('hideMediaLogo')"
      />
      <form-input
        id="media.enablePp"
        v-model="media.enablePp"
        field="switch"
        :locked="$isLocked('media.enablePp')"
        :label="$t('enablePp')"
      />
      <template v-if="media.enablePp">
        <form-input
          id="media.ppForward"
          v-model="media.ppForward"
          :locked="$isLocked('media.ppForward')"
          placeholder="e.g. PageDown / ALT+F / ALT+N"
          :label="$t('ppForward')"
          :required="media.enablePp"
        />
        <form-input
          id="media.ppBackward"
          v-model="media.ppBackward"
          placeholder="e.g. PageUp / ALT+B / ALT+P"
          :locked="$isLocked('media.ppBackward')"
          :label="$t('ppBackward')"
          :required="media.enablePp"
        />
      </template>
    </template>
    <v-divider class="mb-6" />
    <form-input
      id="media.enableVlcPlaylistCreation"
      v-model="media.enableVlcPlaylistCreation"
      field="switch"
      :locked="$isLocked('media.enableVlcPlaylistCreation')"
    >
      <template #label>
        <span v-html="$t('enableVlcPlaylistCreation')" />
      </template>
    </form-input>
    <v-divider class="mb-6" />
    <form-input
      id="media.excludeTh"
      v-model="media.excludeTh"
      field="switch"
      :locked="$isLocked('media.excludeTh')"
    >
      <template #label>
        <span v-html="$t('excludeTh')" />
      </template>
    </form-input>
    <form-input
      id="media.excludeLffi"
      v-model="media.excludeLffi"
      field="switch"
      :locked="$isLocked('media.excludeLffi')"
    >
      <template #label>
        <span v-html="$t('excludeLffi')" />
      </template>
    </form-input>
    <form-input
      id="media.excludeLffiImages"
      v-model="media.excludeLffiImages"
      field="switch"
      :locked="$isLocked('media.excludeLffiImages')"
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
import { WebDAVClient } from 'webdav/dist/web/types'
import { MediaPrefs, ElectronStore, ShortJWLang } from '~/types'
import { Res } from '~/types/prefs'
const resolutions = ['240p', '360p', '480p', '720p'] as Res[]
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
      return resolutions.map((val) => {
        return {
          label: val,
          value: val,
        }
      })
    },
    isWindows() {
      return platform() === 'win32'
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
    valid(val: boolean) {
      this.$emit('valid', val)
    },
    media: {
      handler(val: MediaPrefs) {
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
        if (this.bg === 'yeartext') {
          await this.$refreshBackgroundImgPreview(true)
        }
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
      async handler(val: boolean) {
        // If value is not in sync with the state of the media window, toggle it
        if (val !== this.$store.state.present.mediaScreenInit) {
          await this.$toggleMediaWindow(val ? 'open' : 'close')
        }

        // Initialize the media screen background
        this.bg = await this.$refreshBackgroundImgPreview()
      },
    },
    'media.hideMediaLogo': {
      async handler() {
        await this.$refreshBackgroundImgPreview(true)
      },
    },
    bg(val: string) {
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
    if (
      !this.langs
        .map(({ langcode }) => langcode)
        .includes(this.media.lang ?? '')
    ) {
      this.media.lang = null
    }
    this.loading = false
    this.$emit('valid', this.valid)

    if (this.$refs.form) {
      this.$refs.form.validate()
    }
  },
  methods: {
    toggleListener(enable: boolean, field: 'backward' | 'forward') {
      if (enable) {
        window.addEventListener(
          'keydown',
          field === 'backward' ? this.addPpBackwardKey : this.addPpForwardKey
        )
      } else {
        window.removeEventListener(
          'keydown',
          field === 'backward' ? this.addPpBackwardKey : this.addPpForwardKey
        )
      }
    },
    addPpForwardKey(e: KeyboardEvent) {
      e.preventDefault()
      const val = this.media.ppForward
      this.media.ppForward = val ? val + `+${e.key}` : e.key
    },
    addPpBackwardKey(e: KeyboardEvent) {
      e.preventDefault()
      const val = this.media.ppBackward
      this.media.ppBackward = val ? val + `+${e.key}` : e.key
    },
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
        try {
          await this.client.deleteFile(
            join(
              this.$getPrefs('cong.dir'),
              'media-window-background-image' + extname(this.background)
            )
          )
        } catch (e: any) {
          if (e.status !== 404) {
            this.$error(
              'errorWebdavRm',
              e,
              'media-window-background-image' + extname(this.background)
            )
          }
        }
      }

      // Refresh the media screen background
      this.bg = await this.$refreshBackgroundImgPreview()
    },
  },
})
</script>
