<template>
  <v-container fluid fill-height>
    <v-dialog v-if="fileString && type === 'jwpub'" persistent :value="true">
      <manage-select-document
        :file="fileString"
        :set-progress="setProgress"
        @select="addMedia($event)"
        @empty="reset()"
      />
    </v-dialog>
    <v-row class="fill-height" align-content="start">
      <manage-header />
      <manage-select-type v-model="type" :disabled="loading" />
      <v-row v-if="type" align="center" class="mb-0">
        <v-col cols="1" class="text-center" align-self="center">
          <font-awesome-icon :icon="faFileExport" />
        </v-col>
        <v-col cols="11">
          <song-picker
            v-if="type === 'song'"
            v-model="song"
            :disabled="loading"
          />
          <manage-select-file
            v-else
            :type="type"
            :path="fileString"
            :loading="loading"
            @click="
              type == 'custom' ? addFiles() : addFiles(false, 'JWPUB', 'jwpub')
            "
          />
        </v-col>
      </v-row>
      <manage-media-prefix v-if="song || files.length > 0" v-model="prefix" />
      <v-col cols="12" class="px-0" style="margin-bottom: 72px">
        <loading-icon v-if="loading" />
        <template v-else>
          <v-overlay :value="dragging">
            <font-awesome-icon :icon="faDownload" size="3x" bounce />
          </v-overlay>
          <manage-media-list
            :date="date"
            :new-file="song"
            :new-files="files"
            :prefix="prefix"
            :media="media"
            :set-progress="setProgress"
            @refresh="getExistingMedia()"
          />
        </template>
      </v-col>
      <v-progress-linear
        v-if="currentProgress || totalProgress"
        fixed
        stream
        striped
        :height="8"
        style="bottom: 72px"
        :buffer-value="currentProgress"
        :value="totalProgress"
      />
      <v-footer fixed>
        <v-col class="text-left">
          <icon-btn
            v-if="song || files.length > 0"
            variant="cancel"
            :disabled="loading"
            click-twice
            @click="goHome()"
          />
        </v-col>
        <v-col class="text-center">
          <v-btn
            v-if="song || files.length > 0"
            color="primary"
            min-width="32px"
            :loading="loading"
            @click="saveFiles()"
          >
            <font-awesome-icon :icon="faSave" size="lg" />
          </v-btn>
          <icon-btn v-else variant="home" :disabled="loading" />
        </v-col>
        <v-col />
      </v-footer>
    </v-row>
  </v-container>
