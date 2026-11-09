<template>
  <ConfirmDialog
    v-model="open"
    :confirm-label="t('settings-pin-remove')"
    dialog-id="settings-pin-reset"
    icon="mmm-settings"
    icon-color="primary"
    persistent
    :title="t('settings-pin-forgot')"
    @cancel="cancel"
    @confirm="confirm"
  >
    <q-card-section class="q-pb-none">
      <div class="text-weight-medium q-mb-sm">
        {{ t('settings-pin-reset-authorized') }}
      </div>
      <div>{{ t('settings-pin-reset-explain') }}</div>
      <code class="settings-pin-reset__folder">{{ folder }}</code>
    </q-card-section>
    <q-card-section>
      <q-btn
        class="btn-tonal full-width q-mb-md"
        color="primary"
        flat
        :label="t('user-guide')"
        no-caps
        @click="openExternal('docs')"
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
        @keyup.enter="confirm"
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
  removeSettingsPinResetFile,
  writeSettingsPinResetFile,
} from 'src/utils/settings-pin';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ congregationId: string }>();

const open = defineModel<boolean>({ required: true });

const { t } = useI18n();
const { openExternal } = globalThis.electronApi;

const { congregations } = storeToRefs(useCongregationSettingsStore());
const { settingsPinFailedAttempts } = storeToRefs(useCurrentStateStore());

const folder = ref('');
const enteredCode = ref('');
const wrongCode = ref(false);
let expectedCode = '';

const start = async () => {
  try {
    const code = createSettingsPinResetCode();
    folder.value = await writeSettingsPinResetFile(
      code,
      t('settings-pin-reset-file-note'),
    );
    expectedCode = code;
    enteredCode.value = '';
    wrongCode.value = false;
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'startSettingsPinReset' } },
    });
    open.value = false;
    createTemporaryNotification({
      message: t('settings-pin-reset-failed'),
      type: 'negative',
    });
  }
};

const end = () => {
  expectedCode = '';
  open.value = false;
  void removeSettingsPinResetFile();
};

const cancel = () => {
  end();
};

const confirm = () => {
  const settings = congregations.value[props.congregationId];
  if (!settings || !expectedCode || enteredCode.value.trim() !== expectedCode) {
    wrongCode.value = true;
    return;
  }
  settings.settingsPin = null;
  settingsPinFailedAttempts.value[props.congregationId] = 0;
  end();
  createTemporaryNotification({
    message: t('settings-pin-removed'),
    type: 'positive',
  });
};

watch(open, (isOpen) => {
  if (isOpen) void start();
});
</script>

<style scoped>
.settings-pin-reset__folder {
  display: block;
  margin-top: 0.5rem;
  overflow-wrap: anywhere;
  user-select: text;
}
</style>
