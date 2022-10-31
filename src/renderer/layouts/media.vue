<template>
  <v-app>
    <v-main>
      <nuxt />
    </v-main>
  </v-app>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'MediaLayout',
  head() {
    return {
      title: 'Media Window', // Changing this causes configured OBS Window Captures to break
      titleTemplate: '%s - M³', // Changing this causes configured OBS Window Captures to break
      htmlAttrs: {
        lang: this.$i18n.localeProperties.iso ?? this.$i18n.locale,
      },
    }
  },
})
</script>
