<template>
  <v-app-bar height="64px">
    <v-col class="text-left" cols="4">
      <v-menu bottom right>
        <template #activator="{ on, attrs }">
          <v-btn icon aria-label="More actions" v-bind="attrs" v-on="on">
            <font-awesome-icon :icon="faEllipsisVertical" size="lg" />
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="(action, i) in actions"
            :key="i"
            :disabled="action.disabled ? mediaActive : false"
            @click="action.action()"
          >
            <v-list-item-icon>
              <font-awesome-icon
                v-for="(icon, j) in action.icons"
                :key="j"
                :icon="icon"
                size="sm"
              />
            </v-list-item-icon>
            <v-list-item-title>{{ action.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            aria-label="Add song"
            v-bind="attrs"
            v-on="on"
            @click="$emit('song')"
          >
            <font-awesome-icon :icon="faMusic" pull="left" size="lg" />
            <font-awesome-icon :icon="faPlus" pull="right" size="lg" />
          </v-btn>
        </template>
        <span>{{ $t('lastMinuteSong') }}</span>
      </v-tooltip>
      <v-tooltip
        v-if="$getPrefs('media.enableSubtitles') && ccAvailable"
        bottom
      >
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            aria-label="Toggle subtitles"
            v-bind="attrs"
            :color="ccEnable ? 'primary' : undefined"
            v-on="on"
            @click="$emit('cc')"
          >
            <font-awesome-icon :icon="ccIcon" size="lg" />
          </v-btn>
        </template>
        <span>{{ $t('toggleSubtitles') }}</span>
      </v-tooltip>
    </v-col>
    <v-col class="text-center d-flex justify-center">
      <v-btn
        if="btn-toggle-meeting-date"
        class="px-3"
        color="secondary"
        :disabled="mediaActive"
        large
        @click="clearDate()"
      >
        {{ date }}
      </v-btn>
    </v-col>
    <v-col class="text-right pr-8" cols="4">
      <template v-if="$getPrefs('media.enablePp')">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              id="btn-pp-previous"
              icon
              aria-label="Previous"
              :disabled="!mediaActive && currentIndex < 1"
              v-bind="attrs"
              v-on="on"
              @click="$emit('previous')"
            >
              <font-awesome-icon :icon="faBackward" size="lg" />
            </v-btn>
          </template>
          <span>{{ $getPrefs('media.ppBackward') }}</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              id="btn-pp-next"
              icon
              aria-label="Next"
              v-bind="attrs"
              class="mr-2"
              :disabled="!mediaActive && currentIndex == mediaCount - 1"
              v-on="on"
              @click="$emit('next')"
            >
              <font-awesome-icon :icon="faForward" size="lg" />
            </v-btn>
          </template>
          <span>{{ $getPrefs('media.ppForward') }}</span>
        </v-tooltip>
      </template>
      <v-tooltip v-if="sortable" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            id="btn-order-save"
            aria-label="Save order"
            icon
            v-bind="attrs"
            v-on="on"
            @click="$emit('sortable')"
          >
            <font-awesome-icon :icon="faArrowDownUpLock" size="lg" />
          </v-btn>
        </template>
        <span>{{ $t('sortSave') }}</span>
      </v-tooltip>
      <v-tooltip v-else bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            id="btn-order-change"
            icon
            aria-label="Sort items"
            :disabled="mediaActive"
            v-bind="attrs"
            v-on="on"
            @click="$emit('sortable')"
          >
            <font-awesome-icon :icon="faArrowDownUpAcrossLine" size="lg" />
          </v-btn>
        </template>
        <span>{{ $t('sortMedia') }}</span>
      </v-tooltip>
    </v-col>
  </v-app-bar>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { join } from 'upath'
import { ipcRenderer } from 'electron'
import {
  faListOl,
  faRotateRight,
  faBackward,
  faForward,
  faMusic,
  faPlus,
  faGlobe,
  faFolderPlus,
  faArrowDownUpLock,
  faEllipsisVertical,
  faArrowDownUpAcrossLine,
  faClosedCaptioning,
  faFolderOpen,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { faClosedCaptioning as farClosedCaptioning } from '@fortawesome/free-regular-svg-icons'

export default defineComponent({
  props: {
    mediaActive: {
      type: Boolean,
      default: false,
    },
    mediaCount: {
      type: Number,
      default: 0,
    },
    currentIndex: {
      type: Number,
      default: 0,
    },
    ccEnable: {
      type: Boolean,
      default: true,
    },
    sortable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      ccAvailable: false,
      actions: [
        {
          title: this.$t('manageMedia'),
          icons: [faFolderPlus],
          action: () => {
            this.$emit('manage-media')
          },
        },
        {
          title: this.$t('refresh'),
          icons: [faRotateRight],
          // @ts-ignore
          action: this.refresh,
          disabled: true,
        },
        {
          title: this.$t('openFolder'),
          icons: [faFolderOpen],
          // @ts-ignore
          action: this.openFolder,
        },
        {
          title: this.$t('showPrefix'),
          icons: [faListOl],
          // @ts-ignore
          action: this.showPrefix,
        },
        {
          title: this.$t('openJWorg') + ' [BETA]',
          icons: [faGlobe],
          // @ts-ignore
          action: this.openWebsite,
          disabled: true,
        },
      ] as {
        title: string
        icons: IconDefinition[]
        action: () => void
      }[],
    }
  },
  computed: {
    date(): string {
      return this.$route.query.date as string
    },
    ccIcon(): IconDefinition {
      return this.ccEnable ? faClosedCaptioning : farClosedCaptioning
    },
    scene(): string {
      return this.$store.state.obs.currentScene as string
    },
    faMusic() {
      return faMusic
    },
    faPlus() {
      return faPlus
    },
    faEllipsisVertical() {
      return faEllipsisVertical
    },
    faArrowDownUpAcrossLine() {
      return faArrowDownUpAcrossLine
    },
    faBackward() {
      return faBackward
    },
    faForward() {
      return faForward
    },
    faArrowDownUpLock() {
      return faArrowDownUpLock
    },
  },
  mounted() {
    this.ccAvailable =
      this.$findAll(join(this.$mediaPath(), this.date, '*.vtt')).length > 0

    ipcRenderer.send('toggleSubtitles', {
      enabled: this.$getPrefs('media.enableSubtitles') && this.ccAvailable,
      top: false,
    })
  },
  methods: {
    async openWebsite() {
      // Set OBS scene
      if (this.scene) {
        const mediaScene = this.$getPrefs('app.obs.mediaScene') as string
        if (mediaScene) {
          await this.$setScene(mediaScene)
        } else {
          this.$warn('errorObsMediaScene')
        }
      }

      ipcRenderer.send(
        'openWebsite',
        `https://www.jw.org/${this.$getPrefs('app.localAppLang')}/`
      )
    },
    refresh() {
      this.$emit('refresh')
      this.ccAvailable =
        this.$findAll(join(this.$mediaPath(), this.date, '*.vtt')).length > 0
    },
    clearDate() {
      this.$router.push({
        query: {
          ...this.$route.query,
          date: undefined,
        },
      })
    },
    showPrefix() {
      this.$emit('prefix')
    },
    openFolder(): void {
      try {
        ipcRenderer.send('openPath', join(this.$mediaPath(), this.date))
      } catch (e: unknown) {
        this.$warn(
          'errorSetVars',
          { identifier: join(this.$mediaPath(), this.date) },
          e
        )
      }
    },
  },
})
</script>
