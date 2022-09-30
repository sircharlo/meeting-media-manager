<template>
  <v-row justify="center" class="fill-height mb-0">
    <v-col cols="12" class="text-center" style="margin-bottom: 72px">
      <v-tabs v-model="tab" grow>
        <v-tab>{{ $t('all') }}</v-tab>
        <v-tab
          v-for="h in headers"
          :key="h.component"
          :class="{ 'error--text': !h.valid }"
        >
          {{ getInitials(h.name) }}
        </v-tab>
      </v-tabs>
      <v-expansion-panels
        v-model="panel"
        multiple
        focusable
        accordion
        :readonly="tab !== 0"
      >
        <v-expansion-panel
          v-for="(header, i) in headers"
          v-show="tab === 0 || tab === i + 1"
          :key="header.component"
        >
          <v-expansion-panel-header>
            {{ header.name }}
          </v-expansion-panel-header>
          <v-expansion-panel-content class="pt-4">
            <component
              :is="header.component"
              @valid="setValid(header.component, $event)"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
    <v-footer fixed class="justify-space-between">
      <v-col cols="12" align-self="end" class="d-flex">
        <v-col class="d-flex pa-0 align-center" align-self="center">
          <v-btn
            small
            :color="updateSuccess ? undefined : 'error'"
            :class="{ 'mr-2': true, 'pulse-danger': !updateSuccess }"
            @click="openReleases()"
          >
            <font-awesome-icon
              v-if="!updateSuccess"
              :icon="faHandPointRight"
              class="mr-1"
            />
            M³ {{ $config.isDev ? 'dev' : $config.version }}
          </v-btn>
          <v-btn small class="mr-2" @click="report()">
            {{ $t('reportIssue') }}
          </v-btn>
          <v-btn
            v-if="cacheColor === 'warning'"
            small
            :color="cacheColor"
            :loading="loading"
            class="black--text"
            @click="removeCache()"
          >
            {{ `${$t('cleanCache')} (${cache}MB)` }}
          </v-btn>
          <v-tooltip v-else top>
            <template #activator="{ on, attrs }">
              <v-btn
                small
                :color="cacheColor"
                :loading="loading"
                class="black--text"
                v-bind="attrs"
                v-on="on"
                @click="removeCache()"
              >
                {{ `${$t('cleanCache')} (${cache}MB)` }}
              </v-btn>
            </template>
            <span>{{ $t('clickAgain') }}</span>
          </v-tooltip>
        </v-col>
        <v-col align-self="end" class="text-right pa-0">
          <icon-btn
            v-if="cancel && isNew && !valid"
            variant="homeVariant"
            @click="goBack()"
          />
          <icon-btn
            v-else
            variant="home"
            :disabled="!valid"
            :style="valid ? undefined : 'color: red !important'"
          />
        </v-col>
      </v-col>
    </v-footer>
  </v-row>
</template>
<script lang="ts">
import { join } from 'upath'
import Vue from 'vue'
import { faHandPointRight } from '@fortawesome/free-solid-svg-icons'
export default Vue.extend({
  name: 'SettingsPage',
  data() {
    return {
      cache: 0,
      tab: 0,
      cancel: false,
      mounted: false,
      cacheColor: 'warning',
      loading: false,
      panel: [0, 1, 2, 3] as number[],
      headers: [
        {
          name: this.$t('optionsApp'),
          component: 'settings-app',
          valid: false,
        },
        {
          name: this.$t('optionsCongSync'),
          component: 'settings-cong',
          valid: false,
        },
        {
          name: this.$t('optionsMedia'),
          component: 'settings-media',
          valid: false,
        },
        {
          name: this.$t('optionsMeetings'),
          component: 'settings-meetings',
          valid: false,
        },
      ] as { name: string; component: string; valid: boolean }[],
    }
  },
  head() {
    return { title: 'Settings' }
  },
  computed: {
    cong(): string {
      return this.$route.query.cong as string
    },
    isNew(): boolean {
      return !!this.$route.query.new
    },
    online() {
      return this.$store.state.stats.online && !this.$getPrefs('app.offline')
    },
    valid(): boolean {
      return this.headers.every(({ valid }) => valid)
    },
    faHandPointRight() {
      return faHandPointRight
    },
    updateSuccess(): boolean {
      return this.$store.state.stats.updateSuccess as boolean
    },
  },
  watch: {
    valid(val: boolean) {
      if (val) this.calcCache()
    },
    tab(val: number) {
      if (this.tab === 0) this.panel = []
      else if (val > 0) {
        if (!this.panel.includes(val - 1)) {
          this.panel.push(val - 1)
        }
      }
    },
    headers: {
      handler() {
        // Open invalid settings and close valid settings on first load
        this.headers.forEach(({ valid }, i) => {
          const match = this.panel.indexOf(i)
          if (!valid && match === -1) {
            this.panel.push(i)
          } else if (!this.mounted && valid && match > -1) {
            this.panel.splice(match, 1)
          }
        })
        this.mounted = this.mounted || this.valid
      },
      deep: true,
    },
  },
  async mounted() {
    let congs = await this.$getCongPrefs()
    congs = congs.filter((c: { name: string; path: string }) => {
      return c.path !== join(this.$appPath(), `prefs-${this.cong}.json`)
    })

    if (congs.length > 0) {
      this.cancel = true
    }

    this.calcCache()
  },
  methods: {
    getInitials(word: string) {
      return word
        .split(' ')
        .map((w) => w[0])
        .join('')
    },
    setValid(component: string, valid: boolean) {
      const header = this.headers.find((h) => h.component === component)
      if (header) header.valid = valid
    },
    goBack() {
      console.debug('Go back')
      this.$removeCong(join(this.$appPath(), `prefs-${this.cong}.json`))
      this.$router.back()
    },
    calcCache(): void {
      if (
        !this.$getPrefs('app.localOutputPath') ||
        !this.$getPrefs('media.lang')
      ) {
        this.cache = 0
        return
      }
      this.cache = parseFloat(
        (
          this.$findAll(
            [join(this.$mediaPath(), '**'), join(this.$pubPath(), '**')],
            {
              ignore: [join(this.$mediaPath(), 'Recurring')],
              stats: true,
            }
          )
            .map((file: any) => file.stats.size)
            .reduce((a: number, b: number) => a + b, 0) /
          1024 /
          1024
        ).toFixed(1)
      )
    },
    async removeCache(): Promise<void> {
      if (this.cacheColor === 'warning') {
        this.cacheColor = 'error'
        setTimeout(() => {
          this.cacheColor = 'warning'
        }, 3000)
      } else {
        this.loading = true
        const folders = []

        if (this.$pubPath()) {
          folders.push(this.$pubPath())
        }

        if (this.$mediaPath()) {
          folders.push(join(this.$mediaPath(), '*'))
        }

        // Remove cache
        this.$rm(
          this.$findAll(folders, {
            ignore: this.$mediaPath()
              ? [join(this.$mediaPath(), 'Recurring')]
              : [],
            onlyDirectories: true,
          })
        )

        // Force refresh jw langs
        if (this.online) {
          await this.$getJWLangs(true)
        }
        this.cacheColor = 'warning'
        this.calcCache()
      }
      this.loading = false
    },
    openReleases() {
      window.open(`${this.$config.repo}/releases/latest`, '_blank')
    },
    report(): void {
      window.open(this.$bugURL(), '_blank')
    },
  },
})
</script>
