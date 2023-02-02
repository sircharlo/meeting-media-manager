<!-- eslint-disable vue/no-unused-vars -->
<template>
  <v-select
    id="cong-select"
    v-model="cong"
    :items="congs"
    item-text="name"
    item-value="path"
    :loading="loading"
    :disabled="$attrs.disabled"
    :label="$t('congregationName')"
    dense
    solo
    @change="changeCong($event)"
  >
    <template #item="{ item }">
      <v-list-item-action v-if="congs.length > 1" class="me-0">
        <font-awesome-icon
          v-if="item.color === 'warning'"
          :icon="faSquareMinus"
          class="warning--text"
          size="xs"
          @click.stop="atCongClick(item)"
        />
        <v-tooltip v-else left :value="true">
          <template #activator="data">
            <font-awesome-icon
              :icon="faSquareMinus"
              class="error--text"
              size="xs"
              @click.stop="atCongClick(item)"
            />
          </template>
          <span>{{ $t('clickAgain') }}</span>
        </v-tooltip>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>{{ item.name }}</v-list-item-title>
      </v-list-item-content>
    </template>
    <template #append-item>
      <v-list-item id="add-cong-option" @click="addCong()">
        <v-list-item-action>
          <font-awesome-icon
            :icon="faSquarePlus"
            class="success--text"
            size="xs"
          />
        </v-list-item-action>
        <v-list-item-content />
      </v-list-item>
    </template>
  </v-select>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { basename } from 'upath'
import { faSquareMinus, faSquarePlus } from '@fortawesome/free-solid-svg-icons'
import { MS_IN_SEC } from '~/constants/general'
export default defineComponent({
  data() {
    return {
      cong: null,
      congs: [] as { name: string; path: string; color: string }[],
      loading: true,
    }
  },
  computed: {
    faSquareMinus() {
      return faSquareMinus
    },
    faSquarePlus() {
      return faSquarePlus
    },
  },
  async mounted() {
    this.loading = true
    this.congs = (await this.$getCongPrefs()).map(
      (cong: { name: string; path: string }) => {
        return {
          name: cong.name,
          path: cong.path,
          color: 'warning',
        }
      }
    )
    this.cong = this.$storePath() as string
    this.loading = false
  },
  methods: {
    addCong() {
      if (this.$store.state.present.mediaScreenInit) {
        this.$toggleMediaWindow('close')
      }
      this.$store.commit('cong/clear')
      this.$store.commit('obs/clear')

      // Create new cong and switch to it
      // eslint-disable-next-line no-magic-numbers
      const id = Math.random().toString(36).substring(2, 15)
      this.$switchCong(join(this.$appPath(), 'prefs-' + id + '.json'))
      console.debug('Create new cong via select')
      this.$router.push({
        path: this.localePath('/settings'),
        query: { cong: id, new: 'true' },
      })
    },
    changeCong(path: string) {
      console.debug('Switched cong via select')
      this.$router.push({
        query: {
          cong: basename(path, '.json').replace('prefs-', ''),
        },
      })
    },
    atCongClick(item: { name: string; path: string; color: string }): void {
      if (item.color === 'warning') {
        item.color = 'error'
        setTimeout(() => {
          item.color = 'warning'
        }, 3 * MS_IN_SEC)
      }
      // Remove current congregation
      else if (this.cong === item.path) {
        this.$removeCong(item.path)

        // Switch to the first other congregation found
        console.debug('Switch to existing cong')
        this.$router.push({
          query: {
            cong: basename(
              this.congs.find((c) => c.path !== item.path)?.path as string,
              '.json'
            ).replace('prefs-', ''),
          },
        })
      } else {
        this.$removeCong(item.path)
        window.location.reload()
      }
    },
  },
})
</script>
