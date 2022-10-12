<template>
  <v-container fluid fill-height class="align-start">
    <media-controls
      v-if="date"
      style="margin-bottom: 72px"
      :media-active="mediaActive"
      :video-active="videoActive"
    />
    <meeting-select
      v-else
      style="margin-bottom: 72px"
      :first-choice="firstChoice"
    />
    <v-footer fixed class="justify-end">
      <v-col v-if="scene && scenes.length > 1" class="d-flex justify-center">
        <v-btn-toggle
          v-if="showButtons"
          v-model="scene"
          mandatory
          color="primary"
        >
          <v-tooltip v-for="s in scenes" :key="s.name" top>
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
        <icon-btn
          v-if="shuffleEnabled"
          variant="shuffle"
          click-twice
          :disabled="mediaActive"
        />
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
  </v-container>
</template>
<!-- eslint-disable no-magic-numbers -->
<script lang="ts">
import Vue from 'vue'
import { MetaInfo } from 'vue-meta'
import { ipcRenderer } from 'electron'
import { faHome, IconDefinition } from '@fortawesome/free-solid-svg-icons'
export default Vue.extend({
  name: 'PresentPage',
  data() {
    return {
      mediaActive: false,
      videoActive: false,
      firstChoice: true,
      windowWidth: 0,
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
      async set(value: string) {
        if (this.mediaActive) {
          this.$store.commit('obs/setCurrentScene', value)
        } else {
          await this.$setScene(value)
        }
      },
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
      const WIDTH_OF_OTHER_ELEMENTS = this.shuffleEnabled ? 317 : 243
      return this.windowWidth - WIDTH_OF_OTHER_ELEMENTS
    },
    combinedScenesLength(): number {
      let nrOfChars = 0
      const PADDING_PER_SCENE = 25
      const BORDER_WIDTH = 1
      const WIDTH_PER_CHAR = 10.3

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
      const WIDTH_PER_CHAR = 22

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
      return (this.$store.state.obs.scenes as string[])
        .filter((scene) => scene !== this.$getPrefs('app.obs.mediaScene'))
        .map((scene, i) => {
          return {
            shortcut: `ALT+${i + 1}`,
            text: `ALT+${i + 1}: ${scene}`,
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
    cong(): string {
      return this.$route.query.cong as string
    },
  },
  watch: {
    date(val: string) {
      if (val) {
        this.firstChoice = false
      }
    },
  },
  mounted() {
    this.setWindowWidth()
    window.onresize = this.setWindowWidth
    ipcRenderer.on('showingMedia', (_e, val) => {
      this.mediaActive = val[0]
      this.videoActive = val[1]
    })

    if (this.$store.state.obs.connected) {
      this.$setScene(this.$getPrefs('app.obs.cameraScene'))
    }

    if (this.$getPrefs('media.enablePp')) {
      this.$setShortcut(
        this.$getPrefs('media.ppForward') as string,
        'nextMediaItem',
        'presentMode'
      )
      this.$setShortcut(
        this.$getPrefs('media.ppBackward') as string,
        'previousMediaItem',
        'presentMode'
      )
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.setWindowWidth)
    ipcRenderer.removeAllListeners('showingMedia')
    this.$unsetShortcuts('presentMode')
  },
  methods: {
    setWindowWidth() {
      this.windowWidth = window.innerWidth
    },
  },
})
</script>
