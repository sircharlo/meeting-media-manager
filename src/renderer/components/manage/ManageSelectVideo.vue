<template>
  <v-dialog :value="active" @click:outside="$emit('cancel')">
    <v-sheet class="pa-2">
      <h2 class="text-center">{{ $t('selectVideo') }}</h2>
      <loading-icon v-if="loading" />
      <v-row v-else style="width: 100%" class="ma-0">
        <v-col
          v-for="video in videos"
          :key="video.guid"
          class="d-flex align-center"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            hover
            ripple
            rounded
            style="width: 100%; height: 100%"
            @click="selectVideo(video)"
          >
            <v-img
              :src="video.images.lss.lg"
              :aspect-ratio="2 / 1"
              width="100%"
              height="100%"
              class="white--text align-end"
              gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
            >
              <v-card-title style="word-break: normal; user-select: none">
                {{ video.title }}
              </v-card-title>
            </v-img>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>
  </v-dialog>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { extname } from 'upath'
import { MediaItem, VideoFile } from '~/types'
export default defineComponent({
  props: {
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      videos: [] as MediaItem[],
    }
  },
  computed: {},
  mounted() {
    this.getVideos()
  },
  methods: {
    async getVideos() {
      this.loading = true
      try {
        this.videos = await this.$getLatestJWMedia()
      } catch (e: unknown) {
        console.error(e)
      }
      this.loading = false
    },
    parseRes(res?: string): number {
      if (!res) return 0
      return +res.replace(/\D/g, '')
    },
    selectVideo(video: MediaItem) {
      this.loading = true
      console.log('video', video)
      const videoFiles = video.files
        .filter((file) => {
          return (
            this.parseRes(file.label) <=
            this.parseRes(this.$getPrefs('media.maxRes') as string)
          )
        })
        // Sort highest res first, then not subtitled first
        .sort((a, b) => {
          return (
            this.parseRes(b.label) -
            +b.subtitled -
            (this.parseRes(a.label) - +a.subtitled)
          )
        })
      console.log(videoFiles)
      try {
        const meetingFile: VideoFile = {
          duration: videoFiles[0].duration,
          filesize: videoFiles[0].filesize,
          markers: null,
          pub: '',
          title: video.title,
          track: 0,
          subtitled: videoFiles[0].subtitled,
          subtitles: videoFiles[0].subtitles,
          issue: '',
          safeName:
            this.$sanitize(video.title) +
            extname(videoFiles[0].progressiveDownloadURL),
          url: videoFiles[0].progressiveDownloadURL,
          checksum: videoFiles[0].checksum,
          trackImage: video.images.lss?.lg ?? '',
          primaryCategory: video.primaryCategory,
        }
        this.$emit('select', meetingFile)
      } catch (e: unknown) {
        console.error(e)
      }
      this.loading = false
    },
  },
})
</script>
