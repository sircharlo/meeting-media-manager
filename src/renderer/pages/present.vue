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
    <v-footer fixed class="justify-space-between">
      <v-col class="text-left" cols="auto">
        <icon-btn
          v-if="$getPrefs('meeting.enableMusicButton')"
          variant="shuffle"
          click-twice
          :disabled="mediaActive"
        />
      </v-col>
      <v-col v-if="scene && scenes.length > 1" class="d-flex justify-center">
        <v-btn-toggle
          v-if="scenes.length <= 6"
          v-model="scene"
          mandatory
          color="primary"
        >
          <v-tooltip v-for="s in scenes" :key="s.name" top>
            <template #activator="{ on, attrs }">
              <v-btn :value="s.value" v-bind="attrs" v-on="on">
                {{ showShortText ? s.shortText : s.value }}
              </v-btn>
            </template>
            <span>{{ showShortText ? s.text : s.shortcut }}</span>
          </v-tooltip>
        </v-btn-toggle>
        <form-input
          v-else
          v-model="scene"
          field="select"
          :items="scenes"
          hide-details="auto"
        />
      </v-col>
      <v-col class="text-right" cols="auto">
        <icon-btn variant="toggleScreen" class="mr-2" />
        <v-btn
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
    showShortText(): boolean {
      return (
        10.1 * this.combinedScenesLength >
        this.windowWidth - 320 - (25 * this.scenes.length + 1)
      )
    },
    combinedScenesLength(): number {
      let length = 0
      for (const scene of this.scenes) {
        length += scene.value.length
      }
      return length
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
    mediaScreenVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible as boolean
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
