<template>
  <v-btn
    v-if="variant === 'shuffle' && musicFadeOut && !clickedOnce"
    color="warning"
    title="ALT+K"
    :disabled="loading || $attrs.disabled"
    :loading="loading || $attrs.loading"
    @click="atClick()"
  >
    <v-icon small left :color="isDark ? 'white' : 'black'">
      fas fa-fw fa-stop
    </v-icon>
    {{ timeRemaining }}
  </v-btn>
  <v-btn
    v-else-if="variant === 'pause'"
    color="warning"
    :class="{ 'pulse-danger': toggled }"
    @click="toggle()"
  >
    <v-icon color="black">
      {{ toggled ? 'fas fa-fw fa-play' : 'fas fa-fw fa-pause' }}
    </v-icon>
  </v-btn>
  <v-btn
    v-else-if="variant === 'toggleScreen'"
    :color="mediaVisible ? 'warning' : 'primary'"
    class="px-2"
    :class="{ 'pulse-danger': !mediaVisible }"
    title="ALT+Z"
    min-width="32px"
    @click="toggleMediaScreen()"
  >
    <span class="fa-stack fa-1x">
      <i :class="style.icons[mediaVisible ? 0 : 1]" />
      <i :class="style.icons[mediaVisible ? 2 : 3]" />
    </span>
  </v-btn>
  <v-tooltip v-else-if="clickedOnce" v-bind="tooltipObj">
    <template #activator="{ on, attrs }">
      <v-btn
        ref="btn"
        v-model="$attrs.value"
        :disabled="loading || $attrs.disabled"
        :loading="loading || $attrs.loading"
        v-bind="{ ...style.props, ...$attrs, ...attrs }"
        :color="variant === 'shuffle' && !musicFadeOut ? 'warning' : 'error'"
        v-on="on"
        @click="atClick()"
      >
        <v-icon v-if="variant === 'shuffle' && musicFadeOut" color="white">
          fas fa-fw fa-stop
        </v-icon>
        <v-icon
          v-for="icon in style.icons"
          v-else
          v-bind="icon.props ? icon.props : {}"
          :key="icon.text ? icon.text : icon"
          :color="isDark || variant !== 'shuffle' ? 'white' : 'black'"
        >
          {{ icon.text ? icon.text : icon }}
        </v-icon>
        <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
      </v-btn>
    </template>
    <span>{{ $t('clickAgain') }}</span>
  </v-tooltip>
  <v-btn
    v-else
    ref="btn"
    v-model="$attrs.value"
    :nuxt="!!style.to"
    :disabled="loading || $attrs.disabled"
    :loading="loading || $attrs.loading"
    :to="style.to ? localePath(`${style.to}?cong=${cong}`) : undefined"
    v-bind="{ ...style.props, ...$attrs }"
    @click.stop="atClick()"
  >
    <v-icon
      v-for="icon in style.icons"
      v-bind="icon.props ? icon.props : {}"
      :key="icon.text ? icon.text : icon"
      :color="iconColor ? iconColor : icon.props ? icon.props.color : undefined"
    >
      {{ icon.text ? icon.text : icon }}
    </v-icon>
    <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
  </v-btn>
</template>
<script lang="ts">
import Vue from 'vue'
import { Dayjs } from 'dayjs'
import { ipcRenderer } from 'electron'
export default Vue.extend({
  props: {
    variant: {
      type: String,
      required: true,
      validator: (val: string) =>
        [
          'home',
          'settings',
          'play',
          'pause',
          'stop',
          'sort',
          'toggleScreen',
          'present',
          'shuffle',
        ].includes(val),
    },
    clickTwice: {
      type: Boolean,
      default: false,
    },
    tooltip: {
      type: String,
      default: 'right',
      validator: (val: string) =>
        ['right', 'left', 'top', 'bottom'].includes(val),
    },
    iconColor: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      toggled: false,
      loading: false,
      clickedOnce: false,
      timeRemaining: '',
      interval: null as null | NodeJS.Timer,
      styles: {
        home: {
          to: '/',
          props: { 'min-width': '32px', dark: true },
          icons: [{ text: 'fas fa-fw fa-home', props: { small: true } }],
        },
        present: {
          to: '/present',
          props: { color: 'primary', title: 'ALT+D' },
          icons: [
            { text: 'fas fa-fw fa-play', props: { small: true } },
            { text: 'fas fa-sliders', props: { small: true } },
          ],
        },
        settings: {
          to: '/settings',
          props: { 'min-width': '32px', dark: true },
          icons: [{ text: 'fas fa-fw fa-user-cog', props: { small: true } }],
        },
        shuffle: {
          props: { color: 'info', title: 'ALT+K' },
          icons: [
            { text: 'fas fa-fw fa-music', props: { small: true } },
            { text: 'fa-solid fa-shuffle', props: { small: true } },
          ],
        },
        play: {
          props: { color: 'primary' },
          icons: [{ text: 'fas fa-fw fa-play', props: { small: true } }],
        },
        stop: {
          props: { color: 'warning' },
          icons: [{ text: 'fas fa-fw fa-stop', props: { color: 'black' } }],
        },
        sort: {
          props: { color: 'info', class: 'sort-btn' },
          icons: [{ text: 'fas fa-sort', props: { small: true } }],
        },
        toggleScreen: {
          icons: [
            'fas fa-fw fa-stack-1x fa-desktop black--text',
            'fas fa-fw fa-stack-1x fa-desktop white--text',
            'fas fa-stack-2x fa-ban error--text',
            'far fa-stack-2x fa-circle white--text',
          ],
        },
      },
    }
  },
  computed: {
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
    style(): any {
      // @ts-ignore
      return this.styles[this.variant]
    },
    tooltipObj(): any {
      const obj = {} as any
      obj[this.tooltip] = true
      return obj
    },
  },
  watch: {
    musicFadeOut(val) {
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
    toggle() {
      this.toggled = !this.toggled
      this.$emit('click')
    },
    async atClick(): Promise<void> {
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
            if (this.timeRemaining === '00:00') {
              this.loading = true
              await this.$shuffleMusic(true)
              this.loading = false
            }
          }
        }, 1000)
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
