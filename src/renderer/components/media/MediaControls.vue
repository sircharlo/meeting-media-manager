<!-- Media controls for the presentation mode -->
<template>
  <v-row>
    <v-app-bar height="64px" width="100%">
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
    <v-app-bar
      v-if="zoomIntegration"
      id="zoom-app-bar"
      height="56"
      dark
      color="primary"
      class="text-left"
    >
      <v-app-bar-nav-icon>
        <font-awesome-icon :icon="faZ" size="lg" />
      </v-app-bar-nav-icon>
      <v-col cols="auto">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              aria-label="Toggle zoom component"
              v-bind="attrs"
              v-on="on"
              @click="showZoomComponent = !showZoomComponent"
            >
              <font-awesome-icon
                :icon="showZoomComponent ? faEyeSlash : faEye"
                size="lg"
              />
            </v-btn>
          </template>
          <span>{{ $t('zoomToggleComponent') }}</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              :loading="loadingZoom"
              aria-label="Toggle zoom meeting"
              v-bind="attrs"
              v-on="on"
              @click="toggleZoomMeeting()"
            >
              <font-awesome-icon
                :icon="zoomStarted ? faStop : faPlay"
                size="lg"
              />
            </v-btn>
          </template>
          <span>{{ $t(`zoom${zoomStarted ? 'Stop' : 'Start'}Meeting`) }}</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              aria-label="Mute Zoom participants"
              v-bind="attrs"
              v-on="on"
              @click="$muteParticipants()"
            >
              <font-awesome-icon :icon="faMicrophoneSlash" size="lg" />
            </v-btn>
          </template>
          <span>{{ $t('zoomMuteParticipants') }}</span>
        </v-tooltip>
      </v-col>
      <v-col class="d-flex flex-row pr-0">
        <v-col class="d-flex align-center pr-0">
          <form-input
            v-model="participants"
            field="autocomplete"
            color="white"
            item-text="displayName"
            item-value="userId"
            :loading="allParticipants.length == 0"
            :label="$t('spotlightParticipants')"
            :disabled="spotlightActive"
            :items="allParticipants"
            hide-details="auto"
            chips
            small-chips
            deletable-chips
            multiple
            clearable
            return-object
          />
        </v-col>
        <v-col cols="auto" class="px-0">
          <v-btn
            icon
            :class="{ 'pulse-danger': spotlightActive }"
            :disabled="participants.length == 0"
            @click="spotlightParticipants()"
          >
            <font-awesome-icon
              :icon="spotlightActive ? faUsersSlash : faUsersRectangle"
              size="lg"
            />
          </v-btn>
        </v-col>
      </v-col>
    </v-app-bar>
    <loading-icon v-if="loading" />
    <div
      v-else
      id="media-list-container"
      :style="`
        width: 100%;
        overflow-y: auto;
        ${listHeight}
      `"
    >
      <song-picker
        v-if="addSong"
        ref="songPicker"
        v-model="song"
        class="pa-4"
        clearable
      />
      <template v-if="song">
        <v-list class="ma-4">
          <media-item
            :key="song.url"
            :src="song.url"
            :play-now="song.play"
            :stop-now="song.stop"
            :deactivate="song.deactivate"
            :media-active="mediaActive"
            :video-active="videoActive"
            :show-prefix="showPrefix"
            :streaming-file="song"
            :zoom-part="zoomPart"
            @playing="setIndex(-1)"
            @deactivated="song.deactivate = false"
          />
        </v-list>
        <v-divider class="mx-4" />
      </template>
      <draggable
        v-model="items"
        tag="v-list"
        handle=".sort-btn"
        group="media-items"
        class="ma-4"
        @start="dragging = true"
        @end="dragging = false"
      >
        <media-item
          v-for="(item, i) in items"
          :key="item.id"
          :src="item.path"
          :play-now="item.play"
          :stop-now="item.stop"
          :deactivate="item.deactivate"
          :media-active="mediaActive"
          :video-active="videoActive"
          :show-prefix="showPrefix"
          :sortable="sortable"
          :zoom-part="zoomPart"
          @playing="setIndex(i)"
          @deactivated="resetDeactivate(i)"
        />
      </draggable>
    </div>
  </v-row>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { basename, dirname, join } from 'upath'
import draggable from 'vuedraggable'
import { ipcRenderer } from 'electron'
import { Participant } from '@zoomus/websdk/embedded'
import {
  faListOl,
  faRotateRight,
  faBackward,
  faForward,
  faMusic,
  faPlus,
  faZ,
  faPlay,
  faStop,
  faMicrophoneSlash,
  faUsersRectangle,
  faUsersSlash,
  faEye,
  faEyeSlash,
  faGlobe,
  faArrowDownUpLock,
  faEllipsisVertical,
  faArrowDownUpAcrossLine,
  faFolderOpen,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { VideoFile } from '~/types'
import { MS_IN_SEC } from '~/constants/general'
export default defineComponent({
  components: {
    draggable,
  },
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
      dragging: false,
      sortable: false,
      loading: true,
      spotlightActive: false,
      participants: [] as Participant[],
      addSong: false,
      song: null as null | VideoFile,
      showPrefix: false,
      loadingZoom: false,
      showZoomComponent: true,
      items: [] as {
        id: string
        path: string
        play: boolean
        stop: boolean
        deactivate: boolean
      }[],
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
    listHeight(): string {
      const FOOTER = 72
      const TOP_BAR = 64
      const ZOOM_BAR = 57
      let otherElements = FOOTER + TOP_BAR
      if (this.zoomIntegration) otherElements += ZOOM_BAR
      return `max-height: ${this.windowHeight - otherElements}px`
    },
    date(): string {
      return this.$route.query.date as string
    },
    faMicrophoneSlash() {
      return faMicrophoneSlash
    },
    faUsersSlash() {
      return faUsersSlash
    },
    faMusic() {
      return faMusic
    },
    faUsersRectangle() {
      return faUsersRectangle
    },
    faPlay() {
      return faPlay
    },
    faStop() {
      return faStop
    },
    faPlus() {
      return faPlus
    },
    faZ() {
      return faZ
    },
    faEye() {
      return faEye
    },
    faEyeSlash() {
      return faEyeSlash
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
    zoomIntegration(): boolean {
      return !!this.$store.state.zoom.client
    },
    zoomStarted(): boolean {
      return this.$store.state.zoom.started as boolean
    },
    isCoHost(): boolean {
      return this.$store.state.zoom.coHost as boolean
    },
    allParticipants(): Participant[] {
      const participants = this.$store.state.zoom.participants as Participant[]
      return participants.filter(
        (p) => !p.bHold && p.displayName !== this.$getPrefs('app.zoom.name')
      )
    },
    zoomScene(): string | null {
      return this.$getPrefs('app.obs.zoomScene') as string | null
    },
  },
  watch: {
    song() {
      this.addSong = false
    },
    showZoomComponent(show: boolean) {
      const el = document.getElementById('zoomMeeting')
      if (!el) return
      el.style.display = show ? 'flex' : 'none'
    },
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

    setTimeout(() => {
      this.showZoomComponent = !this.$getPrefs('app.zoom.hideComponent')
      const el = document.querySelector(
        '#zoom-app-bar button.v-app-bar__nav-icon'
      ) as HTMLButtonElement

      if (el) {
        el.disabled = true
      }
    }, MS_IN_SEC)
  },
  methods: {
    async spotlightParticipants() {
      if (!this.isCoHost) {
        this.$warn('errorNotCoHost')
        return
      }

      this.$toggleSpotlight(window.sockets[window.sockets.length - 1], false)

      if (this.spotlightActive) {
        this.$muteParticipants(window.sockets[window.sockets.length - 1])

        const hostID = this.$store.state.zoom.hostID as number
        const automateAudio = this.$getPrefs(
          'app.zoom.automateAudio'
        ) as boolean
        if (automateAudio || this.$getPrefs('app.zoom.spotlight')) {
          this.$toggleSpotlight(
            window.sockets[window.sockets.length - 1],
            true,
            hostID
          )
        }
        this.participants = []
      } else {
        for (const p of this.participants) {
          this.$toggleSpotlight(
            window.sockets[window.sockets.length - 1],
            true,
            p.userId
          )
          await this.$toggleMic(
            window.sockets[window.sockets.length - 1],
            false,
            p.userId
          )
        }
      }
      this.spotlightActive = !this.spotlightActive
    },
    async toggleZoomMeeting() {
      this.loadingZoom = true
      if (this.zoomStarted) {
        this.$stopMeeting(window.sockets[window.sockets.length - 1])
      } else {
        await this.$startMeeting(window.sockets[window.sockets.length - 1])
      }
      this.loadingZoom = false
    },
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
<style lang="scss">
#zoom-app-bar {
  button.v-app-bar__nav-icon {
    cursor: initial !important;

    &:before {
      opacity: 0 !important;
    }
  }
}
</style>
