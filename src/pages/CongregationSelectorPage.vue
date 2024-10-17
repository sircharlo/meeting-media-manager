<template>
  <q-page padding>
    <q-list v-if="Object.keys(congregations).length">
      <!-- @vue-ignore-->
      <div
        v-for="(prefs, id) in congregations"
        :key="id"
        v-ripple
        :class="
          'media-section cursor-pointer congregation ' +
          (currentCongregation === id ? 'active' : '')
        "
        @click="chooseCongregation(id)"
        @mouseleave="hoveredCongregation = null"
        @mouseover="hoveredCongregation = id"
      >
        <q-item class="items-center">
          <div class="col">
            <div
              :class="
                'text-subtitle1 row ' +
                (currentCongregation === id ? 'text-primary' : '')
              "
            >
              {{ congregations[id]?.congregationName || $t('noName') }}
            </div>
            <div class="row text-caption text-grey">
              <template v-if="congregations[id]?.disableMediaFetching">
                {{ $t('no-regular-meetings') }}
              </template>
              <template
                v-else-if="
                  parseInt(congregations[id]?.mwDay) >= 0 &&
                  parseInt(congregations[id]?.weDay) >= 0
                "
              >
                {{
                  getDateLocale(congregations[id].localAppLang).days[
                    parseInt(congregations[id]?.mwDay) === 6
                      ? 0
                      : parseInt(congregations[id]?.mwDay) + 1
                  ]
                }}
                {{ congregations[id]?.mwStartTime }} |
                {{
                  getDateLocale(congregations[id].localAppLang).days[
                    parseInt(congregations[id]?.weDay) === 6
                      ? 0
                      : parseInt(congregations[id]?.weDay) + 1
                  ]
                }}
                {{ congregations[id]?.weStartTime }}
              </template>
              <template v-else-if="invalidSettings(id)">{{
                $t('incomplete-configuration')
              }}</template>
            </div>
          </div>
          <div class="col-shrink">
            <q-btn
              :class="
                (hoveredCongregation !== id ? 'invisible' : '') + ' q-mr-lg'
              "
              :label="$t('delete')"
              color="negative"
              flat
              icon="mmm-delete"
              size="md"
              @click.stop="congToDelete = id"
            />
            <q-icon
              :class="
                currentCongregation === id ? 'text-primary' : 'text-accent-300'
              "
              :name="
                currentCongregation === id
                  ? 'mmm-radio-button-checked'
                  : 'mmm-radio-button-unchecked'
              "
              size="sm"
            />
          </div>
        </q-item>
      </div>
    </q-list>
  </q-page>
  <q-dialog v-model="deletePending">
    <q-card class="modal-confirm">
      <q-card-section
        class="row items-center text-bigger text-semibold text-negative q-pb-none"
      >
        <q-icon class="q-mr-sm" name="mmm-delete" />
        {{ $t('profile-deletion') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{
          $t('are-you-sure-you-want-to-delete-this-profile', {
            profileName: congregations[congToDelete]?.congregationName,
          })
        }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn :label="$t('cancel')" flat @click="congToDelete = ''" />
        <q-btn
          :label="$t('delete')"
          color="negative"
          flat
          @click="
            deleteCongregation(congToDelete);
            congToDelete = '';
          "
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { errorCatcher } from 'src/helpers/error-catcher';
import { downloadSongbookVideos } from 'src/helpers/jw-media';
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const { getDateLocale } = useLocale();

const congregationSettings = useCongregationSettingsStore();
const currentState = useCurrentStateStore();
const jwStore = useJwStore();
const { updateYeartext } = jwStore;
const { congregationCount, congregations } = storeToRefs(congregationSettings);
const { createCongregation, deleteCongregation } = congregationSettings;
const { invalidSettings, setCongregation } = currentState;
const { currentCongregation } = storeToRefs(currentState);
const route = useRoute();
const router = useRouter();
const congToDelete = ref<number | string>('');
const deletePending = computed(() => {
  return !!congToDelete.value;
});
const hoveredCongregation = ref<number | string>('');

function chooseCongregation(
  congregation: number | string,
  initialLoad?: boolean,
) {
  try {
    const invalidSettings = setCongregation(congregation);
    if (congregation) {
      updateYeartext();
      downloadSongbookVideos();
      if (initialLoad) {
        // if (initialLoad || invalidSettings)
        router.push('/setup-wizard');
      } else {
        if (invalidSettings) {
          router.push('/settings');
        } else {
          router.push('/media-calendar/initial');
        }
      }
    }
  } catch (error) {
    errorCatcher(error);
    router.push('/');
  }
}

const isHomePage = computed(() => {
  return route?.path === '/initial-congregation-selector';
});

function createNewCongregation() {
  chooseCongregation(createCongregation(), true);
}

if (congregationCount.value === 0) {
  createNewCongregation();
} else if (congregationCount.value === 1 && isHomePage.value) {
  chooseCongregation(Object.keys(congregations.value)[0]);
} else if (!isHomePage.value) {
  chooseCongregation('');
}

onMounted(() => {
  window.addEventListener('createNewCongregation', createNewCongregation);
});

onUnmounted(() => {
  window.removeEventListener('createNewCongregation', createNewCongregation);
});
</script>
