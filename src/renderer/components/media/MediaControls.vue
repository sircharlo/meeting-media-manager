<!-- Media controls for the presentation mode -->
<template>
  <v-row>
    <v-app-bar height="64px">
      <v-col class="text-left" cols="4">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              id="btn-refresh-media"
              icon
              aria-label="Refresh"
              :disabled="mediaActive"
              v-bind="attrs"
              v-on="on"
              @click="getMedia()"
            >
              <font-awesome-icon :icon="faRotateRight" size="lg" />
            </v-btn>
          </template>
          <span>{{ $t('refresh') }}</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              if="btn-open-media-folder"
              icon
              aria-label="Open media folder"
              class="mx-2"
              v-bind="attrs"
              v-on="on"
              @click="openFolder()"
            >
              <font-awesome-icon :icon="faFolderOpen" size="lg" />
            </v-btn>
          </template>
          <span>{{ $t('openFolder') }}</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              id="btn-toggle-prefix"
              icon
              aria-label="Toggle prefix"
              v-bind="attrs"
              v-on="on"
              @click="togglePrefix()"
            >
              <font-awesome-icon pull="left" :icon="faEye" size="lg" />
              <font-awesome-icon :icon="faListOl" size="lg" />
            </v-btn>
          </template>
          <span>{{ $t('showPrefix') }}</span>
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
              <font-awesome-icon :icon="faSquareCheck" size="lg" />
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
              <font-awesome-icon :icon="faArrowDownShortWide" size="lg" />
            </v-btn>
          </template>
          <span>{{ $t('sortMedia') }}</span>
        </v-tooltip>
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
          @playing="setIndex(i)"
          @deactivated="resetDeactivate(i)"
        />
      </draggable>
    </div>
  </v-row>
</template>
<script lang="ts">
import Vue from 'vue'
import { basename, dirname, join } from 'upath'
import draggable from 'vuedraggable'
import { ipcRenderer } from 'electron'
import {
  faEye,
  faListOl,
  faRotateRight,
  faBackward,
  faForward,
  faSquareCheck,
  faArrowDownShortWide,
  faFolderOpen,
} from '@fortawesome/free-solid-svg-icons'
import { MS_IN_SEC } from '~/constants/general'
export default Vue.extend({
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
  },
  data() {
    return {
      currentIndex: -1,
      dragging: false,
      sortable: false,
      loading: true,
      showPrefix: false,
      items: [] as {
        id: string
        path: string
        play: boolean
        stop: boolean
        deactivate: boolean
      }[],
    }
  },
  computed: {
    listHeight(): string {
      const OTHER_ELEMENTS = 136
      return `max-height: ${this.windowHeight - OTHER_ELEMENTS}px`
    },
    date(): string {
      return this.$route.query.date as string
    },
    faEye() {
      return faEye
    },
    faArrowDownShortWide() {
      return faArrowDownShortWide
    },
    faListOl() {
      return faListOl
    },
    faBackward() {
      return faBackward
    },
    faForward() {
      return faForward
    },
    faRotateRight() {
      return faRotateRight
    },
    faSquareCheck() {
      return faSquareCheck
    },
    faFolderOpen() {
      return faFolderOpen
    },
    mediaVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
  },
  watch: {
    mediaActive(val: boolean) {
      this.items.forEach((item) => {
        item.play = false
        item.stop = false
        item.deactivate = false
      })

      if (
        !val &&
        this.$getPrefs('media.hideWinAfterMedia') &&
        this.mediaVisible
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
  },
  methods: {
    resetDeactivate(index: number) {
      const item = this.items[index]
      item.deactivate = false
    },
    setIndex(index: number) {
      const previousItem = this.items[this.currentIndex]
      if (previousItem && this.currentIndex !== index) {
        previousItem.deactivate = true
      }
      this.currentIndex = index
    },
    previous() {
      if (this.mediaActive) {
        this.items[this.currentIndex].stop = true
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
        this.items[this.currentIndex].stop = true
      } else if (this.currentIndex < this.items.length - 1) {
        this.currentIndex++
        this.items[this.currentIndex].play = true

        this.scrollToItem(this.currentIndex)
      }
    },
    getMedia() {
      this.loading = true
      this.items = this.$findAll(join(this.$mediaPath(), this.date, '*'))
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
      ipcRenderer.send('openPath', join(this.$mediaPath(), this.date))
    },
  },
})
</script>
