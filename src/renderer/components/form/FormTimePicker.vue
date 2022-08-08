<template>
  <v-menu
    ref="menu"
    v-model="menu"
    attach
    :close-on-content-click="false"
    :nudge-left="160"
    :return-value.sync="$attrs.value"
    transition="scale-transition"
    offset-y
    top
    max-width="290px"
    min-width="290px"
  >
    <template #activator="{ on, attrs }">
      <form-input
        id="timepicker-field"
        ref="field"
        v-model="$attrs.value"
        :label="label"
        :prepend-icon="locked ? undefined : 'fa-regular fa-clock'"
        readonly
        :locked="locked"
        :dense="false"
        v-bind="{ ...attrs, ...$attrs }"
        hide-details="auto"
        style="min-width: 100px; max-width: 100px"
        v-on="on"
      />
    </template>
    <v-time-picker
      v-if="menu"
      id="timepicker"
      ref="field"
      v-model="$attrs.value"
      full-width
      :use-seconds="useSeconds"
      format="24hr"
      @click:minute="$refs.menu.save($attrs.value)"
      @change="$emit('input', $event)"
    />
  </v-menu>
</template>
<script>
import Vue from 'vue'
export default Vue.extend({
  props: {
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
      menu: false,
    }
  },
})
</script>
