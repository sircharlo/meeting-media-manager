<template>
  <v-container fluid fill-height>
    <manage-select-video
      :active="type === 'jworg' && !jwFile"
      @cancel="type = 'custom'"
      @select="selectVideo"
    />
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
      <manage-select-type v-model="type" :disabled="loading || saving" />
      <v-row v-if="type" align="center" class="mb-0">
        <v-col cols="1" class="text-center" align-self="center">
          <font-awesome-icon :icon="faFileExport" />
        </v-col>
        <v-col cols="11">
          <song-picker
            v-if="type === 'song'"
            v-model="jwFile"
            :disabled="loading || saving"
          />
          <manage-select-file
            v-else-if="type !== 'jworg'"
            :type="type"
            :path="fileString"
            :loading="loading || saving"
            @click="
              type == 'custom' ? addFiles() : addFiles(false, 'JWPUB', 'jwpub')
            "
          />
        </v-col>
      </v-row>
      <manage-media-prefix v-if="jwFile || files.length > 0" v-model="prefix" />
      <v-col cols="12" class="px-0">
        <loading-icon v-if="loading || saving" />
        <template v-else>
          <v-overlay :value="dragging">
            <font-awesome-icon :icon="faDownload" size="3x" bounce />
          </v-overlay>
          <manage-media-list
            :date="date"
            :new-file="jwFile"
            :new-files="files"
            :prefix="prefix"
            :media="media"
            :show-input="type && type !== 'jworg'"
            :show-prefix="!!jwFile || files.length > 0"
            :set-progress="setProgress"
            @refresh="$emit('refresh')"
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
      <v-footer fixed height="72px">
        <v-col class="text-left">
          <icon-btn
            v-if="jwFile || files.length > 0"
            variant="cancel"
            :disabled="loading || saving"
            click-twice
            @click="dialog ? cancel() : goHome()"
          />
        </v-col>
        <v-col class="text-center">
          <v-btn
            v-if="jwFile || files.length > 0"
            color="primary"
            min-width="32px"
            :loading="loading || saving"
            @click="saveFiles()"
          >
            <font-awesome-icon :icon="faSave" size="lg" />
          </v-btn>
          <v-btn
            v-else-if="dialog"
            color="btn"
            min-width="32px"
            @click="cancel()"
          >
            <font-awesome-icon :icon="faXmark" size="lg" class="white--text" />
          </v-btn>
          <icon-btn v-else variant="home" :disabled="loading || saving" />
        </v-col>
        <v-col />
      </v-footer>
    </v-row>
  </v-container>
