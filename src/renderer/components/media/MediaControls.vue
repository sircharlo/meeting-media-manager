<!-- Media controls for the presentation mode -->
<template>
  <v-row>
    <v-app-bar fixed>
      <v-col class="text-left" cols="4">
        <v-btn
          icon
          aria-label="Refresh"
          :disabled="mediaActive"
          @click="getMedia()"
        >
          <font-awesome-icon :icon="faRotateRight" />
        </v-btn>
        <v-btn icon aria-label="Open media folder" @click="openFolder()">
          <font-awesome-icon :icon="faFolderOpen" />
        </v-btn>
        <v-btn icon aria-label="Toggle prefix" @click="togglePrefix()">
          <font-awesome-icon :icon="faEye" />
          <font-awesome-icon :icon="faListOl" />
        </v-btn>
      </v-col>
      <v-col class="text-center d-flex justify-center">
        <v-btn
          class="px-3"
          color="secondary"
          :disabled="mediaActive"
          @click="clearDate()"
        >
          {{ date }}
        </v-btn>
      </v-col>
      <v-col class="text-right" cols="4">
        <template v-if="$getPrefs('media.enablePp')">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                aria-label="Previous"
                :disabled="!mediaActive && currentIndex < 1"
                v-bind="attrs"
                v-on="on"
                @click="previous()"
              >
                <font-awesome-icon :icon="faBackward" />
              </v-btn>
            </template>
            <span>{{ $getPrefs('media.ppBackward') }}</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                aria-label="Next"
                v-bind="attrs"
                :disabled="!mediaActive && currentIndex == items.length - 1"
                v-on="on"
                @click="next()"
              >
                <font-awesome-icon :icon="faForward" />
              </v-btn>
            </template>
            <span>{{ $getPrefs('media.ppForward') }}</span>
          </v-tooltip>
        </template>
        <v-btn
          v-if="sortable"
          aria-label="Save order"
          icon
          @click="sortable = false"
        >
          <font-awesome-icon :icon="faSquareCheck" />
        </v-btn>
        <v-btn
          v-else
          icon
          aria-label="Sort items"
          :disabled="mediaActive"
          @click="sortable = true"
        >
          <font-awesome-icon :icon="faArrowDownShortWide" />
        </v-btn>
      </v-col>
    </v-app-bar>
    <loading-icon v-if="loading" />
    <draggable
      v-else
      v-model="items"
      tag="v-list"
      handle=".sort-btn"
      group="media-items"
      style="width: 100%; margin-top: 56px"
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
      />
    </draggable>
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
  },
  watch: {
    mediaActive() {
      this.items.forEach((item) => {
        item.play = false
        item.stop = false
        item.deactivate = false
      })
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
      }
    },
    next() {
      if (this.mediaActive) {
        this.items[this.currentIndex].stop = true
      } else if (this.currentIndex < this.items.length - 1) {
        this.currentIndex++
        this.items[this.currentIndex].play = true
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
      }, 3000)
    },
    openFolder(): void {
      ipcRenderer.send('openPath', join(this.$mediaPath(), this.date))
    },
  },
})
</script>
