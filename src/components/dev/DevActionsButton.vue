<template>
  <!-- Dev builds only (see ActionIsland): opens the Dev actions popup.
       Orange while something is faked, so it isn't forgotten. -->
  <q-btn
    aria-label="Dev actions"
    class="super-rounded"
    :class="classes"
    :color="color"
    icon="mmm-tools"
    rounded
    :text-color="textColor"
    unelevated
    @click="open = !open"
  >
    <q-tooltip v-if="!open" :delay="1000" :offset="[14, 22]">
      Dev actions
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import {
  type IslandButtonStatus,
  useIslandButton,
} from 'src/composables/useIslandButton';
import {
  devMainFaults,
  devMeetingOverride,
  devRendererFaults,
} from 'src/helpers/dev-state';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';

const open = defineModel<boolean>({ required: true });

const currentState = useCurrentStateStore();

const faking = computed(
  () =>
    !!devMeetingOverride.value ||
    !currentState.online ||
    devRendererFaults.failFetches ||
    Object.values(devMainFaults).some(Boolean),
);

const { classes, color, textColor } = useIslandButton(
  computed<IslandButtonStatus>(() => (faking.value ? 'attention' : 'normal')),
  open,
);
</script>
