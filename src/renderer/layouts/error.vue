<template>
  <v-container class="text-center">
    <h1 v-if="error.statusCode === 404">
      {{ pageNotFound }}
    </h1>
    <h1 v-else>
      {{ otherError }}
    </h1>
    <v-btn small class="mr-2" @click="report()">
      {{ $t('reportIssue') }}
    </v-btn>
    <icon-btn variant="home" />
  </v-container>
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'ErrorPage',
  props: {
    error: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      pageNotFound: '404 Not Found',
      otherError: 'An error occurred',
    }
  },
  head() {
    const title: string =
      this.error.statusCode === 404 ? this.pageNotFound : this.otherError
    return {
      title,
    }
  },
  methods: {
    report(): void {
      window.open(
        (this.$bugURL() as string) +
          encodeURIComponent(`
        ### Error details
        \`\`\`
        ${JSON.stringify(this.error, Object.getOwnPropertyNames(this.error), 2)}
        \`\`\`
        `).replace(/\n/g, '%0D%0A'),
        '_blank'
      )
    },
  },
})
</script>
<style scoped>
h1 {
  font-size: 20px;
}
</style>
