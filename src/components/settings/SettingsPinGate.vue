<template>
  <div class="settings-pin-gate">
    <div class="settings-pin-gate__card">
      <div class="row items-center no-wrap q-mb-sm">
        <span class="icon-chip text-primary q-mr-sm">
          <q-icon name="mmm-settings" size="xs" />
        </span>
        <div class="text-bigger text-semibold">
          {{ t('settings-locked') }}
        </div>
      </div>
      <div class="q-mb-md">{{ t('settings-locked-explain') }}</div>

      <q-form @submit.prevent="unlock">
        <q-input
          v-model="pin"
          autocomplete="off"
          autofocus
          class="bg-accent-100"
          dense
          :error="wrongPin"
          :error-message="t('settings-pin-wrong')"
          inputmode="numeric"
          :label="t('settings-pin-code')"
          outlined
          type="password"
        />
        <div class="row items-center justify-between q-mt-sm">
          <q-btn
            color="primary"
            flat
            :label="t('settings-pin-forgot')"
            no-caps
            @click="startReset"
          />
          <q-btn
            color="primary"
            :label="t('settings-pin-unlock')"
            :loading="checking"
            no-caps
            type="submit"
            unelevated
          />
        </div>
      </q-form>
    </div>
  </div>

  <ConfirmDialog
    v-model="resetOpen"
    :confirm-label="t('settings-pin-remove')"
    dialog-id="settings-pin-reset"
    icon="mmm-settings"
    icon-color="primary"
    persistent
    :title="t('settings-pin-forgot')"
    @cancel="cancelReset"
    @confirm="confirmReset"
  >
    <q-card-section class="q-pb-none">
      {{ t('settings-pin-reset-explain', { file: resetFileName }) }}
    </q-card-section>
    <q-card-section>
      <q-btn
        class="btn-tonal full-width q-mb-md"
        color="primary"
        flat
        :label="t('settings-pin-reset-open-folder')"
        no-caps
        @click="openSettingsPinResetFolder"
      />
      <q-input
        v-model="enteredCode"
        autocomplete="off"
        class="bg-accent-100"
        dense
        :error="wrongCode"
        :error-message="t('settings-pin-reset-code-wrong')"
        inputmode="numeric"
        :label="t('settings-pin-reset-code')"
        outlined
        @keyup.enter="confirmReset"
      />
    </q-card-section>
  </ConfirmDialog>
</template>

<script setup lang="ts">
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  createSettingsPinResetCode,
  openSettingsPinResetFolder,
  removeSettingsPinResetFile,
  verifySettingsPin,
  writeSettingsPinResetFile,
} from 'src/utils/settings-pin';
import { useCurrentStateStore } from 'stores/current-state';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { currentSettings, settingsUnlocked } = storeToRefs(
  useCurrentStateStore(),
);

const pin = ref('');
const wrongPin = ref(false);
const checking = ref(false);

const unlock = async () => {
  const stored = currentSettings.value?.settingsPin;
  if (!stored || checking.value) return;
  checking.value = true;
  wrongPin.value = false;
  try {
    if (await verifySettingsPin(pin.value, stored)) {
      settingsUnlocked.value = true;
      return;
    }
    wrongPin.value = true;
    pin.value = '';
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'unlockSettings' } } });
    wrongPin.value = true;
  } finally {
    checking.value = false;
  }
};

const resetOpen = ref(false);
const resetFileName = ref('');
const enteredCode = ref('');
const wrongCode = ref(false);
let expectedCode = '';

const startReset = async () => {
  try {
    const code = createSettingsPinResetCode();
    resetFileName.value = await writeSettingsPinResetFile(
      code,
      t('settings-pin-reset-file-note'),
    );
    expectedCode = code;
    enteredCode.value = '';
    wrongCode.value = false;
    resetOpen.value = true;
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'startSettingsPinReset' } },
    });
    createTemporaryNotification({
      message: t('settings-pin-reset-failed'),
      type: 'negative',
    });
  }
};

const endReset = () => {
  expectedCode = '';
  resetOpen.value = false;
  void removeSettingsPinResetFile();
};

const cancelReset = () => {
  endReset();
};

const confirmReset = () => {
  if (!expectedCode || enteredCode.value.trim() !== expectedCode) {
    wrongCode.value = true;
    return;
  }
  if (currentSettings.value) currentSettings.value.settingsPin = null;
  settingsUnlocked.value = true;
  endReset();
  createTemporaryNotification({
    message: t('settings-pin-removed'),
    type: 'positive',
  });
};
</script>

<style scoped>
.settings-pin-gate {
  display: flex;
  justify-content: center;
  padding-top: 10vh;
}

.settings-pin-gate__card {
  background: white;
  border: 1px solid color-mix(in srgb, rgb(170, 188, 227) 45%, transparent);
  border-radius: 14px;
  box-shadow:
    0px 2px 12px 0px rgba(35, 60, 120, 0.06),
    0px 6px 20px 0px rgba(35, 60, 120, 0.05);
  max-width: 420px;
  padding: 1.25rem;
  width: 100%;
}

body.body--dark .settings-pin-gate__card {
  background: #1d1d1d;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.35),
    0 6px 20px rgba(0, 0, 0, 0.25);
}
</style>
