<!-- eslint-disable vue/no-unused-vars -->
<!-- Media list in the media manager page -->
<template>
  <v-list
    v-if="mediaList.length > 0"
    dense
    :style="`overflow-y: auto;max-height: ${listHeight}px`"
  >
    <v-dialog
      v-if="edit"
      :value="true"
      max-width="700px"
      @click:outside="edit = null"
    >
      <v-card>
        <v-col class="text-right">
          <form-input v-model="edit.newName" :suffix="edit.ext" />
          <v-btn
            color="primary"
            :loading="renaming"
            aria-label="save"
            @click="saveNewName()"
          >
            <font-awesome-icon :icon="faCheck" />
          </v-btn>
        </v-col>
      </v-card>
    </v-dialog>
    <v-list-item
      v-for="item in mediaList"
      :key="item.safeName"
      dense
      :disabled="item.loading"
    >
      <v-list-item-action v-if="item.loading" class="my-0">
        <v-progress-circular indeterminate size="16" width="2" />
      </v-list-item-action>
      <v-list-item-action
        v-else-if="!item.recurring && (item.isLocal || item.congSpecific)"
        class="my-0"
      >
        <v-btn v-if="item.color === 'warning'" icon @click="atClick(item)">
          <font-awesome-icon
            :icon="faSquareMinus"
            class="warning--text"
            size="xs"
          />
        </v-btn>
        <v-tooltip v-else right :value="true">
          <template #activator="data">
            <v-btn icon @click="atClick(item)">
              <font-awesome-icon
                :icon="faSquareMinus"
                class="error--text"
                size="xs"
              />
            </v-btn>
          </template>
          <span>{{ $t('clickAgain') }}</span>
        </v-tooltip>
      </v-list-item-action>
      <v-list-item-action v-else class="my-0">
        <v-btn icon @click="atClick(item)">
          <font-awesome-icon
            v-if="item.isLocal === undefined"
            :icon="faSquarePlus"
            size="xs"
          />
          <font-awesome-icon
            v-else-if="item.hidden"
            :icon="faSquare"
            size="xs"
          />
          <font-awesome-icon v-else :icon="faSquareCheck" size="xs" />
        </v-btn>
      </v-list-item-action>
      <v-hover v-slot="{ hover }">
        <v-list-item-content>
          <v-img
            v-if="hover && getPreview(item)"
            :src="preview"
            alt="Loading..."
            class="tooltip-img"
            max-width="200px"
            contain
          />
          <v-list-item-title
            v-if="item.isLocal === undefined"
            :class="{
              'text-decoration-line-through': item.ignored,
            }"
          >
            {{ prefix + ' ' + item.safeName }}
          </v-list-item-title>
          <v-list-item-title
            v-else
            :class="{
              'text-decoration-line-through': item.hidden,
            }"
          >
            {{ item.safeName }}
          </v-list-item-title>
        </v-list-item-content>
      </v-hover>
      <v-list-item-action class="my-0">
        <font-awesome-icon
          v-if="item.recurring"
          :icon="faSyncAlt"
          class="info--text"
        />
        <v-btn
          v-else-if="(item.congSpecific || item.isLocal) && !item.hidden"
          icon
          aria-label="rename file"
          @click="editItem(item)"
        >
          <font-awesome-icon :icon="faPen" size="sm" />
        </v-btn>
      </v-list-item-action>
      <v-list-item-action>
        <font-awesome-icon
          :icon="item.safeName | typeIcon"
          size="sm"
          fixed-width
        />
      </v-list-item-action>
      <v-list-item-action class="ms-2">
        <font-awesome-icon
          v-if="item.congSpecific"
          :icon="faCloud"
          class="info--text"
          size="sm"
        />
        <font-awesome-icon
          v-else-if="item.isLocal"
          :icon="faFolderOpen"
          size="sm"
        />
        <font-awesome-icon
          v-else
          :icon="faGlobeAmericas"
          class="primary--text"
          size="sm"
        />
      </v-list-item-action>
    </v-list-item>
  </v-list>
  <p v-else>{{ $t('noMedia') }}</p>
