<template>
  <v-form
    ref="congForm"
    v-model="valid"
    class="text-left"
    @submit.prevent="submit()"
  >
    <v-dialog v-if="setPrefs" :value="true" fullscreen hide-overlay>
      <cong-forced-prefs @done="setPrefs = false" />
    </v-dialog>
    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn color="primary" v-bind="attrs" class="mb-4" v-on="on">
          {{ $t('hostname') }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(host, index) in hosts"
          :key="index"
          @click="setHost(host)"
        >
          <v-list-item-title>{{ host.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <form-input
      id="cong.server"
      v-model="cong.server"
      :label="$t('hostname')"
      prefix="https://"
      :rules="[!complete || error !== 'host' || !online]"
      @blur="submit()"
      @keydown.enter.prevent="submit()"
    />
    <!--<form-input v-model="cong.port" :label="$t('port')" />-->
    <form-input
      id="cong.user"
      v-model="cong.user"
      :label="$t('username')"
      :required="!!cong.server"
      :rules="[!complete || error !== 'credentials']"
      @blur="submit()"
      @keydown.enter.prevent="submit()"
    />
    <form-input
      id="cong.password"
      v-model="cong.password"
      field="password"
      :label="$t('password')"
      :required="!!cong.server"
      :rules="[!complete || error !== 'credentials']"
      @blur="submit()"
      @keydown.enter.prevent="submit()"
    />
    <v-col class="d-flex pa-0 pb-2 align-center">
      <form-input
        id="cong.dir"
        v-model="cong.dir"
        :label="$t('webdavFolder')"
        :required="!!cong.server"
        :rules="[!complete || error !== 'dir']"
        hide-details="auto"
        @blur="submit()"
        @keydown.enter.prevent="submit()"
      />
      <v-btn
        class="ml-2"
        :color="
          online ? (error === 'success' ? 'success' : 'primary') : 'warning'
        "
        :loading="loading"
        :disabled="!complete"
        @click="submit()"
      >
        <font-awesome-icon :icon="faGlobe" size="lg" />
      </v-btn>
    </v-col>
    <template v-if="client">
      <v-btn v-if="cong.dir !== '/'" class="mb-2" @click="moveDirUp()">
        {{ $t('webdavFolderUp') }}
      </v-btn>
      <cong-dir-list :contents="contents" @open="openDir($event)" />
      <v-col cols="12" class="d-flex px-0">
        <v-col class="text-left pl-0" align-self="center">
          {{ $t('settingsLocked') }}
        </v-col>
        <v-col class="text-right pr-0">
          <v-btn color="primary" @click="setPrefs = true">
            <font-awesome-icon :icon="faCog" size="lg" />
          </v-btn>
        </v-col>
      </v-col>
    </template>
  </v-form>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { faCog, faGlobe } from '@fortawesome/free-solid-svg-icons'
import { WebDAVClient } from 'webdav/dist/web/types'
import { CongFile, CongPrefs, ElectronStore, Host } from '~/types'
const { PREFS } = require('~/constants/prefs') as { PREFS: ElectronStore }
const { HOSTS } = require('~/constants/cong') as { HOSTS: Host[] }
export default defineComponent({
  data() {
    return {
      setPrefs: false,
      valid: true,
      loading: false,
      error: '',
      cong: {
        ...PREFS.cong,
      } as CongPrefs,
      hosts: HOSTS,
    }
  },
  computed: {
    faGlobe() {
      return faGlobe
    },
    online(): boolean {
      return this.$store.state.stats.online && this.error !== 'offline'
    },
    faCog() {
      return faCog
    },
    client(): WebDAVClient {
      return this.$store.state.cong.client as WebDAVClient
    },
    contents(): CongFile[] {
      return this.$store.state.cong.contentsTree as CongFile[]
    },
    complete(): boolean {
      return !!(
        this.cong.server &&
        this.cong.user &&
        this.cong.password &&
        this.cong.dir
      )
    },
  },
  watch: {
    valid(val: boolean) {
      this.$emit('valid', val)
    },
    complete(val: boolean) {
      if (!val) {
        this.error = ''
        this.$store.commit('cong/clear')
      }
    },
    cong: {
      handler(val: CongPrefs) {
        this.$setPrefs('cong', val)
      },
      deep: true,
    },
  },
  async mounted() {
    Object.assign(this.cong, this.$getPrefs('cong'))
    this.$emit('valid', this.valid)

    if (this.$refs.congForm) {
      // @ts-ignore
      this.$refs.congForm.validate()
    }

    // If all the cong fields are filled in, try to connect
    if (this.complete && this.online) {
      await this.submit()
      if (this.client) {
        this.$updateContentsTree()
      }
    }
  },
  methods: {
    async moveDirUp() {
      if (!this.cong.dir) return
      if (this.cong.dir.endsWith('/')) {
        this.cong.dir =
          this.cong.dir.substring(
            0,
            this.cong.dir.slice(0, -1).lastIndexOf('/') + 1
          ) || '/'
      } else {
        this.cong.dir =
          this.cong.dir.substring(0, this.cong.dir.lastIndexOf('/')) || '/'
      }

      await this.submit()
    },
    async submit() {
      if (this.complete) {
        this.loading = true
        this.error = (await this.$connect(
          this.cong.server as string,
          this.cong.user as string,
          this.cong.password as string,
          this.cong.dir as string
        )) as string
        if (this.client) {
          this.$updateContentsTree()
          this.$forcePrefs()
        }
        this.loading = false
      }
    },
    async openDir(dir: string) {
      this.cong.dir = dir
      await this.$updateContent()
      this.$updateContentsTree()
    },
    setHost(host: Host) {
      this.cong.server = host.server
      this.cong.port = host.port
      this.cong.dir = host.dir
    },
  },
})
</script>
