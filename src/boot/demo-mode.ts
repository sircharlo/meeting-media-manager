import { seedDemoData } from 'src/helpers/demo-mode';

import { defineBoot } from '#q-app';

// Runs before the router's initial navigation, so the fake congregation and
// media are in place before any page component mounts.
export default defineBoot(() => {
  if (globalThis.electronApi?.isDemoMode) seedDemoData();
});
