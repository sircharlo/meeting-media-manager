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
  </v-treeview>
</template>
<script lang="ts">
import {
  faFile,
  faFolderOpen,
  faFolder,
} from '@fortawesome/free-solid-svg-icons'
import Vue from 'vue'
export default Vue.extend({
  props: {
    contents: {
      type: Array,
      required: true,
    },
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
    faFolder() {
      return faFolder
    },
    faFolderOpen() {
      return faFolderOpen
    },
  },
})
</script>
