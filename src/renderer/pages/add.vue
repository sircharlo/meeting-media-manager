<template>
  <v-container fluid fill-height>
    <v-dialog v-if="file && type === 'jwpub'" :value="true">
      <media-select
        :file="file ? file.filepath : null"
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
          <v-btn-toggle v-model="type" style="width: 100%">
            <v-btn width="33.3%" value="song">{{ $t('song') }}</v-btn>
            <v-btn width="33.3%" value="custom">{{ $t('custom') }}</v-btn>
            <v-btn width="33.3%" value="jwpub">{{ $t('jwpub') }}</v-btn>
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
            v-model="file"
            field="autocomplete"
            :items="songs"
            item-text="title"
            item-value="safeName"
            hide-details="auto"
            :disabled="loadingSongs"
            :loading="loadingSongs"
            return-object
          />
          <v-row v-else-if="type === 'custom'" align="center">
            <v-col cols="auto" class="pr-0 text-left">
              <v-btn color="primary" style="height: 40px" @click="addFile('*')">
                {{ $t('browse') }}
              </v-btn>
            </v-col>
            <v-col class="pl-0">
              <form-input
                :value="file ? file.filepath : ''"
                readonly
                hide-details="auto"
              />
            </v-col>
          </v-row>
          <v-row v-else-if="type === 'jwpub'" align="center">
            <v-col cols="auto" class="pr-0 text-left">
              <v-btn
                color="primary"
                style="height: 40px"
                @click="addFile('JWPUB', 'jwpub')"
              >
                {{ $t('browse') }}
              </v-btn>
            </v-col>
            <v-col class="pl-0">
              <form-input
                :value="file ? file.filepath : ''"
                readonly
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-row
        v-if="file || files.length > 0"
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
            />
          </v-col>
        </v-col>
      </v-row>
      <v-col cols="12" class="px-0" style="margin-bottom: 72px">
        <loading v-if="loading" />
        <media-list
          v-else
          :date="date"
          :new-file="file"
          :new-files="files"
          :prefix="prefix"
          :media="media"
          :set-progess="setProgress"
          @refresh="getExistingMedia()"
        />
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
          <v-btn
            v-if="file || files.length > 0"
            nuxt
            :disabled="loading"
            color="error"
            :to="localePath('/?cong=') + cong"
            min-width="32px"
          >
            <font-awesome-icon
              :icon="faCircleArrowLeft"
              class="white--text"
              size="lg"
            />
          </v-btn>
        </v-col>
        <v-col class="text-center">
          <v-btn
            v-if="file || files.length > 0"
            color="primary"
            min-width="32px"
            :loading="loading"
            :disabled="loading"
            @click="saveFile()"
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
import { readdirSync, readFileSync, existsSync, statSync } from 'fs-extra'
import { basename, extname, join } from 'upath'
import { ipcRenderer } from 'electron'
import Vue from 'vue'
import { FileStat, WebDAVClient } from 'webdav/web'
import {
  faArrowDown19,
  faCircleArrowLeft,
  faCloud,
  faFileExport,
  faFolderOpen,
  faPhotoFilm,
  faSave,
} from '@fortawesome/free-solid-svg-icons'
import { CongFile, LocalFile, MeetingFile, VideoFile } from '~/types'
export default Vue.extend({
  name: 'AddPage',
  data() {
    return {
      prefix1: null,
      prefix2: null,
      prefix3: null,
      totalProgress: 0,
      currentProgress: 0,
      loading: true,
      type: null,
      file: null as LocalFile | null | VideoFile,
      files: [] as LocalFile[],
      loadingSongs: true,
      songs: [] as VideoFile[],
      media: [] as (MeetingFile | CongFile | LocalFile)[],
      types: [
        {
          label: this.$t('song'),
          value: 'song',
        },
        {
          label: this.$t('custom'),
          value: 'custom',
        },
        {
          label: this.$t('jwpub'),
          value: 'jwpub',
        },
      ],
    }
  },
  head() {
    return { title: 'Media List' }
  },
  computed: {
    faSave() {
      return faSave
    },
    faFolderOpen() {
      return faFolderOpen
    },
    faCloud() {
      return faCloud
    },
    faPhotoFilm() {
      return faPhotoFilm
    },
    isDark() {
      return this.$vuetify.theme.dark
    },
    faArrowDown19() {
      return faArrowDown19
    },
    faCircleArrowLeft() {
      return faCircleArrowLeft
    },
    faFileExport() {
      return faFileExport
    },
    cong() {
      return this.$route.query.cong
    },
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
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
      )
      const mwDay = this.$getPrefs('meeting.mwDay')
      const weDay = this.$getPrefs('meeting.weDay')
      const weekDay = day.day() === 0 ? 6 : day.day() - 1 // day is 0 indexed and starts with Sunday
      return mwDay === weekDay || weDay === weekDay
    },
  },
  watch: {
    async type(newType) {
      this.file = null
      if (newType === 'song' && this.songs.length === 0) {
        await this.getSongs()
      }
    },
    file(val) {
      if (!val) {
        this.prefix1 = this.prefix2 = this.prefix3 = null
      }
    },
  },
  async mounted() {
    await this.getMeetingData()
    await this.getExistingMedia()
    this.loading = false
  },
  methods: {
    addMedia(media: LocalFile[]) {
      this.files = media
      this.type = null
    },
    async addFile(...exts: string[]) {
      const result = await ipcRenderer.invoke('openDialog', {
        filters: [{ name: exts[0] ?? '', extensions: exts }],
        properties: ['openFile'],
      })
      if (
        result &&
        !result.canceled &&
        (exts.includes('*') ||
          exts.includes(extname(result.filePaths[0]).substring(1)))
      ) {
        const name = '- ' + basename(result.filePaths[0])
        this.file = {
          safeName: name,
          filepath: result.filePaths[0],
        }
      }
    },
    async saveFile(): Promise<void> {
      this.loading = true
      try {
        for (const file of [...this.files, Object.assign({}, this.file)]) {
          if (!file?.safeName) continue
          if (this.prefix) {
            file.safeName = this.prefix + ' ' + file.safeName
          }

          const path = join(this.$mediaPath(), this.date, file.safeName)
          if (file.contents) {
            this.$write(path, file.contents)
          } else if (file.filepath) {
            this.$copy(file.filepath, path)
          } else if (file.safeName) {
            file.folder = this.date
            await this.$downloadIfRequired(file, this.setProgress)
          }

          if (this.client) {
            const mediaPath = join(this.$getPrefs('cong.dir'), 'Media')
            const datePath = join(mediaPath, this.date)
            const filePath = join(datePath, file.safeName)
            if (!(await this.client.exists(mediaPath))) {
              await this.client.createDirectory(mediaPath)
            }
            if (!(await this.client.exists(datePath))) {
              await this.client.createDirectory(datePath)
            }
            /* createReadStream(path).pipe(
              this.client.createWriteStream(
                filePath,
                { overwrite: true },
                (res) => {
                  console.log(JSON.parse(JSON.stringify(res)))
                }
              )
            ) */
            const perf: any = {
              start: performance.now(),
              bytes: statSync(path).size,
              name: file.safeName,
            }
            await this.client.putFileContents(filePath, readFileSync(path), {
              overwrite: true,
              onUploadProgress: (progress) => {
                this.setProgress(progress.loaded, progress.total, true)
              },
            })
            perf.end = performance.now()
            perf.bits = perf.bytes * 8
            perf.ms = perf.end - perf.start
            perf.s = perf.ms / 1000
            perf.bps = perf.bits / perf.s
            perf.mbps = perf.bps / 1000000
            perf.dir = 'up'
            this.$log.debug(perf)
          }
        }
        await this.$convertUnusableFiles(this.$mediaPath())
        if (this.client) await this.$updateContent()
        await this.getExistingMedia()
      } catch (e) {
        this.$log.error(e)
      } finally {
        this.type = null
        this.files = []
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
        this.$getPrefs('app.outputFolderDateFormat')
      )
      const weekDay = day.day() === 0 ? 6 : day.day() - 1 // day is 0 indexed and starts with Sunday
      if (weekDay === this.$getPrefs('meeting.mwDay')) {
        await this.$getMwMedia(this.date)
      } else if (weekDay === this.$getPrefs('meeting.weDay')) {
        await this.$getWeMedia(this.date)
      }
      this.$createMediaNames()
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
    async getExistingMedia() {
      const meetings = this.$store.getters['media/meetings'] as Map<
        string,
        Map<number, MeetingFile[]>
      >
      const localMedia: LocalFile[] = []

      const congMedia: CongFile[] = (
        this.$store.state.cong.contents as FileStat[]
      )
        .filter(
          ({ filename, type }) =>
            type === 'file' && filename.includes(`Media/${this.date}/`)
        )
        .map((file) => {
          return Object.assign(file, {
            isLocal: false,
            safeName: file.basename,
            congSpecific: true,
          })
        })

      const jwMedia: MeetingFile[] = []
      for (const [, media] of meetings.get(this.date) ?? []) {
        for (const m of media) {
          m.isLocal = false
          if (this.client) {
            m.hidden = await this.client.exists(
              join(this.$getPrefs('cong.dir'), 'Hidden', this.date, m.safeName)
            )
          }
        }
        jwMedia.push(...media)
      }

      const path = join(this.$mediaPath(), this.date)
      if (existsSync(path)) {
        readdirSync(path).forEach((filename) => {
          const jwMatch = jwMedia.find((m) => m.safeName === filename)
          const congMatch = congMedia.find((m) => m.basename === filename)
          if (jwMatch) {
            jwMatch.isLocal = true
          } else if (congMatch) {
            congMatch.isLocal = true
          } else {
            localMedia.push({
              safeName: filename,
              isLocal: true,
              filepath: join(this.$mediaPath(), this.date, filename),
            })
          }
        })
      }
      this.media = [...jwMedia, ...congMedia, ...localMedia].sort((a, b) => {
        return (a.safeName as string).localeCompare(b.safeName as string)
      })
    },
  },
})
</script>
