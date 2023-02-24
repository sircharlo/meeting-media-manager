<template>
  <v-app-bar
    id="zoom-app-bar"
    height="56"
    dark
    color="primary"
    class="text-left"
  >
    <v-app-bar-nav-icon>
      <font-awesome-icon :icon="faZ" size="lg" />
    </v-app-bar-nav-icon>
    <v-col cols="auto">
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            aria-label="Toggle zoom component"
            v-bind="attrs"
            v-on="on"
            @click="showZoomComponent = !showZoomComponent"
          >
            <font-awesome-icon
              :icon="showZoomComponent ? faEyeSlash : faEye"
              size="lg"
            />
          </v-btn>
        </template>
        <span>{{ $t('zoomToggleComponent') }}</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            :loading="loadingZoom"
            aria-label="Toggle zoom meeting"
            v-bind="attrs"
            v-on="on"
            @click="toggleZoomMeeting()"
          >
            <font-awesome-icon
              :icon="zoomStarted ? faStop : faPlay"
              size="lg"
            />
          </v-btn>
        </template>
        <span>{{ $t(`zoom${zoomStarted ? 'Stop' : 'Start'}Meeting`) }}</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            aria-label="Mute Zoom participants"
            v-bind="attrs"
            v-on="on"
            @click="$muteParticipants()"
          >
            <font-awesome-icon :icon="faMicrophoneSlash" size="lg" />
          </v-btn>
        </template>
        <span>{{ $t('zoomMuteParticipants') }}</span>
      </v-tooltip>
    </v-col>
    <v-col class="d-flex flex-row pr-0">
      <v-col class="d-flex align-center justify-end pr-0">
        <form-input
          v-model="participants"
          field="autocomplete"
          color="white"
          item-text="displayName"
          item-value="userId"
          :search-input.sync="participantSearch"
          :loading="allParticipants.length == 0"
          :label="$t('spotlightParticipants')"
          :disabled="spotlightActive"
          :items="allParticipants"
          style="max-width: 500px"
          hide-details="auto"
          chips
          small-chips
          deletable-chips
          multiple
          clearable
          return-object
          @change="participantSearch = ''"
        >
          <template #item="{ item }">
            <v-list-item-action>
              <v-simple-checkbox
                :value="participants.includes(item)"
                @click="toggleParticipant(item)"
              />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>{{ item.displayName }}</v-list-item-title>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn icon @click.stop="$emit('rename', item)">
                <font-awesome-icon :icon="faPencil" size="lg" />
              </v-btn>
            </v-list-item-action>
          </template>
        </form-input>
      </v-col>
      <v-col cols="auto" class="px-0">
        <v-btn
          icon
          :class="{ 'pulse-danger': spotlightActive }"
          :disabled="participants.length == 0"
          @click="spotlightParticipants()"
        >
          <font-awesome-icon
            :icon="spotlightActive ? faUsersSlash : faUsersRectangle"
            size="lg"
          />
        </v-btn>
      </v-col>
    </v-col>
  </v-app-bar>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { ipcRenderer } from 'electron'
import { Participant } from '@zoomus/websdk/embedded'
import {
  faZ,
  faStop,
  faPlay,
  faMicrophoneSlash,
  faUsersRectangle,
  faUsersSlash,
  faEye,
  faPencil,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons'
import { MS_IN_SEC } from '~/constants/general'
export default defineComponent({
  data() {
    return {
      loadingZoom: false,
      showZoomComponent: true,
      spotlightActive: false,
      participantSearch: '',
      participants: [] as Participant[],
    }
  },
  computed: {
    faMicrophoneSlash() {
      return faMicrophoneSlash
    },
    faUsersSlash() {
      return faUsersSlash
    },
    faUsersRectangle() {
      return faUsersRectangle
    },
    faPencil() {
      return faPencil
    },
    faZ() {
      return faZ
    },
    faStop() {
      return faStop
    },
    faPlay() {
      return faPlay
    },
    faEye() {
      return faEye
    },
    faEyeSlash() {
      return faEyeSlash
    },
    mediaVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
    zoomStarted(): boolean {
      return this.$store.state.zoom.started as boolean
    },
    isCoHost(): boolean {
      return this.$store.state.zoom.coHost as boolean
    },
    allParticipants(): Participant[] {
      const participants = this.$store.state.zoom.participants as Participant[]
      return participants.filter(
        (p) => !p.bHold && p.displayName !== this.$getPrefs('app.zoom.name')
      )
    },
  },
  watch: {
    showZoomComponent(show: boolean) {
      const el = document.getElementById('zoomMeeting')
      if (!el) return
      el.style.display = show ? 'flex' : 'none'
    },
  },
  mounted() {
    setTimeout(() => {
      this.showZoomComponent = !this.$getPrefs('app.zoom.hideComponent')
      const el = document.querySelector(
        '#zoom-app-bar button.v-app-bar__nav-icon'
      ) as HTMLButtonElement

      if (el) {
        el.disabled = true
      }
    }, MS_IN_SEC)
  },
  methods: {
    zoomSocket(): WebSocket {
      return window.sockets[window.sockets.length - 1]
    },
    toggleParticipant(participant: Participant) {
      if (this.participants.includes(participant)) {
        this.participants = this.participants.filter(
          (p) => p.userId !== participant.userId
        )
      } else {
        this.participants.push(participant)
      }
    },
    async spotlightParticipants() {
      if (!this.isCoHost) {
        this.$warn('errorNotCoHost')
        return
      }

      this.$toggleSpotlight(this.zoomSocket(), false)

      if (this.spotlightActive) {
        this.$muteParticipants(this.zoomSocket())

        const hostID = this.$store.state.zoom.hostID as number
        if (this.$getPrefs('app.zoom.spotlight')) {
          this.$toggleSpotlight(this.zoomSocket(), true, hostID)
        }
        this.participants = []
        this.$store.commit('zoom/setSpotlights', [])
      } else {
        this.$store.commit(
          'zoom/setSpotlights',
          this.participants.map((p) => p.userId)
        )
        for (const p of this.participants) {
          this.$toggleSpotlight(this.zoomSocket(), true, p.userId)
          await this.$toggleMic(this.zoomSocket(), false, p.userId)
        }
      }

      if (this.mediaVisible !== this.spotlightActive) {
        ipcRenderer.send('toggleMediaWindowFocus')
      }

      this.spotlightActive = !this.spotlightActive
    },
    async toggleZoomMeeting() {
      this.loadingZoom = true
      if (this.zoomStarted) {
        this.$stopMeeting(this.zoomSocket())
      } else {
        await this.$startMeeting(this.zoomSocket())
      }
      this.loadingZoom = false
    },
  },
})
</script>
<style lang="scss">
#zoom-app-bar {
  button.v-app-bar__nav-icon {
    cursor: initial !important;

    &:before {
      opacity: 0 !important;
    }
  }
}
</style>
