<template>
  <v-row justify="start" align="start">
    <v-col cols="12" class="text-center">
      <h2>{{ $t('meeting') }}</h2>
    </v-col>
    <v-col cols="12">
      <v-divider />
    </v-col>
    <v-col cols="12">
      <v-list>
        <template v-for="(date, i) in dates">
          <v-list-item
            :key="date"
            class="text-center"
            @click="selectDate(date)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ date }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider :key="i" />
        </template>
      </v-list>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { join, basename } from 'upath'
import Vue from 'vue'
export default Vue.extend({
  data() {
    return {
      dates: [] as string[],
    }
  },
  mounted() {
    this.dates = this.$findAll(join(this.$mediaPath(), '*'), {
      onlyDirectories: true,
      ignore: [join(this.$mediaPath(), 'Recurring')],
    }).map((date) => basename(date))
  },
  methods: {
    selectDate(date: string) {
      this.$router.push({
        query: {
          ...this.$route.query,
          date,
        },
      })
    },
  },
})
</script>
