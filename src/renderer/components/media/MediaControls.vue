<template>
  <v-row>
    <v-app-bar fixed>
      <v-col class="text-left">
        <v-btn icon @click="togglePrefix()">
          <v-icon small>fas fa-fw fa-eye</v-icon>
          <v-icon small>fas fa-fw fa-list-ol</v-icon>
        </v-btn>
      </v-col>
      <v-col class="text-center">
        <v-btn color="secondary" @click="clearDate()">{{ date }}</v-btn>
      </v-col>
      <v-col class="text-right">
        <v-btn icon>
          <v-icon small>fas fa-fw fa-rotate-right</v-icon>
        </v-btn>
        <v-btn v-if="sortable" icon @click="sortable = false">
          <v-icon small>fas fa-fw fa-square-check</v-icon>
        </v-btn>
        <v-btn v-else icon @click="sortable = true">
          <v-icon small>fas fa-fw fa-arrow-down-short-wide</v-icon>
        </v-btn>
        <v-btn icon @click="openFolder()">
          <v-icon small>fas fa-fw fa-folder-open</v-icon>
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
import { join } from 'upath'
import draggable from 'vuedraggable'
import { ipcRenderer } from 'electron'
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
      items: [] as { id: number; path: string }[],
    }
  },
  computed: {
    date(): string {
      return this.$route.query.date as string
    },
  },
  mounted() {
    this.items = this.$findAll([
      join(this.$mediaPath(), this.date, '*'),
      join(this.$mediaPath(), 'Recurring', '*'),
    ]).map((path, i) => {
      return { id: i, path }
    })
    this.loading = false
  },
  beforeDestroy() {},
  methods: {
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
