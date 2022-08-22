<template>
  <v-row justify="center" class="fill-height mb-0">
    <v-col cols="12" class="text-center">
      <v-expansion-panels v-model="panel" multiple>
        <v-expansion-panel
          v-for="(header, i) in headers"
          :key="header.component"
        >
          <v-expansion-panel-header>
            {{ header.name }}
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <component
              :is="header.component"
              @valid="headers[i].valid = $event"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
    <v-col cols="12" align-self="end" class="d-flex">
      <v-col class="d-flex pa-0" align-self="center">
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
          small
          :color="cacheColor"
          :loading="loading"
          class="black--text"
          @click="removeCache()"
        >
          {{ `${$t('cleanCache')} (${cache}MB)` }}
        </v-btn>
      </v-col>
      <v-col align-self="end" class="text-right pa-0">
        <icon-btn variant="home" :disabled="!valid" />
      </v-col>
    </v-col>
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
      cacheColor: 'warning',
      loading: false,
      panel: [] as number[],
      headers: [
        {
          name: this.$t('optionsApp'),
          component: 'settings-app',
          valid: true,
        },
        {
          name: this.$t('optionsCongSync'),
          component: 'settings-cong',
          valid: true,
        },
        {
          name: this.$t('optionsMedia'),
          component: 'settings-media',
          valid: true,
        },
        {
          name: this.$t('optionsMeetings'),
          component: 'settings-meetings',
          valid: true,
        },
      ],
    }
  },
  head() {
    return { title: 'Settings' }
  },
  computed: {
    cong(): string {
      return this.$route.query.cong
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
    valid(val) {
      if (val) this.calcCache()
    },
  },
  mounted() {
    if (!this.$getPrefs('app.congregationName')) {
      this.panel = [0, 2, 3]
    } else {
      this.calcCache()
    }
  },
  methods: {
    calcCache(): void {
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
        this.$rm(
          this.$findAll([join(this.$mediaPath(), '*'), this.$pubPath()], {
            ignore: [join(this.$mediaPath(), 'Recurring')],
            onlyDirectories: true,
          })
        )
        await this.$getJWLangs(true)
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
