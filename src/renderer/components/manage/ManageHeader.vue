<template>
  <v-row align="center" class="mb-4" style="width: 100%">
    <v-col cols="1" class="text-center">
      <font-awesome-icon
        size="2x"
        :icon="isMeetingDay || client ? faCloud : faFolderOpen"
        :class="{
          'secondary--text': !isDark,
          'accent--text': isDark,
        }"
      />
    </v-col>
    <v-col cols="11" class="text-center">
      <h1>{{ title }}</h1>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { Dayjs } from 'dayjs'
import { defineComponent } from 'vue'
import { WebDAVClient } from 'webdav/dist/web/types'
import {
  faCloud,
  faFolderOpen,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'

export default defineComponent({
  computed: {
    faFolderOpen(): IconDefinition {
      return faFolderOpen
    },
    faCloud(): IconDefinition {
      return faCloud
    },
    isDark(): boolean {
      return this.$vuetify.theme.dark as boolean
    },
    title(): string {
      return this.date === 'Recurring'
        ? (this.$t('recurring') as string)
        : this.date
    },
    date(): string {
      return this.$route.query.date as string
    },
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    isMeetingDay(): boolean {
      const day = this.$dayjs(
        this.date,
        this.$getPrefs('app.outputFolderDateFormat') as string
      ) as Dayjs
      return !!this.$isMeetingDay(day)
    },
  },
})
</script>
