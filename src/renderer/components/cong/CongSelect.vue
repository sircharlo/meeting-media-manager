<!-- Select a congregation on startup -->
<template>
  <v-container fluid fill-height class="align-start">
    <v-row justify="start" align="start">
      <v-col cols="12" class="text-center">
        <font-awesome-icon :icon="faBuildingUser" size="2xl" />
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
import { faBuildingUser } from '@fortawesome/free-solid-svg-icons'
import { basename } from 'upath'
import { defineComponent } from 'vue'
import { ipcRenderer } from 'electron'
export default defineComponent({
  data() {
    return {
      congs: [] as { name: string | null; path: string; filename: string }[],
    }
  },
  computed: {
    faBuildingUser() {
      return faBuildingUser
    },
  },
  async mounted() {
    this.$vuetify.theme.dark = await ipcRenderer.invoke('darkMode')
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
