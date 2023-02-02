<template>
  <v-row align="center" class="my-n4" style="width: 100%">
    <v-col cols="1" class="text-center" align-self="center">
      <font-awesome-icon :icon="faArrowDown19" />
    </v-col>
    <v-col cols="11" class="d-flex">
      <v-col cols="4">
        <v-otp-input
          id="input-prefix-1"
          v-model="prefix1"
          type="number"
          length="2"
          dense
          :disabled="loading"
          @finish="focus($refs.prefix2)"
        />
      </v-col>
      <v-col cols="4">
        <v-otp-input
          v-if="prefix1"
          id="input-prefix-2"
          ref="prefix2"
          v-model="prefix2"
          type="number"
          length="2"
          dense
          :disabled="loading"
          @finish="focus($refs.prefix3)"
        />
      </v-col>
      <v-col cols="4">
        <v-otp-input
          v-if="prefix2"
          id="input-prefix-3"
          ref="prefix3"
          v-model="prefix3"
          type="number"
          length="2"
          dense
          :disabled="loading"
        />
      </v-col>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import {
  faArrowDown19,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
export default defineComponent({
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      prefix1: '',
      prefix2: '',
      prefix3: '',
    }
  },
  computed: {
    value(): string {
      return this.$attrs.value
    },
    faArrowDown19(): IconDefinition {
      return faArrowDown19
    },
    prefix(): string {
      return [this.prefix1, this.prefix2, this.prefix3]
        .filter(Boolean)
        .join('-')
    },
  },
  watch: {
    value() {
      this.setPrefix()
    },
    prefix() {
      this.$emit('input', this.prefix)
    },
  },
  mounted() {
    this.setPrefix()
  },
  methods: {
    focus(ref: any) {
      if (ref) ref.focus()
    },
    setPrefix() {
      const [prefix1, prefix2, prefix3] = this.value.split('-')
      this.prefix1 = prefix1 ?? ''
      this.prefix2 = prefix2 ?? ''
      this.prefix3 = prefix3 ?? ''
    },
  },
})
</script>
