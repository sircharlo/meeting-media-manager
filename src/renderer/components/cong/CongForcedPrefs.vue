<template>
  <v-card class="d-flex flex-column">
    <v-card-title class="justify-center">
      {{ $t('settingsLocked') }}
    </v-card-title>
    <v-col cols="12">
      <v-divider />
    </v-col>
    <v-card-text>
      {{ $t('settingsLockedWhoAreYou') }}
    </v-card-text>
    <v-card-text>
      {{ $t('settingsLockedExplain') }}
    </v-card-text>
    <loading v-if="loading" />
    <v-row v-else class="mb-10 justify-space-around">
      <v-col
        v-for="item in forcable"
        :key="item.key"
        cols="12"
        md="5"
        lg="4"
        class="pl-8 py-2"
      >
        <v-switch v-model="item.forced" hide-details="auto" class="my-0 py-0">
          <template #label>
            <v-tooltip top>
              <template #activator="{ attrs, on }">
                <span v-bind="attrs" v-on="on">
                  <v-chip color="info">{{ item.key }}</v-chip>
                </span>
              </template>
              <span>{{ $t(item.description) }}</span>
            </v-tooltip>
            <v-chip>
              {{ item.value ? item.value : 'null' }}
            </v-chip>
          </template>
        </v-switch>
      </v-col>
    </v-row>
    <v-footer fixed style="justify-content: right">
      <v-btn color="primary" @click="updatePrefs()">
        <v-icon>fas fa-fw fa-check</v-icon>
      </v-btn>
    </v-footer>
  </v-card>
</template>
<script lang="ts">
import Vue from 'vue'
import { join } from 'upath'
import { WebDAVClient } from 'webdav/web'
const { FORCABLE } = require('~/constants/prefs') as { FORCABLE: string[] }
export default Vue.extend({
  data() {
    return {
      loading: true,
      forcable: [] as { key: string; value: any; forced: boolean }[],
    }
  },
  computed: {
    client() {
      return this.$store.state.cong.client as WebDAVClient
    },
    forced(): any {
      return this.flattenObject(this.$store.state.cong.prefs)
    },
  },
  mounted() {
    this.forcable = [
      ...FORCABLE.map((key) => {
        return {
          key,
          value: this.$getPrefs(key),
          forced: this.forced[key] !== undefined,
          description: this.getDescription(key),
        }
      }),
    ]
    this.loading = false
  },
  methods: {
    flattenObject(ob: any) {
      const toReturn = {} as any

      for (const i in ob) {
        if (!ob[i]) continue

        if (typeof ob[i] === 'object' && ob[i] !== null) {
          const flatObject = this.flattenObject(ob[i])
          for (const x in flatObject) {
            if (!flatObject[x]) continue

            toReturn[i + '.' + x] = flatObject[x]
          }
        } else {
          toReturn[i] = ob[i]
        }
      }
      return toReturn
    },
    getDescription(key: string) {
      const lastKey = key.split('.').pop() as string
      switch (key) {
        case 'app.obs.enable':
          return 'enableObs'
        case 'app.obs.cameraScene':
        case 'app.obs.mediaScene':
          return `obs${lastKey.charAt(0).toUpperCase() + lastKey.slice(1)}`
        case 'media.enableMp4Conversion':
          return 'convertDownloaded'
        case 'media.lang':
          return 'mediaLang'
        case 'meeting.enableMusicFadeOut':
        case 'meeting.musicFadeOutTime':
          return 'musicFadeOutType'
        case 'meeting.mwDay':
        case 'meeting.mwStartTime':
        case 'meeting.weDay':
        case 'meeting.weStartTime':
          return lastKey.substring(0, 2) + 'MeetingDay'
        default:
          return lastKey
      }
    },
    async updatePrefs() {
      this.loading = true
      const forcedPrefs = {} as any
      this.forcable
        .filter(({ forced }) => forced)
        .forEach((pref) => {
          const keys = pref.key.split('.')
          if (!forcedPrefs[keys[0]]) {
            forcedPrefs[keys[0]] = {}
          }

          if (keys.length === 2) {
            forcedPrefs[keys[0]][keys[1]] = pref.value
          } else if (keys.length === 3) {
            if (!forcedPrefs[keys[0]][keys[1]]) {
              forcedPrefs[keys[0]][keys[1]] = {}
            }
            forcedPrefs[keys[0]][keys[1]][keys[2]] = pref.value
          }
        })
      await this.client.putFileContents(
        join(this.$getPrefs('cong.dir'), 'forcedPrefs.json'),
        JSON.stringify(forcedPrefs, null, 2)
      )
      await this.$forcePrefs()
      this.loading = false
      this.$emit('done')
    },
  },
})
</script>
