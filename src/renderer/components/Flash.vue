<template>
  <div class="messages">
    <v-snackbar
      v-for="(m, key) in messages"
      :key="key"
      top
      absolute
      rounded
      :value="true"
      :timeout="6000"
      :color="m.color"
      :min-width="0"
      :min-height="0"
      content-class="message-content"
      :style="`z-index: 999; top: ${60 * key + 8}px`"
    >
      {{ m.message }}
    </v-snackbar>
  </div>
</template>
<script lang="ts">
import { mapGetters } from 'vuex'
import Vue from 'vue'
import { Flash } from '~/types'
export default Vue.extend({
  data() {
    return {
      messages: [] as Flash[],
    }
  },
  computed: {
    ...mapGetters('flash', ['message', 'color', 'duration']),
  },
  watch: {
    message(val: string) {
      if (val) {
        this.messages.push({
          message: val,
          color: this.color,
          duration: this.duration,
        })
        this.$store.commit('flash/clear')
      }
    },
  },
  mounted() {
    window.setInterval(() => {
      this.checkMessages()
    }, 1000)
  },
  methods: {
    checkMessages(): void {
      this.messages.forEach((message: Flash, key: number) => {
        if (message.duration < 1) {
          this.messages.shift()
        } else {
          this.messages[key].duration--
        }
      })
    },
  },
})
</script>
<style scoped>
.messages >>> .message-content {
  text-align: center !important;
  padding: 10px 20px !important;
}
</style>
