<!-- Cong server directory list -->
<template>
  <v-treeview
    v-model="tree"
    :items="contents"
    item-key="filename"
    item-text="basename"
    open-on-click
  >
    <template #prepend="{ item, open }">
      <font-awesome-icon v-if="item.type === 'file'" :icon="faFile" />
      <font-awesome-icon v-else :icon="open ? faFolderOpen : faFolder" />
    </template>
    <template #append="{ item }">
      <v-btn
        v-if="item.type === 'directory'"
        icon
        @click="$emit('open', item.filename)"
      >
        <font-awesome-icon :icon="faArrowRight" />
      </v-btn>
    </template>
  </v-treeview>
</template>
<script lang="ts">
import {
  faFile,
  faFolderOpen,
  faArrowRight,
  faFolder,
} from '@fortawesome/free-solid-svg-icons'
// eslint-disable-next-line import/named
import { defineComponent, PropOptions } from 'vue'
import { CongFile } from '~/types'
export default defineComponent({
  props: {
    contents: {
      type: Array,
      required: true,
    } as PropOptions<CongFile[]>,
  },
  data() {
    return {
      tree: [],
    }
  },
  computed: {
    faFile() {
      return faFile
    },
    faArrowRight() {
      return faArrowRight
    },
    faFolder() {
      return faFolder
    },
    faFolderOpen() {
      return faFolderOpen
    },
  },
})
</script>
