<template>
  <div class="zoom-status-row row items-start no-wrap q-py-xs">
    <div class="zoom-status-row__icon q-mr-sm" :class="`text-${color}`">
      <q-spinner v-if="status === 'running'" size="16px" />
      <q-icon v-else :name="icon" size="16px" />
    </div>
    <div class="col">
      <div class="text-weight-medium">{{ text }}</div>
      <div v-if="detail" class="text-caption text-grey">{{ detail }}</div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  detail?: string;
  status: 'failed' | 'passed' | 'pending' | 'running';
  text: string;
}>();

const icon = computed(() => {
  if (props.status === 'passed') return 'mmm-check';
  if (props.status === 'failed') return 'mmm-error';
  return 'mmm-radio-button-unchecked';
});

const color = computed(() => {
  if (props.status === 'passed') return 'positive';
  if (props.status === 'failed') return 'negative';
  if (props.status === 'running') return 'primary';
  return 'grey';
});
</script>

<style scoped>
.zoom-status-row__icon {
  align-items: center;
  display: flex;
  height: 1.5em;
}
</style>
