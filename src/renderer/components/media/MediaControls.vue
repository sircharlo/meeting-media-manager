<template>
  <v-row>
    <v-app-bar fixed>
      <v-col class="text-left">
        <v-btn icon aria-label="Toggle prefix" @click="togglePrefix()">
          <font-awesome-icon :icon="faEye" />
          <font-awesome-icon :icon="faListOl" />
        </v-btn>
      </v-col>
      <v-col class="text-center">
        <v-btn color="secondary" @click="clearDate()">{{ date }}</v-btn>
      </v-col>
      <v-col class="text-right">
        <v-btn icon aria-label="Refresh" @click="getMedia()">
          <font-awesome-icon :icon="faRotateRight" />
        </v-btn>
        <v-btn
          v-if="sortable"
          aria-label="Save order"
          icon
          @click="sortable = false"
        >
          <font-awesome-icon :icon="faSquareCheck" />
        </v-btn>
        <v-btn v-else icon aria-label="Sort items" @click="sortable = true">
          <font-awesome-icon :icon="faArrowDownShortWide" />
        </v-btn>
        <v-btn icon aria-label="Open media folder" @click="openFolder()">
          <font-awesome-icon :icon="faFolderOpen" />
        </v-btn>
      </v-col>
    </v-app-bar>
    <loading v-if="loading" />
    <draggable
      v-else
      v-model="items"
      tag="v-list"
      handle=".sort-btn"
      group="media-items"
      style="width: 100%; margin-top: 56px"
      @start="dragging = true"
      @end="dragging = false"
    >
      <media-item
        v-for="item in items"
        :key="item.id"
        :src="item.path"
        :media-active="mediaActive"
        :show-prefix="showPrefix"
        :sortable="sortable"
      />
    </draggable>
  </v-row>
</template>
<script lang="ts">
import Vue from 'vue'
import { basename, join } from 'upath'
import draggable from 'vuedraggable'
import { ipcRenderer } from 'electron'
import {
  faEye,
  faListOl,
  faRotateRight,
  faSquareCheck,
  faArrowDownShortWide,
  faFolderOpen,
} from '@fortawesome/free-solid-svg-icons'
export default Vue.extend({
  components: {
    draggable,
  },
  props: {
    mediaActive: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dragging: false,
      sortable: false,
      loading: true,
      showPrefix: false,
      items: [] as { id: string; path: string }[],
    }
  },
  computed: {
    date(): string {
      return this.$route.query.date as string
    },
    faEye() {
      return faEye
    },
    faArrowDownShortWide() {
      return faArrowDownShortWide
    },
    faListOl() {
      return faListOl
    },
    faRotateRight() {
      return faRotateRight
    },
    faSquareCheck() {
      return faSquareCheck
    },
    faFolderOpen() {
      return faFolderOpen
    },
  },
  mounted() {
    this.getMedia()
  },
  methods: {
    getMedia() {
      this.loading = true
      this.items = this.$findAll(join(this.$mediaPath(), this.date, '*'))
        .filter((f) => {
          return this.$isImage(f) || this.$isVideo(f) || this.$isAudio(f)
        })
        .sort((a, b) => basename(a).localeCompare(basename(b)))
        .map((path) => {
          return {
            id:
              basename(path)
                .replaceAll(' ', '')
                .replaceAll('-', '')
                .replaceAll("'", '')
                .replaceAll('.', '')
                .replaceAll(/\d/g, '') + 'mediaitem',
            path,
          }
        })
      this.loading = false
    },
    clearDate() {
      this.$router.push({
        query: {
          ...this.$route.query,
          date: undefined,
        },
      })
    },
    togglePrefix() {
      this.showPrefix = true
      setTimeout(() => {
        this.showPrefix = false
      }, 3000)
    },
    openFolder(): void {
      ipcRenderer.send('openPath', join(this.$mediaPath(), this.date))
    },
  },
})
</script>
