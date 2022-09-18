<template>
  <v-app>
    <v-main>
      <nuxt />
    </v-main>
  </v-app>
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'MediaLayout',
  head() {
    return {
      title: 'Media Window',
      titleTemplate: '%s - M³',
      htmlAttrs: {
        lang: this.$i18n.localeProperties.iso ?? this.$i18n.locale,
      },
    }
  },
})
</script>
