<template>
  <v-dialog
    ref="dialog"
    v-model="dialog"
    :return-value.sync="$attrs.value"
    width="290px"
  >
    <template #activator="{ on, attrs }">
      <form-input
        :id="id ? id + '-field' : 'datepicker-field'"
        ref="field"
        v-model="formattedDate"
        :label="label"
        readonly
        clearable
        :locked="locked"
        :dense="false"
        v-bind="{ ...attrs, ...$attrs }"
        append-outer
        hide-details
        @click:clear="
          $emit('input', null)
          $refs.dialog.save(null)
        "
        v-on="on"
      >
        <template v-if="!locked" #append>
          <font-awesome-icon :icon="faCalendar" style="margin-top: 2px" />
        </template>
      </form-input>
    </template>
    <v-date-picker
      v-if="dialog"
      :id="id ? id + '-picker' : 'datepicker'"
      ref="field"
      v-model="$attrs.value"
      full-width
      :locale="locale"
      :first-day-of-week="$getFirstDayOfWeek($dayjs.locale())"
      :allowed-dates="allowedDates"
      :min="min ? min : undefined"
      @change="
        $emit('input', $event)
        $refs.dialog.save($attrs.value)
      "
    />
  </v-dialog>
</template>
<script>
import { defineComponent } from 'vue'
import { faCalendar } from '@fortawesome/free-regular-svg-icons'
export default defineComponent({
  props: {
    id: {
      type: String,
      default: null,
    },
    label: {
      type: String,
      required: true,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    min: {
      type: String,
      default: null,
    },
    format: {
      type: String,
      default: 'YYYY-MM-DD',
    },
    allowedDates: {
      type: Function,
      default: null,
    },
  },
  data() {
    return {
      dialog: false,
    }
  },
  computed: {
    faCalendar() {
      return faCalendar
    },
    formattedDate() {
      const date = this.$dayjs(this.$attrs.value, 'YYYY-MM-DD')
      return date.isValid() ? date.format(this.format) : null
    },
    locale() {
      return this.$i18n.localeProperties.iso.toLowerCase()
    },
  },
})
</script>
