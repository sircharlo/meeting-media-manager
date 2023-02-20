<template>
  <v-container
    fluid
    fill-height
    class="align-start align-content-space-between pa-0"
  >
    <confirm-dialog
      v-model="dialog"
      content="obsZoomSceneActivate"
      @cancel="dialog = false"
      @confirm="
        dialog = false
        zoomPart = true
      "
    />
    <media-controls
      v-if="date"
      :media-active="mediaActive"
      :video-active="videoActive"
      :window-height="windowHeight"
      :zoom-part="zoomPart"
    />
    <meeting-select
      v-else
      :first-choice="firstChoice"
      :window-height="windowHeight"
    />
    <v-row>
      <present-footer
        :media-active="mediaActive"
        :zoom-part="zoomPart"
        :window-width="windowWidth"
        @zoom-part="toggleZoomPart()"
      />
    </v-row>
  </v-container>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { MetaInfo } from 'vue-meta'
import { ipcRenderer } from 'electron'
import { ObsPrefs } from '~/types'
export default defineComponent({
  name: 'PresentPage',
  data() {
    return {
      dialog: false,
      obsLoading: false,
      zoomPart: false,
      mediaActive: false,
      videoActive: false,
      firstChoice: true,
      windowWidth: 0,
      windowHeight: 0,
    }
  },
  head(): MetaInfo {
    return {
      title: this.date ?? 'Present',
      titleTemplate: this.date
        ? 'Present %s - M³'
        : '%s - Meeting Media Manager',
    }
  },
  computed: {
    obsEnabled(): boolean {
      const { enable, port, password } = this.$getPrefs('app.obs') as ObsPrefs

      return enable && !!port && !!password
    },
    allScenes(): string[] {
      return this.$store.state.obs.scenes as string[]
    },
    zoomScene(): string | null {
      const zoomScene = this.$getPrefs('app.obs.zoomScene') as string | null
      if (!zoomScene || !this.allScenes.includes(zoomScene)) return null
      return zoomScene
    },
    shuffleEnabled(): boolean {
      return !!this.$getPrefs('meeting.enableMusicButton')
    },
    date(): string {
      return this.$route.query.date as string
    },
  },
  watch: {
    date(val: string) {
      if (val) {
        this.firstChoice = false
      }
    },
    zoomScene(val: string | null) {
      if (val) {
        this.$store.commit('notify/deleteByMessage', 'errorObsZoomScene')
      } else {
        this.zoomPart = false
      }
    },
    async mediaActive(val: boolean) {
      if (this.shuffleEnabled) {
        if (val) {
          this.$unsetShortcut('toggleMusicShuffle')
        } else {
          const shuffleShortcut = this.$getPrefs(
            'meeting.shuffleShortcut'
          ) as string
          if (shuffleShortcut) {
            await this.$setShortcut(
              shuffleShortcut,
              'toggleMusicShuffle',
              'music'
            )
          }
        }
      }
    },
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.setWindowSize)
    ipcRenderer.removeAllListeners('showingMedia')
    this.$unsetShortcuts('presentMode')
  },
  async mounted() {
    this.setWindowSize()
    window.addEventListener('resize', this.setWindowSize)
    ipcRenderer.on('showingMedia', (_e, val) => {
      this.mediaActive = val[0]
      this.videoActive = val[1]
    })

    if (this.obsEnabled) {
      await this.initOBS()
    }

    if (this.$store.state.obs.connected) {
      const cameraScene = this.$getPrefs('app.obs.cameraScene') as string
      if (cameraScene) {
        await this.$setScene(cameraScene)
      } else {
        this.$warn('errorObsCameraScene')
      }
    }

    if (this.$getPrefs('media.enablePp')) {
      const ppForward = this.$getPrefs('media.ppForward') as string
      const ppBackward = this.$getPrefs('media.ppBackward') as string

      if (ppForward && ppBackward) {
        this.$setShortcut(ppForward, 'nextMediaItem', 'presentMode')
        this.$setShortcut(ppBackward, 'previousMediaItem', 'presentMode')
      } else {
        this.$warn('errorPpEnable')
      }
    }
  },
  methods: {
    async initOBS() {
      this.obsLoading = true
      await this.$getScenes()
      this.obsLoading = false
    },
    toggleZoomPart() {
      if (this.zoomPart) {
        this.zoomPart = false
      } else {
        this.dialog = true
      }
    },
    setWindowSize() {
      this.windowWidth = window.innerWidth
      this.windowHeight = window.innerHeight
    },
  },
})
</script>
