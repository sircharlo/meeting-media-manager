<template>
  <DialogCongregationLookup v-model="showCongregationLookup" />
  <q-page padding>
    <template v-if="currentSettings">
      <q-stepper v-model="step" animated color="primary" vertical>
        <q-step
          :done="step > 1"
          icon="mmm-ui-language"
          :name="1"
          :title="t('setupWizard.welcome')"
        >
          <p>{{ t('setupWizard.intro') }}</p>
          <p>{{ t('what-language-would-you-like-m-to-be-displayed-in') }}</p>
          <SelectInput
            v-model="currentSettings.localAppLang"
            list="appLanguages"
          />
          <!-- :label="t('localAppLang')" -->
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn
              color="negative"
              flat
              :label="t('cancel')"
              @click="
                deleteCongregation(currentCongregation);
                currentCongregation = '';
                goToPage('/congregation-selector');
              "
            />
            <!-- <q-btn :label="t('continue')" color="primary" @click="step++" />
        </q-stepper-navigation>
        <q-stepper-navigation class="q-gutter-sm">
          <q-btn :label="t('back')" color="negative" flat @click="step--" /> -->
            <q-btn
              color="primary"
              :disable="!currentSettings.localAppLang"
              :label="t('continue')"
              @click="step++"
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          :done="step > 2"
          icon="mmm-lectern"
          :name="2"
          :title="t('how-will-the-app-be-used')"
        >
          <p>{{ t('what-kind-of-profile-is-this') }}</p>
          <p>{{ t('profile-type-regular') }}</p>
          <p>{{ t('profile-type-special') }}</p>
          <p>{{ t('profile-type-choose-regular') }}</p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn color="negative" flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              flat
              :label="t('other')"
              @click="
                regularProfile = false;
                step++;
              "
            />
            <q-btn
              color="primary"
              :label="t('regular')"
              @click="
                regularProfile = true;
                step++;
              "
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          :done="step > 3"
          icon="mmm-rename"
          :name="3"
          :title="t('profile-name')"
        >
          <!-- This icon is from the Material Design Icons collection -->
          <p>
            {{
              t(
                'the-name-of-your-congregation-or-group-will-be-used-to-quickly-switch-between-profiles-if-ever-you-decide-create-more-than-one-in-the-future',
              )
            }}
          </p>
          <div class="q-gutter-sm row">
            <TextInput v-model="currentSettings.congregationName" />
            <q-btn
              v-if="regularProfile"
              color="primary"
              icon="mmm-search"
              :label="t('congregation-lookup')"
              outline
              @click="showCongregationLookup = true"
            />
          </div>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn color="negative" flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              :disable="!currentSettings?.congregationName"
              :label="t('continue')"
              @click="step++"
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          :done="step > 4"
          icon="mmm-download"
          :name="4"
          :title="t('cacheFolder')"
        >
          <p>{{ t('cacheFolder-explain') }}</p>
          <p>{{ t('cacheFolder-wizard') }}</p>
          <FolderInput v-model="currentSettings.cacheFolder" />
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn color="negative" flat :label="t('back')" @click="step--" />
            <q-btn color="primary" :label="t('continue')" @click="step++" />
          </q-stepper-navigation>
        </q-step>
        <q-step
          :done="step > 5"
          icon="mmm-media-language"
          :name="5"
          :title="t('lang')"
        >
          <p>{{ t('in-what-language-should-media-be-downloaded') }}</p>
          <SelectInput v-model="currentSettings.lang" list="jwLanguages" />
          <!-- use-input -->
          <!-- :label="t('lang')" -->
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn color="negative" flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              :disable="!currentSettings.lang"
              :label="t('continue')"
              @click="
                currentSettings.enableMediaDisplayButton = true;
                step++;
              "
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          :done="step > 6"
          icon="mmm-yeartext"
          :name="6"
          :title="t('yeartext')"
        >
          <!-- This icon is from the Material Design Icons collection -->
          <p>
            {{
              t(
                'notice-the-yeartext-is-now-being-displayed-on-the-external-monitor-but-lets-keep-going',
              )
            }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn color="negative" flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              :label="t('continue')"
              @click="step = regularProfile ? step + 1 : 103"
            />
          </q-stepper-navigation>
        </q-step>

        <q-step
          v-if="regularProfile"
          :disable="!regularProfile"
          :done="step > 7"
          icon="mmm-calendar-month"
          :name="7"
          :title="t('setupWizard.meetingDaysTimes')"
        >
          <p>
            {{
              t(
                'what-are-your-meeting-days-and-times-well-use-this-info-to-display-the-media-calendar',
              )
            }}
          </p>
          <p class="text-subtitle2">{{ t('midweek-meeting') }}</p>
          <p class="q-gutter-sm row">
            <SelectInput v-model="currentSettings.mwDay" list="days" />
            <!-- :label="t('mwDay')" -->
            <TimeInput
              v-model="currentSettings.mwStartTime"
              :options="['meetingTime']"
            />
            <!-- :label="t('mwStartTime')" -->
          </p>
          <p class="text-subtitle2">{{ t('weekend-meeting') }}</p>
          <p class="q-gutter-sm row">
            <SelectInput v-model="currentSettings.weDay" list="days" />
            <!-- :label="t('weDay')" -->
            <TimeInput
              v-model="currentSettings.weStartTime"
              :options="['meetingTime']"
            />
            <!-- :label="t('weStartTime')" -->
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn color="negative" flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              :disable="
                !currentSettings.mwDay ||
                !currentSettings.mwStartTime ||
                !currentSettings.weDay ||
                !currentSettings.weStartTime
              "
              :label="t('continue')"
              @click="step++"
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          v-if="regularProfile"
          :disable="!regularProfile"
          :done="step > 8"
          icon="mmm-download"
          :name="8"
          :title="t('songbook-video-caching')"
        >
          <p class="text-subtitle1">
            {{ t('would-you-like-to-enable-songbook-video-caching') }}
          </p>
          <p>
            {{ t('this-will-speed-up-media-retrieval-for-meetings') }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('no')" @click="step++" />
            <q-btn
              color="primary"
              :label="t('yes')"
              @click="
                currentSettings.enableExtraCache = true;
                downloadSongbookVideos();
                step++;
              "
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          v-if="regularProfile"
          :disable="!regularProfile"
          :done="step > 9"
          icon="mmm-almost-done"
          :name="9"
          :title="t('almost-done')"
        >
          <p>
            {{
              t(
                'well-start-fetching-media-while-we-wrap-up-with-our-initial-setup',
              )
            }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn color="negative" flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              :label="t('continue')"
              @click="
                fetchMedia();
                downloadBackgroundMusic();
                step = 101;
              "
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          v-if="regularProfile"
          :disable="!regularProfile"
          :done="step > 101"
          icon="mmm-stream-now"
          :name="101"
          :title="t('media-display')"
        >
          <p>
            {{ t('look-for-this-button-in-m-s-footer') }}
            <q-btn
              class="super-rounded q-ml-sm"
              color="primary"
              disable
              icon="mmm-media-display-active"
              outline
            />
          </p>
          <p>
            {{
              t(
                'clicking-it-will-allow-you-to-temporarily-hide-the-media-and-yeartext-and-reveal-the-zoom-participants-underneath-once-the-zoom-part-is-over-you-can-show-the-yeartext-again-using-the-same-button',
              )
            }}
          </p>
          <p>
            {{
              t(
                'to-quickly-show-and-hide-zoom-participants-on-the-tv-screens-when-needed-make-sure-that-the-setting-to-use-dual-monitors-in-zoom-is-enabled',
              )
            }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn color="negative" flat :label="t('back')" @click="step = 9" />
            <q-btn color="primary" :label="t('continue')" @click="step++" />
          </q-stepper-navigation>
        </q-step>
        <q-step
          v-if="regularProfile"
          :disable="!regularProfile"
          :done="step > 102"
          icon="mmm-music-note"
          :name="102"
          :title="t('setupWizard.backgroundMusic')"
        >
          <p>
            {{ t('also-look-for-this-button-in-m-s-footer') }}
            <q-btn
              class="super-rounded q-ml-sm"
              color="primary"
              disable
              icon="mmm-music-note"
              outline
            />
          </p>
          <p>
            {{
              t(
                'clicking-it-will-allow-you-to-start-and-stop-the-playback-of-background-music-music-will-start-playing-automatically-before-a-meeting-is-scheduled-to-start-when-m-is-launched-and-will-also-stop-automatically-before-the-meeting-starts-however-background-music-playback-will-need-to-be-manually-started-after-the-closing-prayer-using-this-button',
              )
            }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn color="negative" flat :label="t('back')" @click="step--" />
            <q-btn color="primary" :label="t('continue')" @click="step++" />
          </q-stepper-navigation>
        </q-step>
        <q-step
          :done="step > 103"
          icon="mmm-obs-studio"
          :name="103"
          :title="t('obsEnable')"
        >
          <p class="text-subtitle1">
            {{ t('does-your-kingdom-hall-use-a-program-called-obs-studio') }}
          </p>
          <p>
            {{
              t(
                'obs-studio-is-a-free-app-used-to-manage-camera-and-video-feeds-in-many-kingdom-halls',
              )
            }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn
              flat
              :label="t('no')"
              @click="
                obsUsed = false;
                step = 300;
              "
            />
            <q-btn
              color="primary"
              :label="t('yes')"
              @click="
                obsUsed = true;
                step++;
              "
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          v-if="obsUsed"
          :disable="!obsUsed"
          :done="step > 104"
          icon="mmm-obs-studio"
          :name="104"
          :title="t('obs-studio-integration')"
        >
          <p class="text-subtitle1">
            {{ t('would-you-like-to-integrate-m-with-obs-studio') }}
          </p>
          <p>
            {{
              t(
                'doing-so-will-greatly-simplify-and-facilitate-sharing-media-during-hybrid-meetings',
              )
            }}
          </p>
          <p>
            {{
              t(
                'configure-the-websocket-plugin-in-obs-studio-the-virtual-camera-plugin-is-also-required-so-make-sure-its-installed-and-configured-as-well',
              )
            }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('back')" @click="step--" />
            <q-btn
              flat
              :label="t('no')"
              @click="
                obsIntegrate = false;
                step = 300;
              "
            />
            <q-btn
              color="primary"
              :label="t('yes')"
              @click="
                obsIntegrate = true;
                step++;
              "
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          v-if="obsUsed && obsIntegrate"
          :disable="!obsUsed || !obsIntegrate"
          :done="step > 105"
          icon="mmm-obs-password"
          :name="105"
          :title="t('obs-studio-port-and-password')"
        >
          <p>
            {{
              t(
                'enter-the-port-and-password-configured-in-obs-studios-websocket-plugin',
              )
            }}
          </p>
          <TextInput
            v-model="currentSettings.obsPort"
            :actions="['obsConnect']"
            class="q-mb-md"
            :label="t('obsPort')"
          />
          <TextInput
            v-model="currentSettings.obsPassword"
            :actions="['obsConnect']"
            :label="t('obsPassword')"
          />
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              :disable="
                !currentSettings.obsPort || !currentSettings.obsPassword
              "
              :label="t('continue')"
              @click="step++"
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          v-if="obsUsed && obsIntegrate"
          :disable="!obsUsed || !obsIntegrate"
          :done="step > 106"
          icon="mmm-lectern"
          :name="106"
          :title="t('obs-studio-stage-scene')"
        >
          <p class="text-subtitle1">
            {{ t('configure-a-scene-in-obs-studio-to-show-a-stage-wide-shot') }}
          </p>
          <p>{{ t('once-the-scene-has-been-created-select-it-here') }}</p>
          <SelectInput
            v-model="currentSettings.obsCameraScene"
            list="obsScenes"
          />
          <!-- :label="t('obsCameraScene')" -->
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              :disable="!currentSettings.obsCameraScene"
              :label="t('continue')"
              @click="step++"
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          v-if="obsUsed && obsIntegrate"
          :disable="!obsUsed || !obsIntegrate"
          :done="step > 107"
          icon="mmm-media"
          :name="107"
          :title="t('obs-studio-media-scene')"
        >
          <p class="text-subtitle1">
            {{
              t('configure-a-scene-in-obs-studio-to-capture-the-media-window')
            }}
          </p>
          <p>{{ t('once-the-scene-has-been-created-select-it-here') }}</p>
          <SelectInput
            v-model="currentSettings.obsMediaScene"
            list="obsAllScenes"
          />
          <!-- :label="t('obsMediaScene')" -->
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              :disable="!currentSettings.obsMediaScene"
              :label="t('continue')"
              @click="step = 300"
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          :done="step > 300"
          icon="mmm-congratulations"
          :name="300"
          :title="t('congratulations')"
        >
          <!-- This icon is from the Material Design Icons collection -->
          <p class="text-subtitle1">{{ t('m-is-now-ready-to-be-used') }}</p>
          <p>
            {{
              t(
                'feel-free-to-browse-around-the-other-available-options-or-if-you-prefer-you-can-head-right-to-the-media-playback-screen-and-start-using-it-to-display-media',
              )
            }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn
              color="negative"
              flat
              :label="t('start-over')"
              @click="step = 1"
            />
            <q-btn
              color="primary"
              flat
              :label="t('titles.settings')"
              @click="goToPage('/settings')"
            />
            <q-btn
              color="primary"
              :label="t('media-playback')"
              @click="goToPage('/media-calendar')"
            />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { watchImmediate } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMeta } from 'quasar';
import DialogCongregationLookup from 'src/components/dialog/DialogCongregationLookup.vue';
import FolderInput from 'src/components/form-inputs/FolderInput.vue';
import SelectInput from 'src/components/form-inputs/SelectInput.vue';
import TextInput from 'src/components/form-inputs/TextInput.vue';
import TimeInput from 'src/components/form-inputs/TimeInput.vue';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  downloadBackgroundMusic,
  downloadSongbookVideos,
  fetchMedia,
} from 'src/helpers/jw-media';
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
useMeta({ title: t('setup-wizard') });

const currentState = useCurrentStateStore();
const { currentCongregation, currentSettings } = storeToRefs(currentState);

const congregationSettings = useCongregationSettingsStore();
const { deleteCongregation } = congregationSettings;

const regularProfile = ref(false);

// const usingAtKh = ref(false);
const obsUsed = ref(false);
const obsIntegrate = ref(false);

const jwStore = useJwStore();
const { updateYeartext } = jwStore;
const router = useRouter();

if (currentSettings.value) {
  currentSettings.value.autoStartMusic = true;
}

watch(
  () => obsIntegrate.value,
  (newObsIntegrate) => {
    if (newObsIntegrate && obsUsed.value && currentSettings.value) {
      currentSettings.value.obsEnable = true;
    }
  },
);

watch(
  [
    () => currentSettings.value?.lang,
    () => currentSettings?.value?.langFallback,
  ],
  () => updateYeartext(),
);

watchImmediate(
  () => regularProfile.value,
  (newRegularProfile) => {
    if (currentSettings.value)
      currentSettings.value.disableMediaFetching = !newRegularProfile;
  },
);

const goToPage = (path: string) => {
  try {
    router.push({ path });
  } catch (error) {
    errorCatcher(error);
  }
};

const step = ref(1);
const showCongregationLookup = ref(false);
</script>
