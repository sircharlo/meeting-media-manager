<template>
  <v-footer width="100%" height="72px" class="justify-end">
    <v-col v-if="scene && zoomScene" cols="auto">
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn icon @click="$emit('zoom-part')">
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
    <v-col v-else-if="obsEnabled && !scene">
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn icon :loading="obsLoading" @click="initOBS()">
            <font-awesome-icon
              :icon="faRotateRight"
              size="xl"
              v-bind="attrs"
              v-on="on"
            />
          </v-btn>
        </template>
        <span>{{ $t('obsRefresh') }}</span>
      </v-tooltip>
    </v-col>
    <v-col
      v-if="scene && !zoomPart && scenes.length > 1"
      class="d-flex justify-end pa-1"
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
        width=""
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
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ipcRenderer } from 'electron'
import {
  faHome,
  IconDefinition,
  faHouseUser,
  faRotateRight,
  faPodcast,
} from '@fortawesome/free-solid-svg-icons'
import { EmbeddedClient, Participant } from '@zoomus/websdk/embedded'
import { ObsPrefs } from '~/types'
export default defineComponent({
  props: {
    mediaActive: {
      type: Boolean,
      default: false,
    },
    zoomPart: {
      type: Boolean,
      default: false,
    },
    windowWidth: {
      type: Number,
      required: true,
    },
    participant: {
      type: Object as PropType<Participant>,
      required: true,
    },
  },
  data() {
    return {
      obsLoading: false,
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
    obsEnabled(): boolean {
      const { enable, port, password } = this.$getPrefs('app.obs') as ObsPrefs

      return enable && !!port && !!password
    },
    allScenes(): string[] {
      return this.$store.state.obs.scenes as string[]
    },
    zoomClient(): typeof EmbeddedClient {
      return this.$store.state.zoom.client as typeof EmbeddedClient
    },
    zoomScene(): string | null {
      const zoomScene = this.$getPrefs('app.obs.zoomScene') as string | null
      if (!zoomScene || !this.allScenes.includes(zoomScene)) return null
      return zoomScene
    },
    showButtons(): boolean {
      return this.shortScenesLength < this.availableWidth
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
    faHome(): IconDefinition {
      return faHome as IconDefinition
    },
    faHouseUser(): IconDefinition {
      return faHouseUser as IconDefinition
    },
    faRotateRight(): IconDefinition {
      return faRotateRight as IconDefinition
    },
    faPodcast(): IconDefinition {
      return faPodcast as IconDefinition
    },
    cong(): string {
      return this.$route.query.cong as string
    },
    mediaWinVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
  },
  watch: {
    zoomPart(val: boolean) {
      if (this.mediaActive || !this.zoomScene) return
      const hostID = this.$store.state.zoom.hostID as number

      if (this.zoomClient) {
        this.$toggleMic(this.zoomSocket(), !val, this.participant?.userId)
        if (val) {
          this.$toggleSpotlight(this.zoomSocket(), false)
          this.$toggleSpotlight(this.zoomSocket(), true, hostID)
        } else {
          this.$emit('clear-participant')
        }
      }

      this.$setScene(val ? this.zoomScene : this.scene)
      if (val === this.mediaWinVisible) {
        ipcRenderer.send('toggleMediaWindowFocus')
      }

      if (this.zoomClient) {
        this.$toggleSpotlight(this.zoomSocket(), false)
        this.$toggleSpotlight(
          this.zoomSocket(),
          this.$getPrefs('app.zoom.spotlight') as boolean,
          hostID
        )
      }
    },
  },
  async mounted() {
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
  },
  methods: {
    async initOBS() {
      this.obsLoading = true
      await this.$getScenes()
      this.obsLoading = false
    },
    zoomSocket(): WebSocket {
      return window.sockets[window.sockets.length - 1]
    },
  },
})
</script>
