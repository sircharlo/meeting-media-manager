<!-- Icon buttons that are used multiple times across the application -->
<template>
  <v-btn
    v-if="variant === 'shuffle' && musicFadeOut && !clickedOnce"
    :id="variant"
    :aria-label="variant"
    color="warning"
    :title="$getPrefs('meeting.shuffleShortcut')"
    v-bind="$attrs"
    :loading="loading || $attrs.loading"
    :style="{ color: isDark ? 'white' : 'black' }"
    @click="atClick()"
  >
    <font-awesome-icon
      :icon="faStop"
      pull="left"
      :style="{ color: isDark ? 'white' : 'black' }"
    />
    {{ timeRemaining }}
  </v-btn>
  <v-tooltip v-else-if="variant === 'pause'" v-bind="tooltipObj">
    <template #activator="{ on, attrs }">
      <v-btn
        :id="variant"
        color="warning"
        :aria-label="variant"
        v-bind="{ ...$attrs, ...attrs }"
        :class="{ 'pulse-danger': toggled }"
        v-on="on"
        @click="$emit('click')"
      >
        <font-awesome-icon
          :icon="isVideo ? pauseIcon : pauseImageIcon"
          size="xl"
          class="black--text"
        />
      </v-btn>
    </template>
    <span>{{ $t(isVideo ? 'pause' : 'pauseImg') }}</span>
  </v-tooltip>
  <v-btn
    v-else-if="variant === 'toggleScreen'"
    :id="variant"
    :aria-label="variant"
    :color="mediaVisible ? 'warning' : 'primary'"
    v-bind="$attrs"
    :class="{ 'pulse-danger': !mediaVisible }"
    :title="$getPrefs('media.mediaWinShortcut')"
    @click="toggleMediaScreen()"
  >
    <font-awesome-layers class="fa-lg" fixed-width>
      <font-awesome-icon
        :icon="style.icons[0]"
        :class="mediaVisible ? 'black--text' : 'white--text'"
        fixed-width
      />
      <font-awesome-icon
        :icon="style.icons[mediaVisible ? 1 : 2]"
        :class="mediaVisible ? 'error--text' : 'white--text'"
        fixed-width
        transform="grow-12"
      />
    </font-awesome-layers>
  </v-btn>
  <v-tooltip v-else-if="clickedOnce" v-bind="tooltipObj">
    <template #activator="{ on, attrs }">
      <v-btn
        :id="variant"
        ref="btn"
        v-model="$attrs.value"
        :aria-label="variant"
        :loading="loading || $attrs.loading"
        v-bind="{ ...style.props, ...$attrs, ...attrs }"
        :color="variant === 'shuffle' && !musicFadeOut ? 'warning' : 'error'"
        v-on="on"
        @click="atClick()"
      >
        <font-awesome-icon
          v-if="variant === 'shuffle' && musicFadeOut"
          :icon="faStop"
          size="xl"
        />
        <font-awesome-icon
          v-for="(icon, i) in style.icons"
          v-else
          v-bind="icon.props ? icon.props : {}"
          :key="i"
          :pull="style.icons.length > 1 ? (i == 0 ? 'left' : 'right') : null"
          :icon="icon.text ? icon.text : icon"
          :style="{
            color:
              isDark || variant !== 'shuffle'
                ? 'white !important'
                : 'black !important',
          }"
        />
        <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
      </v-btn>
    </template>
    <span>{{ $t('clickAgain') }}</span>
  </v-tooltip>
  <v-btn
    v-else
    :id="variant"
    ref="btn"
    v-model="$attrs.value"
    :aria-label="variant"
    :title="
      variant === 'present'
        ? $getPrefs('media.presentShortcut')
        : variant === 'shuffle'
        ? $getPrefs('meeting.shuffleShortcut')
        : undefined
    "
    v-bind="{ ...style.props, ...$attrs }"
    :class="{
      ...style.props.class,
      'pulse-danger': variant === 'settings' && !updateSuccess,
    }"
    :nuxt="!!style.to || $attrs.nuxt"
    :loading="loading || $attrs.loading"
    :to="
      style.to
        ? localePath(`${style.to}?cong=${cong}&week=${weekNr}`)
        : $attrs.to
    "
    @click.stop="atClick()"
  >
    <font-awesome-icon
      v-for="(icon, i) in style.icons"
      v-bind="icon.props ? icon.props : {}"
      :key="i"
      :pull="style.icons.length > 1 ? (i == 0 ? 'left' : 'right') : null"
      :icon="icon.text ? icon.text : icon"
      :style="
        iconColor || icon.props
          ? { color: iconColor ? iconColor : icon.props.color }
          : {}
      "
    />
    <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
  </v-btn>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { Dayjs } from 'dayjs'
