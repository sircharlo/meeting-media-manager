<template>
  <v-treeview
    v-model="tree"
    :items="contents"
    item-key="filename"
    item-text="basename"
    open-on-click
  >
    <template #prepend="{ item, open }">
      <v-icon v-if="item.type === 'file'"> fa-solid fa-file </v-icon>
      <v-icon v-else>
        {{ open ? 'fa-solid fa-folder-open' : 'fa-solid fa-folder' }}
      </v-icon>
    </template>
  </v-treeview>
</template>
<script lang="ts">
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
})
</script>