</template>
<script lang="ts">
// eslint-disable-next-line import/named
import { readdirSync, existsSync, readFileSync, statSync } from 'fs-extra'
import { basename, join, changeExt, extname } from 'upath'
import { ipcRenderer } from 'electron'
import { defineComponent } from 'vue'
import { MetaInfo } from 'vue-meta'
import { WebDAVClient } from 'webdav/dist/web/types'
import {
  faFileExport,
  faDownload,
  faSave,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { Dayjs } from 'dayjs'
import { LocalFile, MeetingFile, VideoFile } from '~/types'
import {
  BITS_IN_BYTE,
  BYTES_IN_MB,
  HUNDRED_PERCENT,
  MS_IN_SEC,
} from '~/constants/general'
export default defineComponent({
  name: 'ManagePage',
  data() {
    return {
      prefix: '',
      dragging: false,
      uploadedFiles: 0,
      totalFiles: 0,
      totalProgress: 0,
      currentProgress: 0,
      loading: true,
      type: 'custom',
      fileString: '',
      song: null as VideoFile | null,
      files: [] as (LocalFile | VideoFile)[],
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
    faSave(): IconDefinition {
      return faSave
    },
    faDownload(): IconDefinition {
      return faDownload
    },
    faFileExport(): IconDefinition {
      return faFileExport
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
  watch: {
    type() {
      this.fileString = ''
    },
    fileString(val: string) {
      if (!val) {
        this.prefix = ''
      }
    },
    song(val) {
      if (val) {
        this.prefix = '00-00'
      }
    },
  },
  beforeDestroy() {
    document.removeEventListener('dragover', this.stopEvent)
    document.removeEventListener('dragenter', this.handleDrag)
    document.removeEventListener('dragleave', this.handleDrag)
    document.removeEventListener('drop', this.handleDrop)
  },
  async mounted() {
    if (this.online) {
      await this.getMeetingData()
    } else {
      this.$warn('errorOffline')
    }
    this.getExistingMedia()
    document.addEventListener('dragover', this.stopEvent)
    document.addEventListener('dragenter', this.handleDrag)
    document.addEventListener('dragleave', this.handleDrag)
    document.addEventListener('drop', this.handleDrop)
    this.loading = false
  },
  methods: {
    goHome() {
      console.debug('Go back home')
      this.$router.push({
        path: this.localePath('/'),
        query: {
          ...this.$route.query,
          date: undefined,
        },
      })
    },
    handleDrag(e: DragEvent) {
      if (
        !this.dragging ||
        (e.target as HTMLElement).className === 'v-overlay__scrim'
      ) {
        this.dragging = e.type === 'dragenter'
      }
    },
    stopEvent(e: DragEvent) {
      e.preventDefault()
      e.stopPropagation()
    },
    handleDrop(e: DragEvent) {
      this.stopEvent(e)
      this.dragging = false
      this.files = Array.from(e.dataTransfer?.files ?? []).map((file) => {
        return {
          safeName: '- ' + this.$sanitize(file.name, true),
          filepath: file.path,
        }
      })

      // If one jwpub was dropped, set media type to jwpub
      if (
        this.files.length === 1 &&
        extname(this.files[0].filepath ?? '') === '.jwpub'
      ) {
        this.type = 'jwpub'
      } else {
        this.type = 'custom'
      }
      this.fileString = this.files.map(({ filepath }) => filepath).join(';')
    },
    addMedia(media: LocalFile[]) {
      this.files = media
      this.type = ''
    },
    async addFiles(multi = true, ...exts: string[]) {
      if (exts.length === 0) {
        exts.push('*')
      }
      const properties = ['openFile']
      if (multi) properties.push('multiSelections')

      const result = await ipcRenderer.invoke('openDialog', {
        filters: [{ name: exts[0], extensions: exts }],
        properties,
      })

      if (result && !result.canceled) {
        this.files = result.filePaths.map((file: string) => ({
          safeName: '- ' + this.$sanitize(basename(file), true),
          filepath: file,
        }))
        this.fileString = result.filePaths.join(';')
      }
    },
    async processFile(file: LocalFile | VideoFile) {
      if (!file?.safeName || file.ignored) {
        this.increaseProgress()
        return
      }
      if (this.prefix) {
        file.safeName = this.prefix + ' ' + file.safeName
      }

      const path = join(this.$mediaPath() as string, this.date, file.safeName)

      // JWPUB extract
      if (file.contents) {
        this.$write(path, file.contents as Buffer)
      }
      // Local file
      else if (file.filepath) {
        this.$copy(file.filepath, path)
      }
      // External file from jw.org
      else if (file.safeName) {
        file.folder = this.date
        // @ts-ignore: file is not recognized as type Buffer
        await this.$downloadIfRequired(file, this.setProgress)

        // Download markers if required
        if ((file as VideoFile).markers) {
          const markers = Array.from(
            new Set(
              (file as VideoFile).markers?.markers?.map(
                ({ duration, label, startTime, endTransitionDuration }) =>
                  JSON.stringify({
                    duration,
                    label,
                    startTime,
                    endTransitionDuration,
                  })
              )
            )
          ).map((m) => JSON.parse(m))

          this.$write(
            join(
              this.$mediaPath(),
              file.folder as string,
              changeExt(file.safeName as string, 'json')
            ),
            JSON.stringify(markers)
          )
        }
      }

      // Upload media to the cong server
      if (this.client && this.online) {
        const perf: any = {
          start: performance.now(),
          bytes: statSync(path).size,
          name: file.safeName,
        }

        const filePath = join(
          this.$getPrefs('cong.dir') as string,
          'Media',
          this.date,
          file.safeName
        )

        try {
          await this.client.putFileContents(filePath, readFileSync(path), {
            overwrite: true,
            onUploadProgress: ({ loaded, total }) => {
              this.setProgress(loaded, total)
            },
          })
        } catch (e: any) {
          if (
            e.message ===
            'Cannot create a string longer than 0x1fffffe8 characters'
          ) {
            this.$warn('errorWebdavTooBig', { identifier: basename(path) })
          } else {
            this.$error('errorWebdavPut', e, `${basename(path)}`)
          }
        }

        perf.end = performance.now()
        perf.bits = perf.bytes * BITS_IN_BYTE
        perf.ms = perf.end - perf.start
        perf.s = perf.ms / MS_IN_SEC
        perf.bps = perf.bits / perf.s
        perf.MBps = perf.bps / BYTES_IN_MB
        perf.dir = 'up'
        this.$log.debug(perf)
      }
      this.increaseProgress()
    },
    increaseProgress() {
      this.uploadedFiles += 1
      this.setProgress(this.uploadedFiles, this.totalFiles, true)
    },
    async saveFiles() {
      this.loading = true
      try {
        const promises: Promise<void>[] = []
        const files = [...this.files, this.song] as (VideoFile | LocalFile)[]
        this.totalFiles = files.length

        const mediaPath = join(this.$getPrefs('cong.dir') as string, 'Media')
        const datePath = join(mediaPath, this.date)

        try {
          await this.$createCongDir(mediaPath)
        } catch (e: unknown) {
          this.$error('errorWebdavPut', e, mediaPath)
        }

        try {
          await this.$createCongDir(datePath)
        } catch (e: unknown) {
          this.$error('errorWebdavPut', e, datePath)
        }

        files.forEach((file) => {
          promises.push(this.processFile(file))
        })

        await Promise.allSettled(promises)

        await this.$convertUnusableFiles(
          this.$mediaPath() as string,
          this.setProgress
        )
        if (this.client) await this.$updateContent()
        this.getExistingMedia()
      } catch (e: unknown) {
        this.$error('errorAdditionalMedia', e, this.fileString)
      } finally {
        this.reset()
        this.loading = false
      }
    },
    reset() {
      this.type = ''
      this.song = null
      this.files = []
      this.fileString = ''
      this.uploadedFiles = 0
      this.totalFiles = 0
    },
    setProgress(loaded: number, total: number, global = false) {
      if (global) {
        this.totalProgress = (HUNDRED_PERCENT * loaded) / total
      } else {
        this.currentProgress = this.totalProgress
          ? this.totalProgress +
            ((HUNDRED_PERCENT - this.totalProgress) * loaded) / total
          : (HUNDRED_PERCENT * loaded) / total
      }
      if (this.currentProgress === HUNDRED_PERCENT) this.currentProgress = 0
      if (this.totalProgress === HUNDRED_PERCENT) this.totalProgress = 0
    },
    async getMeetingData() {
      try {
        const day = this.$dayjs(
          this.date,
          this.$getPrefs('app.outputFolderDateFormat') as string
        ) as Dayjs

        if (!day.isValid() || this.$getPrefs('meeting.specialCong')) return

        const weekDay = day.day() === 0 ? 6 : day.day() - 1 // Day is 0 indexed and starts with Sunday

        if (weekDay === this.$getMwDay(day.startOf('week'))) {
          await this.$getMwMedia(this.date)
        } else if (weekDay === (this.$getPrefs('meeting.weDay') as number)) {
          await this.$getWeMedia(this.date)
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
            readdirSync(path).forEach((filename) => {
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
