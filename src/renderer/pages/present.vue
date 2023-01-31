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
    <div id="zoomMeeting" />
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
      <v-footer width="100%" height="72px" class="justify-end">
        <v-col v-if="scene && zoomScene">
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn icon @click="toggleZoomPart()">
                <font-awesome-icon
                  :icon="zoomPart ? faPodcast : faHouseUser"
                  size="xl"
                  v-bind="attrs"
                  :class="{ 'success--text': zoomPart }"
                  v-on="on"
                />
              </v-btn>
            </template>
            <span>{{ $t('obsZoomSceneToggle') }}</span>
          </v-tooltip>
        </v-col>
        <v-col
          v-if="scene && !zoomPart && scenes.length > 1"
          class="d-flex justify-center pa-1"
        >
          <v-btn-toggle
            v-if="showButtons"
            v-model="scene"
            mandatory
            color="primary"
          >
            <v-tooltip v-for="s in scenes" :key="s.value" top>
              <template #activator="{ on, attrs }">
                <v-btn :value="s.value" v-bind="attrs" v-on="on">
                  {{ showShortButtons ? s.shortText : s.value }}
                </v-btn>
              </template>
              <span>{{ showShortButtons ? s.text : s.shortcut }}</span>
            </v-tooltip>
          </v-btn-toggle>
          <form-input
            v-else
            id="input-select-obs-scene"
            v-model="scene"
            field="select"
            :items="scenes"
            hide-details="auto"
          />
        </v-col>
        <v-col class="text-right" cols="auto">
          <shuffle-btn v-if="shuffleEnabled" :disabled="mediaActive" />
          <icon-btn variant="toggleScreen" class="mx-2" />
          <v-btn
            id="present-to-home"
            nuxt
            :to="localePath('/?cong=') + cong"
            color="warning"
            aria-label="Go to home"
            :disabled="mediaActive"
          >
            <font-awesome-icon :icon="faHome" class="black--text" size="xl" />
          </v-btn>
        </v-col>
      </v-footer>
    </v-row>
  </v-container>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { MetaInfo } from 'vue-meta'
