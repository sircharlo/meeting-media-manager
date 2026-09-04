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
      :label="t('enter-key-combination')"
      outline
      @click="shortcutPicker = true"
    />
    <BaseDialog
      v-model="shortcutPicker"
      :dialog-id="dialogId"
      @hide="stopListening()"
      @show="startListening()"
    >
      <q-card class="modal-confirm round-card">
        <q-card-section
          class="row items-center no-wrap text-bigger text-semibold text-primary q-pb-none"
        >
          <div class="icon-chip q-mr-sm">
            <q-icon name="mmm-configuration" size="xs" />
          </div>
          {{ t('enter-a-key-combination') }}
        </q-card-section>
        <q-card-section class="row items-center">
          {{ t('enter-a-key-combination-now-using-your-keyboard') }}
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
            v-if="localValue"
            color="negative"
            flat
            :label="t('clear')"
            @click="localValue = ''"
          />
          <q-btn flat :label="t('close')" @click="shortcutPicker = false" />
        </q-card-actions>
      </q-card>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import type { SettingsValues } from 'src/types';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  getConflictingShortcutName,
  getCurrentShortcuts,
  isKeyCode,
  registerCustomShortcut,
} from 'src/helpers/keyboardShortcuts';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { log } from 'src/shared/vanilla';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Define props and emits
const props = defineProps<{
  dialogId: string;
  modelValue: null | string;
  shortcutName: keyof SettingsValues;
}>();

const emit = defineEmits(['update:modelValue']);

// Setup component
const localValue = ref(props.modelValue);

const { unregisterShortcut } = globalThis.electronApi;

const handleKeyPress = (event: KeyboardEvent) => {
  log('🎹 Key pressed:', 'shortcutInput', 'log', event.code, event.key, {
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  });
  try {
    const { altKey, code, ctrlKey, key, metaKey, shiftKey } = event;
    const keys = [];

    // Prevent default behavior for key combinations
    event.preventDefault();

    // Press a combination of modifier keys
    if (ctrlKey) keys.push('Ctrl');
    if (shiftKey) keys.push('Shift');
    if (altKey) keys.push('Alt');
    if (metaKey) keys.push('Meta');

    // Handle the actual key press
    let pressed = code;

    if (code.startsWith('Digit')) pressed = key;
    if (code.startsWith('Key')) pressed = code.slice(3);
    if (code.startsWith('Arrow')) pressed = key.slice(5);
    if (code.startsWith('MediaTrack')) {
      pressed = `Media${code.slice(10)}Track`;
    }

    // Allow single key presses or key combinations
    if (isKeyCode(pressed)) {
      const candidate =
        keys.length > 0 ? [...keys, pressed].join('+') : pressed;

      // FE-5 (full-audit-2026-09-04.md): the commit watcher below silently
      // skipped a combination already assigned elsewhere, but had already
      // been shown here as if it were accepted - reopening the dialog later
      // wouldn't reset it either, since the underlying prop never changed.
      // Reject it here instead, before it's ever displayed as picked.
      const conflictingShortcut = getConflictingShortcutName(
        candidate,
        props.shortcutName,
      );
      if (conflictingShortcut) {
        createTemporaryNotification({
          message: t('shortcut-already-assigned', {
            action: t(conflictingShortcut),
          }),
          type: 'negative',
        });
        return;
      }

      localValue.value = candidate;
    }
  } catch (e) {
    errorCatcher(e);
  }
};

const startListening = () => {
  log(
    '🎹 Starting keyboard listener for shortcut input',
    'shortcutInput',
    'log',
  );
  globalThis.addEventListener('keydown', handleKeyPress, { passive: false });
  // Focus the dialog to ensure it receives key events
  setTimeout(() => {
    const dialog = document.querySelector(
      `[data-dialog-id="${props.dialogId}"]`,
    );
    if (dialog) {
      (dialog as HTMLElement).focus();
    }
  }, 100);
};

const stopListening = () => {
  log(
    '🎹 Stopping keyboard listener for shortcut input',
    'shortcutInput',
    'log',
  );
  globalThis.removeEventListener('keydown', handleKeyPress);
};

const shortcutPicker = ref(false);

watch(localValue, (newValue, oldValue) => {
  if (!newValue || !getCurrentShortcuts().includes(newValue)) {
    emit('update:modelValue', newValue);
    if (oldValue) unregisterShortcut(oldValue);
    if (newValue) registerCustomShortcut(props.shortcutName, newValue);
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  },
);
</script>
