<template>
  <q-list
    v-if="element.children?.some((m) => !m.hidden)"
    bordered
    class="q-mx-sm q-my-sm media-children rounded-borders overflow-hidden"
  >
    <q-menu context-menu style="overflow-x: hidden" touch-position>
      <q-list>
        <q-item
          v-close-popup
          clickable
          :disable="!!mediaPlaying.url"
          @click="emit('update:hidden', true)"
        >
          <q-item-section avatar>
            <q-icon name="mmm-file-hidden" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('hide-from-list') }}</q-item-label>
            <q-item-label caption>
              {{ t('hide-from-list-explain') }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <q-expansion-item
      :key="element.children.map((m) => m.uniqueId).join(',')"
      v-model="isExpanded"
      :disable="
        element.children.map((m) => m.fileUrl).includes(mediaPlaying.url)
      "
      :header-class="
        isExpanded ? ($q.dark.isActive ? 'bg-accent-400' : 'bg-accent-200') : ''
      "
    >
      <template #header>
        <q-item-section>
          <div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="element.extractCaption"></span>
            <q-badge
              class="q-ml-sm text-primary"
              :color="$q.dark.isActive ? 'accent-400' : 'accent-200'"
              :label="element.children?.length"
              rounded
              :text-color="$q.dark.isActive ? 'white' : 'accent-200'"
            />
          </div>
        </q-item-section>
      </template>

      <div v-if="element.children">
        <div
          v-for="childElement in element.children"
          :key="childElement.uniqueId"
        >
          <MediaItem
            :key="childElement.uniqueId"
            v-model:repeat="childElement.repeat"
            child
            :media="childElement"
            @update:custom-duration="
              emit('update:custom-duration', $event, childElement.uniqueId)
            "
            @update:hidden="
              emit('update:child-hidden', $event, childElement.uniqueId)
            "
            @update:tag="emit('update:tag', $event, childElement.uniqueId)"
            @update:title="emit('update:title', $event, childElement.uniqueId)"
          />
        </div>
      </div>
    </q-expansion-item>
  </q-list>
</template>

<script setup lang="ts">
import type { MediaItem as MediaItemType } from 'src/types';

import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import MediaItem from './MediaItem.vue';

const currentState = useCurrentStateStore();
const { mediaPlaying } = storeToRefs(currentState);

const props = defineProps<{
  element: MediaItemType;
  expanded: boolean;
}>();

const emit = defineEmits<{
  'update:child-hidden': [value: boolean, uniqueId: string];
  'update:custom-duration': [value: string, uniqueId: string];
  'update:expanded': [value: boolean];
  'update:hidden': [value: boolean];
  'update:tag': [value: unknown, uniqueId: string];
  'update:title': [value: string, uniqueId: string];
}>();

const $q = useQuasar();
const { t } = useI18n();

const isExpanded = computed({
  get: () => props.expanded,
  set: (value) => emit('update:expanded', value),
});
</script>
