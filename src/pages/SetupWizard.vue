<template>
  <q-page padding>
    <template v-if="currentSettings">
      <div class="wizard-progress-track">
        <div
          class="wizard-progress-fill"
          :style="{ width: stepProgress * 100 + '%' }"
        />
      </div>
      <q-stepper v-model="step" color="primary" vertical>
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
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn
              color="negative"
              flat
              :label="t('cancel')"
              @click="cancelSetup"
            />
            <q-btn
              class="btn-tonal"
              color="primary"
              flat
              :label="t('import-profile-settings')"
              @click="importProfileSettingsForWizard"
            />
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
            <q-btn flat :label="t('back')" @click="step--" />
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
              class="btn-tonal"
              color="primary"
              flat
              icon="mmm-search"
              :label="t('congregation-lookup')"
              @click="openCongregationLookup"
            />
          </div>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              :disable="!currentSettings?.congregationName"
              :label="t('continue')"
              @click="step = 5"
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          :done="step > 5"
          icon="mmm-media-language"
          :name="5"
          :title="t('lang')"
        >
          <p>{{ t('in-what-language-should-media-be-downloaded') }}</p>
          <SelectInput
            v-model="currentSettings.lang"
            :label="t('lang')"
            list="jwLanguages"
            use-input
          />
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('back')" @click="step = 3" />
            <q-btn
              color="primary"
              :disable="!currentSettings.lang"
              :label="t('continue')"
              @click="
                currentSettings.enableMediaDisplayButton = true;
                step = 7;
              "
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          :done="step > 7"
          icon="mmm-yeartext"
          :name="7"
          :title="
            currentLangObject?.isSignLanguage
              ? t('media-display')
              : t('yeartext')
          "
        >
          <!-- This icon is from the Material Design Icons collection -->
          <p>
            {{
              currentLangObject?.isSignLanguage
                ? t('notice-the-media-window-is-now-being-displayed')
                : t('notice-the-yeartext-is-now-being-displayed')
            }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('back')" @click="step = 5" />
            <q-btn
              color="primary"
              :label="t('continue')"
              @click="
                step = !regularProfile ? 200 : scheduleAppliedViaLookup ? 9 : 8
              "
            />
          </q-stepper-navigation>
        </q-step>

        <q-step
          v-if="regularProfile"
          :disable="!regularProfile"
          :done="step > 8"
          icon="mmm-calendar-month"
          :name="8"
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
            <TimeInput
              v-model="currentSettings.mwStartTime"
              :options="['meetingTime']"
            />
          </p>
          <p class="text-subtitle2">{{ t('weekend-meeting') }}</p>
          <p class="q-gutter-sm row">
            <SelectInput v-model="currentSettings.weDay" list="days" />
            <TimeInput
              v-model="currentSettings.weStartTime"
              :options="['meetingTime']"
            />
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('back')" @click="step--" />
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
          :done="step > 9"
          icon="mmm-download"
          :name="9"
          :title="t('songbook-video-caching')"
        >
          <p class="text-subtitle1">
            {{ t('would-you-like-to-enable-songbook-video-caching') }}
          </p>
          <p>
            {{ t('this-will-speed-up-media-retrieval-for-meetings') }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('back')" @click="step--" />
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
          :done="step > 10"
          icon="mmm-almost-done"
          :name="10"
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
            <q-btn flat :label="t('back')" @click="step--" />
            <q-btn
              color="primary"
              :label="t('continue')"
              @click="
                fetchMedia();
                step = 200;
              "
            />
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
            <q-btn flat :label="t('back')" @click="step = 200" />
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
          v-if="step >= 200"
          :done="step > 200"
          icon="mmm-integrations"
          :name="200"
          :title="t('zoomEnable')"
        >
          <p class="text-subtitle1">
            {{ t('would-you-like-to-integrate-zoom') }}
          </p>
          <p>
            {{ t('zoom-integration-explain') }}
          </p>
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn
              flat
              :label="t('back')"
              @click="step = regularProfile ? 10 : 7"
            />
            <q-btn flat :label="t('no')" @click="step = 103" />
            <q-btn
              color="primary"
              :label="t('yes')"
              @click="
                currentSettings.zoomEnable = true;
                step = 201;
              "
            />
          </q-stepper-navigation>
        </q-step>
        <q-step
          v-if="step >= 201 && currentSettings?.zoomEnable"
          :disable="!currentSettings?.zoomEnable"
          :done="step > 201"
          icon="mmm-integrations"
          :name="201"
          :title="t('zoomScreenShareShortcut')"
        >
          <p>{{ t('zoomScreenShareShortcut-explain') }}</p>
          <ShortcutInput
            v-model="currentSettings.zoomScreenShareShortcut"
            :dialog-id="'setup-wizard-zoom-shortcut'"
            shortcut-name="zoomScreenShareShortcut"
          />
          <q-stepper-navigation class="q-gutter-sm">
            <q-btn flat :label="t('back')" @click="step = 200" />
            <q-btn
              color="primary"
              :disable="!currentSettings?.zoomScreenShareShortcut"
              :label="t('continue')"
              @click="step = 300"
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
              :label="t('settings')"
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

    <!-- Congregation Lookup Dialog -->
    <DialogCongregationLookup
      v-model="showCongregationLookup"
      :dialog-id="'setup-wizard-congregation-lookup'"
      @applied="scheduleAppliedViaLookup = true"
    />
  </q-page>
</template>

<script setup lang="ts">
import type { LanguageValue } from 'src/constants/locales';

import { watchImmediate } from '@vueuse/core';
import DialogCongregationLookup from 'components/dialog/DialogCongregationLookup.vue';
import SelectInput from 'components/form-inputs/SelectInput.vue';
import ShortcutInput from 'components/form-inputs/ShortcutInput.vue';
import TextInput from 'components/form-inputs/TextInput.vue';
import TimeInput from 'components/form-inputs/TimeInput.vue';
import { storeToRefs } from 'pinia';
import { useMeta } from 'quasar';
import { removeCongregationCache } from 'src/helpers/cleanup';
import { errorCatcher } from 'src/helpers/error-catcher';
import { downloadSongbookVideos, fetchMedia } from 'src/helpers/jw-media';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { localeOptions } from 'src/i18n';
import { camelToKebabCase } from 'src/utils/general';
import { importProfileSettingsFromFile } from 'src/utils/profile-settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
useMeta({ title: t('setup-wizard') });

const currentState = useCurrentStateStore();
const { currentCongregation, currentLangObject, currentSettings, online } =
  storeToRefs(currentState);

const congregationSettings = useCongregationSettingsStore();
const { deleteCongregation } = congregationSettings;

const regularProfile = ref(false);
const scheduleAppliedViaLookup = ref(false);

const obsUsed = ref(false);
const obsIntegrate = ref(false);

const jwStore = useJwStore();
const { updateYeartext } = jwStore;
const router = useRouter();

const { getLocales } = globalThis.electronApi;

if (currentSettings.value) {
  currentSettings.value.autoStartMusic = true;
}

const importProfileSettingsForWizard = async () => {
  try {
    if (!currentSettings.value) return;

    const importedSettings = await importProfileSettingsFromFile();
    if (!importedSettings) return;

    Object.assign(currentSettings.value, importedSettings);
    regularProfile.value = !importedSettings.disableMediaFetching;
    obsUsed.value = importedSettings.obsEnable;
    obsIntegrate.value = importedSettings.obsEnable;
    step.value = 300;

    createTemporaryNotification({
      message: t('profile-settings-imported'),
      type: 'positive',
    });
  } catch (error) {
    errorCatcher(error);
    createTemporaryNotification({
      message: t('profile-settings-import-failed'),
      type: 'negative',
    });
  }
};

const loadSystemLocale = async () => {
  try {
    const systemLocales = await getLocales();
    const availableLocales = new Set(
      localeOptions.map((l) => camelToKebabCase(l.value).toLowerCase()),
    );
    let match: LanguageValue | undefined;

    for (const locale of systemLocales) {
      if (match || !currentSettings.value) break;

      const normalized = locale.toLowerCase();
      const base = normalized.split('-')[0];

      if (availableLocales.has(normalized)) {
        match = normalized as LanguageValue;
      } else if (base && availableLocales.has(base)) {
        match = base as LanguageValue;
      }
    }

    if (match && currentSettings.value) {
      currentSettings.value.localAppLang = match;
    }
  } catch (e) {
    errorCatcher(e);
  }
};

onMounted(() => {
  loadSystemLocale();
});

const goToPage = (path: string) => {
  try {
    router.push({ path });
  } catch (error) {
    errorCatcher(error);
  }
};

const cancelSetup = async () => {
  const congId = currentCongregation.value;
  deleteCongregation(congId);
  currentCongregation.value = '';
  currentState.openCongregationSwitcher();
  goToPage('/media-calendar');
  await removeCongregationCache(congId);
};

const step = ref(1);

// The wizard branches a lot (regular vs. special profile, OBS, Zoom, sign
// language...), so there's no single "step 7 of 12" that's true for every
// session. Rather than compute the exact reachable path (which would also
// need to react to earlier answers changing), this is every step name in
// the order it's reached - a reasonable, generally-forward-moving progress
// indicator - unlike a flat superset of every possible step, this only
// counts the steps actually reachable given the answers given so far, so it
// no longer jumps non-monotonically when a branch is skipped (e.g. a
// special profile skipping 8-10, or Zoom being enabled and skipping OBS
// entirely). Mirrors the exact branch conditions the q-step v-ifs and their
// own navigation buttons use below: regularProfile gates 8/9/10; from step
// 200 "yes" jumps straight to 201 then 300 (OBS is only offered if Zoom is
// declined - see step 200's "no" button); obsUsed/obsIntegrate gate 104 and
// 105-107. Before a branching question has actually been answered, this
// falls back to whatever that setting is currently persisted as (e.g. a
// previous run's answer) as a reasonable best-guess default - the total
// simply adjusts (and the bar's implied position shifts accordingly) once
// the user actually answers it, same as any progress estimate over a
// branching flow.
const reachableStepNames = computed(() => {
  const names = [1, 2, 3, 5, 7];
  if (regularProfile.value) {
    // Step 7's own continue button skips straight to 9 when the schedule
    // was already applied via the congregation lookup dialog (see its
    // @click above) - step 8 (meeting days/times) never gets shown in that
    // case, so it must be excluded here too or the bar jumps by 2 steps
    // instead of 1 when that branch is taken.
    if (!scheduleAppliedViaLookup.value) names.push(8);
    names.push(9, 10);
  }
  names.push(200);
  if (currentSettings.value?.zoomEnable) {
    names.push(201);
  } else {
    names.push(103);
    if (obsUsed.value) {
      names.push(104);
      if (obsIntegrate.value) names.push(105, 106, 107);
    }
  }
  names.push(300);
  return names;
});
const stepProgress = computed(() => {
  const names = reachableStepNames.value;
  const index = names.indexOf(step.value);
  return index === -1 ? 0 : index / (names.length - 1);
});

const showCongregationLookup = ref(false);

const openCongregationLookup = () => {
  showCongregationLookup.value = true;
};

watch(step, () => {
  nextTick(() => {
    const activeTab = document.querySelector('.q-stepper__tab--active');
    const parentStep = activeTab?.closest('.q-stepper__step');

    if (parentStep) {
      parentStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});

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
  () =>
    updateYeartext({
      isSignLanguage: currentLangObject.value?.isSignLanguage,
      lang: currentSettings.value?.lang,
      langFallback: currentSettings.value?.langFallback,
      online: online.value,
    }),
);

watchImmediate(
  () => regularProfile.value,
  (newRegularProfile) => {
    if (currentSettings.value)
      currentSettings.value.disableMediaFetching = !newRegularProfile;
  },
);
</script>

<style scoped>
.wizard-progress-track {
  background: rgba(128, 128, 128, 0.25);
  border-radius: 3px;
  height: 5px;
  margin: 0 0 1em;
  overflow: hidden;
  width: 100%;
}

.wizard-progress-fill {
  background: var(--q-primary);
  border-radius: 3px;
  height: 100%;
  transition: width 200ms ease;
}

/* One question per screen: only the active step's header is shown at all -
   Quasar's vertical stepper otherwise always renders every step's header in
   a single always-expanded list, which reads as a long checklist rather
   than a focused wizard, especially with over a dozen branching steps. None of the
   step/jump logic (`step` model, `:name`/`v-if` branching) changes - this is
   a pure presentation change on top of it, and the progress bar above takes
   over signaling "how far along" instead of the visible list of steps. */
:deep(.q-stepper__tab:not(.q-stepper__tab--active)) {
  display: none;
}

/* With neighboring tabs hidden, the connector line segments Quasar draws
   between consecutive dots would otherwise dangle toward a now-zero-size
   neighbor - the progress bar above already communicates sequence, so drop
   these entirely rather than leave a stray line fragment. */
:deep(.q-stepper__dot::before),
:deep(.q-stepper__dot::after) {
  display: none;
}

:deep(.q-stepper__tab--active .q-stepper__title) {
  font-weight: 650;
}

/* Quasar's own step transition (`animated` prop) is an accordion-style
   collapse/expand of each step's content in place, which reads as an
   inelegant "morph" now that only one step is ever visible at a time -
   dropped in favor of a plain fade+scale entrance on whichever step just
   became active. There's no matching exit animation for the outgoing step
   (Quasar removes it from the DOM immediately, before any transition could
   run) - only the incoming step animates. */
@media (prefers-reduced-motion: no-preference) {
  :deep(.q-stepper__step-content) {
    animation: wizard-step-enter 260ms ease-out;
  }

  /* The header (icon + title) toggles via the display:none rule above
     rather than unmounting, but a display:none -> displayed transition
     still restarts a CSS animation same as a fresh insertion would - so
     this fires every time a step becomes active, same as the body, instead
     of the title just snapping in on its own. */
  :deep(.q-stepper__tab--active) {
    animation: wizard-step-enter 260ms ease-out;
  }
}

@keyframes wizard-step-enter {
  from {
    opacity: 0;
    transform: scale(0.97);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
