<template>
  <div class="timer-remote-addresses">
    <div class="text-caption text-dark-grey q-mb-xs">
      {{
        timerRemoteUrls.length
          ? t('timer-remote-open-on-device')
          : t('timer-remote-no-network')
      }}
    </div>
    <div
      v-for="url in timerRemoteUrls"
      :key="url"
      class="row items-center no-wrap q-gutter-x-sm"
    >
      <code class="col ellipsis timer-remote-addresses__url">{{ url }}</code>
      <q-btn
        :aria-label="t('timer-remote-copy')"
        dense
        flat
        icon="mmm-link"
        round
        size="sm"
        @click="copyRemoteUrl(url)"
      >
        <q-tooltip :delay="500">{{ t('timer-remote-copy') }}</q-tooltip>
      </q-btn>
    </div>
    <!-- Windows only: see src-electron/main/timer-remote-firewall.ts. -->
    <NoticeBanner
      v-if="firewallMessage"
      class="q-mt-sm"
      dense
      icon="mmm-warning"
      type="warning"
    >
      <div class="text-caption">{{ firewallMessage }}</div>
      <template v-if="canAllow" #action>
        <q-btn
          dense
          flat
          :label="t('timer-remote-firewall-allow')"
          :loading="allowing"
          no-caps
          @click="allowThroughFirewall"
        >
          <template #loading>
            <LiquidSpinner />
          </template>
        </q-btn>
      </template>
    </NoticeBanner>
  </div>
</template>

<script setup lang="ts">
import type { TimerRemoteFirewallState } from 'src/types';

import { watchDebounced } from '@vueuse/core';
import LiquidSpinner from 'components/ui/LiquidSpinner.vue';
import NoticeBanner from 'components/ui/NoticeBanner.vue';
import { storeToRefs } from 'pinia';
import { copyToClipboard } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getRendererPlatform } from 'src/helpers/fs';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { parseTimerRemotePort } from 'src/helpers/timer-remote';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

// Where to open the timer remote on a tablet or phone, in the timer popup
// and under the timer remote's settings. On Windows, also whether Windows
// Firewall lets those devices in, with a button to allow it.

const { t } = useI18n();

const { currentSettings, timerRemoteUrls } = storeToRefs(
  useCurrentStateStore(),
);

const port = computed(() =>
  parseTimerRemotePort(currentSettings.value?.timerRemotePort),
);

const copyRemoteUrl = async (url: string) => {
  try {
    await copyToClipboard(url);
    createTemporaryNotification({
      group: 'timer-remote',
      icon: 'mmm-link',
      message: t('timer-remote-copied'),
      type: 'positive',
    });
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'copyRemoteUrl' } } });
  }
};

const firewallState = ref<null | TimerRemoteFirewallState>(null);
const allowing = ref(false);

// Only on Windows: elsewhere there's no Windows Firewall to ask about (and
// the main process answers `unsupported` there anyway).
const isWindows = getRendererPlatform() === 'win32';

let checkId = 0;
const checkFirewall = async () => {
  const id = ++checkId;
  if (!isWindows || port.value === null || !timerRemoteUrls.value.length) {
    firewallState.value = null;
    return;
  }
  try {
    const status = await globalThis.electronApi.getTimerRemoteFirewallStatus(
      port.value,
    );
    if (id === checkId) firewallState.value = status.state;
  } catch (error) {
    // Only a hint: without it, the page still works wherever it's allowed.
    log('Could not check Windows Firewall', 'timer', 'warn', error);
    if (id === checkId) firewallState.value = null;
  }
};

const firewallMessage = computed(() => {
  switch (firewallState.value) {
    case 'blocked':
    case 'not-allowed':
      return t('timer-remote-firewall-not-allowed');
    case 'blocks-all':
      return t('timer-remote-firewall-blocks-all');
    default:
      return '';
  }
});

// A firewall set to block every incoming connection ignores the rules: only
// the user can turn that off, in Windows Security.
const canAllow = computed(
  () =>
    firewallState.value === 'blocked' || firewallState.value === 'not-allowed',
);

const notify = (message: string, type: 'negative' | 'positive' | 'warning') => {
  createTemporaryNotification({
    group: 'timer-remote-firewall',
    icon: type === 'positive' ? 'mmm-check' : 'mmm-warning',
    message,
    timeout: type === 'positive' ? undefined : 15_000,
    type,
  });
};

const allowThroughFirewall = async () => {
  if (port.value === null || allowing.value) return;
  allowing.value = true;
  try {
    const result = await globalThis.electronApi.allowTimerRemoteThroughFirewall(
      port.value,
    );
    firewallState.value = result.status.state;
    switch (result.outcome) {
      case 'allowed':
        notify(t('timer-remote-firewall-allowed'), 'positive');
        break;
      case 'cancelled':
        // Turned down on purpose: the warning stays, nothing else to say.
        break;
      case 'still-blocked':
        notify(t('timer-remote-firewall-still-blocked'), 'warning');
        break;
      default:
        notify(t('timer-remote-firewall-failed'), 'negative');
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'allowTimerRemoteThroughFirewall' } },
    });
    notify(t('timer-remote-firewall-failed'), 'negative');
  } finally {
    allowing.value = false;
  }
};

// Once on opening, then again when the port or the addresses (the networks)
// change, after a second without changes: typing a port changes it on each
// keystroke, and each check starts PowerShell. The main process also shares
// one check between the timer popup and Settings.
onMounted(checkFirewall);
watchDebounced(
  [port, () => timerRemoteUrls.value.join(' ')],
  () => checkFirewall(),
  { debounce: 1000 },
);
</script>

<style scoped>
.timer-remote-addresses__url {
  font-size: 0.85em;
  min-width: 0;
}
</style>
