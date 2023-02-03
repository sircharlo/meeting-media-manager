<!-- eslint-disable vue/no-v-html -->
<template>
  <v-text-field
    v-if="field == 'text' || field == 'password' || field == 'number'"
    :id="safeId"
    ref="field"
    v-model="$attrs.value"
    :type="field === 'password' && passwordVisible ? 'text' : field"
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
        @click="passwordVisible = !passwordVisible"
      />
    </template>
    <template v-else-if="locked" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon
            v-bind="attrs"
            :icon="faLock"
            style="margin-top: 2px"
            v-on="on"
          />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
    <template v-else-if="explanation && appendOuter" #append-outer>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon
            v-bind="attrs"
            :icon="faCircleQuestion"
            size="lg"
            style="margin-top: 2px"
            v-on="on"
          />
        </template>
        <span>{{ $t(explanation) }}</span>
      </v-tooltip>
    </template>
    <template v-else-if="explanation" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon
            v-bind="attrs"
            :icon="faCircleQuestion"
            size="lg"
            style="margin-top: 2px"
            v-on="on"
          />
        </template>
        <span>{{ $t(explanation) }}</span>
      </v-tooltip>
    </template>
    <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
  </v-text-field>
  <v-autocomplete
    v-else-if="field == 'autocomplete'"
    :id="safeId"
    ref="field"
    v-model="$attrs.value"
    :disabled="$attrs.disabled || locked"
    v-bind="{ ...style, ...$attrs }"
    :rules="rules"
    :counter="max"
    hide-no-data
    v-on="$listeners"
  >
    <template v-for="(_, slot) of $scopedSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
    <slot v-for="(_, name) in $slots" :slot="name" :name="name" />
    <template v-if="locked" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon
            v-bind="attrs"
            :icon="faLock"
            style="margin-top: 2px"
            v-on="on"
          />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
    <template v-else-if="explanation" #append-outer>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon
            v-bind="attrs"
            size="lg"
            :icon="faCircleQuestion"
            style="margin-top: 2px"
            v-on="on"
          />
        </template>
        <span>{{ $t(explanation) }}</span>
      </v-tooltip>
    </template>
  </v-autocomplete>
  <v-select
    v-else-if="field == 'select'"
    :id="safeId"
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
          <font-awesome-icon
            v-bind="attrs"
            :icon="faLock"
            style="margin-top: 2px"
            v-on="on"
          />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
    <template v-else-if="explanation" #append-outer>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon
            v-bind="attrs"
            :icon="faCircleQuestion"
            size="lg"
            style="margin-top: 2px"
            v-on="on"
          />
        </template>
        <span>{{ $t(explanation) }}</span>
      </v-tooltip>
    </template>
  </v-select>
  <v-textarea
    v-else-if="field == 'textarea'"
    :id="safeId"
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
    <template v-else-if="explanation" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon
            v-bind="attrs"
            size="lg"
            :icon="faCircleQuestion"
            v-on="on"
          />
        </template>
        <span>{{ $t(explanation) }}</span>
      </v-tooltip>
    </template>
  </v-textarea>
  <v-checkbox
    v-else-if="field == 'checkbox'"
    :id="safeId"
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
          <font-awesome-icon
            v-bind="attrs"
            :icon="faLock"
            style="margin-top: 3px"
            v-on="on"
          />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
    <template v-else-if="explanation" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon
            v-bind="attrs"
            size="lg"
            :icon="faCircleQuestion"
            style="margin-top: 3px"
            v-on="on"
          />
        </template>
        <span>{{ $t(explanation) }}</span>
      </v-tooltip>
    </template>
  </v-checkbox>
  <v-switch
    v-else-if="field == 'switch'"
    :id="safeId"
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
          <font-awesome-icon
            v-bind="attrs"
            :icon="faLock"
            style="margin-top: 3px"
            v-on="on"
          />
        </template>
        <span>{{ $t('settingLocked') }}</span>
      </v-tooltip>
    </template>
    <template v-else-if="explanation" #append>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <font-awesome-icon
            v-bind="attrs"
            :icon="faCircleQuestion"
            style="margin-top: 3px"
            size="lg"
            v-on="on"
          />
        </template>
        <span>{{ $t(explanation) }}</span>
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
        :id="safeId"
        ref="field"
        v-model="$attrs.value"
        :color="required && $attrs.value === null ? 'error' : 'primary'"
        v-bind="$attrs"
        :class="{ 'btn-group-error': required && $attrs.value === null }"
        v-on="$listeners"
        @change="$emit('input', $event)"
      >
        <v-btn
          v-for="(item, key) in groupItems"
          :id="safeId + '-' + key"
          :key="key"
          :value="item.value"
          :disabled="$attrs.disabled || locked"
          :style="`height: ${height}`"
        >
          {{ item.label }}
        </v-btn>
        <v-btn v-if="locked" icon disabled :style="`height: ${height}`">
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
        :id="safeId"
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
              <font-awesome-icon
                v-bind="attrs"
                :icon="faLock"
                style="margin-top: 2px"
                v-on="on"
              />
            </template>
            <span>{{ $t('settingLocked') }}</span>
          </v-tooltip>
        </template>
        <template v-else-if="explanation" #append>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <font-awesome-icon
                v-bind="attrs"
                size="lg"
                :icon="faCircleQuestion"
                style="margin-top: 2px"
                v-on="on"
              />
            </template>
            <span>{{ $t(explanation) }}</span>
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
  faCircleQuestion,
  faEyeSlash,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { defineComponent, PropOptions } from 'vue'
