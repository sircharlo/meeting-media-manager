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
        <div class="row items-center q-mt-sm">
          <q-btn
            v-if="canReset"
            color="primary"
            flat
            :label="t('settings-pin-forgot')"
            no-caps
            @click="resetOpen = true"
          />
          <q-btn
            class="q-ml-auto"
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

  <DialogSettingsPinReset
    v-model="resetOpen"
    :congregation-id="currentCongregation"
  />
</template>

<script setup lang="ts">
import DialogSettingsPinReset from 'components/settings/DialogSettingsPinReset.vue';
import { storeToRefs } from 'pinia';
import { useSettingsPinAttempts } from 'src/composables/useSettingsPinAttempts';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'stores/current-state';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { currentCongregation, currentSettings, settingsUnlocked } = storeToRefs(
  useCurrentStateStore(),
);

const { canReset, checkPin } = useSettingsPinAttempts(currentCongregation);

const pin = ref('');
const wrongPin = ref(false);
const checking = ref(false);
const resetOpen = ref(false);

const unlock = async () => {
  const stored = currentSettings.value?.settingsPin;
  if (!stored || checking.value) return;
  checking.value = true;
  wrongPin.value = false;
  try {
    if (await checkPin(pin.value, stored)) {
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
