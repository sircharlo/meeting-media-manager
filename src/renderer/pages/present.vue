<template>
  <v-container
    fluid
    fill-height
    class="align-start align-content-space-between pa-0"
  >
    <confirm-dialog
      v-model="dialog"
      description="obsZoomSceneActivate"
      @cancel="dialog = false"
      @confirm="
        dialog = false
        zoomPart = true
      "
    >
      <form-input
        v-if="!!zoomClient"
        v-model="participant"
        field="autocomplete"
        :loading="allParticipants.length === 0"
        :label="$t('unmuteParticipant')"
        :items="allParticipants"
        item-text="displayName"
        item-value="userId"
        return-object
      />
    </confirm-dialog>
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
      <present-footer
        :media-active="mediaActive"
        :zoom-part="zoomPart"
        :window-width="windowWidth"
        @zoom-part="toggleZoomPart()"
        @clear-participant="participant = null"
      />
    </v-row>
  </v-container>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { MetaInfo } from 'vue-meta'
import { ipcRenderer } from 'electron'
import zoomSDK, { EmbeddedClient, Participant } from '@zoomus/websdk/embedded'
import { ObsPrefs, ZoomPrefs } from '~/types'
import { MS_IN_SEC } from '~/constants/general'
export default defineComponent({
  name: 'PresentPage',
  data() {
    return {
      dialog: false,
      participant: null as null | Participant,
      obsLoading: false,
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
    coHost(): boolean {
      return this.$store.state.zoom.coHost as boolean
    },
    zoomClient(): typeof EmbeddedClient {
      return this.$store.state.zoom.client as typeof EmbeddedClient
    },
    zoomStarted(): boolean {
      return this.$store.state.zoom.started as boolean
    },
    allParticipants(): Participant[] {
      const participants = this.$store.state.zoom.participants as Participant[]
      return participants.filter(
        (p) => !p.bHold && p.displayName !== this.$getPrefs('app.zoom.name')
      )
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
      this.$stopMeeting(this.zoomSocket())
      await this.zoomClient.leaveMeeting()
      this.$store.commit('zoom/clear')
      this.$store.commit('notify/deleteByMessage', 'errorNoSocket')
      this.$store.commit('notify/deleteByMessage', 'errorNotCoHost')
      this.$store.commit('notify/deleteByMessage', 'remindNeedCoHost')
    }
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

    const zoom = this.$getPrefs('app.zoom') as ZoomPrefs
    if (zoom?.enable && zoom.name && zoom.id && zoom.password) {
      const client = zoomSDK.createClient()
      this.$store.commit('zoom/setClient', client)
      try {
        await client
          .init({
            zoomAppRoot: document.getElementById('zoomMeeting') ?? undefined,
            // @ts-ignore
            language: this.$i18n.localeProperties.iso,
          })
          .catch(() => {
            console.debug('Caught init promise error')
          })
      } catch (e: unknown) {
        console.debug('Caught init error')
      }
      await this.$connectZoom()
      const originalSend = WebSocket.prototype.send
      window.sockets = []
      WebSocket.prototype.send = function (...args) {
        console.debug('send:', args)
        if (
          this.url.includes('zoom') &&
          this.url.includes('dn2') &&
          !window.sockets.includes(this)
        ) {
          window.sockets.push(this)
          console.debug('sockets', window.sockets)
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
              await this.$startMeeting(this.zoomSocket())
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
        this.$store.commit('zoom/setWebSocket', this.zoomSocket())
      }
    }, MS_IN_SEC)
  },
  methods: {
    zoomSocket(): WebSocket | null {
      if (window.sockets && window.sockets.length > 0) {
        return window.sockets[window.sockets.length - 1]
      }
      return null
    },
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
<style lang="scss">
#zoomMeeting {
  width: 0;
  height: 0;
  z-index: 999;
}
</style>
