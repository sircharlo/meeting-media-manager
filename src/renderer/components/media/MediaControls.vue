<!-- Media controls for the presentation mode -->
<template>
  <v-row>
    <v-app-bar height="64px">
      <v-col class="text-left" cols="4">
        <v-menu bottom right>
          <template #activator="{ on, attrs }">
            <v-btn icon aria-label="More actions" v-bind="attrs" v-on="on">
              <font-awesome-icon :icon="faEllipsisVertical" size="lg" />
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="(action, i) in actions"
              :key="i"
              :disabled="action.disabled ? mediaActive : false"
              @click="action.action()"
            >
              <v-list-item-icon>
                <font-awesome-icon
                  v-for="(icon, j) in action.icons"
                  :key="j"
                  :icon="icon"
                  size="sm"
                />
              </v-list-item-icon>
              <v-list-item-title>{{ action.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              aria-label="Add song"
              v-bind="attrs"
              v-on="on"
              @click="addSong = !addSong"
            >
              <font-awesome-icon :icon="faMusic" pull="left" size="lg" />
              <font-awesome-icon :icon="faPlus" pull="right" size="lg" />
            </v-btn>
          </template>
          <span>{{ $t('lastMinuteSong') }}</span>
        </v-tooltip>
        <v-tooltip
          v-if="$getPrefs('media.enableSubtitles') && ccAvailable"
          bottom
        >
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              aria-label="Toggle subtitles"
              v-bind="attrs"
              :color="ccEnable ? 'primary' : undefined"
              v-on="on"
              @click="ccEnable = !ccEnable"
            >
              <font-awesome-icon :icon="ccIcon" size="lg" />
            </v-btn>
          </template>
          <span>{{ $t('toggleSubtitles') }}</span>
        </v-tooltip>
      </v-col>
      <v-col class="text-center d-flex justify-center">
        <v-btn
          if="btn-toggle-meeting-date"
          class="px-3"
          color="secondary"
          :disabled="mediaActive"
          large
          @click="clearDate()"
        >
          {{ date }}
        </v-btn>
      </v-col>
      <v-col class="text-right pr-8" cols="4">
        <template v-if="$getPrefs('media.enablePp')">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                id="btn-pp-previous"
                icon
                aria-label="Previous"
                :disabled="!mediaActive && currentIndex < 1"
                v-bind="attrs"
                v-on="on"
                @click="previous()"
              >
                <font-awesome-icon :icon="faBackward" size="lg" />
              </v-btn>
            </template>
            <span>{{ $getPrefs('media.ppBackward') }}</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                id="btn-pp-next"
                icon
                aria-label="Next"
                v-bind="attrs"
                class="mr-2"
                :disabled="!mediaActive && currentIndex == items.length - 1"
                v-on="on"
                @click="next()"
              >
                <font-awesome-icon :icon="faForward" size="lg" />
              </v-btn>
            </template>
            <span>{{ $getPrefs('media.ppForward') }}</span>
          </v-tooltip>
        </template>
        <v-tooltip v-if="sortable" bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              id="btn-order-save"
              aria-label="Save order"
              icon
              v-bind="attrs"
              v-on="on"
              @click="sortable = false"
            >
              <font-awesome-icon :icon="faArrowDownUpLock" size="lg" />
            </v-btn>
          </template>
          <span>{{ $t('sortSave') }}</span>
        </v-tooltip>
        <v-tooltip v-else bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              id="btn-order-change"
              icon
              aria-label="Sort items"
              :disabled="mediaActive"
              v-bind="attrs"
              v-on="on"
              @click="sortable = true"
            >
              <font-awesome-icon :icon="faArrowDownUpAcrossLine" size="lg" />
            </v-btn>
          </template>
          <span>{{ $t('sortMedia') }}</span>
        </v-tooltip>
      </v-col>
    </v-app-bar>
    <loading-icon v-if="loading" />
    <media-list
      v-else
      :items="items"
      :media-active="mediaActive"
      :video-active="videoActive"
      :window-height="windowHeight"
      :zoom-part="zoomPart"
      :show-prefix="showPrefix"
      :sortable="sortable"
      :cc-enable="ccEnable"
      :add-song="addSong"
      @index="setIndex"
      @deactivate="resetDeactivate"
      @song="addSong = false"
    />
  </v-row>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { basename, dirname, join } from 'upath'
import { ipcRenderer } from 'electron'
import {
  faListOl,
  faRotateRight,
  faBackward,
  faForward,
  faMusic,
  faPlus,
  faGlobe,
  faArrowDownUpLock,
  faEllipsisVertical,
  faArrowDownUpAcrossLine,
  faClosedCaptioning,
  faFolderOpen,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { faClosedCaptioning as farClosedCaptioning } from '@fortawesome/free-regular-svg-icons'
import { MS_IN_SEC } from '~/constants/general'
type MediaItem = {
  id: string
  path: string
  play: boolean
  stop: boolean
  deactivate: boolean
}
export default defineComponent({
  props: {
    mediaActive: {
      type: Boolean,
      default: false,
    },
    videoActive: {
      type: Boolean,
      default: false,
    },
    windowHeight: {
      type: Number,
      required: true,
    },
    zoomPart: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      currentIndex: -1,
      sortable: false,
      loading: true,
      addSong: false,
      ccEnable: true,
      ccAvailable: false,
      showPrefix: false,
      items: [] as MediaItem[],
      actions: [
        {
          title: this.$t('refresh'),
          icons: [faRotateRight],
          // @ts-ignore
          action: this.getMedia,
          disabled: true,
        },
        {
          title: this.$t('openFolder'),
          icons: [faFolderOpen],
          // @ts-ignore
          action: this.openFolder,
        },
        {
          title: this.$t('showPrefix'),
          icons: [faListOl],
          // @ts-ignore
          action: this.togglePrefix,
        },
        {
          title: this.$t('openJWorg') + ' [BETA]',
          icons: [faGlobe],
          // @ts-ignore
          action: this.openWebsite,
          disabled: true,
        },
      ] as {
        title: string
        icons: IconDefinition[]
        action: () => void
      }[],
    }
  },
  computed: {
    date(): string {
      return this.$route.query.date as string
    },
    ccIcon(): IconDefinition {
      return this.ccEnable ? faClosedCaptioning : farClosedCaptioning
    },
    faMusic() {
      return faMusic
    },
    faPlus() {
      return faPlus
    },
    faEllipsisVertical() {
      return faEllipsisVertical
    },
    faArrowDownUpAcrossLine() {
      return faArrowDownUpAcrossLine
    },
    faBackward() {
      return faBackward
    },
    faForward() {
      return faForward
    },
    faArrowDownUpLock() {
      return faArrowDownUpLock
    },
    mediaVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
    scene(): string {
      return this.$store.state.obs.currentScene as string
    },
    zoomScene(): string | null {
      return this.$getPrefs('app.obs.zoomScene') as string | null
    },
  },
  watch: {
    async mediaActive(val: boolean) {
      this.items.forEach((item) => {
        item.play = false
        item.stop = false
        item.deactivate = false
      })

      if (!val && this.scene) {
        await this.$setScene(
          this.zoomPart ? this.zoomScene ?? this.scene : this.scene
        )
      }

      if (
        !val &&
        this.mediaVisible &&
        (this.zoomPart || this.$getPrefs('media.hideWinAfterMedia'))
      ) {
        ipcRenderer.send('toggleMediaWindowFocus')
      }
    },
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('play')
  },
  mounted() {
    this.getMedia()
    ipcRenderer.on('play', (_e, type: 'next' | 'previous') => {
      if (type === 'next') {
        this.next()
      } else if (type === 'previous') {
        this.previous()
      }
    })
    if (this.$getPrefs('media.autoPlayFirst')) {
      this.$executeBeforeMeeting(
        'play',
        this.$getPrefs('media.autoPlayFirstTime') as number,
        () => {
          if (!this.mediaActive) {
            this.currentIndex = -1
            this.next()
          }
        }
      )
    }
  },
  methods: {
    openWebsite() {
      ipcRenderer.send(
        'openWebsite',
        `https://www.jw.org/${this.$getPrefs('app.localAppLang')}/`
      )
    },
    resetDeactivate(index: number) {
      const item = this.items[index]
      item.deactivate = false
    },
    setIndex(index: number) {
      const previousItem = this.items[this.currentIndex]
      if (previousItem && this.currentIndex !== index) {
        // @ts-ignore
        previousItem.deactivate = true
      }
      this.currentIndex = index
    },
    previous() {
      if (this.mediaActive) {
        if (this.currentIndex >= 0) {
          this.items[this.currentIndex].stop = true
        }
      } else if (this.currentIndex > 0) {
        this.currentIndex--
        this.items[this.currentIndex].play = true

        this.scrollToItem(this.currentIndex)
      }
    },
    scrollToItem(index: number) {
      if (index >= 1) {
        const el = document.querySelector(`#${this.items[index - 1].id}`)
        if (el) el.scrollIntoView()
      } else {
        const el = document.querySelector('#media-list-container')
        if (el) el.scrollTo(0, 0)
      }
    },
    next() {
      if (this.mediaActive) {
        if (this.currentIndex >= 0) {
          this.items[this.currentIndex].stop = true
        }
      } else if (this.currentIndex < this.items.length - 1) {
        this.currentIndex++
        this.items[this.currentIndex].play = true

        this.scrollToItem(this.currentIndex)
      }
    },
    getMedia() {
      this.loading = true
      const mediaPath = this.$mediaPath()
      if (mediaPath && this.date) {
        this.items = this.$findAll(join(mediaPath, this.date, '*'))
          .filter((f) => {
            return this.$isImage(f) || this.$isVideo(f) || this.$isAudio(f)
          })
          .sort((a, b) => basename(a).localeCompare(basename(b)))
          .map((path) => {
            const cleanName = this.$sanitize(basename(path), true)
            if (basename(path) !== cleanName) {
              this.$rename(path, basename(path), cleanName)
            }
            return {
              id: this.$strip('mediaitem-' + cleanName),
              path: join(dirname(path), cleanName),
              play: false,
              stop: false,
              deactivate: false,
            }
          })

        this.ccAvailable =
          this.$findAll(join(mediaPath, this.date, '*.vtt')).length > 0
      }
      this.loading = false
    },
    clearDate() {
      this.$router.push({
        query: {
          ...this.$route.query,
          date: undefined,
        },
      })
    },
    togglePrefix() {
      this.showPrefix = true
      setTimeout(() => {
        this.showPrefix = false
      }, 3 * MS_IN_SEC)
    },
    openFolder(): void {
      try {
        ipcRenderer.send('openPath', join(this.$mediaPath(), this.date))
      } catch (e: unknown) {
        this.$warn(
          'errorSetVars',
          { identifier: join(this.$mediaPath(), this.date) },
          e
        )
      }
    },
  },
})
</script>
