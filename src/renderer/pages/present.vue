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
                {{ s.shortText }}
              </v-btn>
            </template>
            <span>{{ s.text }}</span>
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
import { ipcRenderer } from 'electron'
import { faHome, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { Scene, SceneV4, SceneV5 } from '~/types'
export default Vue.extend({
  name: 'PresentPage',
  data() {
    return {
      mediaActive: false,
      videoActive: false,
      firstChoice: true,
    }
  },
  head() {
    return {
      // @ts-ignore
      title: this.date ?? 'Present',
      // @ts-ignore
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
    scenes() {
      return (this.$store.state.obs.scenes as Scene[])
        .filter(({ scene }) => {
          if (this.$getPrefs('app.obs.useV4')) {
            return (
              (scene as SceneV4).name !== this.$getPrefs('app.obs.mediaScene')
            )
          } else {
            return (
              (scene as SceneV5).sceneName !==
              this.$getPrefs('app.obs.mediaScene')
            )
          }
        })
        .map((scene, i) => {
          const v4 = this.$getPrefs('app.obs.useV4')
          const sceneName = v4
            ? (scene as SceneV4).name
            : (scene as SceneV5).sceneName
          return {
            shortText: sceneName
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase(),
            text: `ALT+${i + 1}: ${sceneName}`,
            value: sceneName,
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
      return this.$store.state.present.mediaScreenVisible
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
    ipcRenderer.on('showingMedia', (_e, val) => {
      this.mediaActive = val[0]
      this.videoActive = val[1]
    })
    if (this.$getPrefs('media.enablePp')) {
      this.$setShortcut(
        this.$getPrefs('media.ppForward') as string,
        'nextMediaItem',
        'present mode'
      )
      this.$setShortcut(
        this.$getPrefs('media.ppBackward') as string,
        'previousMediaItem',
        'present mode'
      )
    }
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('showingMedia')
    this.$unsetShortcuts('present mode')
  },
})
</script>