import { ipcRenderer } from 'electron'
import zoomSDK, { EmbeddedClient } from '@zoomus/websdk/embedded'
import {
  faHome,
  IconDefinition,
  faHouseUser,
  faPodcast,
} from '@fortawesome/free-solid-svg-icons'
import { ObsPrefs, ZoomPrefs } from '~/types'
import { MS_IN_SEC } from '~/constants/general'
export default defineComponent({
  name: 'PresentPage',
  data() {
    return {
      dialog: false,
      zoomPart: false,
      mediaActive: false,
      videoActive: false,
      firstChoice: true,
      windowWidth: 0,
      windowHeight: 0,
      zoomInterval: null as null | NodeJS.Timer,
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
    scene: {
      get(): string {
        return this.$store.state.obs.currentScene as string
      },
      async set(val: string) {
        if (val && this.mediaActive) {
          this.$store.commit('obs/setCurrentScene', val)
        } else if (val) {
          await this.$setScene(val)
        }
      },
    },
    allScenes(): string[] {
      return this.$store.state.obs.scenes as string[]
    },
    zoomScene(): string | null {
      const zoomScene = this.$getPrefs('app.obs.zoomScene') as string | null
      if (!zoomScene || !this.allScenes.includes(zoomScene)) return null
      return zoomScene
    },
    showButtons(): boolean {
      return this.shortScenesLength < this.availableWidth
    },
    mediaWinVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
    showShortButtons(): boolean {
      return this.combinedScenesLength > this.availableWidth
    },
    shuffleEnabled(): boolean {
      return !!this.$getPrefs('meeting.enableMusicButton')
    },
    availableWidth(): number {
      let BUTTONS = 172
      const FOOTER_PADDING = 32
      const ZOOM_BUTTON = 65
      const SHUFFLE_BUTTON = 72
      if (this.zoomScene) BUTTONS += ZOOM_BUTTON
      if (this.shuffleEnabled) BUTTONS += SHUFFLE_BUTTON
      const OBS_MENU_PADDING = 8
      const WIDTH_OF_OTHER_ELEMENTS =
        FOOTER_PADDING + BUTTONS + OBS_MENU_PADDING
      return this.windowWidth - WIDTH_OF_OTHER_ELEMENTS
    },
    combinedScenesLength(): number {
      let nrOfChars = 0
      const PADDING_PER_SCENE = 25
      const BORDER_WIDTH = 1
      const WIDTH_PER_CHAR = 10

      for (const scene of this.scenes) {
        nrOfChars += scene.value.length
      }
      return (
        WIDTH_PER_CHAR * nrOfChars +
        (PADDING_PER_SCENE * this.scenes.length + BORDER_WIDTH)
      )
    },
    shortScenesLength(): number {
      let nrOfChars = 0
      const PADDING_PER_SCENE = 25
      const BORDER_WIDTH = 1
      const WIDTH_PER_CHAR = 14

      for (const scene of this.scenes) {
        nrOfChars += scene.shortText.length
      }
      return (
        WIDTH_PER_CHAR * nrOfChars +
        (PADDING_PER_SCENE * this.scenes.length + BORDER_WIDTH)
      )
    },
    scenes(): {
      value: string
      shortcut: string
      text: string
      shortText: string
    }[] {
      return this.allScenes
        .filter(
          (scene) =>
            !!scene &&
            scene !== this.$getPrefs('app.obs.mediaScene') &&
            scene !== this.$getPrefs('app.obs.zoomScene')
        )
        .map((scene, i) => {
          let shortcut = `Alt+${i + 1}`
          if (i === 9) shortcut = `Alt+0`
          if (i > 9) shortcut = ''
          return {
            shortcut,
            text: `${shortcut}: ${scene}`,
            value: scene,
            shortText: scene
              .replace('+', ' + ')
              .replace('  ', ' ')
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase(),
          }
        })
    },
    date(): string {
      return this.$route.query.date as string
    },
    faHome(): IconDefinition {
      return faHome as IconDefinition
    },
    faHouseUser(): IconDefinition {
      return faHouseUser as IconDefinition
    },
    faPodcast(): IconDefinition {
      return faPodcast as IconDefinition
    },
    cong(): string {
      return this.$route.query.cong as string
    },
    coHost(): boolean {
      return this.$store.state.zoom.coHost as boolean
    },
    zoomClient(): typeof EmbeddedClient {
      return this.$store.state.zoom.client as typeof EmbeddedClient
    },
    zoomStarted(): boolean {
      return this.$store.state.zoom.started as boolean
    },
  },
  watch: {
    coHost(val: boolean) {
      if (val) {
        this.$store.commit('notify/deleteByMessage', 'remindNeedCoHost')
      }
    },
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
    zoomPart(val: boolean) {
      if (this.mediaActive) return
      if (val && this.zoomScene) {
        this.$setScene(this.zoomScene)
        if (this.mediaWinVisible) {
          ipcRenderer.send('toggleMediaWindowFocus')
        }
      } else if (!val) {
        this.$setScene(this.scene)
        if (!this.mediaWinVisible) {
          ipcRenderer.send('toggleMediaWindowFocus')
        }
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
  async beforeDestroy() {
    window.removeEventListener('resize', this.setWindowSize)
    ipcRenderer.removeAllListeners('showingMedia')
    this.$unsetShortcuts('presentMode')
    if (this.zoomClient) {
      this.$stopMeeting(window.sockets[window.sockets.length - 1])
      await this.zoomClient.leaveMeeting()
      this.$store.commit('zoom/clear')
      this.$store.commit('notify/deleteByMessage', 'remindNeedCoHost')
      this.$store.commit('notify/deleteByMessage', 'errorNotCoHost')
    }
  },
  async mounted() {
    this.setWindowSize()
    window.onresize = this.setWindowSize
    ipcRenderer.on('showingMedia', (_e, val) => {
      this.mediaActive = val[0]
      this.videoActive = val[1]
    })

    const { enable, port, password } = this.$getPrefs('app.obs') as ObsPrefs

    if (enable && port && password) {
      await this.$getScenes()
    }

    const zoom = this.$getPrefs('app.zoom') as ZoomPrefs
    if (zoom.enable && zoom.name && zoom.id && zoom.password) {
      const client = zoomSDK.createClient()
      this.$store.commit('zoom/setClient', client)
      try {
        await client
          .init({
            zoomAppRoot: document.getElementById('zoomMeeting') ?? undefined,
            language: this.$i18n.localeProperties.iso,
          })
          .catch((e) => {
            console.debug('Caught init promise error')
            console.error(e)
          })
      } catch (e: unknown) {
        console.debug('Caught init error')
        console.error(e)
      }
      await this.$connectZoom()
      const originalSend = WebSocket.prototype.send
      window.sockets = []
      WebSocket.prototype.send = function (...args) {
        console.debug('send:', args)
        if (!window.sockets.includes(this)) {
          window.sockets.push(this)
        }
        return originalSend.call(this, ...args)
      }

      const mwDay = this.$getMwDay()
      const weDay = this.$getPrefs('meeting.weDay') as number
      const today = this.$dayjs().day() === 0 ? 6 : this.$dayjs().day() - 1 // Day is 0 indexed and starts with Sunday
      if (
        this.$getPrefs('app.zoom.autoStartMeeting') &&
        (today === mwDay || today === weDay)
      ) {
        const startTime = this.$getPrefs(
          `meeting.${today === mwDay ? 'mw' : 'we'}StartTime`
        ) as string
        const meetingStarts = startTime?.split(':') ?? ['0', '0']
        const timeToStop = this.$dayjs()
          .hour(+meetingStarts[0])
          .minute(+meetingStarts[1])
          .second(0)
          .millisecond(0)
          .subtract(this.$getPrefs('app.zoom.autoStartTime') as number, 'm')

        this.zoomInterval = setInterval(async () => {
          const timeLeft = this.$dayjs
            .duration(timeToStop.diff(this.$dayjs()), 'ms')
            .asSeconds()
          if (timeLeft.toFixed(0) === '0' || timeLeft.toFixed(0) === '-0') {
            if (!this.zoomStarted) {
              await this.$startMeeting(
                window.sockets[window.sockets.length - 1]
              )
            }
            clearInterval(this.zoomInterval as NodeJS.Timer)
          } else if (timeLeft < 0) {
            clearInterval(this.zoomInterval as NodeJS.Timer)
          }
        }, MS_IN_SEC)
      }
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
    setTimeout(() => {
      if (window.sockets && window.sockets.length > 0) {
        console.debug('Found socket')
        this.$store.commit(
          'zoom/setWebSocket',
          window.sockets[window.sockets.length - 1]
        )
      }
    }, MS_IN_SEC)
  },
  methods: {
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
<style lang="scss">
#zoomMeeting {
  width: 0;
  height: 0;
  z-index: 999;
}
</style>
