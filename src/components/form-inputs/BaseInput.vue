<template>
  <ToggleInput
    v-if="item.type === 'toggle'"
    v-model="model"
    :actions="item.actions"
    :setting-id="settingId"
    v-bind="$attrs"
  />
  <ColorInput
    v-else-if="item.type === 'color'"
    v-model="model"
    :actions="item.actions"
    :rules="item.rules"
    :setting-id="settingId"
  />
  <TextInput
    v-else-if="item.type === 'text'"
    v-model="model"
    :actions="item.actions"
    :rules="item.rules"
    v-bind="$attrs"
    :setting-id="settingId"
  />
  <FolderInput
    v-else-if="item.type === 'path'"
    v-model="model"
    v-bind="$attrs"
  />
  <SliderInput
    v-else-if="item.type === 'slider'"
    v-model="model"
    :actions="item.actions"
    :max="item.max"
    :min="item.min"
    v-bind="$attrs"
    :step="item.step"
  />
  <DateInput
    v-else-if="item.type === 'date'"
    v-model="model"
    :options="item.options"
    :rules="item.rules"
    v-bind="$attrs"
  />
  <TimeInput
    v-else-if="item.type === 'time'"
    v-model="model"
    :options="item.options"
    :rules="item.rules"
    v-bind="$attrs"
  />
  <SelectInput
    v-else-if="item.type === 'list'"
    v-model="model"
    :list="item.list"
    :rules="item.rules"
    v-bind="$attrs"
    :setting-id="settingId"
    use-input
  />
  <!-- :use-input="settingId.toLowerCase().includes('lang')" -->
  <ShortcutInput
    v-else-if="item.type === 'shortcut'"
    v-model="model"
    :dialog-id="`shortcut-input-${settingId}`"
    :shortcut-name="settingId"
    v-bind="$attrs"
  />
  <pre v-else>{{ item }}</pre>
</template>
<script setup lang="ts">
import type { SettingsItem, SettingsValues } from 'src/types';

import ColorInput from 'components/form-inputs/ColorInput.vue';
import DateInput from 'components/form-inputs/DateInput.vue';
import FolderInput from 'components/form-inputs/FolderInput.vue';
import SelectInput from 'components/form-inputs/SelectInput.vue';
import ShortcutInput from 'components/form-inputs/ShortcutInput.vue';
import SliderInput from 'components/form-inputs/SliderInput.vue';
import TextInput from 'components/form-inputs/TextInput.vue';
import TimeInput from 'components/form-inputs/TimeInput.vue';
import ToggleInput from 'components/form-inputs/ToggleInput.vue';

defineProps<{
  item: SettingsItem;
  settingId: keyof SettingsValues;
}>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const model = defineModel<any>({ required: true });
</script>
