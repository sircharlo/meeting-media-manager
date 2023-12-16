<template>
  <v-col class="d-flex pa-0">
    <v-col v-show="!disableHours" cols="2" class="pa-0">
      <v-otp-input
        id="input-hours"
        ref="hours"
        v-model="hours"
        type="number"
        length="2"
        dense
        plain
        :rules="[(v) => validHours]"
        :disabled="disableHours"
        @change="handleChange"
        @finish="focus($refs.mins)"
      />
    </v-col>
    <v-col
      v-if="!disableHours"
      cols="auto"
      class="py-0 px-1 d-flex align-center justify-center"
    >
      <span>:</span>
    </v-col>
    <v-col cols="2" class="pa-0">
      <v-otp-input
        id="input-minutes"
        ref="minutes"
        v-model="minutes"
        type="number"
        length="2"
        dense
        plain
        :rules="[(v) => validMinutes]"
        @change="handleChange"
        @finish="focus($refs.seconds)"
      />
    </v-col>
    <v-col cols="auto" class="py-0 px-1 d-flex align-center justify-center">
      <span>:</span>
    </v-col>
    <v-col cols="2" class="pa-0">
      <v-otp-input
        id="input-seconds"
        ref="seconds"
        v-model="seconds"
        type="number"
        length="2"
        dense
        plain
        :rules="[(v) => validSeconds]"
        @change="handleChange"
        @finish="focus($refs.ms)"
      />
    </v-col>
    <v-col cols="auto" class="py-0 px-1 d-flex align-center justify-center">
      <span>.</span>
    </v-col>
    <v-col cols="3" class="pa-0">
      <v-otp-input
        id="input-ms"
        ref="ms"
        v-model="ms"
        type="number"
        length="3"
        dense
        plain
        :rules="[(v) => validMs]"
        @change="handleChange"
      />
    </v-col>
    <v-col class="pa-0">
      <slot />
    </v-col>
  </v-col>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    value: {
      type: String,
      default: '',
    },
    min: {
      type: String,
      default: '',
    },
    max: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      hours: '',
      minutes: '',
      seconds: '',
      ms: '',
    }
  },
  computed: {
    disableHours(): boolean {
      return (this.hours === '0' || this.hours === '00') && this.maxHours === 0
    },
    validHours(): boolean {
      return +this.hours >= this.minHours && +this.hours <= this.maxHours
    },
    validMinutes(): boolean {
      return (
        +this.minutes >= this.minMinutes && +this.minutes <= this.maxMinutes
      )
    },
    validSeconds(): boolean {
      return (
        +this.seconds >= this.minSeconds && +this.seconds <= this.maxSeconds
      )
    },
    validMs(): boolean {
      return +this.ms >= this.minMs && +this.ms <= this.maxMs
    },
    maxHours(): number {
      const MAX = 99
      return this.isTimestamp(this.max) ? this.getHours(this.max) : MAX
    },
    maxMinutes(): number {
      const MAX = 99
      if (+this.hours < this.maxHours) return MAX
      return this.isTimestamp(this.max) ? this.getMinutes(this.max) : MAX
    },
    maxSeconds(): number {
      const MAX = 99
      if (+this.minutes < this.maxMinutes) return MAX
      return this.isTimestamp(this.max) ? this.getSeconds(this.max) : MAX
    },
    maxMs(): number {
      const MAX = 9999
      if (+this.seconds < this.maxSeconds) return MAX
      return this.isTimestamp(this.max) ? this.getMs(this.max) : MAX
    },
    minHours(): number {
      return this.isTimestamp(this.min) ? this.getHours(this.min) : 0
    },
    minMinutes(): number {
      if (+this.hours > this.minHours) return 0
      return this.isTimestamp(this.min) ? this.getMinutes(this.min) : 0
    },
    minSeconds(): number {
      if (+this.minutes > this.minMinutes) return 0
      return this.isTimestamp(this.min) ? this.getSeconds(this.min) : 0
    },
    minMs(): number {
      if (+this.seconds > this.minSeconds) return 0
      return this.isTimestamp(this.min) ? this.getMs(this.min) : 0
    },
    valid(): boolean {
      return (
        this.validHours &&
        this.validMinutes &&
        this.validSeconds &&
        this.validMs
      )
    },
  },
  watch: {
    value(val: string) {
      this.setValue(val || '')
    },
    valid(val: boolean) {
      this.$emit('valid', val)
    },
  },
  mounted() {
    this.setValue(this.value || '')
    this.handleChange()
    this.$emit('valid', this.valid)
  },
  methods: {
    focus(ref: any) {
      if (ref) {
        ref.focus()
      }
    },
    isTimestamp(val: string) {
      return val && /\d{2}:\d{2}:\d{2}.\d{3}/.test(val)
    },
    getHours(val: string) {
      return Number(val?.split(':')[0] || '0')
    },
    getMinutes(val: string) {
      return Number(val?.split(':')[1] || '0')
    },
    getSeconds(val: string) {
      return Number(val?.split(':')[2]?.split('.')[0] || '0')
    },
    getMs(val: string) {
      return Number(val?.split(':')[2]?.split('.')[1] || '0')
    },
    setValue(val: string) {
      if (this.isTimestamp(val)) {
        const [hours, minutes, seconds] = val.split(':')
        this.hours = hours
        this.minutes = minutes
        this.seconds = seconds.split('.')[0]
        this.ms = seconds.split('.')[1]
      } else {
        this.resetValue()
        this.handleChange()
      }
    },
    resetValue() {
      this.hours = ''
      this.minutes = ''
      this.seconds = ''
      this.ms = ''
    },
    handleChange() {
      const val = `${this.hours.toString().padStart(2, '0')}:${this.minutes
        .toString()
        .padStart(2, '0')}:${this.seconds.toString().padStart(2, '0')}.${this.ms
        .toString()
        .padStart(3, '0')}`
      this.$emit('input', val)
    },
  },
})
</script>
