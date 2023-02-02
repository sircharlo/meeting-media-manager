<template>
  <v-col cols="12" class="d-flex pb-0 justify-center">
    <v-col
      v-for="(day, i) in daysOfWeek"
      :key="day.formatted"
      class="text-center flex-shrink-1 px-1 pb-0"
    >
      <v-card
        :color="dayColors[i]"
        class="fill-height d-flex justify-center flex-column"
        @click="openDate(day.formatted)"
      >
        <v-card-text class="pb-0 pt-2">{{ day.first }}</v-card-text>
        <v-card-text class="pt-0 pb-2">{{ day.second }}</v-card-text>
      </v-card>
    </v-col>
    <v-col class="pb-0 px-1">
      <v-card
        class="fill-height d-flex align-center"
        :color="recurringColor"
        @click="openDate('Recurring')"
      >
        <v-card-text class="text-center py-2">
          {{ $t('recurring') }}
        </v-card-text>
      </v-card>
    </v-col>
  </v-col>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Dayjs } from 'dayjs'
import { DAYS_IN_WEEK } from '~/constants/general'
export default defineComponent({
  props: {
    currentWeek: {
      type: Number,
      required: true,
    },
    recurringColor: {
      type: String,
      required: true,
    },
    dayColors: {
      type: Object as PropType<{ [key: number]: string }>,
      required: true,
    },
  },
  computed: {
    now() {
      return (this.$dayjs() as Dayjs).hour(0).minute(0).second(0).millisecond(0)
    },
    baseDate(): Dayjs {
      let y = 0
      if (this.currentWeek < this.$dayjs().isoWeek()) y = 1
      const week = (this.$dayjs() as Dayjs)
        .startOf('week')
        .add(y, 'years')
        .isoWeek(this.currentWeek)
      return week.startOf('week')
    },
    daysOfWeek(): { first: string; second: string; formatted: string }[] {
      const days: { first: string; second: string; formatted: string }[] = []
      for (let i = 0; i < DAYS_IN_WEEK; i++) {
        const day = this.baseDate.add(i, 'days')
        if (day.isBefore(this.now)) continue
        const weekDay = day.day() === 0 ? 6 : day.day() - 1 // Day is 0 indexed and starts with Sunday

        // Add meeting day
        if (
          !this.$getPrefs('meeting.specialCong') &&
          (weekDay === this.$getMwDay(this.baseDate) ||
            weekDay === this.$getPrefs('meeting.weDay'))
        ) {
          days.push({
            first: day.format('D MMM'),
            second: day.format('dddd'),
            formatted: day.format(
              this.$getPrefs('app.outputFolderDateFormat') as string
            ),
          })
        }
        // Add normal day
        else {
          days.push({
            first: day.format('D'),
            second: day.format('dd.'),
            formatted: day.format(
              this.$getPrefs('app.outputFolderDateFormat') as string
            ),
          })
        }
      }
      return days
    },
  },
  methods: {
    openDate(date: string) {
      console.debug('Manage specific day')
      this.$router.push({
        path: this.localePath('/manage'),
        query: { ...this.$route.query, date },
      })
    },
  },
})
</script>
