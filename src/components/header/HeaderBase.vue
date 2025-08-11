<template>
  <q-header
    bordered
    class="bg-primary text-white text-bigger text-weight-medium"
  >
    <DialogAbout
      ref="aboutInfo"
      v-model="aboutModal"
      :dialog-id="dialogId"
      @hide="aboutModal = false"
    />
    <div class="row items-center q-mr-md">
      <q-btn
        round
        style="width: 56px; height: 56px"
        unelevated
        @click="aboutModal = true"
      >
        <q-avatar>
          <q-img
            loading="lazy"
            src="~assets/img/logo-no-background.svg"
            width="40px"
          />
          <q-badge
            v-if="!aboutInfo?.updatesEnabled"
            color="warning"
            floating
            style="top: -1px; right: 0px"
          >
            <q-icon name="mmm-updates-disabled" size="small" />
          </q-badge>
          <q-badge
            v-else-if="aboutInfo?.betaUpdatesEnabled"
            color="negative"
            floating
            label="β"
            style="top: -1px; right: 0px; text-transform: none"
          />
        </q-avatar>
      </q-btn>
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
              {{ t(route.meta.title.toString()) }}
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
import DialogAbout from 'components/dialog/DialogAbout.vue';
import { storeToRefs } from 'pinia';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import HeaderCalendar from './HeaderCalendar.vue';
import HeaderCongregation from './HeaderCongregation.vue';
import HeaderSettings from './HeaderSettings.vue';
import HeaderWebsite from './HeaderWebsite.vue';

const { t } = useI18n();
const route = useRoute();

const congregationSettings = useCongregationSettingsStore();

const currentState = useCurrentStateStore();
const { currentCongregation } = storeToRefs(currentState);

const aboutModal = ref(false);
const aboutInfo = ref<InstanceType<typeof DialogAbout> | null>(null);
const dialogId = 'about-dialog';

// const hoveredLogo = ref(false);
// const activeLogo = computed(() => {
//   return hoveredLogo.value || aboutModal.value;
// });
</script>
