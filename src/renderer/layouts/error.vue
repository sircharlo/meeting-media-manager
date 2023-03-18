<template>
  <v-container class="text-center">
    <h1 class="mb-4">
      {{ error.statusCode === 404 ? pageNotFound : otherError }}
    </h1>
    <v-btn class="mr-2" @click="report()">
      {{ $t('reportIssue') }}
    </v-btn>
    <!-- <icon-btn variant="home" @click="refresh()" /> -->
  </v-container>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { NOT_FOUND } from '~/constants/general'
export default defineComponent({
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
      otherError: 'An unexpected error occurred',
    }
  },
  head() {
    const title: string =
      this.error.statusCode === NOT_FOUND ? this.pageNotFound : this.otherError
    return {
      title,
      titleTemplate: '%s - M³',
    }
  },
  methods: {
    refresh() {
      if (this.$route.path === `/${this.$i18n.locale}`) {
        window.location.reload()
      }
    },
    report(): void {
      window.open(
        (this.$bugURL() as string) +
          encodeURIComponent(`
### Error details
\`\`\`
${JSON.stringify(this.error, Object.getOwnPropertyNames(this.error), 2)}
\`\`\``).replace(/\n/g, '%0D%0A'),
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
