<template>
  <v-btn
    v-if="variant === 'shuffle' && musicFadeOut && !clickedOnce"
    :aria-label="variant"
    color="warning"
    title="ALT+K"
    v-bind="$attrs"
    :loading="loading || $attrs.loading"
    @click="atClick()"
  >
    <font-awesome-icon :icon="faStop" pull="left" />
    {{ timeRemaining }}
  </v-btn>
  <v-btn
    v-else-if="variant === 'pause'"
    color="warning"
    :aria-label="variant"
    v-bind="$attrs"
    :class="{ 'pulse-danger': toggled }"
    @click="$emit('click')"
  >
    <font-awesome-icon :icon="pauseIcon" size="xl" class="black--text" />
  </v-btn>
  <v-btn
    v-else-if="variant === 'toggleScreen'"
    :aria-label="variant"
    :color="mediaVisible ? 'warning' : 'primary'"
    v-bind="$attrs"
    :class="{ 'pulse-danger': !mediaVisible }"
    title="ALT+Z"
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
          :style="{ color: 'white' }"
        />
        <font-awesome-icon
          v-for="(icon, i) in style.icons"
          v-else
          v-bind="icon.props ? icon.props : {}"
          :key="i"
          :pull="style.icons.length > 0 ? (i == 0 ? 'left' : 'right') : null"
          :icon="icon.text ? icon.text : icon"
          :style="{
            color: isDark || variant !== 'shuffle' ? 'white' : 'black',
          }"
        />
        <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
      </v-btn>
    </template>
    <span>{{ $t('clickAgain') }}</span>
  </v-tooltip>
  <v-btn
    v-else
    ref="btn"
    v-model="$attrs.value"
    :aria-label="variant"
    v-bind="{ ...style.props, ...$attrs }"
    :class="{
      ...style.props.class,
      'pulse-danger': variant === 'settings' && !updateSuccess,
    }"
    :nuxt="!!style.to || $attrs.nuxt"
    :loading="loading || $attrs.loading"
    :to="style.to ? localePath(`${style.to}?cong=${cong}`) : $attrs.to"
    @click.stop="atClick()"
  >
    <font-awesome-icon
      v-for="(icon, i) in style.icons"
      v-bind="icon.props ? icon.props : {}"
      :key="i"
      :pull="style.icons.length > 0 ? (i == 0 ? 'left' : 'right') : null"
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
import Vue from 'vue'
import { Dayjs } from 'dayjs'
import {
  faStop,
  faPlay,
  faPause,
  faDesktop,
  faBan,
  faSliders,
  faUserCog,
  faShuffle,
  faMusic,
  faSort,
  faHome,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { faCircle } from '@fortawesome/free-regular-svg-icons'
import { ipcRenderer } from 'electron'

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

export default Vue.extend({
  props: {
    variant: {
      type: String,
      required: true,
      validator: (val: string) => {
        return [
          'home',
          'settings',
          'play',
          'pause',
          'stop',
          'sort',
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
          props: { 'min-width': '32px', color: 'black' },
          icons: [{ text: faHome, props: { class: 'white--text' } }],
        },
        present: {
          to: '/present',
          props: { color: 'primary', title: 'ALT+D' },
          icons: [faPlay, faSliders],
        },
        settings: {
          to: '/settings',
          props: { 'min-width': '32px', color: 'black' },
          icons: [{ text: faUserCog, props: { class: 'white--text' } }],
        },
        shuffle: {
          props: { color: 'info', title: 'ALT+K' },
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
        sort: {
          props: { color: 'info', class: { 'sort-btn': true } },
          icons: [faSort],
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
        }, 3000)
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
        }, 1000)
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
