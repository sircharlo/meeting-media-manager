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
              {{ congregations[id]?.congregationName || t('noName') }}
            </div>
            <div class="row text-caption text-grey">
              <template v-if="congregations[id]?.disableMediaFetching">
                {{ t('no-regular-meetings') }}
              </template>
              <template
                v-else-if="
                  parseInt(congregations[id]?.mwDay ?? '') >= 0 &&
                  parseInt(congregations[id]?.weDay ?? '') >= 0
                "
              >
                {{
                  getDateLocale(congregations[id]?.localAppLang).days[
                    parseInt(congregations[id]?.mwDay ?? '') === 6
                      ? 0
                      : parseInt(congregations[id]?.mwDay ?? '') + 1
                  ]
                }}
                {{ congregations[id]?.mwStartTime }} |
                {{
                  getDateLocale(congregations[id]?.localAppLang).days[
                    parseInt(congregations[id]?.weDay ?? '') === 6
                      ? 0
                      : parseInt(congregations[id]?.weDay ?? '') + 1
                  ]
                }}
                {{ congregations[id]?.weStartTime }}
              </template>
              <template v-else-if="invalidSettings(id)">
                {{ t('incomplete-configuration') }}
              </template>
            </div>
          </div>
          <div class="col-shrink">
            <q-btn
              :class="
                (hoveredCongregation !== id ? 'invisible' : '') + ' q-mr-lg'
              "
              color="negative"
              flat
              icon="mmm-delete"
              :label="t('delete')"
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
        {{ t('profile-deletion') }}
      </q-card-section>
      <q-card-section class="row items-center">
        {{
          t('are-you-sure-you-want-to-delete-this-profile', {
            profileName: congregations[congToDelete]?.congregationName,
          })
        }}
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn flat :label="t('cancel')" @click="congToDelete = ''" />
        <q-btn
          color="negative"
          flat
          :label="t('delete')"
          @click="
            removeCongregation(congToDelete);
            congToDelete = '';
          "
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMeta } from 'quasar';
import { useLocale } from 'src/composables/useLocale';
import { errorCatcher } from 'src/helpers/error-catcher';
import { downloadSongbookVideos } from 'src/helpers/jw-media';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { getAdditionalMediaPath, getPublicationsPath } from 'src/utils/fs';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { getDateLocale } = useLocale();
const { t } = useI18n({ useScope: 'global' });
useMeta({ title: t('titles.profileSelection') });

const appSettings = useAppSettingsStore();

const { migrations } = storeToRefs(appSettings);
const { runMigration } = appSettings;

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

useEventListener(window, 'createNewCongregation', createNewCongregation, {
  passive: true,
});

const autoSelectCongregation = () => {
  if (congregationCount.value === 0) {
    createNewCongregation();
  } else if (congregationCount.value === 1 && isHomePage.value) {
    const id = Object.keys(congregations.value)[0];
    if (id) chooseCongregation(id);
  } else if (!isHomePage.value) {
    chooseCongregation('');
  }
};

const removeCongregation = async (id: number | string) => {
  deleteCongregation(id);
  try {
    window.electronApi.fs.remove(
      window.electronApi.path.join(
        await getAdditionalMediaPath(currentState.currentSettings?.cacheFolder),
        `${id}`,
      ),
    );
    window.electronApi.fs.remove(
      window.electronApi.path.join(
        await getPublicationsPath(currentState.currentSettings?.cacheFolder),
        `S-34mp_${id}`,
      ),
    );
  } catch (error) {
    errorCatcher(error);
  }
};

const runMigrations = async () => {
  const migrationsToRun = [
    'firstRun',
    'localStorageToPiniaPersist',
    'addBaseUrlToAllCongregations',
  ];

  for (const migration of migrationsToRun) {
    if (!migrations.value?.includes(migration)) {
      const success = await runMigration(migration);
      if (migration === 'firstRun' && success) {
        createTemporaryNotification({
          caption: t('successfully-migrated-from-the-previous-version'),
          icon: 'mmm-info',
          message: t('welcome-to-mmm'),
          timeout: 15000,
          type: 'positive',
        });
      }
    }
  }
};
onMounted(() => {
  runMigrations().then(autoSelectCongregation);
});
</script>
