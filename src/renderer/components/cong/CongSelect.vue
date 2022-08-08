<template>
  <v-container fluid fill-height class="align-start">
    <v-row justify="start" align="start">
      <v-col cols="12" class="text-center">
        <v-icon x-large>fas fa-2x fa-building-user</v-icon>
      </v-col>
      <v-col cols="12">
        <v-divider />
      </v-col>
      <v-col cols="12">
        <v-list>
          <v-list-item
            v-for="cong in congs"
            :key="cong.filename"
            @click="$emit('selected', cong.filename)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ cong.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>
<script lang="ts">
import { basename } from 'upath'
import Vue from 'vue'
export default Vue.extend({
  data() {
    return {
      congs: [] as { name: string | null; path: string; filename: string }[],
    }
  },
  async mounted() {
    this.congs = (await this.$getCongPrefs()).map((c) => {
      return {
        name: c.name,
        path: c.path,
        filename: basename(c.path, '.json'),
      }
    })
  },
  methods: {},
})
</script>
