<template>
  <form-input
    id="select-song"
    v-model="$attrs.value"
    field="autocomplete"
    :items="songs"
    :label="$t('selectSong')"
    item-text="title"
    item-value="safeName"
    hide-details="auto"
    :loading="loading"
    return-object
    v-bind="$attrs"
    :clearable="$attrs.clearable !== undefined"
    :disabled="$attrs.disabled"
    @change="$emit('input', $event)"
  />
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { VideoFile } from '~/types'
export default defineComponent({
  data() {
    return {
      loading: true,
      songs: [] as VideoFile[],
    }
  },
  mounted() {
    this.getSongs()
  },
  methods: {
    async getSongs() {
      this.loading = true
      this.songs = await this.$getSongs()
      this.loading = false
    },
  },
})
</script>
