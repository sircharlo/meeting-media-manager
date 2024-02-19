<!-- Cong toggle forced prefs modal -->
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
    <loading-icon v-if="loading" />
    <v-row v-else class="mb-10 justify-space-around">
      <v-col
        v-for="item in forcable"
        :key="item.key"
        cols="12"
        md="5"
        lg="4"
        class="pl-8 py-2"
      >
        <v-switch
          v-model="item.forced"
          hide-details="auto"
          class="my-0 py-0"
          @change="change = true"
        >
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
              {{ item.value === null ? 'null' : item.value }}
            </v-chip>
          </template>
        </v-switch>
      </v-col>
    </v-row>
    <v-footer fixed style="justify-content: right">
      <v-btn color="primary" :disabled="loading" @click="updatePrefs()">
        <font-awesome-icon :icon="faCheck" size="xl" />
      </v-btn>
    </v-footer>
  </v-card>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { join } from 'upath'
import { WebDAVClient } from 'webdav/dist/web/types'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { FORCABLE } = require('~/constants/prefs') as { FORCABLE: string[] }
export default defineComponent({
  data() {
    return {
      change: false,
      loading: true,
      forcable: [] as {
        key: string
        value: unknown
        forced: boolean
        description: string
      }[],
    }
  },
  computed: {
    faCheck() {
      return faCheck
    },
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
        if (ob[i] === undefined) continue

        if (typeof ob[i] === 'object' && ob[i] !== null) {
          const flatObject = this.flattenObject(ob[i])
          for (const x in flatObject) {
            if (flatObject[x] === undefined) continue

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
        case 'app.obs.imageScene':
          return `obs${lastKey.charAt(0).toUpperCase() + lastKey.slice(1)}`
        case 'app.zoom.enable':
          return 'enableZoom'
        case 'app.zoom.autoStartMeeting':
        case 'app.zoom.autoStartTime':
        case 'app.zoom.autoRename':
        case 'app.zoom.hideComponent':
        case 'app.zoom.id':
        case 'app.zoom.name':
        case 'app.zoom.spotlight':
          return `zoom${lastKey.charAt(0).toUpperCase() + lastKey.slice(1)}`
        case 'media.autoPlayFirstTime':
          return 'minutesBeforeMeeting'
        case 'media.enableMp4Conversion':
          return 'convertDownloaded'
        case 'media.lang':
          return 'mediaLang'
        case 'media.langSubs':
          return 'subsLang'
        case 'media.langFallback':
          return 'mediaLangFallback'
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
      // If nothing changed, just close the modal
      if (!this.change) {
        this.$emit('done')
        return
      }
      this.loading = true
      const forcedPrefs = {} as any

      try {
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

        // Update forcedPrefs.json
        this.$log.debug('prefs', JSON.stringify(forcedPrefs))
        await this.client.putFileContents(
          join(this.$getPrefs('cong.dir'), 'forcedPrefs.json'),
          JSON.stringify(forcedPrefs, null, 2)
        )
        await this.$forcePrefs(true)
      } catch (e: unknown) {
        this.$error(
          'errorForcedSettingsEnforce',
          e,
          join(this.$getPrefs('cong.dir'), 'forcedPrefs.json')
        )
      } finally {
        this.loading = false
        this.$emit('done')
      }
    },
  },
})
</script>
