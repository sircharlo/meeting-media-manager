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
          <q-icon
            v-if="route.meta.icon"
            class="q-mr-md"
            :name="route.meta.icon.toString()"
            size="md"
          />
        </div>
        <div class="col items-center">
          <div class="row text-current-page">
            <div v-if="route.meta.title" class="ellipsis">
              {{ $t(route.meta.title.toString()) }}
            </div>
          </div>
          <div
            v-if="!route.fullPath.includes('congregation-selector')"
            class="row text-congregation"
          >
            <div class="ellipsis">
              {{
                congregationSettings?.congregations?.[currentCongregation]
                  ?.congregationName
              }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-shrink q-gutter-x-sm">
        <HeaderCongregation
          v-if="route.fullPath.includes('congregation-selector')"
        />
        <HeaderCalendar
          v-else-if="route.fullPath.includes('/media-calendar')"
        />
        <HeaderSettings v-else-if="route.fullPath.includes('/settings')" />
        <HeaderWebsite
          v-else-if="route.fullPath.includes('/present-website')"
        />
      </div>
    </div>
  </q-header>
</template>
<script setup lang="ts">
// Packages
import { storeToRefs } from 'pinia';
// Components
import DialogAbout from 'src/components/dialog/DialogAbout.vue';
// Stores
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useCurrentStateStore } from 'src/stores/current-state';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

// Sub-components
import HeaderCalendar from './HeaderCalendar.vue';
import HeaderCongregation from './HeaderCongregation.vue';
import HeaderSettings from './HeaderSettings.vue';
import HeaderWebsite from './HeaderWebsite.vue';

const route = useRoute();

const congregationSettings = useCongregationSettingsStore();

const currentState = useCurrentStateStore();
const { currentCongregation } = storeToRefs(currentState);

const aboutModal = ref(false);
</script>
