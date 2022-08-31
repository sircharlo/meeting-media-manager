<!-- Media list in the media manager page -->
<template>
  <v-list>
    <v-dialog v-if="edit" :value="true">
      <v-card>
        <v-col class="text-right">
          <form-input v-model="edit.newName" :suffix="edit.ext" />
          <v-btn color="primary" aria-label="save" @click="saveNewName()">
            <font-awesome-icon :icon="faCheck" />
          </v-btn>
        </v-col>
      </v-card>
    </v-dialog>
    <v-list-item
      v-for="item in mediaList"
      :key="item.safeName"
      dense
      @click="atClick(item)"
    >
      <v-list-item-action
        v-if="!item.recurring && (item.isLocal || item.congSpecific)"
      >
        <font-awesome-icon
          v-if="item.color === 'warning'"
          :icon="faSquareMinus"
          class="warning--text"
          size="xs"
        />
        <v-tooltip v-else right>
          <template #activator="{ on, attrs }">
            <font-awesome-icon
              v-bind="attrs"
              :icon="faSquareMinus"
              class="error--text"
              size="xs"
              v-on="on"
            />
          </template>
          <span>{{ $t('clickAgain') }}</span>
        </v-tooltip>
      </v-list-item-action>
      <v-list-item-action v-else-if="item.isLocal === undefined">
        <font-awesome-icon :icon="faSquarePlus" size="xs" />
      </v-list-item-action>
      <v-list-item-action v-else>
        <font-awesome-icon v-if="item.hidden" :icon="faSquare" />
        <font-awesome-icon v-else :icon="faSquareCheck" size="xs" />
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
          <v-list-item-title v-if="item.isLocal === undefined">
            {{ prefix + ' ' + item.safeName }}
          </v-list-item-title>
          <v-list-item-title
            v-else
            :class="{ 'text-decoration-line-through': item.hidden }"
          >
            {{ item.safeName }}
          </v-list-item-title>
        </v-list-item-content>
      </v-hover>
      <v-list-item-action>
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
      <v-list-item-action>
        <font-awesome-icon
          v-if="item.congSpecific"
          :icon="faCloud"
          class="info--text"
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
</template>
<script lang="ts">
// eslint-disable-next-line import/named
import { pathToFileURL } from 'url'
import { extname, join, trimExt } from 'upath'
import Vue, { PropOptions } from 'vue'
import { WebDAVClient, FileStat } from 'webdav'
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
  faSquarePlus,
  faFileCode,
  faPen,
  faSyncAlt,
  faFilePdf,
  faCloud,
  faGlobeAmericas,
} from '@fortawesome/free-solid-svg-icons'
import { LocalFile, MeetingFile, VideoFile } from '~/types'
export default Vue.extend({
  filters: {
    ext(filename: string) {
      return extname(filename)
    },
    typeIcon(filename: string) {
      if (['.jpg', '.png', '.jpeg', '.svg'].includes(extname(filename))) {
        return faImage
      } else if (['.mp4'].includes(extname(filename))) {
        return faFilm
      } else if (extname(filename) === '.pdf') {
        return faFilePdf
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
    setProgress: {
      type: Function,
      default: null,
    },
  },
  data() {
    return {
      edit: null as any,
      preview: '',
      previewName: '',
      loading: false,
      mediaList: [] as (MeetingFile | LocalFile)[],
    }
  },
  computed: {
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    contents(): FileStat[] {
      return this.$store.state.cong.contents as FileStat[]
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
  mounted() {
    this.setMediaList()
  },
  methods: {
    setMediaList() {
      // If new files are being uploaded, add them to the list
      if (this.newFile || this.newFiles.length > 0) {
        this.mediaList = [this.newFile, ...this.newFiles, ...this.media]

          .filter(Boolean)
          .map((m) => {
            m.color = 'warning'
            return m
          })
          .sort((a, b) => {
            if (this.prefix && a.isLocal === undefined) {
              return (this.prefix + ' ' + (a.safeName as string)).localeCompare(
                b.safeName as string
              )
            } else if (this.prefix && b.isLocal === undefined) {
              return (a.safeName as string).localeCompare(
                this.prefix + ' ' + (b.safeName as string)
              )
            } else {
              return (a.safeName as string).localeCompare(b.safeName as string)
            }
          })
      } else {
        this.mediaList = [
          ...this.media.map((m) => {
            m.color = 'warning'
            return m
          }),
        ]
      }
    },
    async saveNewName() {
      this.$rename(
        join(this.$mediaPath(), this.date, this.edit?.safeName),
        this.edit?.safeName,
        this.edit?.newName + this.edit?.ext
      )

      // Change the name of the file in every date folder that it appears in
      if (this.date === 'Recurring') {
        this.$findAll(
          join(this.$mediaPath() as string, '*', this.edit?.safeName)
        ).forEach((file) => {
          this.$rename(
            file,
            this.edit?.safeName,
            this.edit?.newName + this.edit?.ext
          )
        })
      }

      // Change the name in the cong server
      if (this.client && this.edit.congSpecific) {
        const dirPath = join(
          this.$getPrefs('cong.dir') as string,
          'Media',
          this.date
        )
        if (
          !this.contents.find(
            (c) =>
              c.filename === join(dirPath, this.edit?.newName + this.edit?.ext)
          )
        ) {
          await this.client.moveFile(
            join(dirPath, this.edit?.safeName),
            join(dirPath, this.edit?.newName + this.edit?.ext)
          )
        }
        await this.$updateContent()
      }
      this.edit = null
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
      else if (item.contents) {
        this.preview =
          `data:image/${extname(item.safeName as string)};base64,` +
          item.contents.toString('base64')
      } else if (item.filepath && this.$isImage(item.filepath)) {
        this.preview = pathToFileURL(item.filepath).href
      } else if (this.$isImage(item.url as string)) {
        if (item.congSpecific) {
          this.client.getFileContents(item.url as string).then((contents) => {
            this.preview =
              `data:;base64,` +
              Buffer.from(new Uint8Array(contents as ArrayBuffer)).toString(
                'base64'
              )
          })
        } else {
          this.preview = pathToFileURL(item.url as string).href
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
          if (match) {
            match.hidden = !match.hidden
            if (this.client) {
              const hiddenPath = join(this.$getPrefs('cong.dir'), 'Hidden')
              const datePath = join(hiddenPath, this.date)
              const filePath = join(datePath, item.safeName)

              // Create hidden dir if not exists
              if (
                !this.contents.find(({ filename }) => filename === hiddenPath)
              ) {
                await this.client.createDirectory(hiddenPath)
              }

              // Create date dir if not exists
              if (
                !this.contents.find(({ filename }) => filename === datePath)
              ) {
                await this.client.createDirectory(datePath)
              }

              // Remove file if exists or add it if it doesn't
              if (this.contents.find(({ filename }) => filename === filePath)) {
                try {
                  await this.client.deleteFile(filePath)
                } catch (e) {
                  this.$error('errorWebdavRm', e, filePath)
                }
              } else {
                await this.client.putFileContents(filePath, '')
              }
              await this.$updateContent()
            }
          }
        }
        this.$emit('refresh')
      }
    },
    async atClick(item: MeetingFile | LocalFile) {
      if (!item.recurring && (item.isLocal || item.congSpecific)) {
        await this.removeItem(item)
      } else if (item.isLocal !== undefined) {
        await this.toggleVisibility(item)
      }
    },
    async removeItem(item: MeetingFile | LocalFile) {
      if (item.color === 'error') {
        this.mediaList.splice(this.mediaList.indexOf(item), 1)
        this.$rm(join(this.$mediaPath(), this.date, item.safeName as string))

        // Remove item in cong server
        if (item.congSpecific) {
          try {
            await this.client.deleteFile(item.url as string)
          } catch (e: any) {
            this.$error('errorWebdavRm', e, item.url as string)
          }
          await this.$updateContent()
        }
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
        }, 3000)
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
