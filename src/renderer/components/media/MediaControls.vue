<!-- Media controls for the presentation mode -->
<template>
  <v-row>
    <v-dialog :value="manageMedia" fullscreen persistent>
      <v-sheet :color="isDark ? '#121212' : '#ffffff'" class="fill-height">
        <v-container fluid fill-height>
          <manage-media
            :media="localMedia"
            :loading="loading"
            dialog
            @cancel="manageMedia = false"
            @refresh="getMedia()"
          />
        </v-container>
      </v-sheet>
    </v-dialog>
    <present-top-bar
      :media-active="mediaActive"
      :current-index="currentIndex"
      :media-count="items.length"
      :cc-enable="ccEnable"
      :sortable="sortable"
      @song="addSong = !addSong"
      @cc="ccEnable = !ccEnable"
      @previous="previous()"
      @next="next()"
      @sortable="sortable = !sortable"
      @prefix="togglePrefix()"
      @refresh="getMedia()"
      @manage-media="manageMedia = true"
    />
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
import { MS_IN_SEC } from '~/constants/general'
import { LocalFile } from '~/types'
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
      manageMedia: false,
      currentIndex: -1,
      sortable: false,
      loading: true,
      addSong: false,
      ccEnable: true,
      showPrefix: false,
      items: [] as MediaItem[],
    }
  },
  computed: {
    date(): string {
      return this.$route.query.date as string
    },
    mediaVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
    localMedia(): LocalFile[] {
      return this.items.map((item) => {
        return {
          safeName: basename(item.path),
          isLocal: true,
          filepath: item.path,
        }
      })
    },
    isDark(): boolean {
      return this.$vuetify.theme.dark as boolean
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
      }
      this.loading = false
    },
    togglePrefix() {
      this.showPrefix = true
      setTimeout(() => {
        this.showPrefix = false
      }, 3 * MS_IN_SEC)
    },
  },
})
</script>
