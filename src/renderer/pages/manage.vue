<template>
  <manage-media
    :media="media"
    :loading="loading"
    upload-media
    @refresh="getExistingMedia()"
  />
</template>
<script lang="ts">
// eslint-disable-next-line import/named
import { readdirSync, existsSync } from 'fs-extra'
import { join, extname } from 'upath'
import { defineComponent } from 'vue'
import { MetaInfo } from 'vue-meta'
import { WebDAVClient } from 'webdav/dist/web/types'
import { Dayjs } from 'dayjs'
import { LocalFile, MeetingFile } from '~/types'
export default defineComponent({
  name: 'ManagePage',
  data() {
    return {
      loading: true,
      media: [] as (MeetingFile | LocalFile)[],
    }
  },
  head(): MetaInfo {
    return { title: `Manage ${this.date}`, titleTemplate: '%s - M³' }
  },
  computed: {
    online() {
      return this.$store.state.stats.online && !this.$getPrefs('app.offline')
    },
    now(): Dayjs {
      return (this.$dayjs() as Dayjs).hour(0).minute(0).second(0).millisecond(0)
    },
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    date(): string {
      return this.$route.query.date as string
    },
  },
  async mounted() {
    if (this.online) {
      await this.getMeetingData()
    } else {
      this.$warn('errorOffline')
    }
    this.getExistingMedia()
    this.loading = false
  },
  methods: {
    async getMeetingData() {
      try {
        const day = this.$dayjs(
          this.date,
          this.$getPrefs('app.outputFolderDateFormat') as string
        ) as Dayjs

        const meetingDay = this.$isMeetingDay(day)
        if (meetingDay === 'mw') {
          await this.$getMwMedia(this.date)
        } else if (meetingDay === 'we') {
          await this.$getWeMedia(this.date)
        } else {
          return
        }

        this.$createMediaNames()

        if (this.client) {
          await this.$updateContent()
        }
      } catch (e: unknown) {
        this.$error('errorAdditionalMediaList', e)
      }
    },
    getExistingMedia() {
      try {
        if (this.client && this.online) {
          const day = this.$dayjs(
            this.date,
            this.$getPrefs('app.outputFolderDateFormat') as string
          ) as Dayjs

          this.$getCongMedia(
            day.isValid() ? day.startOf('week') : this.now.startOf('week'),
            this.now
          )
        }

        const meetings = this.$store.getters['media/meetings'] as Map<
          string,
          Map<number, MeetingFile[]>
        >
        const localMedia: LocalFile[] = []
        const jwMedia: MeetingFile[] = []

        for (const [, media] of meetings.get(this.date) ?? []) {
          for (const m of media) {
            m.isLocal = false
          }
          jwMedia.push(...media)
        }

        // If jw media is already downloaded, set isLocal of jw media to true, else add local file to list
        const mediaPath = this.$mediaPath()
        if (mediaPath) {
          const path = join(mediaPath, this.date)
          if (existsSync(path)) {
            readdirSync(path)
              .filter((f) => extname(f) !== '.title')
              .forEach((filename) => {
                const jwMatch = jwMedia.find(
                  ({ safeName }) => safeName === filename
                )
                if (jwMatch) {
                  jwMatch.isLocal = true
                } else {
                  localMedia.push({
                    safeName: filename,
                    isLocal: true,
                    filepath: join(
                      this.$mediaPath() as string,
                      this.date,
                      filename
                    ),
                  })
                }
              })
          }
        }

        this.media = [...jwMedia, ...localMedia].sort((a, b) => {
          return (a.safeName as string).localeCompare(b.safeName as string)
        })
      } catch (e: unknown) {
        this.$error('errorAdditionalMediaList', e)
      }
    },
  },
})
</script>