</template>
<script lang="ts">
// eslint-disable-next-line import/named
import { readFileSync, statSync } from 'fs-extra'
import { basename, join, changeExt, extname } from 'upath'
import { ipcRenderer } from 'electron'
import { defineComponent, PropType } from 'vue'
import { MetaInfo } from 'vue-meta'
import { WebDAVClient } from 'webdav/dist/web/types'
import {
  faFileExport,
  faDownload,
  faSave,
  faXmark,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { LocalFile, MeetingFile, VideoFile } from '~/types'
import { BITS_IN_BYTE, BYTES_IN_MB, MS_IN_SEC } from '~/constants/general'
export default defineComponent({
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    dialog: {
      type: Boolean,
      default: false,
    },
    uploadMedia: {
      type: Boolean,
      default: false,
    },
    media: {
      type: Array as PropType<(MeetingFile | LocalFile)[]>,
      default: () => [],
    },
  },
  data() {
    return {
      prefix: '',
      dragging: false,
      uploadedFiles: 0,
      totalFiles: 0,
      totalProgress: 0,
      currentProgress: 0,
      type: 'custom',
      fileString: '',
      saving: false,
      jwFile: null as VideoFile | null,
      files: [] as (LocalFile | VideoFile)[],
    }
  },
  head(): MetaInfo {
    return { title: `Manage ${this.date}`, titleTemplate: '%s - M³' }
  },
  computed: {
    online(): boolean {
      return (
        this.$store.state.stats.online &&
        (!this.$getPrefs('app.offline') as boolean)
      )
    },
    faSave(): IconDefinition {
      return faSave
    },
    faDownload(): IconDefinition {
      return faDownload
    },
    faXmark(): IconDefinition {
      return faXmark
    },
    faFileExport(): IconDefinition {
      return faFileExport
    },
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    date(): string {
      return this.$route.query.date as string
    },
  },
  watch: {
    type(val: string) {
      this.fileString = ''
      if (val === 'jworg') {
        this.jwFile = null
      }
    },
    fileString(val: string) {
      if (!val) {
        this.prefix = ''
      }
    },
    jwFile(val) {
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
  mounted() {
    document.addEventListener('dragover', this.stopEvent)
    document.addEventListener('dragenter', this.handleDrag)
    document.addEventListener('dragleave', this.handleDrag)
    document.addEventListener('drop', this.handleDrop)
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
    cancel() {
      this.reset()
      this.$emit('cancel')
    },
    selectVideo(video: VideoFile) {
      this.jwFile = video
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
      console.log(JSON.stringify(e.dataTransfer?.files))
      this.stopEvent(e)
      this.dragging = false
      this.files = Array.from(e.dataTransfer?.files ?? []).map((file) => {
        return {
          safeName: '- ' + this.$sanitize(file.name, true),
          filepath: file.path,
        }
      })

      console.log(this.files)

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

      const congPromises: Promise<void>[] = []
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

        if ((file as VideoFile).subtitles) {
          congPromises.push(this.uploadFile(changeExt(path, 'vtt')))
        }

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

          const markerPath = join(
            this.$mediaPath(),
            file.folder as string,
            changeExt(file.safeName as string, 'json')
          )
          this.$write(markerPath, JSON.stringify(markers))
          congPromises.push(this.uploadFile(markerPath))
        }
      }

      // Upload media to the cong server
      if (this.client && this.online && this.uploadMedia) {
        const perf: any = {
          start: performance.now(),
          bytes: statSync(path).size,
          name: file.safeName,
        }

        congPromises.push(this.uploadFile(path))
        await Promise.allSettled(congPromises)

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
    async uploadFile(path: string) {
      if (!this.client || !this.online || !this.uploadMedia) return
      const filePath = join(
        this.$getPrefs('cong.dir') as string,
        'Media',
        this.date,
        basename(path)
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
    },
    increaseProgress() {
      this.uploadedFiles += 1
      this.setProgress(this.uploadedFiles, this.totalFiles, true)
    },
    async saveFiles() {
      this.saving = true
      try {
        const promises: Promise<void>[] = []
        const files = [...this.files, this.jwFile] as (VideoFile | LocalFile)[]
        this.totalFiles = files.length

        if (this.client && this.online && this.uploadMedia) {
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
        }

        files.forEach((file) => {
          promises.push(this.processFile(file))
        })

        await Promise.allSettled(promises)

        await this.$convertUnusableFiles(
          this.$mediaPath() as string,
          this.setProgress
        )
        if (this.client && this.uploadMedia) await this.$updateContent()
        this.$emit('refresh')
      } catch (e: unknown) {
        this.$error('errorAdditionalMedia', e, this.fileString)
      } finally {
        this.reset()
        this.saving = false
      }
    },
    reset() {
      this.type = 'custom'
      this.jwFile = null
      this.files = []
      this.fileString = ''
      this.uploadedFiles = 0
      this.totalFiles = 0
    },
    setProgress(loaded: number, total: number, global = false) {
      if (global) {
        this.totalProgress = (100 * loaded) / total
      } else {
        this.currentProgress = this.totalProgress
          ? this.totalProgress + ((100 - this.totalProgress) * loaded) / total
          : (100 * loaded) / total
      }
      if (this.currentProgress === 100) this.currentProgress = 0
      if (this.totalProgress === 100) this.totalProgress = 0
    },
  },
})
</script>
