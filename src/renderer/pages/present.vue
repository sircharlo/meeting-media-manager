<template>
  <v-container fluid fill-height class="align-start">
    <media-controls
      v-if="date"
      style="margin-bottom: 72px"
      :media-active="mediaActive"
    />
    <meeting-select
      v-else
      style="margin-bottom: 72px"
      :first-choice="firstChoice"
    />
    <v-footer fixed>
      <v-col class="text-left" cols="auto">
        <icon-btn
          v-if="$getPrefs('meeting.enableMusicButton')"
          variant="shuffle"
          click-twice
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
import { Scene } from 'obs-websocket-js'
import { ipcRenderer } from 'electron'
import { faHome } from '@fortawesome/free-solid-svg-icons'
export default Vue.extend({
  name: 'PresentPage',
  data() {
    return {
      mediaActive: false,
      firstChoice: true,
    }
  },
  computed: {
    scene: {
      get() {
        return this.$store.state.obs.currentScene
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
        .filter(({ name }) => name !== this.$getPrefs('app.obs.mediaScene'))
        .map(({ name }, i) => {
          return {
            shortText: name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase(),
            text: `ALT+${i + 1}: ${name}`,
            value: name,
          }
        })
    },
    date() {
      return this.$route.query.date
    },
    faHome() {
      return faHome
    },
    cong() {
      return this.$route.query.cong
    },
    mediaScreenVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
  },
  watch: {
    date(val) {
      if (val) {
        this.firstChoice = false
      }
    },
  },
  mounted() {
    ipcRenderer.on('showingMedia', (_e, val) => {
      this.mediaActive = val
    })
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('showingMedia')
  },
})
</script>
