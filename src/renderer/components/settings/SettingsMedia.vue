<!-- eslint-disable vue/no-v-html -->
<template>
  <v-form ref="mediaForm" v-model="valid">
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
    >
    <template #append-outer>
      <v-btn
            color="warning"
            class="mt-n2"
            min-width="32px"
            :disabled="loading"
            @click="getLangs(true)"
          >
            <font-awesome-icon :icon="faArrowsRotate" class="black--text" />
          </v-btn>
    </template>
    </form-input>
    <form-input
      id="media.langFallback"
      v-model="media.langFallback"
      field="autocomplete"
      :label="$t('mediaLangFallback')"
      :items="fallbackLangs"
      item-text="name"
      item-value="langcode"
      :loading="loading"
      :locked="$isLocked('media.langFallback')"
      auto-select-first
      clearable
    />
    <form-input
      id="media.maxRes"
      v-model="media.maxRes"
      field="btn-group"
      :group-label="$t('maxRes')"
      :locked="$isLocked('media.maxRes')"
      :group-items="resolutions"
      mandatory
      required
    />
    <v-divider class="mb-6" />
    <form-input
      id="media.enableSubtitles"
      v-model="media.enableSubtitles"
      field="switch"
      :locked="$isLocked('media.enableSubtitles')"
      :label="$t('enableSubtitles')"
    />
    <form-input
      v-if="media.enableSubtitles"
      id="media.langSubs"
      v-model="media.langSubs"
      field="autocomplete"
      :label="$t('subsLang')"
      :items="subLangs"
      item-text="name"
      item-value="langcode"
      :loading="loading"
      :locked="$isLocked('media.langSubs')"
      auto-select-first
      required
    />
    <v-divider class="mb-6" />
    <form-input
      id="media.enableMp4Conversion"
      v-model="media.enableMp4Conversion"
      field="switch"
      explanation="convertDownloadedExplain"
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
          class="align-center col d-flex justify-center text-no-wrap"
          :style="bg === 'yeartext' ? 'background-color: black;' : ''"
        >
          <v-img
            v-if="bg === 'custom'"
            :key="refresh"
            :src="background"
            alt="Custom Background"
            contain
            max-width="300px"
            max-height="100px"
          />
          <div v-else>
            <div id="yeartextLogoContainer">
              <div id="yeartextLogo"></div>
            </div>
            <div id="yeartextContainer" v-html="background" />
          </div>
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
            @click="refreshBg()"
          >
            <font-awesome-icon :icon="faArrowsRotate" class="black--text" />
          </v-btn>
        </v-col>
      </v-row>
      <form-input
        id="media.mediaWinShortcut"
        v-model="media.mediaWinShortcut"
        :locked="$isLocked('media.mediaWinShortcut')"
        placeholder="e.g. Alt+Z"
        :label="$t('mediaWinShortcut')"
        required
        :rules="getShortcutRules('toggleMediaWindow')"
      />
      <form-input
        id="media.presentShortcut"
        v-model="media.presentShortcut"
        :locked="$isLocked('media.presentShortcut')"
        placeholder="e.g. Alt+D"
        :label="$t('presentShortcut')"
        required
        :rules="getShortcutRules('openPresentMode')"
      />
      <form-input
        id="media.hideMediaLogo"
        v-model="media.hideMediaLogo"
        field="switch"
        :locked="$isLocked('media.hideMediaLogo')"
        :label="$t('hideMediaLogo')"
      />
      <form-input
        id="media.hideWinAfterMedia"
        v-model="media.hideWinAfterMedia"
        field="switch"
        explanation="hideWinAfterMediaExplain"
        :locked="$isLocked('media.hideWinAfterMedia')"
        :label="$t('hideWinAfterMedia')"
      />
      <form-input
        id="media.autoPlayFirst"
        v-model="media.autoPlayFirst"
        field="switch"
        :locked="$isLocked('media.autoPlayFirst')"
      >
        <template #label>
          <span v-html="$t('autoPlayFirst')" />
        </template>
      </form-input>
      <form-input
        v-if="media.autoPlayFirst"
        id="media.autoPlayFirstTime"
        v-model="media.autoPlayFirstTime"
        field="slider"
        :min="1"
        :max="15"
        custom-input
        :group-label="playMinutesBeforeMeeting"
        :locked="$isLocked('media.autoPlayFirstTime')"
        hide-details="auto"
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
          placeholder="e.g. PageDown / Alt+F / Alt+N"
          :label="$t('ppForward')"
          required
          :rules="getShortcutRules('nextMediaItem')"
        />
        <form-input
          id="media.ppBackward"
          v-model="media.ppBackward"
          placeholder="e.g. PageUp / Alt+B / Alt+P"
          :locked="$isLocked('media.ppBackward')"
          :label="$t('ppBackward')"
          required
          :rules="getShortcutRules('previousMediaItem')"
        />
      </template>
    </template>
    <template v-for="(option, i) in includeOptions">
      <v-divider v-if="option === 'div'" :key="'div-' + i" class="mb-6" />
      <form-input
        v-else
        :id="`media.${option}`"
        :key="option"
        v-model="media[option]"
        field="switch"
        :locked="$isLocked(`media.${option}`)"
      >
        <template #label>
          <span v-html="$t(option)" />
        </template>
      </form-input>
    </template>
  </v-form>
