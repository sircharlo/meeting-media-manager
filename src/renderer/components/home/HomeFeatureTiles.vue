<template>
  <v-col cols="12" class="d-flex py-0">
    <v-col class="text-center flex-shrink-1 px-1 pb-0">
      <v-card
        class="fill-height d-flex justify-center flex-column pb-0"
        :color="jw"
      >
        <v-card-text class="text-center py-2">{{ jwSync }}</v-card-text>
      </v-card>
    </v-col>
    <v-col v-if="congSync" class="text-center flex-shrink-1 px-1 pb-0">
      <v-card
        class="fill-height d-flex justify-center flex-column pb-0"
        :color="cong"
      >
        <v-card-text class="text-center py-2">
          {{ $t('congMedia') }}
        </v-card-text>
      </v-card>
    </v-col>
    <v-col
      v-if="$getPrefs('media.enableMp4Conversion')"
      class="text-center flex-shrink-1 px-1 pb-0"
    >
      <v-card
        class="fill-height d-flex justify-center flex-column pb-0"
        :color="mp4"
      >
        <v-card-text class="text-center py-2">
          {{ $t('convertDownloaded') }}
        </v-card-text>
      </v-card>
    </v-col>
  </v-col>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { ShortJWLang } from '~/types'
export default defineComponent({
  props: {
    jw: {
      type: String,
      required: true,
    },
    cong: {
      type: String,
      required: true,
    },
    mp4: {
      type: String,
      required: true,
    },
  },
  computed: {
    congSync(): boolean {
      return !!this.$store.state.cong.client
    },
    mediaLangObject(): ShortJWLang | null {
      return this.$store.state.media.mediaLang as ShortJWLang | null
    },
    fallbackLangObject(): ShortJWLang | null {
      return this.$store.state.media.fallbackLang as ShortJWLang | null
    },
    jwSync(): string {
      let jwSyncString = ''
      if (this.mediaLangObject?.vernacularName) {
        jwSyncString = `${this.$t('syncJwOrgMedia')} (${
          this.mediaLangObject?.vernacularName
        }`
        if (this.fallbackLangObject?.vernacularName) {
          jwSyncString += ` / ${this.fallbackLangObject?.vernacularName}`
        }
        jwSyncString += ')'
      }
      return jwSyncString
    },
  },
})
</script>
