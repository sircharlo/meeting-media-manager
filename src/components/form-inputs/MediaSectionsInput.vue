<template>
  <q-select
    v-model="sortedModel"
    class="bg-accent-100"
    dense
    emit-value
    hide-bottom-space
    map-options
    multiple
    :option-disable="(opt: SectionOption) => !!opt.header"
    :options="options"
    outlined
    style="width: 320px"
    use-chips
  >
    <template #option="scope">
      <q-item-label v-if="scope.opt.header" class="text-dark-grey" header>
        {{ scope.opt.label }}
      </q-item-label>
      <q-item v-else v-bind="scope.itemProps">
        <q-item-section side>
          <q-checkbox
            dense
            :model-value="scope.selected"
            @update:model-value="scope.toggleOption(scope.opt)"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import type { MediaSectionIdentifier } from 'src/types';

import {
  CO_WEEK_ADDITIONAL_SECTION,
  CUSTOM_MEDIA_SECTIONS_ID,
  MW_MEETING_SECTIONS,
  WE_MEETING_SECTIONS,
} from 'src/constants/media';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface SectionOption {
  header?: boolean;
  label: string;
  value?: MediaSectionIdentifier;
}

const OTHER_MEETING_SECTIONS: MediaSectionIdentifier[] = [
  CO_WEEK_ADDITIONAL_SECTION,
  CUSTOM_MEDIA_SECTIONS_ID,
];

// Matches the display order of `options` below, so selected chips always
// read in the same midweek / weekend / other order as the dropdown list.
const SECTION_ORDER: MediaSectionIdentifier[] = [
  ...MW_MEETING_SECTIONS,
  ...WE_MEETING_SECTIONS,
  ...OTHER_MEETING_SECTIONS,
];

const sortSections = (values: MediaSectionIdentifier[]) =>
  [...values].sort(
    (a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b),
  );

const model = defineModel<MediaSectionIdentifier[]>({ required: true });

const sortedModel = computed<MediaSectionIdentifier[]>({
  get: () => sortSections(model.value),
  set: (value) => {
    model.value = sortSections(value);
  },
});

const { t } = useI18n();

const options = computed<SectionOption[]>(() => [
  { header: true, label: t('midweek-meeting') },
  ...MW_MEETING_SECTIONS.map((value) => ({ label: t(value), value })),
  { header: true, label: t('weekend-meeting') },
  ...WE_MEETING_SECTIONS.map((value) => ({ label: t(value), value })),
  { header: true, label: t('other-sections') },
  ...OTHER_MEETING_SECTIONS.map((value) => ({ label: t(value), value })),
]);
</script>
