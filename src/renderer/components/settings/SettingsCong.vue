<template>
  <v-form
    ref="form"
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
      v-model="cong.server"
      :label="$t('hostname')"
      prefix="https://"
      :rules="[!complete || error !== 'host']"
    />
    <!--<form-input v-model="cong.port" :label="$t('port')" />-->
    <form-input
      v-model="cong.user"
      :label="$t('username')"
      :required="!!cong.server"
      :rules="[!complete || error !== 'credentials']"
    />
    <form-input
      v-model="cong.password"
      field="password"
      :label="$t('password')"
      :required="!!cong.server"
      :rules="[!complete || error !== 'credentials']"
    />
    <form-input
      v-model="cong.dir"
      :label="$t('webdavFolder')"
      :required="!!cong.server"
      :rules="[!complete || error !== 'dir']"
    />
    <v-col v-if="client" cols="12" class="d-flex px-0">
      <v-col class="text-left pl-0" align-self="center">
        {{ $t('settingsLocked') }}
      </v-col>
      <v-col class="text-right pr-0">
        <v-btn color="primary" @click="setPrefs = true">
          <font-awesome-icon :icon="faCog" size="lg" />
        </v-btn>
      </v-col>
    </v-col>
    <cong-dir-list v-if="client" :contents="contents" @open="openDir($event)" />
    <v-btn
      :color="error === 'success' ? 'success' : 'primary'"
      class="float-right"
      :loading="loading"
      @click="submit()"
    >
      <font-awesome-icon :icon="faGlobe" size="lg" />
    </v-btn>
  </v-form>
</template>
<script lang="ts">
import Vue from 'vue'
import { faCog, faGlobe } from '@fortawesome/free-solid-svg-icons'
import { WebDAVClient } from 'webdav'
import { CongFile, CongPrefs, ElectronStore } from '~/types'
const { PREFS } = require('~/constants/prefs') as { PREFS: ElectronStore }
export default Vue.extend({
  data() {
    return {
      setPrefs: false,
      valid: true,
      loading: false,
      error: '',
      cong: {
        ...PREFS.cong,
      } as CongPrefs,
      hosts: [
        {
          name: '4shared',
          server: 'webdav.4shared.com',
          port: '443',
          dir: '/',
        },
        {
          name: 'Box',
          server: 'webdav.box.com',
          port: '443',
          dir: '/dav/',
        },
        {
          name: 'Koofr',
          server: 'app.koofr.net',
          port: '443',
          dir: '/dav/Koofr/',
        },
        {
          name: 'PowerFolder',
          server: 'my.powerfolder.com',
          port: '443',
          dir: '/webdav/',
        },
      ],
    }
  },
  computed: {
    faGlobe() {
      return faGlobe
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
    valid(val) {
      this.$emit('valid', val)
    },
    complete(val) {
      if (!val) {
        this.error = ''
        this.$store.commit('cong/clear')
      }
    },
    cong: {
      handler(val) {
        this.$setPrefs('cong', val)
      },
      deep: true,
    },
  },
  async mounted() {
    Object.assign(this.cong, this.$getPrefs('cong'))
    ;(this.$refs.form as HTMLFormElement).validate()

    // If all the cong fields are filled in, try to connect
    if (this.complete) {
      await this.submit()
      if (this.client) {
        this.$updateContentsTree()
      }
    }
  },
  methods: {
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
    setHost(host: CongPrefs) {
      this.cong.server = host.server
      this.cong.port = host.port
      this.cong.dir = host.dir
    },
  },
})
</script>