</template>
<script lang="ts">
import { pathToFileURL } from 'url'
import { extname, join, trimExt } from 'upath'
import { defineComponent, PropOptions } from 'vue'
import { WebDAVClient, FileStat } from 'webdav/dist/web/types'
import {
  faImage,
  faSquare,
  faSquareCheck,
} from '@fortawesome/free-regular-svg-icons'
import {
  faCheck,
  faFilm,
  faQuestionCircle,
  faSquareMinus,
  faFolderOpen,
  faHeadphones,
  faSquarePlus,
  faFileCode,
  faPen,
  faSyncAlt,
  faFilePdf,
  faClosedCaptioning,
  faCloud,
  faGlobeAmericas,
} from '@fortawesome/free-solid-svg-icons'
import { LocalFile, MeetingFile, VideoFile } from '~/types'
import { LOCKED, MS_IN_SEC, NOT_FOUND } from '~/constants/general'
export default defineComponent({
  filters: {
    ext(filename: string) {
      return extname(filename)
    },
    typeIcon(filename: string) {
      if (window.$nuxt.$isImage(filename)) {
        return faImage
      } else if (window.$nuxt.$isVideo(filename)) {
        return faFilm
      } else if (window.$nuxt.$isAudio(filename)) {
        return faHeadphones
      } else if (extname(filename) === '.pdf') {
        return faFilePdf
      } else if (extname(filename) === '.vtt') {
        return faClosedCaptioning
      } else if (['.xspf', '.json'].includes(extname(filename))) {
        return faFileCode
      } else {
        return faQuestionCircle
      }
    },
  },
  props: {
    date: {
      type: String,
      required: true,
    },
    media: {
      type: Array,
      required: true,
    } as PropOptions<(LocalFile | VideoFile)[]>,
    newFile: {
      type: Object,
      default: null,
    } as PropOptions<VideoFile>,
    newFiles: {
      type: Array,
      default: () => [],
    } as PropOptions<(LocalFile | VideoFile)[]>,
    prefix: {
      type: String,
      default: '',
    },
    showPrefix: {
      type: Boolean,
      default: false,
    },
    showInput: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      edit: null as any,
      preview: '',
      renaming: false,
      previewName: '',
      loading: false,
      windowWidth: 0,
      windowHeight: 0,
      mediaList: [] as (MeetingFile | LocalFile)[],
    }
  },
  computed: {
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    online(): boolean {
      return this.$store.state.stats.online && !this.$getPrefs('app.offline')
    },
    contents(): FileStat[] {
      return this.$store.state.cong.contents as FileStat[]
    },
    listHeight(): number {
      const TOP_PADDING = 12
      const HEADER = 88
      const TYPE_SELECT = 84
      const INPUT = 64
      const PREFIX = 68
      const EL_PADDING = 16
      const FOOTER = 72
      let otherElements =
        FOOTER + TOP_PADDING + HEADER + TYPE_SELECT + EL_PADDING
      if (this.showInput || this.showPrefix) {
        otherElements += INPUT
      }
      if (this.showPrefix) {
        otherElements += PREFIX
      }
      return this.windowHeight - otherElements
    },
    faCheck() {
      return faCheck
    },
    faSyncAlt() {
      return faSyncAlt
    },
    faSquare() {
      return faSquare
    },
    faFolderOpen() {
      return faFolderOpen
    },
    faSquareMinus() {
      return faSquareMinus
    },
    faSquarePlus() {
      return faSquarePlus
    },
    faSquareCheck() {
      return faSquareCheck
    },
    faPen() {
      return faPen
    },
    faCloud() {
      return faCloud
    },
    faGlobeAmericas() {
      return faGlobeAmericas
    },
  },
  watch: {
    media: {
      handler() {
        this.setMediaList()
      },
      deep: true,
    },
    newFile() {
      this.setMediaList()
    },
    newFiles: {
      handler() {
        this.setMediaList()
      },
      deep: true,
    },
    prefix() {
      this.setMediaList()
    },
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.setWindowSize)
  },
  mounted() {
    this.setMediaList()
    this.setWindowSize()
    window.addEventListener('resize', this.setWindowSize)
  },
  methods: {
    setWindowSize() {
      this.windowWidth = window.innerWidth
      this.windowHeight = window.innerHeight
    },
    setMediaList() {
      // If new files are being uploaded, add them to the list
      if (this.newFile || (this.newFiles && this.newFiles.length > 0)) {
        this.mediaList = (
          [
            this.newFile,
            ...(this.newFiles ?? []),
            ...(this.media ?? []),
          ].filter(Boolean) as (MeetingFile | LocalFile)[]
        )
          .map((m) => {
            m.color = 'warning'
            return m
          })
          .sort((a, b) => {
            return (
              ((!!this.prefix && a.isLocal === undefined
                ? this.prefix + ' '
                : '') + a.safeName) as string
            ).localeCompare(
              ((!!this.prefix && b.isLocal === undefined
                ? this.prefix + ' '
                : '') + b.safeName) as string,
              undefined,
              { numeric: true }
            )
          })
      } else {
        this.mediaList = [
          ...(this.media ?? []).map((m) => {
            m.color = 'warning'
            return m
          }),
        ]
      }
    },
    async saveNewName() {
      if (this.renaming) return
      this.renaming = true
      const cleanName = this.$sanitize(
        this.edit?.newName + this.edit?.ext,
        true
      )

      this.$rename(
        join(this.$mediaPath(), this.date, this.edit?.safeName),
        this.edit?.safeName,
        cleanName
      )

      // Change the name of the file in every date folder that it appears in
      if (this.date === 'Recurring') {
        this.$findAll(
          join(this.$mediaPath() as string, '*', this.edit?.safeName)
        ).forEach((file) => {
          this.$rename(file, this.edit?.safeName, cleanName)
        })
      }

      // Change the name in the cong server
      if (this.client && this.online && this.edit.congSpecific) {
        const dirPath = join(
          this.$getPrefs('cong.dir') as string,
          'Media',
          this.date
        )
        if (
          !this.contents.find((c) => c.filename === join(dirPath, cleanName))
        ) {
          await this.client.moveFile(
            join(dirPath, this.edit?.safeName),
            join(dirPath, cleanName)
          )
        }
        await this.$updateContent()
      }
      this.edit = null
      this.renaming = false
      this.$emit('refresh')
    },
    editItem(item: MeetingFile | LocalFile) {
      const newItem = Object.assign({}, item) as any
      newItem.ext = extname(item.safeName as string)
      newItem.newName = trimExt(item.safeName as string)
      this.edit = newItem
    },
    getPreview(item: MeetingFile | LocalFile): string {
      if (this.previewName === item.safeName) {
        return this.preview
      }
      this.loading = true
      this.preview = ''
      if (item.trackImage) this.preview = item.trackImage
      else if (item.thumbnail) this.preview = item.thumbnail
      else if (item.contents && item.safeName) {
        this.preview =
          `data:image/${extname(item.safeName)};base64,` +
          item.contents.toString('base64')
      } else if (item.filepath && this.$isImage(item.filepath)) {
        this.preview = pathToFileURL(item.filepath).href
      } else if (this.online && item.url && this.$isImage(item.url)) {
        if (item.congSpecific && item.url) {
          this.client.getFileContents(item.url).then((contents) => {
            this.preview =
              `data:;base64,` +
              Buffer.from(new Uint8Array(contents as ArrayBuffer)).toString(
                'base64'
              )
          })
        } else if (item.url) {
          this.preview = pathToFileURL(item.url).href
        }
      } else {
        this.preview = ''
      }
      this.loading = false
      this.previewName = item.safeName as string
      return this.preview
    },
    async toggleVisibility(item: MeetingFile | LocalFile) {
      const mediaMap = (
        this.$store.getters['media/meetings'] as Map<
          string,
          Map<number, MeetingFile[]>
        >
      ).get(this.date)

      if (
        mediaMap &&
        (!item.isLocal || (item.recurring && item.congSpecific))
      ) {
        for (const [, media] of mediaMap) {
          const match = media.find((m) => m.safeName === item.safeName)
          if (!match) continue
          if (this.client && this.online) {
            const hiddenPath = join(this.$getPrefs('cong.dir'), 'Hidden')
            const datePath = join(hiddenPath, this.date)
            const filePath = join(datePath, item.safeName)

            // Create hidden/date dir if not exists
            try {
              await this.$createCongDir(hiddenPath)
            } catch (e: unknown) {
              this.$error('errorWebdavPut', e, hiddenPath)
            }

            try {
              await this.$createCongDir(datePath)
            } catch (e: unknown) {
              this.$error('errorWebdavPut', e, datePath)
            }

            // Remove file if exists or add it if it doesn't
            if (this.contents.find(({ filename }) => filename === filePath)) {
              try {
                await this.client.deleteFile(filePath)
              } catch (e: any) {
                if (e.message.includes(LOCKED.toString())) {
                  this.$warn('errorWebdavLocked', { identifier: filePath })
                } else if (e.status !== NOT_FOUND) {
                  this.$error('errorWebdavRm', e, filePath)
                }
              }
            } else {
              await this.client.putFileContents(filePath, '')
            }
            await this.$updateContent()
          }
          match.hidden = !match.hidden
          item.loading = false
          this.$emit('refresh')
          return
        }
      }
    },
    async atClick(item: MeetingFile | LocalFile) {
      if (item.loading) return
      if (!item.recurring && (item.isLocal || item.congSpecific)) {
        item.loading = item.color === 'error'
        await this.removeItem(item)
      } else if (item.isLocal !== undefined) {
        item.loading = true
        await this.toggleVisibility(item)
      } else if (item.isLocal === undefined) {
        item.ignored = !item.ignored
      }
    },
    async removeItem(item: MeetingFile | LocalFile) {
      if (item.color === 'error') {
        this.mediaList.splice(this.mediaList.indexOf(item), 1)
        this.$rm(join(this.$mediaPath(), this.date, item.safeName as string))

        if (this.date === 'Recurring') {
          this.$rm(
            this.$findAll(join(this.$mediaPath(), '*', item.safeName as string))
          )
        }

        // Remove item in cong server
        if (item.congSpecific && this.online) {
          try {
            await this.client.deleteFile(item.url as string)
          } catch (e: any) {
            if (e.message.includes(LOCKED.toString())) {
              this.$warn('errorWebdavLocked', {
                identifier: item.url as string,
              })
            } else if (e.status !== NOT_FOUND) {
              this.$error('errorWebdavRm', e, item.url as string)
            }
          }
          await this.$updateContent()
        }
        item.loading = false
        this.$emit('refresh')
      } else {
        // Make user click twice to remove
        const newItem = Object.assign(item, { color: 'error' })
        this.mediaList.splice(this.mediaList.indexOf(item), 1, newItem)
        setTimeout(() => {
          const i = this.mediaList.indexOf(newItem)
          if (i > -1) {
            this.mediaList.splice(
              i,
              1,
              Object.assign(newItem, { color: 'warning' })
            )
          }
        }, 3 * MS_IN_SEC)
      }
    },
  },
})
</script>
<style lang="scss" scoped>
.tooltip-img {
  content: ' ';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, 0);
}
</style>
