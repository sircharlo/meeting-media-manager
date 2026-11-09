<template>
  <div v-if="currentSettings" id="settingsPin" class="subgroup-card">
    <q-item
      class="rounded-borders"
      :style="$q.screen.lt.sm ? 'flex-direction: column' : ''"
    >
      <q-item-section>
        <q-item-label>{{ t('settings-pin-title') }}</q-item-label>
        <q-item-label caption :class="{ 'q-pb-sm': $q.screen.lt.sm }">
          {{ t('settings-pin-explain') }}
        </q-item-label>
      </q-item-section>
      <q-item-section
        side
        :style="
          ($q.screen.lt.sm ? 'padding-left: 0' : '') + ';align-items: end'
        "
      >
        <div class="row no-wrap q-gutter-sm">
          <q-btn
            v-if="currentSettings.settingsPin"
            color="negative"
            flat
            :label="t('settings-pin-remove')"
            @click="removeOpen = true"
          />
          <q-btn
            class="btn-tonal"
            color="primary"
            flat
            :label="
              currentSettings.settingsPin
                ? t('settings-pin-change')
                : t('settings-pin-set')
            "
            @click="openSetDialog"
          />
        </div>
      </q-item-section>
    </q-item>

    <ConfirmDialog
      v-model="setOpen"
      :confirm-label="t('save')"
      dialog-id="settings-pin-set"
      icon="mmm-settings"
      icon-color="primary"
      :loading="saving"
      :title="t('settings-pin-title')"
      @cancel="setOpen = false"
      @confirm="savePin"
    >
      <q-card-section>
        <q-input
          v-model="newPin"
          autocomplete="off"
          autofocus
          class="bg-accent-100 q-mb-sm"
          dense
          :error="submitted && !isValidSettingsPin(newPin)"
          :error-message="t('settings-pin-format')"
          :hint="t('settings-pin-format')"
          inputmode="numeric"
          :label="t('settings-pin-new')"
          outlined
          type="password"
        />
        <q-input
          v-model="repeatPin"
          autocomplete="off"
          class="bg-accent-100"
          dense
          :error="submitted && newPin !== repeatPin"
          :error-message="t('settings-pin-mismatch')"
          inputmode="numeric"
          :label="t('settings-pin-repeat')"
          outlined
          type="password"
          @keyup.enter="savePin"
        />
      </q-card-section>
    </ConfirmDialog>

    <ConfirmDialog
      v-model="removeOpen"
      :confirm-label="t('settings-pin-remove')"
      dialog-id="settings-pin-remove"
      icon="mmm-settings"
      :message="t('settings-pin-remove-confirmation')"
      :title="t('settings-pin-remove')"
      @cancel="removeOpen = false"
      @confirm="removePin"
    />
  </div>
</template>

<script setup lang="ts">
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { hashSettingsPin, isValidSettingsPin } from 'src/utils/settings-pin';
import { useCurrentStateStore } from 'stores/current-state';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const $q = useQuasar();

const { currentSettings, settingsUnlocked } = storeToRefs(
  useCurrentStateStore(),
);

const setOpen = ref(false);
const removeOpen = ref(false);
const newPin = ref('');
const repeatPin = ref('');
const submitted = ref(false);
const saving = ref(false);

const openSetDialog = () => {
  newPin.value = '';
  repeatPin.value = '';
  submitted.value = false;
  setOpen.value = true;
};

const savePin = async () => {
  submitted.value = true;
  if (!isValidSettingsPin(newPin.value) || newPin.value !== repeatPin.value) {
    return;
  }
  if (!currentSettings.value || saving.value) return;
  saving.value = true;
  try {
    currentSettings.value.settingsPin = await hashSettingsPin(newPin.value);
    // Whoever just set it stays in: the page only locks once they leave.
    settingsUnlocked.value = true;
    setOpen.value = false;
    createTemporaryNotification({
      message: t('settings-pin-saved'),
      type: 'positive',
    });
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'saveSettingsPin' } } });
  } finally {
    saving.value = false;
  }
};

const removePin = () => {
  if (currentSettings.value) currentSettings.value.settingsPin = null;
  removeOpen.value = false;
  createTemporaryNotification({
    message: t('settings-pin-removed'),
    type: 'positive',
  });
};
</script>