import {
  faStop,
  faPlay,
  faPause,
  faVideo,
  faVideoSlash,
  faDesktop,
  faBan,
  faSliders,
  faUserCog,
  faShuffle,
  faCircleArrowLeft,
  faMusic,
  faHome,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { faCircle } from '@fortawesome/free-regular-svg-icons'
import { ipcRenderer } from 'electron'
import { MS_IN_SEC } from '~/constants/general'

interface Style {
  to?: string
  props?: Record<string, any>
  icons: (
    | IconDefinition
    | { text: IconDefinition; props?: Record<string, any> }
  )[]
}

interface Styles {
  [key: string]: Style
}

export default defineComponent({
  props: {
    variant: {
      type: String,
      required: true,
      validator: (val: string) => {
        return [
          'home',
          'cancel',
          'settings',
          'play',
          'pause',
          'stop',
          'toggleScreen',
          'present',
          'shuffle',
        ].includes(val)
      },
    },
    clickTwice: {
      type: Boolean,
      default: false,
    },
    tooltip: {
      type: String,
      default: 'right',
      validator: (val: string) => {
        return ['right', 'left', 'top', 'bottom'].includes(val)
      },
    },
    iconColor: {
      type: String,
      default: '',
    },
    isVideo: {
      type: Boolean,
      default: false,
    },
    toggled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      clickedOnce: false,
      timeRemaining: '',
      interval: null as null | NodeJS.Timer,
      styles: {
        home: {
          to: '/',
          props: {
            'min-width': '32px',
            color: 'btn',
          },
          icons: [{ text: faHome, props: { class: 'white--text' } }],
        },
        cancel: {
          props: {
            'min-width': '32px',
            color: 'error',
          },
          icons: [
            {
              text: faCircleArrowLeft,
              props: { class: 'white--text', size: 'lg' },
            },
          ],
        },
        present: {
          to: '/present',
          props: { color: 'primary' },
          icons: [faPlay, faSliders],
        },
        settings: {
          to: '/settings',
          props: {
            'min-width': '32px',
            color: 'btn',
          },
          icons: [{ text: faUserCog, props: { class: 'white--text' } }],
        },
        shuffle: {
          props: { color: 'info' },
          icons: [
            { text: faMusic, props: { size: 'lg' } },
            { text: faShuffle, props: { size: 'lg' } },
          ],
        },
        play: {
          props: { color: 'primary' },
          icons: [{ text: faPlay, props: { size: 'lg' } }],
        },
        stop: {
          props: { color: 'warning' },
          icons: [
            {
              text: faStop,
              props: { size: 'xl', class: 'black--text' },
            },
          ],
        },
        toggleScreen: {
          icons: [faDesktop, faBan, faCircle],
        },
      } as Styles,
    }
  },
  computed: {
    faStop(): IconDefinition {
      return faStop
    },
    pauseImageIcon(): IconDefinition {
      return this.toggled ? faVideo : faVideoSlash
    },
    weekNr(): number {
      return parseInt((this.$route.query.week as string) ?? -1)
    },
    pauseIcon(): IconDefinition {
      return this.toggled ? faPlay : faPause
    },
    cong(): string {
      return this.$route.query.cong as string
    },
    isDark(): boolean {
      return this.$vuetify.theme.dark as boolean
    },
    mediaVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
    musicFadeOut(): Dayjs {
      return this.$store.state.media.musicFadeOut as Dayjs
    },
    style(): Style {
      return this.styles[this.variant as keyof Styles]
    },
    updateSuccess(): boolean {
      return this.$store.state.stats.updateSuccess as boolean
    },
    tooltipObj(): any {
      const obj = {} as any
      obj[this.tooltip] = true
      return obj
    },
  },
  watch: {
    musicFadeOut(val: Dayjs) {
      if (!!val !== !!this.interval) {
        this.setTimeRemaining()
      }
    },
  },
  mounted() {
    if (!!this.musicFadeOut !== !!this.interval) {
      this.setTimeRemaining()
    }
  },
  methods: {
    async atClick(): Promise<void> {
      // If click twice is enabled, wait for second click
      if (this.clickTwice && !this.clickedOnce) {
        this.clickedOnce = true
        setTimeout(() => {
          this.clickedOnce = false
        }, 3 * MS_IN_SEC)
      } else if (this.variant === 'shuffle') {
        this.loading = true
        this.clickedOnce = false
        await this.$shuffleMusic(!!this.musicFadeOut)
        this.loading = false
      } else {
        this.$emit('click')
      }
    },
    toggleMediaScreen() {
      ipcRenderer.send('toggleMediaWindowFocus')
    },
    // Set time remaining for music shuffle
    setTimeRemaining() {
      this.loading = true
      if (this.musicFadeOut) {
        this.interval = setInterval(async () => {
          if (typeof this.musicFadeOut === 'string') {
            this.timeRemaining = this.musicFadeOut
          } else {
            this.timeRemaining = this.$dayjs
              .duration(this.musicFadeOut.diff(this.$dayjs()), 'ms')
              .format('mm:ss')

            // Stop music shuffle at 0
            if (this.timeRemaining === '00:00') {
              this.loading = true
              await this.$shuffleMusic(true)
              this.loading = false
            }
          }
        }, MS_IN_SEC)
        // Stop the interval if music stopped
      } else if (this.interval) {
        clearInterval(this.interval as NodeJS.Timer)
        this.timeRemaining = ''
        this.interval = null
      }
      this.loading = false
    },
  },
})
</script>
<style lang="scss">
.theme--light {
  .v-btn {
    &.info {
      i {
        color: #000 !important;
      }
    }
  }
}
</style>
