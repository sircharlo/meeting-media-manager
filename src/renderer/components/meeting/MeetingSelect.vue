<!-- Select a date to present -->
<template>
  <v-row justify="start" align="start">
    <v-col cols="12" class="text-center">
      <h2>{{ $t('meeting') }}</h2>
    </v-col>
    <v-col cols="12">
      <v-divider />
    </v-col>
    <v-col cols="12">
      <v-list
        v-if="dates.length > 0"
        :style="`
        width: 100%;
        overflow-y: auto;
        ${listHeight}
      `"
      >
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
      <p v-else>{{ $t('noMeetings') }}</p>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { join, basename } from 'upath'
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    firstChoice: {
      type: Boolean,
      default: true,
    },
    windowHeight: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      dates: [] as string[],
    }
  },
  computed: {
    today(): string {
      return this.$dayjs().format(
        this.$getPrefs('app.outputFolderDateFormat') as string
      )
    },
    listHeight(): string {
      const OTHER_ELEMENTS = 181
      return `max-height: ${this.windowHeight - OTHER_ELEMENTS}px`
    },
  },
  mounted() {
    const mediaPath = this.$mediaPath()
    if (!mediaPath) {
      this.$router.push({
        path: this.localePath('/settings'),
        query: this.$route.query,
      })
      return
    }
    this.dates = this.$findAll(join(mediaPath, '*'), {
      onlyDirectories: true,
      ignore: [join(mediaPath, 'Recurring')],
    })
      .map((date) => basename(date))
      .filter(
        (date) =>
          this.validDate(date) &&
          this.$findAll(join(mediaPath, date, '*.!(title|vtt|json)')).length > 0
      )

    // If the user is not trying to change the date he previously selected
    if (this.firstChoice) {
      // Open the only date available
      if (this.dates.length === 1) {
        this.selectDate(this.dates[0])
      }
      // Open todays date
      else if (this.dates.includes(this.today)) {
        this.selectDate(this.today)
      }
    }
  },
  methods: {
    validDate(date: string) {
      return this.$dayjs(
        date,
        this.$getPrefs('app.outputFolderDateFormat') as string
      ).isValid()
    },
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
