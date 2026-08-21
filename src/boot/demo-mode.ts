import { seedDemoData } from 'src/helpers/demo-mode';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useDemoModeStore } from 'stores/demo-mode';

import { defineBoot } from '#q-app';

// Runs before the router's initial navigation, so the fake congregation and
// media are in place before any page component mounts.
export default defineBoot(() => {
  if (globalThis.electronApi?.isDemoMode) {
    seedDemoData();
    return;
  }

  // Dev-build convenience only: offer to seed the demo congregation so a
  // fresh checkout has meeting-day data to test against immediately, without
  // manually configuring a congregation first. Only offered when there's
  // nothing real to lose - seedDemoData() replaces *all* configured
  // congregations, so this must never fire once real/test data exists.
  // Hardcoded English rather than i18n: this notification is never shown to
  // an actual congregation user, only to a developer running a local build,
  // and 'demo-mode' boots before 'i18n' in quasar.config.ts's boot order.
  if (!globalThis.electronApi?.isDev) return;

  const congregationSettingsStore = useCongregationSettingsStore();
  if (Object.keys(congregationSettingsStore.congregations).length > 0) return;

  const demoModeStore = useDemoModeStore();
  createTemporaryNotification({
    actions: [
      {
        color: 'white',
        handler: () => {
          seedDemoData();
          demoModeStore.activate();
        },
        label: 'Enable',
      },
      {
        color: 'white',
        icon: 'close',
        round: true,
      },
    ],
    caption:
      'Seeds a fake congregation with sample meeting media, so you can test meeting-day quick actions immediately.',
    message: 'No congregation configured yet — enable demo mode?',
    timeout: 0,
    type: 'info',
  });
});
