<template>
  <q-header
    bordered
    class="bg-primary text-white text-bigger text-weight-medium"
  >
    <DialogAbout v-model="aboutModal" />
    <div class="row items-center q-my-sm q-mr-md">
      <div
        class="row justify-center cursor-pointer"
        style="width: 56px"
        @click="aboutModal = true"
      >
        <img src="logo-no-background.svg" />
      </div>
      <q-separator class="bg-semi-white-24 q-ml-none" inset vertical />
      <div class="col q-ml-md flex items-center">
        <div class="col-shrink items-center">
          <q-icon :name="route.meta.icon as string" class="q-mr-md" size="md" />
        </div>
        <div class="col items-center">
          <div class="row text-current-page ellipsis-1-line">
            {{ $t(route.meta.title as string) }}
          </div>
          <div
            v-if="!route.fullPath.includes('congregation-selector')"
            class="row text-congregation ellipsis-1-line"
          >
            {{
              congregationSettings?.congregations?.[currentCongregation]
                ?.congregationName
            }}
          </div>
        </div>
      </div>
      <div class="col-shrink q-gutter-x-sm">
        <HeaderCongregation
          v-if="route.fullPath.includes('congregation-selector')"
        />
        <HeaderCalendar v-else-if="route.fullPath.includes('/media-calendar')" />
        <HeaderSettings v-else-if="route.fullPath.includes('/settings')" />
        <HeaderWebsite v-else-if="route.fullPath.includes('/present-website')" />
      </div>
    </div>
  </q-header>
</template>
<script setup lang="ts">
// Packages
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

// Components
import DialogAbout from 'src/components/dialog/DialogAbout.vue';

// Sub-components
import HeaderCalendar from './HeaderCalendar.vue';
import HeaderCongregation from './HeaderCongregation.vue';
import HeaderSettings from './HeaderSettings.vue';
import HeaderWebsite from './HeaderWebsite.vue';

// Stores
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useCurrentStateStore } from 'src/stores/current-state';

const route = useRoute();

const congregationSettings = useCongregationSettingsStore();

const currentState = useCurrentStateStore();
const { currentCongregation } = storeToRefs(currentState);

const aboutModal = ref(false);
</script>