</template>
<script lang="ts">
import { pathToFileURL } from 'url'
// eslint-disable-next-line import/named
import { readFileSync, existsSync } from 'fs-extra'
import { defineComponent, PropType } from 'vue'
import { ipcRenderer } from 'electron'
import { join, extname } from 'upath'
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
import { WebDAVClient } from 'webdav/dist/web/types'
import { MediaPrefs, ElectronStore, ShortJWLang } from '~/types'
import { Res } from '~/types/prefs'
import { FALLBACK_SITE_LANGS } from '~/constants/lang'
import {
  NOT_FOUND,
  LOCKED,
  WT_CLEARTEXT_FONT,
  JW_ICONS_FONT,
} from '~/constants/general'
const resolutions = ['240p', '360p', '480p', '720p'] as Res[]
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
      bg: '',
      refresh: false,
      valid: true,
      loading: true,
      media: {
        ...PREFS.media,
      } as MediaPrefs,
      jwLangs: [] as ShortJWLang[],
      includeOptions: [
        'div',
        'enableVlcPlaylistCreation',
        'div',
        'excludeTh',
        'excludeLffImages',
        'excludeFootnotes',
        'includePrinted',
      ],
    }
  },
  computed: {
    faArrowsRotate() {
      return faArrowsRotate
    },
    langs(): {
      name: string
      langcode: string
      isSignLanguage: boolean
      mwbAvailable?: boolean
      wAvailable?: boolean
    }[] {
      let langsArray = FALLBACK_SITE_LANGS as ShortJWLang[]
      console.debug("langs() this.jwLangs", this.jwLangs)
      if (Array.isArray(this.jwLangs) && this.jwLangs.length > 0) {
        console.debug("Assigning langs() langsArray to this.jwLangs")
        langsArray = this.jwLangs as ShortJWLang[]
      }
      console.debug("langs() langsArray", langsArray)
      return langsArray.map((lang) => {
        return {
          name: `${lang.vernacularName} (${lang.name})`,
          langcode: lang.langcode,
          isSignLanguage: lang.isSignLanguage,
          mwbAvailable: lang.mwbAvailable,
          wAvailable: lang.wAvailable,
        }
      })
    },
    playMinutesBeforeMeeting(): string {
      return (this.$t('minutesBeforeMeeting') as string).replace(
        '<span>XX</span>',
        (this.media.autoPlayFirstTime ?? 5).toString()
      )
    },
    fallbackLangs(): {
      name: string
      langcode: string
      isSignLanguage: boolean
    }[] {
      return this.langs.filter(
        (l) =>
          l.langcode !== this.media.lang &&
          (l.wAvailable !== false || l.mwbAvailable !== false)
      )
    },
    subLangs(): { name: string; langcode: string; isSignLanguage: boolean }[] {
      return this.langs.filter((lang) => !lang.isSignLanguage)
    },
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    forcedPrefs(): ElectronStore {
      return this.$store.state.cong.prefs as ElectronStore
    },
    resolutions(): { label: Res; value: Res }[] {
      return resolutions.map((val) => {
        return {
          label: val,
          value: val,
        }
      })
    },
    background(): string {
      return this.$store.state.present.background as string
    },
    screens(): { id: number; class: string; text: string }[] {
      return this.$store.state.present.screens as {
        id: number
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
        this.$emit('refresh', val)
      },
      deep: true,
    },
    forcedPrefs() {
      Object.assign(this.media, this.$getPrefs('media'))
    },
    'media.langSubs': {
      // async handler(val: string) {
      //   await this.$getPubAvailability(val)
      // },
    },
    'media.lang': {
      async handler(/* val: string */) {
        // Clear the db and media store
        this.$store.commit('db/clear')
        this.$store.commit('media/clear')
        // await this.$getJWLangs()
        // if (val) await this.$getPubAvailability(val)
        if (this.bg === 'yeartext') {
          await this.$refreshBackgroundImgPreview(true)
        }
      },
    },
    'media.langFallback': {
      async handler(/* val: string */) {
        // Clear the db and media store
        this.$store.commit('db/clear')
        this.$store.commit('media/clear')
        // await this.$getJWLangs()
        // if (val) await this.$getPubAvailability(val)
        if (this.bg === 'yeartext') {
          await this.$refreshBackgroundImgPreview()
        }
      },
    },
    'media.preferredOutput': {
      async handler() {
        // Change the position of the media window to the preferred output
        if (this.media.enableMediaDisplayButton) {
          ipcRenderer.send(
            'showMediaWindow',
            await this.$getMediaWindowDestination()
          )
        }
      },
    },
    'media.enableMediaDisplayButton': {
      async handler(val: boolean) {
        // If value is not in sync with the state of the media window, toggle it
        if (val !== this.$store.state.present.mediaScreenInit) {
          await this.$toggleMediaWindow(val ? 'open' : 'close')
        }

        if (val) {
          // Initialize the media screen background
          this.bg = await this.$refreshBackgroundImgPreview()

          // If second screen is present, use it for media display
          if (
            this.media.preferredOutput === 'window' &&
            this.screens.length > 0
          ) {
            this.media.preferredOutput = this.screens[0].id
          }
        }
      },
    },
    'media.enablePp': {
      handler() {
        if (this.$refs.mediaForm) {
          // @ts-ignore: validate is not a function on type Element
          this.$refs.mediaForm.validate()
        }
      },
    },
    'media.hideMediaLogo': {
      async handler(val: boolean) {
        await this.$refreshBackgroundImgPreview()
        const ytLogo = document.querySelector(
          '#yeartextLogoContainer'
        ) as HTMLDivElement
        if (ytLogo) ytLogo.style.display = !val ? 'block' : 'none'
      },
    },
    'media.mediaWinShortcut': {
      handler(val: string) {
        if (
          this.$isShortcutValid(val) &&
          this.$isShortcutAvailable(val, 'toggleMediaWindow')
        ) {
          this.$unsetShortcut('toggleMediaWindow')
          this.$setShortcut(val, 'toggleMediaWindow')
        }
      },
    },
    'media.presentShortcut': {
      handler(val: string) {
        if (
          this.$isShortcutValid(val) &&
          this.$isShortcutAvailable(val, 'openPresentMode')
        ) {
          this.$unsetShortcut('openPresentMode')
          this.$setShortcut(val, 'openPresentMode')
        }
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
    const promises = [this.loadWtFont(), this.loadJwIconsFont()]
    Object.assign(this.media, this.$getPrefs('media'))
    await this.getLangs()
    this.$emit('refresh', this.media)
    if (this.$refs.mediaForm) {
      // @ts-ignore: validate is not a function on type Element
      this.$refs.mediaForm.validate()
    }
    if (this.valid) this.$emit('valid', this.valid)
    await Promise.allSettled(promises)
  },
  methods: {
  async getLangs(force = false) {
    this.loading = true
    try {
      console.debug("getLangs force", force)
      const response = await this.$getJWLangs(force)
      console.debug("Langs fetch response", response)
      if (!Array.isArray(response) || response.length === 0) {
        console.debug("No useable jwLangs found; falling back to fallback jwLangs")
        this.jwLangs = FALLBACK_SITE_LANGS
      } else {
        this.jwLangs = response
      }
      if (
        this.langs.length > 0 &&
        !this.langs
          .map(({ langcode }) => langcode)
          .includes(this.media.lang ?? '')
      ) {
        this.media.lang = null
      }
    } catch (e: unknown) {
      console.error(e)
      console.debug("Falling back to fallback jwLangs")
      this.jwLangs = FALLBACK_SITE_LANGS
    } finally {
      console.debug("this.jwLangs:", this.jwLangs)
    }
    this.loading = false
  },
    async loadWtFont() {
      let fontFile = this.$localFontPath(WT_CLEARTEXT_FONT)
      if (!existsSync(fontFile)) {
        fontFile = this.$findOne(
          join(await this.$wtFontPath(), 'Wt-ClearText-Bold.*')
        )
      }
      if (fontFile && existsSync(fontFile)) {
        // @ts-ignore: FontFace is not defined in the types
        const font = new FontFace(
          'Wt-ClearText-Bold',
          `url(${pathToFileURL(fontFile).href})`
        )
        try {
          const loadedFont = await font.load()
          // @ts-ignore: fonts does not exist on document
          document.fonts.add(loadedFont)
        } catch (e: unknown) {
          console.error(e)
        }
      }
    },
    async loadJwIconsFont() {
      let fontFile = this.$localFontPath(JW_ICONS_FONT)
      if (!existsSync(fontFile)) {
        fontFile = this.$findOne(join(await this.$wtFontPath(), 'jw-icons*'))
      }
      if (fontFile && existsSync(fontFile)) {
        // @ts-ignore: FontFace is not defined in the types
        const font = new FontFace(
          'JW-Icons',
          `url(${pathToFileURL(fontFile).href})`
        )
        try {
          const loadedFont = await font.load()
          // @ts-ignore: fonts does not exist on document
          document.fonts.add(loadedFont)
        } catch (e: unknown) {
          console.error(e)
        }
      }
    },
    getShortcutRules(fn: string) {
      return [
        (v: string) =>
          this.$isShortcutValid(v) || this.$t('fieldShortcutInvalid'),
        (v: string) =>
          this.$isShortcutAvailable(v, fn) || this.$t('fieldShortcutTaken'),
      ]
    },
    bgFileName(): string {
      return `custom-background-image-${this.prefs.app.congregationName}`
    },
    async refreshBg() {
      await this.$refreshBackgroundImgPreview()
      this.$forceUpdate()
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
            this.$findAll(join(this.$appPath(), this.bgFileName() + '*'))
          )
          this.$copy(bg, join(this.$appPath(), this.bgFileName() + extname(bg)))

          // Upload the background to the cong server
          if (this.client && this.prefs.cong.dir) {
            await this.client.putFileContents(
              join(this.prefs.cong.dir, this.bgFileName() + extname(bg)),
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
      const bg = this.$findAll(join(this.$appPath(), this.bgFileName() + '*'))
      this.$rm(bg)

      // Remove the background from the cong server
      if (this.client && bg.length > 0 && this.prefs.cong.dir) {
        try {
          await this.client.deleteFile(
            join(this.prefs.cong.dir, this.bgFileName() + extname(bg[0]))
          )
        } catch (e: any) {
          if (e.message.includes(LOCKED.toString())) {
            this.$warn('errorWebdavLocked', {
              identifier: this.bgFileName() + extname(bg[0]),
            })
          } else if (e.status !== NOT_FOUND) {
            this.$error('errorWebdavRm', e, this.bgFileName() + extname(bg[0]))
          }
        }
      }

      // Refresh the media screen background
      this.bg = await this.$refreshBackgroundImgPreview()
    },
  },
})
</script>
<style lang="scss">
@font-face {
  font-family: NotoSerif;
  src: url('/NotoSerif-Bold.ttf') format('truetype');
}

#yeartextContainer {
  font-family: 'Wt-ClearText-Bold', 'NotoSerif', serif;
  font-size: 1cqw;
}

#yeartextLogoContainer {
  font-family: JW-Icons;
  font-size: 1.6cqw;
  position: absolute;
  bottom: 1.5cqw;
  right: 1.5cqw;
  box-sizing: unset;
  color: black !important;
  background: rgba(255, 255, 255, 0.2);
  border: rgba(255, 255, 255, 0) 0.15cqw solid;
  overflow: hidden;
  width: 1.2cqw;
  height: 1.2cqw;

  #yeartextLogo {
    margin: -0.6cqw -0.45cqw;
  }
}

#mediaWindowBackground {
  color: white;
  aspect-ratio: 16/9;
  max-width: 25vw;
  position: relative;

  p {
    margin-bottom: 0;
  }
}
</style>
