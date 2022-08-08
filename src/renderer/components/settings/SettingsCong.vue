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
          <v-icon>fas fa-fw fa-cog</v-icon>
        </v-btn>
      </v-col>
    </v-col>
    <cong-dir-list v-if="client" :contents="contents" />
    <v-btn
      :color="error === 'success' ? 'success' : 'primary'"
      class="float-right"
      :loading="loading"
      @click="submit()"
    >
      <v-icon>fa-solid fa-globe</v-icon>
    </v-btn>
  </v-form>
</template>
<script lang="ts">
import Vue from 'vue'
import { dirname } from 'upath'
import { FileStat } from 'webdav/web'
import { CongPrefs, ElectronStore } from '~/types'
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
    client() {
      return this.$store.state.cong.client
    },
    contents() {
      const tree: FileStat[] = []
      const root = this.cong.dir
      const contents = [...this.$store.state.cong.contents] as FileStat[]
      const dirs = [...contents.filter(({ type }) => type === 'directory')]
      const files = [...contents.filter(({ type }) => type === 'file')]
      files.forEach((file) => {
        const fileDir = dirname(file.filename)
        if (fileDir === root) {
          tree.push(file)
        } else {
          const dir = dirs.find(({ filename }) => filename === fileDir)
          if (dir) {
            // @ts-ignore
            if (!dir.children) {
              // @ts-ignore
              dir.children = []
            }
            // @ts-ignore
            dir.children.push(file)
          }
        }
      })
      dirs.forEach((dir) => {
        const dirName = dirname(dir.filename)
        if (dirName !== root) {
          const parent = dirs.find(({ filename }) => filename === dirName)
          if (parent) {
            // @ts-ignore
            if (!parent.children) {
              // @ts-ignore
              parent.children = []
            }
            // @ts-ignore
            parent.children.push(dir)
          }
        }
      })
      dirs
        .filter(({ filename }) => dirname(filename) === root)
        .forEach((dir) => {
          tree.push(dir)
        })
      return tree
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
    // @ts-ignore
    this.$refs.form.validate()
    if (this.complete) {
      await this.submit()
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
        this.loading = false
      }
    },
    setHost(host: CongPrefs) {
      Object.assign(this.cong, host)
    },
  },
})
</script>
