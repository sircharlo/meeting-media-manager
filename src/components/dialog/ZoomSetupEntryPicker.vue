<template>
  <div class="text-subtitle2 q-mt-md q-mb-xs">{{ question }}</div>
  <div class="zoom-entry-picker action-popup__scroll">
    <template v-for="group in groups" :key="group.label">
      <div class="text-caption text-grey q-mt-xs">{{ t(group.label) }}</div>
      <q-option-group
        v-model="selected"
        dense
        :options="
          group.entries.map((entry) => ({
            label: entry,
            value: entry,
          }))
        "
        type="radio"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

// The user picks one of Zoom's toolbar or "More" entries (named in their
// Zoom language), e.g. the one that shares the screen.
const props = defineProps<{
  /** Toolbar and "More" entries; or `groups`, for entries from elsewhere. */
  entries?: { more: string[]; toolbar: string[] };
  /** Entries by group, each under an i18n label (in place of `entries`). */
  groups?: { entries: string[]; label: string }[];
  /** List the "More" menu's entries first. */
  moreFirst?: boolean;
  question: string;
}>();

const selected = defineModel<null | string>({ required: true });

const { t } = useI18n();

const groups = computed(() => {
  if (props.groups) return props.groups.filter((group) => group.entries.length);
  if (!props.entries) return [];
  const toolbar = {
    entries: props.entries.toolbar,
    label: 'zoom-setup-share-in-toolbar',
  };
  const more = {
    entries: props.entries.more,
    label: 'zoom-setup-share-in-more',
  };
  const ordered = props.moreFirst ? [more, toolbar] : [toolbar, more];
  return ordered.filter((group) => group.entries.length);
});
</script>

<style scoped>
.zoom-entry-picker {
  max-height: 180px;
  overflow: auto;
}
</style>
