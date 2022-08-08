<template>
  <v-container class="text-center">
    <h1 v-if="error.statusCode === 404">
      {{ pageNotFound }}
    </h1>
    <h1 v-else>
      {{ otherError }}
    </h1>
    <nuxt-link to="/">Go to home</nuxt-link>
  </v-container>
</template>
<script lang="ts">
import Vue from 'vue'
/*
declare module 'vue/types/vue' {
    interface Vue {
      pageNotFound: string
      otherError: string
    }
  }
*/
export default Vue.extend({
  name: 'ErrorPage',
  props: {
    error: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      pageNotFound: '404 Not Found',
      otherError: 'An error occurred'
    }
  },
  head() {
    const title: string =
      this.error.statusCode === 404 ? this.pageNotFound : this.otherError
    return {
      title
    }
  }
})
</script>
<style scoped>
h1 {
  font-size: 20px;
}
</style>
