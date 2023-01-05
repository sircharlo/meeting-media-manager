<!-- eslint-disable vue/no-unused-vars -->
<!-- Icon buttons that are used multiple times across the application -->
<template>
  <v-tooltip v-if="variant === 'pause'" v-bind="tooltipObj">
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
  <v-tooltip v-else-if="clickedOnce" v-bind="tooltipObj" :value="true">
    <template #activator="data">
      <v-btn
        :id="variant"
        ref="btn"
        v-model="$attrs.value"
        v-click-outside="revertClickedOnce"
        :aria-label="variant"
        v-bind="{ ...style.props, ...$attrs }"
        color="error"
        @click="atClick()"
      >
        <font-awesome-icon
          v-for="(icon, i) in style.icons"
          v-bind="icon.props ? icon.props : {}"
          :key="i"
          :pull="style.icons.length > 1 ? (i == 0 ? 'left' : 'right') : null"
          :icon="icon.text ? icon.text : icon"
          :style="{
            color: 'white !important',
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
      variant === 'present' ? $getPrefs('media.presentShortcut') : undefined
    "
    v-bind="{ ...style.props, ...$attrs }"
    :class="{
      ...style.props.class,
      'pulse-danger': variant === 'settings' && !updateSuccess,
    }"
    :nuxt="!!style.to || $attrs.nuxt"
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
import { defineComponent, PropType } from 'vue'
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
  faCircleArrowLeft,
  faHome,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { faCircle } from '@fortawesome/free-regular-svg-icons'
import { ipcRenderer } from 'electron'
import { MS_IN_SEC } from '~/constants/general'

interface Style {
  to?: string
  props: Record<string, any>
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
        ].includes(val)
      },
    },
    clickTwice: {
      type: Boolean,
      default: false,
    },
    tooltip: {
      type: String as PropType<'top' | 'left' | 'right' | 'bottom'>,
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
      clickedOnce: false,
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
          props: {},
        },
      } as Styles,
    }
  },
  computed: {
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
    mediaVisible(): boolean {
      return this.$store.state.present.mediaScreenVisible
    },
    style(): Style {
      return this.styles[this.variant as keyof Styles]
    },
    updateSuccess(): boolean {
      return this.$store.state.stats.updateSuccess as boolean
    },
    tooltipObj(): {
      top?: boolean
      left?: boolean
      right?: boolean
      bottom?: boolean
    } {
      const obj = {} as {
        top?: boolean
        left?: boolean
        right?: boolean
        bottom?: boolean
      }
      obj[this.tooltip] = true
      return obj
    },
  },
  methods: {
    revertClickedOnce() {
      this.clickedOnce = false
    },
    atClick() {
      // If click twice is enabled, wait for second click
      if (this.clickTwice && !this.clickedOnce) {
        this.clickedOnce = true
        setTimeout(() => {
          this.clickedOnce = false
        }, 3 * MS_IN_SEC)
      } else {
        this.$emit('click')
      }
    },
    toggleMediaScreen() {
      ipcRenderer.send('toggleMediaWindowFocus')
    },
  },
})
</script>
