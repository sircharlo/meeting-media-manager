<template>
  <q-select
    v-model="model"
    class="bg-accent-100"
    clearable
    dense
    emit-value
    hide-bottom-space
    input-debounce="150"
    :label="label"
    map-options
    multiple
    new-value-mode="add-unique"
    :options="filteredOptions"
    outlined
    spellcheck="false"
    style="width: 320px"
    use-chips
    use-input
    @filter="filterFn"
    @new-value="onNewValue"
  >
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.title }}</q-item-label>
          <q-item-label caption>{{ scope.opt.value }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template v-if="loading" #no-option>
      <q-item>
        <q-item-section class="text-accent-400">
          {{ t('loading') }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { fetchJson } from 'src/utils/api';
import { useCurrentStateStore } from 'stores/current-state';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface FilterChoice {
  optionName: string;
  optionValue: number | string;
}

interface PubOption {
  label: string;
  title: string;
  value: string;
}

defineProps<{
  label?: string;
}>();

const model = defineModel<string[]>({ required: true });

const { t } = useI18n();

const { currentLangObject } = storeToRefs(useCurrentStateStore());

const loading = ref(false);
const allOptions = ref<PubOption[]>([]);
const filteredOptions = ref<PubOption[]>([]);

const toOption = (choice: FilterChoice): PubOption => {
  const value = String(choice.optionValue).toLowerCase();
  return {
    label: `${choice.optionName} (${value})`,
    title: choice.optionName,
    value,
  };
};

async function fetchPubList(category: string) {
  const url = `https://www.jw.org/en/library/${category}/json/filters/PseudoSearchViewsFilter/`;
  const result = await fetchJson<{ choices: FilterChoice[]; id: string }>(
    url,
    new URLSearchParams({
      contentLanguageFilter: currentLangObject.value?.symbol || 'en',
      pubFilter: '',
      sortBy: '1',
    }),
  );
  return (result?.choices || []).filter(
    (c) => c.optionName && c.optionValue !== '',
  );
}

onMounted(async () => {
  loading.value = true;
  try {
    const [brochures, books] = await Promise.all([
      fetchPubList('brochures'),
      fetchPubList('books'),
    ]);
    const byValue = new Map<string, PubOption>();
    for (const choice of [...brochures, ...books]) {
      const option = toOption(choice);
      byValue.set(option.value, option);
    }
    allOptions.value = [...byValue.values()].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
    filteredOptions.value = allOptions.value;
  } catch (e) {
    errorCatcher(e);
  } finally {
    loading.value = false;
  }
});

const filterFn = (
  val: string,
  update: (arg0: { (): void; (): void }) => void,
) => {
  update(() => {
    if (!val) {
      filteredOptions.value = allOptions.value;
      return;
    }
    const needle = val.toLowerCase();
    filteredOptions.value = allOptions.value.filter(
      (o) => o.title.toLowerCase().includes(needle) || o.value.includes(needle),
    );
  });
};

const onNewValue = (
  val: string,
  done: (item?: string, mode?: 'add' | 'add-unique' | 'toggle') => void,
) => {
  const symbol = val.trim().toLowerCase();
  if (symbol) done(symbol, 'add-unique');
};
</script>
