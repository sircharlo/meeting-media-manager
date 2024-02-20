<template>
  <v-dialog
    ref="dialog"
    v-model="dialog"
    :return-value.sync="$attrs.value"
    width="290px"
  >
    <template #activator="{ on, attrs }">
      <form-input
        :id="id ? id + '-field' : 'timepicker-field'"
        ref="field"
        v-model="$attrs.value"
        :label="label"
        readonly
        :locked="locked"
        :dense="false"
        v-bind="{ ...attrs, ...$attrs }"
        hide-details
        style="min-width: 85px; max-width: 85px"
        v-on="on"
      >
        <template v-if="!locked" #append>
          <font-awesome-icon :icon="faClock" style="margin-top: 2px" />
        </template>
      </form-input>
    </template>
    <v-time-picker
      v-if="dialog"
      :id="id ? id + '-picker' : 'timepicker'"
      ref="field"
      v-model="$attrs.value"
      full-width
      :use-seconds="useSeconds"
      format="24hr"
      @click:minute="$emit('input', $attrs.value);$refs.dialog.save($attrs.value)"
      @change="$emit('input', $event)"
    />
  </v-dialog>
</template>
<script>
import { defineComponent } from 'vue'
import { faClock } from '@fortawesome/free-regular-svg-icons'
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
    useSeconds: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dialog: false,
    }
  },
  computed: {
    faClock() {
      return faClock
    },
  },
})
</script>
