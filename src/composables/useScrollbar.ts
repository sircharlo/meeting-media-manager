import { useQuasar } from 'quasar';
import { computed } from 'vue';

export function useScrollbar() {
  const $q = useQuasar();

  const thumbStyle = computed(() => {
    return {
      backgroundColor: $q.dark.isActive
        ? 'rgba(255, 255, 255, 0.9)'
        : 'rgba(0, 0, 0, 0.9)',
      borderRadius: '5px',
      opacity: '0.75',
      // right: '100px',
      width: '8px',
    };
  });

  const barStyle = computed(() => {
    return {
      backgroundColor: $q.dark.isActive
        ? 'rgba(255, 255, 255, 0.75)'
        : 'rgba(0, 0, 0, 0.75)',
      borderRadius: '9px',
      opacity: '0.2',
      // right: '2px',
      width: '8px',
    };
  });

  return { barStyle, thumbStyle };
}
