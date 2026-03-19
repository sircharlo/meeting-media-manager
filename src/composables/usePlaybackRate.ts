import { ref } from 'vue';

// Module-level singleton: shared across all components that import this
export const playbackRate = ref(1);
