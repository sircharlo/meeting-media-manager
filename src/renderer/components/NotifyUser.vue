<!-- eslint-disable vue/no-v-html -->
<!-- A message that notifies the user of something -->
<template>
  <div class="n-messages">
    <v-snackbar
      v-for="(m, i) in messages"
      :id="`msg-${m.timestamp}`"
      :key="`${m.timestamp}-${m.message}`"
      top
      right
      rounded
      :elevation="24"
      :color="color"
      :vertical="true"
      :value="true"
      min-width="350px"
      width="30%"
      :timeout="m.persistent ? -1 : 10000"
      content-class="message-content"
      :style="`z-index: 999; top: ${getCombinedHeight(i)}px`"
      @input="hideMessage(i, $event)"
    >
      <v-row justify="space-between">
        <v-col cols="auto" class="d-flex align-center">
          <font-awesome-icon
            :icon="m.type | icon"
            :class="getIconColor(m.type) + '--text mr-1'"
          />
          {{ $t(m.type) }}
        </v-col>
        <v-col cols="auto">
          <v-btn
            v-if="m.persistent || m.dismiss"
            icon
            :color="closeColor"
            class="align-right"
            @click="hideMessage(i)"
          >
            <font-awesome-icon :icon="closeIcon" />
          </v-btn>
        </v-col>
      </v-row>
      <v-divider />
      <p class="pa-2" v-html="$t(m.message)" />
      <code v-if="m.identifier">{{ m.identifier }}</code>
      <v-divider v-if="m.action" class="mt-2" />
      <template v-if="m.action" #action="{ attrs }">
        <v-btn
          v-bind="attrs"
          small
          color="primary"
          @click="openActionURL(m.action)"
        >
          {{ $t(m.action.label) }}
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import {
  faInfoCircle,
  faExclamationCircle,
  faXmark,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import { Notify, NotifyAction } from '~/types'
export default Vue.extend({
  filters: {
    iconColor(type: string) {
      switch (type) {
        case 'warning':
        case 'error':
        case 'success':
          return type
        default:
          return 'primary'
      }
    },
    icon(type: string) {
      switch (type) {
        case 'warning':
        case 'error':
          return faExclamationCircle
        case 'success':
          return faCircleCheck
        default:
          return faInfoCircle
      }
    },
  },
  data() {
    return {
      closeIcon: faXmark,
    }
  },
  computed: {
    messages() {
      return this.$store.state.notify as Notify[]
    },
    closeColor() {
      return this.$vuetify.theme.dark ? 'white' : 'black'
    },
    color() {
      return this.$vuetify.theme.dark ? '#121212' : '#fff'
    },
  },
  methods: {
    openActionURL(action: NotifyAction) {
      let url = action.url as string

      // If action is error, open github report issue page
      if (action.type === 'error') {
        url =
          (this.$bugURL() as string) +
          encodeURIComponent(`
### Error details
\`\`\`
${JSON.stringify(
  action.url as Error,
  Object.getOwnPropertyNames(action.url as Error),
  2
)}
\`\`\``).replace(/\n/g, '%0D%0A')
      }
      window.open(url, '_blank')
    },
    getIconColor(type: string) {
      switch (type) {
        case 'warning':
        case 'error':
        case 'success':
          return type
        default:
          return 'primary'
      }
    },
    hideMessage(key: number, val: boolean = false) {
      if (!val) {
        this.$store.commit('notify/delete', key)
      }
    },
    // Get combined height of previous messages to calculate where to place the next message
    getCombinedHeight(index: number) {
      let height = 0
      for (let i = 0; i < index; i++) {
        height += this.getHeight(i) // The height of each message
        height += 8 // The margin between messages
      }
      return height + 8 // The start margin for the first message
    },
    // Calculate the height of a message
    getHeight(index: number) {
      const el = document.getElementById(
        `msg-${this.messages[index].timestamp}`
      )
      if (el) {
        return el.children[0].clientHeight
      } else {
        return 0
      }
    },
  },
})
</script>
<style lang="scss">
.theme--light {
  .message-content {
    color: black;
  }
}

.n-messages {
  .message-content {
    width: 100%;
    padding: 4px 6px !important;

    code {
      font-size: 0.875em;
      color: #d63384;
      word-wrap: break-word;
    }
  }
}
</style>
