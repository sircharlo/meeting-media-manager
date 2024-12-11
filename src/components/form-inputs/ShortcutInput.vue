<template>
  <div class="row" style="width: 240px" @click="shortcutPicker = true">
    <template v-if="localValue">
      <template
        v-for="(keyboardKey, index) in localValue.split('+')"
        :key="keyboardKey"
      >
        <div :class="'col ' + (index > 0 ? 'q-ml-sm' : '')">
          <q-btn
            :key="keyboardKey"
            class="full-width text-smaller"
            color="primary"
            :label="keyboardKey"
            unelevated
          />
        </div>
      </template>
    </template>
    <q-btn
      v-else
      class="full-width col-12 text-smaller"
      color="primary"
      :label="$t('enter-key-combination')"
      outline
      @click="shortcutPicker = true"
    />
  </div>
  <q-dialog
    v-model="shortcutPicker"
    @hide="stopListening()"
    @show="startListening()"
  >
    <q-card class="modal-confirm">
      <q-card-section
        class="row items-center text-bigger text-semibold q-pb-none"
      >
        {{ $t('enter-a-key-combination') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{ $t('enter-a-key-combination-now-using-your-keyboard') }}
      </q-card-section>
      <q-card-section class="q-pt-none text-center row">
        <template v-if="localValue">
          <template v-for="(key, index) in localValue.split('+')" :key="key">
            <div
              :class="
                'col text-uppercase bg-primary text-white q-pa-sm rounded-borders ' +
                (index > 0 ? 'q-ml-sm' : '')
              "
            >
              {{ key }}
            </div>
          </template>
        </template>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn
          v-close-popup
          color="negative"
          flat
          :label="$t('clear')"
          @click="localValue = ''"
        />
        <q-btn v-close-popup flat :label="$t('confirm')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { SettingsValues } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import {
  getCurrentShortcuts,
  isKeyCode,
  registerCustomShortcut,
} from 'src/helpers/keyboardShortcuts';
import { ref, watch } from 'vue';

// Define props and emits
const props = defineProps<{
  modelValue: null | string;
  shortcutName: keyof SettingsValues;
}>();

const emit = defineEmits(['update:modelValue']);

// Setup component
const localValue = ref(props.modelValue);

watch(localValue, (newValue, oldValue) => {
  if (!newValue || !getCurrentShortcuts().includes(newValue)) {
    emit('update:modelValue', newValue);
    if (oldValue) window.electronApi.unregisterShortcut(oldValue);
    if (newValue) registerCustomShortcut(props.shortcutName, newValue);
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  },
);

const handleKeyPress = (event: KeyboardEvent) => {
  try {
    const { altKey, code, ctrlKey, key, metaKey, shiftKey } = event;
    const keys = [];

    // Press a combination of modifier keys
    if (ctrlKey) keys.push('Ctrl');
    if (shiftKey) keys.push('Shift');
    if (altKey) keys.push('Alt');
    if (metaKey) keys.push('Meta');

    // Press a key
    if (keys.length > 0) {
      let pressed = code;

      if (code.startsWith('Digit')) pressed = key;
      if (code.startsWith('Key')) pressed = code.slice(3);
      if (code.startsWith('Arrow')) pressed = key.slice(5);
      if (code.startsWith('MediaTrack')) {
        pressed = `Media${code.slice(10)}Track`;
      }

      if (isKeyCode(pressed)) {
        keys.push(pressed);
        localValue.value = keys.join('+');
      }
    }
  } catch (e) {
    errorCatcher(e);
  }
};

const startListening = () =>
  window.addEventListener('keydown', handleKeyPress, { passive: true });
const stopListening = () =>
  window.removeEventListener('keydown', handleKeyPress);
const shortcutPicker = ref(false);
</script>
