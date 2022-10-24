<!-- A preview overlay of an automatic action that is about to happen (e.g. auto fetch media or auto quit app) -->
<template>
  <v-overlay :value="true" :opacity="1">
    <v-container class="d-flex flex-column align-center">
      <h1 class="mb-6 text-center">{{ $t(text) }}</h1>
      <v-badge :content="timer">
        <v-btn color="error" @click="$emit('abort')">
          <font-awesome-icon :icon="iconObj" />
        </v-btn>
      </v-badge>
    </v-container>
  </v-overlay>
</template>
<script lang="ts">
import { PropOptions, defineComponent } from 'vue'
import { faPause, faPersonRunning } from '@fortawesome/free-solid-svg-icons'
import { MS_IN_SEC } from '~/constants/general'
export default defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
      validator: (val: string) => {
        return ['faPersonRunning', 'faPause'].includes(val)
      },
    } as PropOptions<'faPersonRunning' | 'faPause'>,
  },
  data() {
    return {
      timer: 5, // seconds
    }
  },
  computed: {
    iconObj() {
      switch (this.icon) {
        case 'faPersonRunning':
          return faPersonRunning
        case 'faPause':
          return faPause
        default:
          throw new Error('Unknown icon: ' + this.icon)
      }
    },
  },
  mounted() {
    setInterval(() => {
      this.timer--
      if (this.timer === 0) {
        this.$emit('perform')
      }
    }, MS_IN_SEC)
  },
})
</script>
