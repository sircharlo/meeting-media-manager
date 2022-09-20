<template>
  <v-container fluid fill-height>
    <v-dialog v-if="fileString && type === 'jwpub'" :value="true">
      <media-select
        :file="fileString"
        :set-progress="setProgress"
        @select="addMedia($event)"
      />
    </v-dialog>
    <v-row class="fill-height" align-content="start">
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
          <h1>{{ date }}</h1>
        </v-col>
      </v-row>
      <v-row align="center" style="width: 100%">
        <v-col cols="1" class="text-center" align-self="center">
          <font-awesome-icon :icon="faPhotoFilm" />
        </v-col>
        <v-col cols="11">
          <v-btn-toggle
            v-model="type"
            color="primary"
            style="width: 100%"
            :mandatory="!!type"
            @change="fileString = ''"
          >
            <v-btn width="33.3%" value="song" :disabled="loading">{{
              $t('song')
            }}</v-btn>
            <v-btn width="33.3%" value="custom" :disabled="loading">{{
              $t('custom')
            }}</v-btn>
            <v-btn width="33.3%" value="jwpub" :disabled="loading">{{
              $t('jwpub')
            }}</v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
      <v-row v-if="type" align="center" class="mb-0">
        <v-col cols="1" class="text-center" align-self="center">
          <font-awesome-icon :icon="faFileExport" />
        </v-col>
        <v-col cols="11">
          <form-input
            v-if="type === 'song'"
            v-model="song"
            field="autocomplete"
            :items="songs"
            item-text="title"
            item-value="safeName"
            hide-details="auto"
            :disabled="loading"
            :loading="loadingSongs"
            return-object
          />
          <v-row v-else-if="type === 'custom'" align="center">
            <v-col cols="auto" class="pr-0 text-left">
              <v-btn
                color="primary"
                style="height: 40px"
                :disabled="loading"
                @click="addFiles()"
              >
                {{ $t('browse') }}
              </v-btn>
            </v-col>
            <v-col class="pl-0">
              <form-input :value="fileString" readonly hide-details="auto" />
            </v-col>
          </v-row>
          <v-row v-else-if="type === 'jwpub'" align="center">
            <v-col cols="auto" class="pr-0 text-left">
              <v-btn
                color="primary"
                style="height: 40px"
                :disabled="loading"
                @click="addFiles(false, 'JWPUB', 'jwpub')"
              >
                {{ $t('browse') }}
              </v-btn>
            </v-col>
            <v-col class="pl-0">
              <form-input :value="fileString" readonly hide-details="auto" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-row
        v-if="song || files.length > 0"
        align="center"
        class="my-n4"
        style="width: 100%"
      >
        <v-col cols="1" class="text-center" align-self="center">
          <font-awesome-icon :icon="faArrowDown19" />
        </v-col>
        <v-col cols="11" class="d-flex">
          <v-col cols="4">
            <v-otp-input
              v-model="prefix1"
              type="number"
              length="2"
              dense
              :disabled="loading"
              @finish="$refs.prefix2.focus()"
            />
          </v-col>
          <v-col cols="4">
            <v-otp-input
              v-if="prefix1"
              ref="prefix2"
              v-model="prefix2"
              type="number"
              length="2"
              dense
              :disabled="loading"
              @finish="$refs.prefix3.focus()"
            />
          </v-col>
          <v-col cols="4">
            <v-otp-input
              v-if="prefix2"
              ref="prefix3"
              v-model="prefix3"
              type="number"
              length="2"
              dense
              :disabled="loading"
            />
          </v-col>
        </v-col>
      </v-row>
      <v-col cols="12" class="px-0" style="margin-bottom: 72px">
        <loading-icon v-if="loading" />
        <template v-else>
          <v-overlay :value="dragging">
            <font-awesome-icon :icon="faDownload" size="3x" bounce />
          </v-overlay>
          <media-list
            :date="date"
            :new-file="song"
            :new-files="files"
            :prefix="prefix"
            :media="media"
            :set-progess="setProgress"
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
            variant="homeVariant"
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
import Vue from 'vue'
import { MetaInfo } from 'vue-meta'
import { FileStat, WebDAVClient } from 'webdav/dist/web/types'
import {
  faArrowDown19,
  faCircleArrowLeft,
  faCloud,
  faFileExport,
  faFolderOpen,
  faPhotoFilm,
  faDownload,
  faSave,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { Dayjs } from 'dayjs'
import { LocalFile, MeetingFile, VideoFile } from '~/types'
export default Vue.extend({
  name: 'AddPage',
  data() {
    return {
      dragging: false,
      prefix1: '',
      prefix2: '',
      prefix3: '',
      totalProgress: 0,
      currentProgress: 0,
      loading: true,
      type: 'custom',
      fileString: '',
      song: null as VideoFile | null,
      files: [] as (LocalFile | VideoFile)[],
      loadingSongs: true,
      songs: [] as VideoFile[],
      media: [] as (MeetingFile | LocalFile)[],
      types: [
        {
          label: this.$t('song') as string,
          value: 'song',
        },
        {
          label: this.$t('custom') as string,
          value: 'custom',
        },
        {
          label: this.$t('jwpub') as string,
          value: 'jwpub',
        },
      ] as { label: string; value: string }[],
    }
  },
  head(): MetaInfo {
    return { title: `Manage ${this.date}`, titleTemplate: '%s - M³' }
  },
  computed: {
    faSave(): IconDefinition {
      return faSave
    },
    faDownload(): IconDefinition {
      return faDownload
    },
    faFolderOpen(): IconDefinition {
      return faFolderOpen
    },
    faCloud(): IconDefinition {
      return faCloud
    },
    faPhotoFilm(): IconDefinition {
      return faPhotoFilm
    },
    isDark(): boolean {
      return this.$vuetify.theme.dark as boolean
    },
    faArrowDown19(): IconDefinition {
      return faArrowDown19
    },
    faCircleArrowLeft(): IconDefinition {
      return faCircleArrowLeft
    },
    faFileExport(): IconDefinition {
      return faFileExport
    },
    now(): Dayjs {
      return (this.$dayjs() as Dayjs).hour(0).minute(0).second(0).millisecond(0)
    },
    cong(): string {
      return this.$route.query.cong as string
    },
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    contents(): FileStat[] {
      return this.$store.state.cong.contents as FileStat[]
    },
    date(): string {
      return this.$route.query.date as string
    },
    prefix(): string {
      return [this.prefix1, this.prefix2, this.prefix3]
        .filter(Boolean)
        .join('-')
    },
    isMeetingDay(): boolean {
      const day = this.$dayjs(
        this.date,
        this.$getPrefs('app.outputFolderDateFormat') as string
      ) as Dayjs
      const mwDay = this.$getPrefs('meeting.mwDay') as number
      const weDay = this.$getPrefs('meeting.weDay') as number
      const weekDay = day.day() === 0 ? 6 : day.day() - 1 // day is 0 indexed and starts with Sunday
      return mwDay === weekDay || weDay === weekDay
    },
  },
  watch: {
    async type(newType: string) {
      if (newType === 'song' && this.songs.length === 0) {
        await this.getSongs()
      }
    },
    fileString(val: string) {
      if (!val) {
        this.prefix1 = this.prefix2 = this.prefix3 = ''
      }
    },
    song(val) {
      if (val) {
        this.prefix1 = '00'
        this.prefix2 = '00'
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
    await this.getMeetingData()
    this.getExistingMedia()
    document.addEventListener('dragover', this.stopEvent)
    document.addEventListener('dragenter', this.handleDrag)
    document.addEventListener('dragleave', this.handleDrag)
    document.addEventListener('drop', this.handleDrop)
    this.loading = false
  },
  methods: {
    goHome() {
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
    async addFiles(multi: boolean = true, ...exts: string[]) {
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
    async saveFiles() {
      this.loading = true
      try {
        for (const file of [...this.files, this.song]) {
          if (!file?.safeName) continue
          if (this.prefix) {
            file.safeName = this.prefix + ' ' + file.safeName
          }

          const path = join(
            this.$mediaPath() as string,
            this.date,
            file.safeName
          )

          // JWPUB extract
          if (file.contents) {
            this.$write(path, file.contents)
          }
          // Local file
          else if (file.filepath) {
            this.$copy(file.filepath, path)
          }
          // External file from jw.org
          else if (file.safeName) {
            file.folder = this.date
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
          if (this.client) {
            const mediaPath = join(
              this.$getPrefs('cong.dir') as string,
              'Media'
            )
            const datePath = join(mediaPath, this.date)
            const filePath = join(datePath, file.safeName)
            const mediaPathExists = !!this.contents.find(
              ({ filename }) => filename === mediaPath
            )
            const datePathExists = !!this.contents.find(
              ({ filename }) => filename === datePath
            )
            if (!mediaPathExists) {
              await this.client.createDirectory(mediaPath)
            }
            if (!datePathExists) {
              await this.client.createDirectory(datePath)
            }
            const perf: any = {
              start: performance.now(),
              bytes: statSync(path).size,
              name: file.safeName,
            }
            try {
              await this.client.putFileContents(filePath, readFileSync(path), {
                overwrite: true,
                onUploadProgress: ({ loaded, total }) => {
                  this.setProgress(loaded, total, true)
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
            perf.bits = perf.bytes * 8
            perf.ms = perf.end - perf.start
            perf.s = perf.ms / 1000
            perf.bps = perf.bits / perf.s
            perf.MBps = perf.bps / 1000000
            perf.dir = 'up'
            this.$log.debug(perf)
          }
        }

        await this.$convertUnusableFiles(this.$mediaPath() as string)
        if (this.client) await this.$updateContent()
        this.getExistingMedia()
      } catch (e: any) {
        this.$error('errorAdditionalMediaList', e)
      } finally {
        this.type = ''
        this.song = null
        this.files = []
        this.fileString = ''
        this.loading = false
      }
    },
    setProgress(loaded: number, total: number, global: boolean = false) {
      if (global) {
        this.totalProgress = (100 * loaded) / total
      } else {
        this.currentProgress = (100 * loaded) / total
      }
      if (this.currentProgress === 100) this.currentProgress = 0
      if (this.totalProgress === 100) this.totalProgress = 0
    },
    async getMeetingData() {
      const day = this.$dayjs(
        this.date,
        this.$getPrefs('app.outputFolderDateFormat') as string
      ) as Dayjs
      if (!day.isValid()) return
      const weekDay = day.day() === 0 ? 6 : day.day() - 1 // day is 0 indexed and starts with Sunday
      if (weekDay === (this.$getPrefs('meeting.mwDay') as number)) {
        await this.$getMwMedia(this.date)
      } else if (weekDay === (this.$getPrefs('meeting.weDay') as number)) {
        await this.$getWeMedia(this.date)
      }
      this.$createMediaNames()
      if (this.client) {
        await this.$updateContent()
      }
    },
    async getSongs() {
      this.loadingSongs = true
      const result = (await this.$getMediaLinks({
        pubSymbol: this.$store.state.media.songPub,
        format: 'MP4',
      })) as VideoFile[]
      result.forEach((song) => {
        song.safeName =
          this.$sanitize(`- ${this.$t('song')} ${song.title}`) + '.mp4'
      })
      this.songs = result
      this.loadingSongs = false
    },
    getExistingMedia() {
      const day = this.$dayjs(
        this.date,
        this.$getPrefs('app.outputFolderDateFormat') as string
      ) as Dayjs
      this.$getCongMedia(
        day.isValid() ? day.startOf('week') : this.now.startOf('week'),
        this.now
      )
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

      // If jw media is already dowloaded, set isLocal of jw media to true, else add local file to list
      const path = join(this.$mediaPath(), this.date)
      if (existsSync(path)) {
        readdirSync(path).forEach((filename) => {
          const jwMatch = jwMedia.find(({ safeName }) => safeName === filename)
          if (jwMatch) {
            jwMatch.isLocal = true
          } else {
            localMedia.push({
              safeName: filename,
              isLocal: true,
              filepath: join(this.$mediaPath() as string, this.date, filename),
            })
          }
        })
      }
      this.media = [...jwMedia, ...localMedia].sort((a, b) => {
        return (a.safeName as string).localeCompare(b.safeName as string)
      })
    },
  },
})
</script>
