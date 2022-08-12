<template>
  <v-list>
    <v-dialog v-if="edit" :value="true">
      <v-card>
        <v-col class="text-right">
          <form-input v-model="edit.newName" :suffix="edit.ext" />
          <v-btn color="primary" @click="saveNewName()">
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
      <v-list-item-action v-if="item.isLocal || item.congSpecific">
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
            :src="getPreview(item)"
            class="tooltip-img"
            max-width="200px"
            contain
          />
          <v-list-item-title v-if="item.isLocal === undefined">
            {{ getName(item) }}
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
        <v-btn v-if="item.isLocal && !item.hidden" icon @click="editItem(item)">
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
import { basename, extname, join, trimExt } from 'upath'
import Vue from 'vue'
import { WebDAVClient } from 'webdav/web'
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
  faPen,
  faCloud,
  faGlobeAmericas,
} from '@fortawesome/free-solid-svg-icons'
import { MultiMediaImage, SmallMediaFile } from '~/types'
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
    },
    newFile: {
      type: [Object, String],
      default: null,
    },
    newFiles: {
      type: Array,
      default: () => [],
    },
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
      edit: null,
      mediaList: [] as any[],
    }
  },
  computed: {
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    faCheck() {
      return faCheck
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
      if (
        (this.newFile &&
          extname(this.newFile.safeName).toLowerCase() !== '.jwpub') ||
        this.newFiles.length > 0
      ) {
        this.mediaList = [this.newFile, ...this.newFiles, ...this.media]
          .filter(Boolean)
          .map((m: any) => {
            m.color = 'warning'
            return m
          })
          .sort((a, b) => {
            if (this.prefix && a.isLocal === undefined) {
              return (this.prefix + ' ' + (a.safeName ?? a)).localeCompare(
                b.safeName
              )
            } else if (this.prefix && b.isLocal === undefined) {
              return (a.safeName as string).localeCompare(
                this.prefix + ' ' + (b.safeName ?? b)
              )
            } else {
              return (a.safeName ?? a).localeCompare(b.safeName ?? b)
            }
          })
      } else {
        this.mediaList = [
          ...this.media.map((m: any) => {
            m.color = 'warning'
            return m
          }),
        ]
      }
    },
    getName(item: any): string {
      return item.safeName ? this.prefix + ' ' + item.safeName : basename(item)
    },
    saveNewName() {
      this.$rename(
        // @ts-ignore
        join(this.$mediaPath(), this.date, this.edit?.safeName),
        // @ts-ignore
        this.edit?.safeName,
        // @ts-ignore
        this.edit?.newName + this.edit?.ext
      )
      this.edit = null
      this.$emit('refresh')
    },
    editItem(item: any) {
      const newItem = Object.assign({}, item)
      newItem.ext = extname(item.safeName)
      newItem.newName = trimExt(item.safeName)
      this.edit = newItem
    },
    getPreview(
      item: SmallMediaFile | MultiMediaImage | { filepath: string } | string
    ): string | undefined {
      // @ts-ignore
      if (item.trackImage) return item.trackImage
      // @ts-ignore
      if (item.thumbnail) return item.thumbnail
      // @ts-ignore
      if (item.contents) {
        return (
          // @ts-ignore
          `data:image/${extname(item.safeName)};base64,` +
          // @ts-ignore
          item.contents.toString('base64')
        )
        // @ts-ignore
      } else if (!item.congSpecific) {
        // @ts-ignore
        const path = item.filepath ?? item.url ?? item
        if (this.$isImage(path)) {
          return pathToFileURL(path).href
        }
      }
      return undefined
    },
    async toggleVisibility(item: MultiMediaImage | SmallMediaFile) {
      const mediaMap = (
        this.$store.getters['media/meetings'] as Map<
          string,
          Map<number, (SmallMediaFile | MultiMediaImage)[]>
        >
      ).get(this.date)

      if (mediaMap && item.isLocal === false) {
        for (const [, media] of mediaMap) {
          const match = media.find((m) => m.safeName === item.safeName)
          if (match) {
            match.hidden = !match.hidden
            if (this.client) {
              const hiddenPath = join(this.$getPrefs('cong.dir'), 'Hidden')
              const datePath = join(hiddenPath, this.date)
              const filePath = join(datePath, item.safeName)

              if (!(await this.client.exists(hiddenPath))) {
                await this.client.createDirectory(hiddenPath)
              }
              if (!(await this.client.exists(datePath))) {
                await this.client.createDirectory(datePath)
              }
              if (await this.client.exists(filePath)) {
                await this.client.deleteFile(filePath)
              } else {
                await this.client.putFileContents(filePath, '')
              }
            }
          }
        }
        this.$emit('refresh')
      }
    },
    async atClick(item: any) {
      if (item.isLocal) {
        await this.removeItem(item)
      } else if (item.isLocal !== undefined) {
        await this.toggleVisibility(item)
      }
    },
    async removeItem(item: any) {
      if (item.color === 'error') {
        this.mediaList.splice(this.mediaList.indexOf(item), 1)
        this.$rm(join(this.$mediaPath(), this.date, item.safeName as string))

        if (item.congSpecific) {
          await this.client.deleteFile(item.filename)
          await this.$updateContent()
        }
        this.$emit('refresh')
      } else {
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