enum FieldType {
  text = 'text',
  password = 'password',
  number = 'number',
  autocomplete = 'autocomplete',
  select = 'select',
  textarea = 'textarea',
  checkbox = 'checkbox',
  switch = 'switch',
  date = 'date',
  time = 'time',
  'btn-group' = 'btn-group',
  slider = 'slider',
}
export default defineComponent({
  props: {
    id: {
      type: String,
      default: null,
    },
    field: {
      type: String,
      default: 'text',
      validator: (val: string) => {
        return Object.keys(FieldType).includes(val)
      },
    } as PropOptions<FieldType>,
    variant: {
      type: String,
      default: 'default',
      validator: (val: string) => {
        return ['default', 'round', 'basic'].includes(val)
      },
    } as PropOptions<'default' | 'round' | 'basic'>,
    max: {
      type: [Boolean, Number],
      default: false,
      validator: (val: number | boolean) => {
        if (typeof val === 'number') {
          return val > 0
        }
        return typeof val === 'boolean'
      },
    },
    groupLabel: {
      type: String,
      default: null,
    },
    groupItems: {
      type: Array,
      default: () => [],
    } as PropOptions<{ label: string; value: string }[]>,
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
    appendOuter: {
      type: Boolean,
      default: false,
    },
    explanation: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      passwordVisible: false,
      style: {
        dense: true,
        // filled: true,
        outlined: true,
      } as any,
    }
  },
  computed: {
    safeId(): string {
      return this.id ? this.$strip(this.id, 'id') : this.$attrs['data-id']
    },
    faLock() {
      return faLock
    },
    faCircleQuestion() {
      return faCircleQuestion
    },
    passIcon(): IconDefinition {
      return this.passwordVisible ? faEyeSlash : faEye
    },
    rules(): ((v: unknown) => true | string)[] {
      const rules = (this.$attrs.rules as unknown as any[]) ?? []
      if (this.required) {
        rules.push((v: unknown) => {
          if (typeof v === 'string') {
            return !!v.trim() || this.$t('fieldRequired')
          }
          return !!v || this.$t('fieldRequired')
        })
      }
      if (this.max) {
        rules.push(
          (v: string) =>
            !v ||
            v.length <= this.max ||
            (this.$t('fieldMax') as string).replace('XX', this.max.toString())
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
        // filled: true,
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
.btn-group-error {
  border: solid 1px;
}
</style>
