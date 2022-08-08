<template>
  <v-container fluid fill-height class="align-start">
    <media-controls
      v-if="date"
      style="margin-bottom: 72px"
      :media-active="mediaActive"
    />
    <meeting-select v-else style="margin-bottom: 72px" />
    <v-footer fixed>
      <v-col class="text-left">
        <icon-btn
          v-if="$getPrefs('meeting.enableMusicButton')"
          variant="shuffle"
          click-twice
        />
      </v-col>
      <v-col v-if="scene">
        <form-input
          v-model="scene"
          field="select"
          :items="scenes"
          hide-details="auto"
        />
      </v-col>
      <v-col class="text-right">
        <icon-btn variant="toggleScreen" class="mr-2" />
        <v-btn
          nuxt
          :to="localePath('/?cong=') + cong"
          color="warning"
          :disabled="mediaActive"
        >
          <v-icon color="black">fas fa-fw fa-home</v-icon>
        </v-btn>
      </v-col>
    </v-footer>
  </v-container>
</template>
<script lang="ts">
import Vue from 'vue'
import { Scene } from 'obs-websocket-js'
import { ipcRenderer } from 'electron'
export default Vue.extend({
  name: 'PresentPage',
  data() {
    return {
      mediaActive: false,
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
            text: `ALT+${i + 1}: ${name}`,
            value: name,
          }
        })
    },
    date() {
      return this.$route.query.date
    },
    cong() {
      return this.$route.query.cong
    },
    mediaScreenVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
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
  methods: {},
})
</script>
