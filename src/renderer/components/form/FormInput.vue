<!-- eslint-disable vue/no-v-html -->
<template>
  <v-text-field
    v-if="field == 'text' || field == 'password' || field == 'number'"
    :id="$attrs['data-id']"
    ref="field"
    v-model="$attrs.value"
    :type="field === 'password' && showPassword ? 'text' : field"
    :disabled="$attrs.disabled || locked"
    v-bind="{ ...style, ...$attrs }"
    :rules="rules"
    :counter="max"
    v-on="$listeners"
  >
    <template v-if="field === 'password'" #append>
      <font-awesome-icon
        :icon="passIcon"
        size="lg"
        @click="showPassword = !showPassword"
      />
    </template>
    <template v-else-if="locked" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon v-bind="attrs" :icon="faLock" v-on="on" />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
    <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
  </v-text-field>
  <v-autocomplete
    v-else-if="field == 'autocomplete'"
    :id="$attrs['data-id']"
    ref="field"
    v-model="$attrs.value"
    :disabled="$attrs.disabled || locked"
    v-bind="{ ...style, ...$attrs }"
    :rules="rules"
    :counter="max"
    hide-no-data
    v-on="$listeners"
  >
    <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
    <template v-if="locked" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon v-bind="attrs" :icon="faLock" v-on="on" />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
  </v-autocomplete>
  <v-select
    v-else-if="field == 'select'"
    :id="$attrs['data-id']"
    ref="field"
    v-model="$attrs.value"
    :readonly="$attrs.disabled || locked"
    :class="{ 'v-input--is-disabled': locked }"
    v-bind="{ ...style, ...$attrs }"
    :rules="rules"
    v-on="$listeners"
  >
    <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
    <template v-if="locked" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon v-bind="attrs" :icon="faLock" v-on="on" />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
  </v-select>
  <v-textarea
    v-else-if="field == 'textarea'"
    :id="$attrs['data-id']"
    ref="field"
    v-model="$attrs.value"
    :disabled="$attrs.disabled || locked"
    v-bind="{ ...style, ...$attrs }"
    :rules="rules"
    :counter="max"
    rows="4"
    v-on="$listeners"
  >
    <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
    <template v-if="locked" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon v-bind="attrs" :icon="faLock" v-on="on" />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
  </v-textarea>
  <v-checkbox
    v-else-if="field == 'checkbox'"
    :id="$attrs['data-id']"
    ref="field"
    v-model="$attrs.value"
    :readonly="$attrs.disabled || locked"
    :class="{ 'v-input--is-disabled': locked }"
    v-bind="$attrs"
    v-on="$listeners"
    @change="$emit('input', !!$event)"
  >
    <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
    <template v-if="locked" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon v-bind="attrs" :icon="faLock" v-on="on" />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
  </v-checkbox>
  <v-switch
    v-else-if="field == 'switch'"
    :id="$attrs['data-id']"
    ref="field"
    v-model="$attrs.value"
    :readonly="$attrs.disabled || locked"
    :class="{ 'v-input--is-disabled': locked }"
    v-bind="$attrs"
    v-on="$listeners"
    @change="$emit('input', !!$event)"
  >
    <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
    <template v-if="locked" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon v-bind="attrs" :icon="faLock" v-on="on" />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
  </v-switch>
  <v-row v-else-if="field == 'btn-group'" class="mb-4" justify="space-between">
    <v-col align-self="center" class="text-left">
      <v-tooltip v-if="locked" top>
        <template #activator="{ on, attrs }">
          <span v-bind="attrs" v-on="on">{{ groupLabel }}</span>
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
      <span v-else>{{ groupLabel }}</span>
    </v-col>
    <v-col align-self="center" class="text-right">
      <v-btn-toggle
        :id="$attrs['data-id']"
        ref="field"
        v-model="$attrs.value"
        v-bind="$attrs"
        v-on="$listeners"
        @change="$emit('input', $event)"
      >
        <v-btn
          v-for="(item, key) in groupItems"
          :key="key"
          :value="item.value"
          :disabled="$attrs.disabled || locked"
          :style="`height: ${height}`"
        >
          {{ item.label }}
        </v-btn>
        <v-btn v-if="locked" icon :disabled="true" :style="`height: ${height}`">
          <font-awesome-icon :icon="faLock" />
        </v-btn>
      </v-btn-toggle>
    </v-col>
    <v-col
      v-if="hasSlot()"
      cols="2"
      class="d-flex justify-end"
      align-self="center"
    >
      <slot />
    </v-col>
  </v-row>
  <v-row v-else-if="field == 'slider'" class="mb-4" justify="space-between">
    <v-col align-self="center" class="text-left">
      {{ groupLabel }}
    </v-col>
    <v-col align-self="center" class="text-right">
      <v-slider
        :id="$attrs['data-id']"
        ref="field"
        v-model="$attrs.value"
        :disabled="$attrs.disabled || locked"
        v-bind="$attrs"
        inverse-label
        :max="max ? max : '100'"
        :label="$attrs.value + labelSuffix"
        hide-details="auto"
        v-on="$listeners"
        @change="$emit('input', $event)"
      >
        <template v-if="locked" #append>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <font-awesome-icon v-bind="attrs" :icon="faLock" v-on="on" />
            </template>
            <span>{{ $t('settingLocked') }}</span>
          </v-tooltip>
        </template>
      </v-slider>
    </v-col>
    <v-col v-if="hasSlot()" cols="2" align-self="center">
      <slot />
    </v-col>
  </v-row>
</template>
<script lang="ts">
import {
  faLock,
  faEye,
  faEyeSlash,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import Vue from 'vue'
export default Vue.extend({
  props: {
    field: {
      type: String,
      default: 'text',
      validator(value: string) {
        return [
          'text',
          'password',
          'number',
          'autocomplete',
          'select',
          'textarea',
          'checkbox',
          'switch',
          'date',
          'time',
          'btn-group',
          'slider',
        ].includes(value)
      },
    },
    variant: {
      type: String,
      default: 'default',
      validator(value: string) {
        return ['default', 'round', 'basic'].includes(value)
      },
    },
    max: {
      type: [Number, Boolean],
      default: false,
    },
    groupLabel: {
      type: String,
      default: null,
    },
    groupItems: {
      type: Array,
      default: () => [],
    },
    height: {
      type: String,
      default: '48px',
    },
    required: {
      type: Boolean,
      default: false,
    },
    labelSuffix: {
      type: String,
      default: '',
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      showPassword: false,
      style: {
        dense: true,
        filled: true,
        outlined: true,
      } as any,
    }
  },
  computed: {
    faLock() {
      return faLock
    },
    passIcon(): IconDefinition {
      return this.showPassword ? faEye : faEyeSlash
    },
    rules() {
      const rules = (this.$attrs.rules as unknown as any[]) ?? []
      if (this.required) {
        rules.push((v: any) => {
          return !!v || 'This field needs to be filled in.'
        })
      }
      if (this.max) {
        rules.push(
          (v: any) => !v || v.length <= this.max || `Max ${this.max} characters`
        )
      }
      return rules
    },
  },
  mounted() {
    if (this.variant === 'basic') {
      this.style = {
        rules: [],
      }
    } else if (this.variant === 'round') {
      this.style = {
        dense: true,
        filled: true,
        rounded: true,
        flat: true,
        rules: [],
      }
    }
  },
  methods: {
    hasSlot(name = 'default') {
      return !!this.$slots[name] || !!this.$scopedSlots[name]
    },
  },
})
</script>
<style lang="css">
.v-text-field--filled .v-text-field__prefix {
  margin-top: 0px !important;
}
</style>
