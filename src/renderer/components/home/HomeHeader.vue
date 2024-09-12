<template>
  <v-row class="pa-4">
    <v-col cols="12">
      <v-alert density="compact" color="warning">
        <template v-if="deprecatedShow">
          <h3 class="mb-4">Deprecation Notice</h3>
          <p>
            Please be advised that this version of Meeting Media Manager
            {{ alreadyDeprecated ? 'was' : 'will be' }} deprecated in
            <b>October 2024</b>, at which point a new and much improved version
            {{ alreadyDeprecated ? 'was' : 'will be' }} released.
            <b
              >Your current settings will be automatically migrated to the new
              version</b
            >
            when
            {{ alreadyDeprecated ? 'you install it' : 'it becomes available' }}.
          </p>
          <p>
            The {{ alreadyDeprecated ? 'updated' : 'upcoming' }} release
            features a modern, simplified and intuitive interface designed for
            an enhanced user experience. Care has been taken to ensure that the
            new version truly helps audio-video operators to accomplish their
            tasks more efficiently and without distractions.
          </p>
          <p>
            Note that the following features
            <b
              >{{
                alreadyDeprecated ? 'are no longer' : 'will no longer be'
              }}
              available</b
            >
            in the new release:
          </p>
          <ul class="mb-4">
            <li>VLC playlist creation</li>
            <li>Congregation WebDAV sync</li>
            <li>Beta Zoom integration</li>
          </ul>
          <p>
            If you have any questions regarding this updated release, feel free
            to
            <a
              href="https://github.com/sircharlo/meeting-media-manager/discussions/new?category=q-a"
              target="_blank"
              rel="noopener noreferrer"
              >reach out</a
            >.
          </p>
        </template>
        <v-btn @click="deprecatedShow = !deprecatedShow"
          >{{ deprecatedShow ? 'Hide' : 'Show' }} deprecation notice</v-btn
        >
      </v-alert>
    </v-col>
    <v-col cols="5" sm="4" md="3" />
    <v-col cols="2" sm="4" md="6" class="text-center">
      <font-awesome-icon
        :icon="statusIcon"
        size="3x"
        :flip="loading"
        :class="{
          'primary--text': loading,
          'secondary--text': !loading && !isDark,
          'accent--text': !loading && isDark,
        }"
      />
    </v-col>
    <v-col cols="5" sm="4" md="3">
      <cong-select-input :disabled="loading || musicPlaying" />
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import {
  faPhotoVideo,
  faDownload,
  faCloud,
  faGlobeAmericas,
} from '@fortawesome/free-solid-svg-icons'
export default defineComponent({
  props: {
    loading: {
      type: Boolean,
      required: true,
    },
    cong: {
      type: String,
      required: true,
    },
    jw: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      deprecatedShow: true,
      alreadyDeprecated: new Date() >= new Date('2024-11-01'),
    }
  },
  computed: {
    isDark(): boolean {
      return this.$vuetify.theme.dark
    },
    musicPlaying(): boolean {
      return !!this.$store.state.media.musicFadeOut
    },
    statusIcon() {
      if (this.cong === 'warning') {
        return faCloud
      } else if (this.jw === 'warning') {
        return faDownload
      } else if (this.loading) {
        return faGlobeAmericas
      } else {
        return faPhotoVideo
      }
    },
  },
})
</script>
