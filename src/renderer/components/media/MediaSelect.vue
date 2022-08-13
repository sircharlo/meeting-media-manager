<template>
  <v-card>
    <v-card-title class="justify-center">
      {{
        !loading && missingMedia.length > 0
          ? $t('selectExternalMedia')
          : $t('selectDocument')
      }}
    </v-card-title>
    <v-col cols="12">
      <v-divider />
    </v-col>
    <v-col cols="12">
      <loading v-if="loading" />
      <v-list v-else-if="missingMedia.length > 0">
        <template v-for="(item, i) in missingMedia">
          <v-list-item
            :key="item"
            class="text-center"
            @click="uploadMissingFile(item)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ item }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider :key="'divider-' + i" />
        </template>
      </v-list>
      <v-list v-else>
        <template v-for="item in items">
          <v-list-item
            :key="item.DocumentId"
            class="text-center"
            @click="selectDoc(item.DocumentId)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ item.Title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider :key="'divider' + item.DocumentId" />
        </template>
      </v-list>
    </v-col>
  </v-card>
</template>
<script lang="ts">
import { ipcRenderer } from 'electron'
import { Database } from 'sql.js'
import { basename, extname, trimExt } from 'upath'
import Vue from 'vue'
import { MultiMediaItem, VideoFile, LocalFile } from '~/types'
export default Vue.extend({
  props: {
    file: {
      type: String,
      required: true,
    },
    setProgress: {
      type: Function,
      default: null,
    },
  },
  data() {
    return {
      loading: true,
      items: [] as { DocumentId: number; Title: string }[],
      db: null as null | Database,
      docId: null as null | number,
      mediaFiles: [] as (LocalFile | VideoFile)[],
      missingMedia: [] as string[],
    }
  },
  watch: {
    mediaFiles: {
      handler(val: (LocalFile | VideoFile)[]): void {
        if (!this.loading && this.missingMedia.length === 0) {
          this.$emit(
            'select',
            val.sort((a, b) =>
              (a.safeName as string).localeCompare(b.safeName as string)
            )
          )
        }
      },
      deep: true,
    },
  },
  async mounted(): Promise<void> {
    const db = await this.$getDbFromJWPUB(
      undefined,
      undefined,
      this.setProgress,
      this.file
    )
    this.db = db

    const table =
      this.$query(
        db,
        "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'"
      ).length === 0
        ? 'Multimedia'
        : 'DocumentMultimedia'
    const suppressZoom = (
      this.$query(
        db,
        "SELECT COUNT(*) AS CNT_REC FROM pragma_table_info('Multimedia') WHERE name='SuppressZoom'"
      ) as { CNT_REC: number }[]
    ).map((item) => {
      return item.CNT_REC > 0
    })[0]

    this.items = this.$query(
      db,
      `SELECT DISTINCT ${table}.DocumentId, Document.Title 
    FROM Document 
      INNER JOIN ${table} ON Document.DocumentId = ${table}.DocumentId
      ${
        table === 'DocumentMultimedia'
          ? `INNER JOIN Multimedia ON Multimedia.MultimediaId = ${table}.MultimediaId`
          : ''
      }
    WHERE Multimedia.CategoryType <> 9
    ${suppressZoom ? 'AND Multimedia.SuppressZoom = 0' : ''}
    ORDER BY ${table}.DocumentId`
    ) as { DocumentId: number; Title: string }[]
    this.loading = false
    if (this.items.length === 0) {
      this.$flash(this.$t('warnNoDocumentsFound') as string)
      this.$emit('empty')
    }
  },
  methods: {
    async uploadMissingFile(name: string): Promise<void> {
      const result = await ipcRenderer.invoke('openDialog', {
        title: name,
        filters: [{ name, extensions: [extname(name).substring(1)] }],
        properties: ['openFile'],
      })
      if (result && !result.canceled) {
        this.missingMedia = this.missingMedia.filter((f) => f !== name)
        const find = this.mediaFiles.find((f) => f.filename === name)
        if (find) find.filepath = result.filePaths[0]
      }
    },
    async selectDoc(docId: number): Promise<void> {
      this.loading = true
      this.docId = docId
      const mmItems = await this.$getDocumentMultiMedia(
        this.db as Database,
        docId,
        undefined,
        true
      )
      for (const [i, mm] of mmItems.entries()) {
        this.setProgress(i + 1, mmItems.length)
        const {
          Label,
          Caption,
          FilePath,
          KeySymbol,
          Track,
          IssueTagNumber,
          MimeType,
          CategoryType,
          MultiMeps,
        } = mm.queryInfo as MultiMediaItem

        const prefix = (i + 1).toString().padStart(2, '0')
        const type =
          '.' + MimeType ? (MimeType.includes('video') ? '.mp4' : '.mp3') : ''

        const title =
          Label ||
          Caption ||
          trimExt(FilePath ?? '') ||
          [KeySymbol, Track, IssueTagNumber].filter(Boolean).join('_')

        const ext = FilePath ? extname(FilePath) : type ?? ''
        const name = this.$sanitize(title) + ext

        const tempMedia = {
          safeName: `${prefix} - ${name}`,
          filename: name,
          contents: undefined as undefined | Buffer,
          url: undefined as string | undefined,
          filepath: undefined as string | undefined,
        } as LocalFile

        if (CategoryType && CategoryType !== -1) {
          tempMedia.contents = this.$getZipContentsByName(this.file, FilePath)
        } else {
          const externalMedia = (await this.$getMediaLinks({
            pubSymbol: KeySymbol as string,
            track: Track ?? undefined,
            issue: IssueTagNumber?.toString(),
            docId: MultiMeps ?? undefined,
          })) as VideoFile[]

          if (externalMedia.length > 0) {
            Object.assign(tempMedia, externalMedia[0])
            tempMedia.safeName = `${prefix} - ${basename(
              tempMedia.url as string
            )}`
          } else {
            this.missingMedia.push(tempMedia.filename as string)
          }
        }
        this.mediaFiles.push(tempMedia)
      }
      this.loading = false
    },
  },
})
</script>
