<template>
  <v-container fluid fill-height>
    <manage-select-video
      :active="type === 'jworg' && !jwFile"
      @cancel="type = 'custom'"
      @select="selectVideo"
    />
    <v-dialog
      v-if="fileString && type === 'jwpub'"
      persistent
      :value="selectDoc"
    >
      <manage-select-document
        :file="fileString"
        :set-progress="setProgress"
        @select="addMedia($event)"
        @empty="reset()"
      />
    </v-dialog>
    <v-row class="fill-height" align-content="start">
      <manage-header />
      <manage-select-type v-model="type" :disabled="loading || saving || processing" />
      <v-row v-if="type" align="center" class="mb-0">
        <v-col cols="1" class="text-center" align-self="center">
          <font-awesome-icon :icon="faFileExport" />
        </v-col>
        <v-col cols="11">
          <song-picker
            v-if="type === 'song'"
            v-model="jwFile"
            :disabled="loading || saving || processing"
          />
          <manage-select-file
            v-else-if="type !== 'jworg'"
            :type="type"
            :path="fileString"
            :loading="loading || saving || processing"
            @click="
            addFiles(type === 'custom', type === 'custom' ? undefined : type, type === 'custom' ? undefined : type.toUpperCase())
            "
          />
        </v-col>
      </v-row>
      <manage-media-prefix v-if="jwFile || files.length > 0" v-model="prefix" />
      <v-col cols="12" class="px-0" style="position: relative">
        <loading-icon v-if="loading || saving || processing" />
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
            :disabled="loading || saving || processing"
            click-twice
            @click="dialog ? cancel() : goHome()"
          />
        </v-col>
        <v-col class="text-center">
          <v-btn
            v-if="jwFile || files.length > 0"
            color="primary"
            min-width="32px"
            :loading="loading || saving || processing"
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
          <icon-btn v-else variant="home" :disabled="loading || saving || processing" />
        </v-col>
        <v-col />
      </v-footer>
    </v-row>
  </v-container>
</template>
<script lang="ts">
// eslint-disable-next-line import/named
import { readFileSync, statSync, writeJsonSync } from 'fs-extra'
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
// eslint-disable-next-line import/named
import { Database } from 'sql.js'
import { LocalFile, MeetingFile, VideoFile, PlaylistItem } from '~/types'
import { BITS_IN_BYTE, BYTES_IN_MB, MS_IN_SEC } from '~/constants/general'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MEPS_IDS } = require('./../../constants/lang') as {
  MEPS_IDS: Record<number, string>
}
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
      selectDoc: false,
      uploadedFiles: 0,
      totalFiles: 0,
      totalProgress: 0,
      currentProgress: 0,
      type: 'custom',
      fileString: '',
      saving: false,
      processing: false,
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
      this.jwFile = null
      this.files = []
      this.selectDoc = val === 'jwpub'
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
      this.stopEvent(e)
      this.dragging = false
      this.files = Array.from(e.dataTransfer?.files ?? []).map((file) => {
        return {
          safeName: '- ' + this.$sanitize(file.name, true),
          filepath: file.path,
        }
      })

      if (!this.files[0]?.filepath) return
      const ext = extname(this.files[0].filepath)

      // If one jwpub/jwlplaylist was dropped, set media type accordingly
      if (
        this.files.length === 1 && (ext === '.jwpub' || ext === '.jwlplaylist')
      ) {
        this.type = ext.substring(1)
        if (ext === '.jwlplaylist') {
          this.processPlaylist(this.files[0].filepath)
        }
      } else {
        this.type = 'custom'
      }
      this.fileString = this.files.map(({ filepath }) => filepath).join(';')
    },
    addMedia(media: LocalFile[]) {
      this.files = media
      this.selectDoc = false
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
        if (this.type === 'jwlplaylist') {
          await this.processPlaylist(result.filePaths[0])
        } else {
          this.files = result.filePaths.map((file: string) => ({
          safeName: '- ' + this.$sanitize(basename(file), true),
          filepath: file,
        }))
        }
        this.fileString = result.filePaths.join(';')
      }
    },
    async processPlaylist(filePath: string) {
      this.processing = true
      const db = (await this.$getDb({
          file: (await this.$getZipContentsByExt(filePath, '.db', false)) ?? undefined,
        })) as Database

        const media = this.$query(
        db,
        `SELECT Label, FilePath, MimeType, DocumentId, Track, IssueTagNumber, KeySymbol, MepsLanguage
        FROM PlaylistItem PI
          LEFT JOIN PlaylistItemLocationMap PILM ON PI.PlaylistItemId = PILM.PlaylistItemId
          LEFT JOIN Location L ON PILM.LocationId = L.LocationId
          LEFT JOIN PlaylistItemIndependentMediaMap PIIMM ON PI.PlaylistItemId = PIIMM.PlaylistItemId
          LEFT JOIN IndependentMedia IM ON PIIMM.IndependentMediaId = IM.IndependentMediaId`
        ) as PlaylistItem[]
        
        const promises: Promise<void>[] = []

        // Get correct extension
        media.map((m) => {
          if (!extname(m.Label ?? '') || (!this.$isImage(m.Label ?? '') && !this.$isVideo(m.Label ?? '') && !this.$isAudio(m.Label ?? ''))) {
            if (extname(m.FilePath ?? '')) {
              m.Label += extname(m.FilePath!)
            } else if (m.MimeType) {
              m.Label = m.Label + '.' + m.MimeType.split('/')[1]
            } else {
              m.Label += '.mp4'
            }
          }
          return m
        }).forEach((m, index) => {
          promises.push(this.processPlaylistItem(index, m, filePath))
        })

        await Promise.allSettled(promises)
        this.processing = false
    },
    async processPlaylistItem(index: number, m: PlaylistItem, filePath: string) {
      if (m.FilePath) {
            this.files.push({
              safeName: `${(index + 1).toString().padStart(2, '0')} - ${this.$sanitize(m.Label, true)}`,
              contents: (await this.$getZipContentsByName(filePath, m.FilePath, false)) ??
              undefined,
            })
          } else {
            const mediaFiles = await this.$getMediaLinks({
              pubSymbol: m.KeySymbol,
              docId: m.DocumentId,
              track: m.Track,
              issue: m.IssueTagNumber,
              lang: m.MepsLanguage ? MEPS_IDS[m.MepsLanguage] : undefined,
            }) as VideoFile[]
            this.files.push(...mediaFiles.map((f) => ({
              ...f,
              safeName: `${(index + 1).toString().padStart(2, '0')} - ${this.$sanitize(
                `${f.title || ''}${extname(
                  f.url || f.filepath || ''
                )}`,
                true
              )}`,
            })))
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
          try{
            writeJsonSync(markerPath, markers, { spaces: 2 })
          } catch(e) {
            this.$log.error(e)
          }
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
      this.selectDoc = false
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
