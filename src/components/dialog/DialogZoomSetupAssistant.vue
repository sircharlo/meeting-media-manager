<template>
  <BaseDialog
    v-model="open"
    dialog-id="zoom-setup-assistant"
    no-backdrop-dismiss
    @hide="stopWatchingMeeting"
  >
    <q-card class="zoom-setup round-card">
      <q-card-section class="row items-center no-wrap q-pb-sm">
        <div class="icon-chip text-primary q-mr-sm">
          <q-icon name="mmm-video-meeting" size="xs" />
        </div>
        <div class="col">
          <div class="text-bigger text-semibold">
            {{ t('zoom-setup-title') }}
          </div>
          <div class="text-caption text-grey">
            {{
              t('zoom-setup-step-count', {
                current: stepIndex + 1,
                total: STEPS.length,
              })
            }}
          </div>
        </div>
        <q-btn dense flat icon="mmm-clear" round @click="open = false">
          <q-tooltip :delay="500">{{ t('close') }}</q-tooltip>
        </q-btn>
      </q-card-section>
      <div class="zoom-setup__progress q-mx-md">
        <div
          class="zoom-setup__progress-fill"
          :style="{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }"
        />
      </div>

      <q-card-section class="action-popup__scroll zoom-setup__body">
        <transition mode="out-in" name="zoom-setup-step">
          <!-- Welcome: what it does, and the helper starting up -->
          <div v-if="step === 'welcome'" key="welcome">
            <div class="text-h6 q-mb-sm">
              {{ t('zoom-setup-welcome-title') }}
            </div>
            <p>{{ t('zoom-setup-welcome-intro') }}</p>
            <div
              v-for="feature in FEATURES"
              :key="feature.text"
              class="row items-center no-wrap q-mb-sm"
            >
              <div class="icon-chip text-primary q-mr-md">
                <q-icon :name="feature.icon" size="xs" />
              </div>
              <div>{{ t(feature.text) }}</div>
            </div>
            <p class="text-caption text-grey q-mt-md">
              {{ t('zoom-setup-requirements') }}
            </p>
            <StatusRow
              :status="helperStatus"
              :text="
                helperStatus === 'failed'
                  ? t(helperErrorKey)
                  : helperStatus === 'passed'
                    ? t('zoom-setup-helper-ready')
                    : t('zoom-setup-helper-checking')
              "
            >
              <q-btn
                v-if="helperStatus === 'failed'"
                color="primary"
                dense
                flat
                :label="t('try-again')"
                no-caps
                @click="startHelper"
              />
            </StatusRow>
          </div>

          <!-- The meeting: its ID, and Zoom having it open -->
          <div v-else-if="step === 'meeting'" key="meeting">
            <div class="text-h6 q-mb-sm">
              {{ t('zoom-setup-meeting-title') }}
            </div>
            <p>{{ t('zoom-setup-meeting-intro') }}</p>
            <q-input
              v-model="meetingIdInput"
              class="q-mb-sm"
              clearable
              dense
              :error="!!meetingIdInput && !parsedMeetingId"
              :error-message="t('zoom-setup-meeting-id-invalid')"
              :label="t('zoomMeetingManagerMeetingId')"
              outlined
              spellcheck="false"
            />
            <p
              v-if="!meetingIdInput"
              class="text-caption text-warning row items-center no-wrap"
            >
              <q-icon class="q-mr-xs" name="mmm-info" size="14px" />
              {{ t('zoom-setup-meeting-id-missing') }}
            </p>
            <q-btn
              class="btn-tonal q-mb-md"
              color="primary"
              :disable="!parsedMeetingId"
              flat
              icon="mmm-arrow-outward"
              :label="t('zoom-setup-meeting-open')"
              no-caps
              @click="openMeetingInZoom"
            />
            <StatusRow
              :status="meetingFound ? 'passed' : 'running'"
              :text="
                meetingFound
                  ? t('zoom-setup-meeting-found')
                  : t('zoom-setup-meeting-waiting')
              "
            />
            <p v-if="!meetingFound" class="text-caption text-grey q-mt-sm">
              {{ t('zoom-setup-meeting-host-hint') }}
            </p>
          </div>

          <!-- Checks: everything M³ needs, found in Zoom -->
          <div v-else-if="step === 'checks'" key="checks">
            <div class="text-h6 q-mb-sm">
              {{ t('zoom-setup-checks-title') }}
            </div>
            <p>{{ t('zoom-setup-checks-intro') }}</p>
            <StatusRow
              v-for="check in checks"
              :key="check.id"
              :detail="check.status === 'failed' ? t(check.fix) : undefined"
              :status="check.status"
              :text="t(check.label)"
            />
            <!-- Zoom's Participants button couldn't be found: the user points M³ to it -->
            <template v-if="hasParticipantsEntries">
              <p class="q-mb-none q-mt-sm">
                {{ t('zoom-setup-participants-not-found') }}
              </p>
              <EntryPicker
                v-model="selectedParticipantsEntry"
                :entries="participantsEntries"
                more-first
                :question="t('zoom-setup-participants-pick')"
              />
              <p
                v-if="participantsEntryFailed"
                class="text-caption text-negative q-mb-none"
              >
                {{ t('zoom-setup-participants-not-opened') }}
              </p>
            </template>
            <!-- "Mute all" wasn't recognized (or the user isn't host): the user points M³ to it -->
            <template v-if="muteAllEntries.length">
              <p class="q-mb-none q-mt-sm">
                {{ t('zoom-setup-mute-all-not-found') }}
              </p>
              <EntryPicker
                v-model="selectedMuteAllEntry"
                :groups="[
                  {
                    entries: muteAllEntries,
                    label: 'zoom-setup-in-participants-panel',
                  },
                ]"
                :question="t('zoom-setup-mute-all-pick')"
              />
              <p
                v-if="muteAllEntryFailed"
                class="text-caption text-negative q-mb-none"
              >
                {{ t('zoom-setup-mute-all-not-opened') }}
              </p>
            </template>
            <div class="row q-gutter-sm q-mt-sm">
              <q-btn
                v-if="hasParticipantsEntries"
                class="btn-tonal"
                color="primary"
                :disable="!selectedParticipantsEntry || checking"
                flat
                :label="t('zoom-setup-share-try')"
                :loading="checking"
                no-caps
                @click="tryParticipantsEntry"
              />
              <q-btn
                v-else-if="muteAllEntries.length"
                class="btn-tonal"
                color="primary"
                :disable="!selectedMuteAllEntry || checking"
                flat
                :label="t('zoom-setup-share-try')"
                :loading="checking"
                no-caps
                @click="tryMuteAllEntry"
              />
              <q-btn
                class="btn-tonal"
                color="primary"
                :disable="checking"
                flat
                icon="mmm-refresh"
                :label="t('zoom-setup-check-again')"
                :loading="checking && !hasChecksPicker"
                no-caps
                @click="runChecks"
              />
            </div>
          </div>

          <!-- The camera button's names, in the user's Zoom language -->
          <ButtonStep
            v-else-if="step === 'video'"
            key="video"
            :choices="videoChoices"
            :done-text="
              t('zoom-setup-video-done', {
                off: currentSettings?.zoomVideoOffTitle,
                on: currentSettings?.zoomVideoOnTitle,
              })
            "
            :intro="t('zoom-setup-video-intro')"
            :question="t('zoom-setup-video-question')"
            :status="videoStatus"
            :status-text="
              videoStatus === 'failed'
                ? t('zoom-setup-video-failed')
                : t('zoom-setup-video-learning')
            "
            :title="t('zoom-setup-video-title')"
            @learn="learnVideo"
            @relearn="videoStatus = 'pending'"
          />

          <!-- The microphone button's names, once computer audio is joined -->
          <ButtonStep
            v-else-if="step === 'mic'"
            key="mic"
            :choices="micChoices"
            :done-text="
              t('zoom-setup-mic-done', {
                off: currentSettings?.zoomMicOffTitle,
                on: currentSettings?.zoomMicOnTitle,
              })
            "
            :intro="t('zoom-setup-mic-intro')"
            :question="t('zoom-setup-mic-question')"
            :status="micStatus"
            :status-text="micStatusText"
            :title="t('zoom-setup-mic-title')"
            :waiting="!micAudioJoined"
            @learn="learnMic"
            @relearn="joinAudioForMic"
          >
            <q-btn
              v-if="micStatus === 'failed' && !micAudioJoined"
              color="primary"
              dense
              flat
              :label="t('try-again')"
              no-caps
              @click="joinAudioForMic"
            />
          </ButtonStep>

          <!-- Raised hands: how Zoom marks them in the user's language -->
          <div v-else-if="step === 'hand'" key="hand">
            <div class="text-h6 q-mb-sm">{{ t('zoom-setup-hand-title') }}</div>
            <p>{{ t('zoom-setup-hand-intro') }}</p>
            <StatusRow
              v-if="handStatus !== 'pending' && !handNeedsFirstPick"
              class="q-mb-sm"
              :status="handStatus"
              :text="handStatusText"
            />
            <template v-if="hasHandEntries && handStatus !== 'passed'">
              <p v-if="handNeedsFirstPick" class="q-mb-none">
                {{ t('zoom-setup-react-not-found') }}
              </p>
              <!-- Asked for once Zoom has moved React into "More". -->
              <EntryPicker
                v-model="selectedHandEntry"
                :entries="handEntries"
                more-first
                :question="t('zoom-setup-react-pick')"
              />
            </template>
            <div class="row q-gutter-sm q-mt-sm">
              <q-btn
                v-if="!hasHandEntries && handStatus !== 'passed'"
                class="btn-tonal"
                color="primary"
                flat
                icon="mmm-groups"
                :label="t('zoom-setup-hand-learn')"
                :loading="handStatus === 'running'"
                no-caps
                @click="learnHand"
              />
              <q-btn
                v-else-if="handStatus !== 'passed'"
                class="btn-tonal"
                color="primary"
                :disable="!selectedHandEntry"
                flat
                :label="t('zoom-setup-share-try')"
                :loading="handStatus === 'running'"
                no-caps
                @click="tryHandEntry"
              />
              <q-btn
                v-else
                color="primary"
                dense
                flat
                :label="t('zoom-setup-learn-again')"
                no-caps
                @click="learnHand"
              />
            </div>
            <p class="text-caption text-grey q-mt-md">
              {{
                currentSettings?.enableTimerDisplay
                  ? t('zoom-setup-hand-timer-on')
                  : t('zoom-setup-hand-timer-off')
              }}
            </p>
          </div>

          <!-- Sharing: Zoom's share window offering the media window -->
          <div v-else-if="step === 'share'" key="share">
            <div class="text-h6 q-mb-sm">{{ t('zoom-setup-share-title') }}</div>
            <p>{{ t('zoom-setup-share-intro') }}</p>
            <StatusRow
              v-if="shareStatus !== 'pending' && !shareNeedsFirstPick"
              class="q-mb-sm"
              :status="shareStatus"
              :text="shareMessage"
            />
            <template v-if="hasShareEntries && shareStatus !== 'passed'">
              <p v-if="shareNeedsFirstPick" class="q-mb-none">
                {{ t('zoom-setup-share-not-found') }}
              </p>
              <EntryPicker
                v-model="selectedShareEntry"
                :entries="shareEntries"
                :question="t('zoom-setup-share-pick')"
              />
            </template>
            <div class="row q-gutter-sm q-mt-sm">
              <q-btn
                v-if="!hasShareEntries && shareStatus !== 'passed'"
                class="btn-tonal"
                color="primary"
                flat
                icon="mmm-media-display-active"
                :label="t('zoom-setup-share-check')"
                :loading="shareStatus === 'running'"
                no-caps
                @click="checkSharing"
              />
              <q-btn
                v-else-if="shareStatus !== 'passed'"
                class="btn-tonal"
                color="primary"
                :disable="!selectedShareEntry"
                flat
                :label="t('zoom-setup-share-try')"
                :loading="shareStatus === 'running'"
                no-caps
                @click="tryShareEntry"
              />
            </div>
          </div>

          <!-- What M³ should do automatically -->
          <div v-else-if="step === 'automations'" key="automations">
            <div class="text-h6 q-mb-sm">
              {{ t('zoom-setup-automations-title') }}
            </div>
            <p>{{ t('zoom-setup-automations-intro') }}</p>
            <template v-if="currentSettings">
              <q-item
                v-for="automation in automations"
                :key="automation.setting"
                class="q-px-none"
                :disable="automation.disabled"
                tag="label"
              >
                <q-item-section>
                  <q-item-label>{{ t(automation.setting) }}</q-item-label>
                  <q-item-label caption>
                    {{ t(`${automation.setting}-explain`) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle
                    v-model="currentSettings[automation.setting]"
                    :disable="automation.disabled"
                  />
                </q-item-section>
              </q-item>
              <div
                v-if="!currentSettings.enableMusicButton"
                class="row items-center no-wrap q-mt-sm text-caption text-warning"
              >
                <q-icon class="q-mr-xs" name="mmm-info" size="14px" />
                <div class="col">{{ t('zoom-setup-music-needed') }}</div>
                <q-btn
                  color="primary"
                  dense
                  flat
                  :label="t('zoom-setup-music-turn-on')"
                  no-caps
                  @click="currentSettings.enableMusicButton = true"
                />
              </div>
              <div
                v-if="obsShowsMedia"
                class="row items-center no-wrap q-mt-sm text-caption text-warning"
              >
                <q-icon class="q-mr-xs" name="mmm-info" size="14px" />
                <div class="col">{{ t('zoom-setup-obs-sharing-off') }}</div>
                <q-btn
                  color="primary"
                  dense
                  flat
                  :label="t('zoom-setup-obs-switch')"
                  no-caps
                  @click="switchMediaSharingFromObs"
                />
              </div>
            </template>
          </div>

          <!-- A host-only run of the real actions -->
          <div v-else-if="step === 'test'" key="test">
            <div class="text-h6 q-mb-sm">{{ t('zoom-setup-test-title') }}</div>
            <p>{{ t('zoom-setup-test-intro') }}</p>
            <ZoomSelfTestSteps v-if="testSteps.length" :steps="testSteps" />
            <StatusRow
              v-if="testOutcome"
              class="q-mt-sm"
              :status="testOutcome"
              :text="
                testOutcome === 'passed'
                  ? t('zoom-setup-test-passed')
                  : t('zoom-setup-test-failed')
              "
            />
            <!-- Sharing didn't stop: the user points M³ to the "Stop share" button -->
            <template v-if="stopShareEntries.length">
              <p class="q-mb-none q-mt-sm">
                {{ t('zoom-setup-stop-share-not-found') }}
              </p>
              <EntryPicker
                v-model="selectedStopShareEntry"
                :groups="[
                  {
                    entries: stopShareEntries,
                    label: 'zoom-setup-in-share-toolbar',
                  },
                ]"
                :question="t('zoom-setup-stop-share-pick')"
              />
              <p
                v-if="stopShareEntryFailed"
                class="text-caption text-negative q-mb-none"
              >
                {{ t('zoom-setup-stop-share-not-opened') }}
              </p>
            </template>
            <div class="row q-gutter-sm q-mt-md">
              <q-btn
                v-if="stopShareEntries.length"
                class="btn-tonal"
                color="primary"
                :disable="!selectedStopShareEntry || testRunning"
                flat
                :label="t('zoom-setup-share-try')"
                :loading="testRunning"
                no-caps
                @click="tryStopShareEntry"
              />
              <q-btn
                class="btn-tonal"
                color="primary"
                :disable="testRunning"
                flat
                icon="mmm-play"
                :label="t('zoom-setup-test-run')"
                :loading="testRunning && !stopShareEntries.length"
                no-caps
                @click="runTest"
              />
            </div>
          </div>

          <!-- Done -->
          <div v-else key="done" class="column items-center text-center">
            <div class="zoom-setup__done-icon text-positive q-my-md">
              <q-icon name="mmm-check" size="lg" />
            </div>
            <div class="text-h6 q-mb-sm">{{ t('zoom-setup-done-title') }}</div>
            <p>{{ t('zoom-setup-done-intro') }}</p>
            <div class="zoom-setup__summary">
              <StatusRow
                v-for="line in summary"
                :key="line.text"
                :status="line.status"
                :text="line.text"
              />
            </div>
          </div>
        </transition>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          v-if="stepIndex > 0 && step !== 'done'"
          flat
          :label="t('back')"
          @click="goBack"
        />
        <q-space />
        <q-btn
          v-if="canSkip"
          color="grey"
          flat
          :label="t('zoom-setup-skip')"
          @click="goNext"
        />
        <q-btn
          v-if="step === 'checks' && !checksPassed && !checking"
          color="grey"
          flat
          :label="t('zoom-setup-continue-anyway')"
          @click="goNext"
        />
        <q-btn
          v-if="step === 'done'"
          color="primary"
          :label="t('zoom-setup-finish')"
          unelevated
          @click="finish"
        />
        <q-btn
          v-else
          color="primary"
          :disable="!canContinue"
          :label="t('continue')"
          unelevated
          @click="goNext"
        />
      </q-card-actions>
    </q-card>
  </BaseDialog>
</template>

<script setup lang="ts">
import type { ZoomDiagnosis } from 'src/types';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import ZoomSelfTestSteps from 'components/dialog/ZoomSelfTestSteps.vue';
import ButtonStep from 'components/dialog/ZoomSetupButtonStep.vue';
import EntryPicker from 'components/dialog/ZoomSetupEntryPicker.vue';
import StatusRow from 'components/dialog/ZoomSetupStatusRow.vue';
import { storeToRefs } from 'pinia';
import {
  getZoomHelperErrorMessageKey,
  ZOOM_DIAGNOSIS_CHECKS,
} from 'src/constants/zoom';
import {
  diagnoseZoom,
  getZoomMeetingState,
  getZoomPanelEntries,
  getZoomShareEntries,
  getZoomShareToolbarEntries,
  getZoomTitlesFromSettings,
  isZoomReactButtonMissing,
  joinZoomAudioForSetup,
  learnZoomHandRaisedPhrase,
  learnZoomMicTitles,
  learnZoomVideoTitles,
  prepareMediaWindowForZoomTest,
  testZoomShareEntry,
  tryZoomMuteAllEntry,
  tryZoomParticipantsEntry,
  tryZoomStopShareEntry,
  withoutZoomFeedback,
} from 'src/helpers/zoom';
import {
  runZoomSelfTest,
  type ZoomSelfTestStep,
} from 'src/helpers/zoom-self-test';
import { isSettingInEffect } from 'src/utils/settings';
import { parseZoomMeetingId } from 'src/utils/zoom';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type Status = 'failed' | 'passed' | 'pending' | 'running';

const STEPS = [
  'welcome',
  'meeting',
  'checks',
  'video',
  'mic',
  'hand',
  'share',
  'automations',
  'test',
  'done',
] as const;
type Step = (typeof STEPS)[number];

const FEATURES = [
  { icon: 'mmm-arrow-outward', text: 'zoom-setup-feature-launch' },
  { icon: 'mmm-volume-off', text: 'zoom-setup-feature-mute' },
  { icon: 'mmm-groups', text: 'zoom-setup-feature-audio' },
  { icon: 'mmm-media-display-active', text: 'zoom-setup-feature-share' },
  { icon: 'mmm-microphone', text: 'zoom-setup-feature-hand' },
] as const;

const VIDEO_CHOICES = [
  { icon: 'mmm-video', isOn: true, label: 'zoom-setup-video-on' },
  { icon: 'mmm-video-off', isOn: false, label: 'zoom-setup-video-off' },
] as const;

const MIC_CHOICES = [
  { icon: 'mmm-microphone', isOn: true, label: 'zoom-setup-mic-on' },
  { icon: 'mmm-microphone-off', isOn: false, label: 'zoom-setup-mic-off' },
] as const;

// The host-only part of the self-test: it never mutes other people.
const USER_TEST_STEPS = [
  'meeting',
  'leave-audio',
  'join-audio',
  'mic-off',
  'mic-on',
  'video-off',
  'video-on',
  'share-start',
  'share-stop',
  'restore',
] as const;

const MEETING_POLL_MS = 2000;

const open = defineModel<boolean>({ default: false });

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const step = ref<Step>('welcome');
const stepIndex = computed(() => STEPS.indexOf(step.value));

// --- Welcome: the helper ---------------------------------------------------

const helperStatus = ref<Status>('pending');
const helperErrorKey = ref('zoom-helper-error-generic');

const startHelper = async () => {
  helperStatus.value = 'running';
  const result = await globalThis.electronApi.startZoomHelper();
  helperErrorKey.value = getZoomHelperErrorMessageKey(result.error);
  helperStatus.value = result.ok ? 'passed' : 'failed';
};

// --- Meeting ---------------------------------------------------------------

const meetingIdInput = ref('');
const meetingFound = ref(false);
let meetingPoll: ReturnType<typeof setInterval> | undefined;

const parsedMeetingId = computed(() =>
  parseZoomMeetingId(meetingIdInput.value),
);

const checkMeeting = async () => {
  meetingFound.value = !!(await getZoomMeetingState())?.found;
};

const stopWatchingMeeting = () => {
  clearInterval(meetingPoll);
  meetingPoll = undefined;
};

const watchMeeting = () => {
  stopWatchingMeeting();
  void checkMeeting();
  meetingPoll = setInterval(() => void checkMeeting(), MEETING_POLL_MS);
};

const openMeetingInZoom = () => {
  if (parsedMeetingId.value) {
    globalThis.electronApi.launchZoomMeeting(parsedMeetingId.value);
  }
};

// --- Checks ----------------------------------------------------------------

const checking = ref(false);
const diagnosis = ref<null | ZoomDiagnosis>(null);

const checks = computed(() =>
  ZOOM_DIAGNOSIS_CHECKS.map((check) => {
    let status: Status = 'pending';
    if (checking.value) status = 'running';
    else if (diagnosis.value) {
      status = diagnosis.value[check.id] ? 'passed' : 'failed';
    }
    return { ...check, status };
  }),
);

const checksPassed = computed(
  () => !checking.value && checks.value.every((c) => c.status === 'passed'),
);

// Zoom's Participants button is named in the user's Zoom language and is
// sometimes kept in Zoom's "More" menu. When M³ can't find it, the user
// picks it from Zoom's entries, as for Share; opening the panel by hand in
// Zoom works too (the checks then learn the names from the open panel).
const participantsEntries = ref<{ more: string[]; toolbar: string[] }>({
  more: [],
  toolbar: [],
});
const selectedParticipantsEntry = ref<null | string>(null);
const participantsEntryFailed = ref(false);

const hasParticipantsEntries = computed(
  () =>
    participantsEntries.value.toolbar.length +
      participantsEntries.value.more.length >
    0,
);

// Likewise for "Mute all", the one host control: its name is learned from
// Zoom's shortcut or its place in the panel, and when neither tells, the
// user (if host) picks it from the buttons under the participants list.
const muteAllEntries = ref<string[]>([]);
const selectedMuteAllEntry = ref<null | string>(null);
const muteAllEntryFailed = ref(false);

const hasChecksPicker = computed(
  () => hasParticipantsEntries.value || muteAllEntries.value.length > 0,
);

const runChecks = async () => {
  checking.value = true;
  try {
    diagnosis.value = (await diagnoseZoom()) ?? { meeting: false };
    participantsEntries.value = diagnosis.value.participantsButtonMissing
      ? await getZoomShareEntries()
      : { more: [], toolbar: [] };
    selectedParticipantsEntry.value = null;
    participantsEntryFailed.value = false;
    muteAllEntries.value = diagnosis.value.muteAllButtonMissing
      ? await getZoomPanelEntries()
      : [];
    selectedMuteAllEntry.value = null;
    muteAllEntryFailed.value = false;
  } finally {
    checking.value = false;
  }
};

/** Runs a pick's test with the checks shown as running; checks again if it worked. */
const tryChecksEntry = async (
  entry: null | string,
  test: (entry: string) => Promise<boolean>,
  failed: { value: boolean },
) => {
  if (!entry) return;
  checking.value = true;
  try {
    failed.value = !(await test(entry));
  } finally {
    checking.value = false;
  }
  // The control is known now: the checks pass, and learn the rest.
  if (!failed.value) await runChecks();
};

const tryParticipantsEntry = () =>
  tryChecksEntry(
    selectedParticipantsEntry.value,
    tryZoomParticipantsEntry,
    participantsEntryFailed,
  );

const tryMuteAllEntry = () =>
  tryChecksEntry(
    selectedMuteAllEntry.value,
    tryZoomMuteAllEntry,
    muteAllEntryFailed,
  );

// --- Video -----------------------------------------------------------------

const videoStatus = ref<Status>('pending');

const videoChoices = computed(() =>
  VIDEO_CHOICES.map((choice) => ({ ...choice, label: t(choice.label) })),
);

const learnVideo = async (cameraIsOn: boolean) => {
  videoStatus.value = 'running';
  const result = await learnZoomVideoTitles(cameraIsOn);
  videoStatus.value = result.ok ? 'passed' : 'failed';
};

// --- Microphone ----------------------------------------------------------------

// Zoom only has a microphone button once computer audio is joined, and only
// then can the user tell whether it's on: M³ joins it before asking.
const micStatus = ref<Status>('pending');
const micAudioJoined = ref(false);

const micChoices = computed(() =>
  MIC_CHOICES.map((choice) => ({ ...choice, label: t(choice.label) })),
);

const micStatusText = computed(() => {
  if (!micAudioJoined.value) {
    return micStatus.value === 'failed'
      ? t('zoom-setup-mic-join-failed')
      : t('zoom-setup-mic-joining');
  }
  return micStatus.value === 'failed'
    ? t('zoom-setup-mic-failed')
    : t('zoom-setup-mic-learning');
});

const joinAudioForMic = async () => {
  micStatus.value = 'running';
  micAudioJoined.value = false;
  micAudioJoined.value = await joinZoomAudioForSetup();
  micStatus.value = micAudioJoined.value ? 'pending' : 'failed';
};

const learnMic = async (micIsOn: boolean) => {
  micStatus.value = 'running';
  const result = await learnZoomMicTitles(micIsOn);
  micStatus.value = result.ok ? 'passed' : 'failed';
};

// --- Raised hands ----------------------------------------------------------

// How Zoom marks a raised hand (and lowers one) is only known in the user's
// Zoom language: M³ raises and lowers the host's own hand to read it.
const handStatus = ref<Status>('pending');
// Its hand is raised from Zoom's React button. Should M³ not find it (named
// in the user's language, and sometimes kept in "More"), the user picks it
// from Zoom's entries, as for Share.
const handReactMissing = ref(false);
const handEntries = ref<{ more: string[]; toolbar: string[] }>({
  more: [],
  toolbar: [],
});
const selectedHandEntry = ref<null | string>(null);
/** Whether the user has tried an entry from the list yet. */
const handEntryTried = ref(false);

const hasHandEntries = computed(
  () => handEntries.value.toolbar.length + handEntries.value.more.length > 0,
);

/** Like shareNeedsFirstPick: an expected step, not an error. */
const handNeedsFirstPick = computed(
  () =>
    handStatus.value === 'failed' &&
    handReactMissing.value &&
    !handEntryTried.value &&
    hasHandEntries.value,
);

const handStatusText = computed(() => {
  if (handStatus.value === 'running') return t('zoom-setup-hand-learning');
  if (handStatus.value === 'passed') {
    return t('zoom-setup-hand-done', {
      phrase: currentSettings.value?.zoomHandRaisedPhrase ?? '',
    });
  }
  if (handReactMissing.value && hasHandEntries.value) {
    return t('zoom-setup-react-not-opened');
  }
  return t('zoom-setup-hand-failed');
});

/** Learns raised hands through a React entry (the remembered one if none). */
const runHandLearning = async (reactEntry?: string) => {
  handStatus.value = 'running';
  const result = await withoutZoomFeedback(() =>
    learnZoomHandRaisedPhrase(reactEntry),
  );
  handReactMissing.value = isZoomReactButtonMissing(result);
  handStatus.value = result.ok && result.phrase ? 'passed' : 'failed';
};

const learnHand = async () => {
  await runHandLearning();
  if (!handReactMissing.value) return;
  handEntries.value = await getZoomShareEntries();
  selectedHandEntry.value = null;
  handEntryTried.value = false;
};

const tryHandEntry = async () => {
  const entry = selectedHandEntry.value;
  if (!entry) return;
  handEntryTried.value = true;
  await runHandLearning(entry);
  // The list stays only while the entry picked wasn't React.
  if (!handReactMissing.value) handEntries.value = { more: [], toolbar: [] };
};

// --- Share -----------------------------------------------------------------

const shareStatus = ref<Status>('pending');
const shareProblem = ref<'' | 'not-listed' | 'not-opened' | 'not-selected'>('');
const shareEntries = ref<{ more: string[]; toolbar: string[] }>({
  more: [],
  toolbar: [],
});
const selectedShareEntry = ref<null | string>(null);
/** Whether the user has tried an entry from the list yet. */
const shareEntryTried = ref(false);

const hasShareEntries = computed(
  () => shareEntries.value.toolbar.length + shareEntries.value.more.length > 0,
);

/**
 * M³'s own first guess at the Share button didn't work, and the user is
 * asked to pick it: an expected step for many Zoom languages, not an error.
 */
const shareNeedsFirstPick = computed(
  () =>
    shareStatus.value === 'failed' &&
    shareProblem.value === 'not-opened' &&
    !shareEntryTried.value &&
    hasShareEntries.value,
);

const shareMessage = computed(() => {
  if (shareStatus.value === 'running') return t('zoom-setup-share-checking');
  if (shareStatus.value === 'passed') return t('zoom-setup-share-done');
  if (shareProblem.value === 'not-listed') {
    return t('zoom-setup-share-not-listed');
  }
  if (shareProblem.value === 'not-selected') {
    return t('zoom-setup-share-not-selected');
  }
  // Nothing to pick from, e.g. the meeting was closed in the meantime.
  if (!hasShareEntries.value) return t('zoom-setup-share-failed');
  return t('zoom-setup-share-not-opened');
});

/** Shows the media window while Zoom's share window is checked. */
const withMediaWindow = async <T,>(check: () => Promise<T>) => {
  const restore = await prepareMediaWindowForZoomTest();
  try {
    return await check();
  } finally {
    restore();
  }
};

const getShareProblem = (result: {
  opened: boolean;
  windowListed: boolean;
}) => {
  if (!result.opened) return 'not-opened';
  if (!result.windowListed) return 'not-listed';
  return 'not-selected';
};

/** Checks sharing through a Share entry; returns whether it opened Zoom's share window. */
const testShare = async (entry: null | string) => {
  shareStatus.value = 'running';
  const result = await withMediaWindow(() => testZoomShareEntry(entry));
  if (result.opened && result.windowSelected) {
    shareStatus.value = 'passed';
  } else {
    shareProblem.value = getShareProblem(result);
    shareStatus.value = 'failed';
  }
  return result.opened;
};

const checkSharing = async () => {
  // The Share entry already learned, or else Zoom's default shortcut. Only
  // when that doesn't open Zoom's share window is the user asked to pick.
  if (await testShare(currentSettings.value?.zoomShareButtonTitle ?? null)) {
    return;
  }
  shareEntries.value = await getZoomShareEntries();
  selectedShareEntry.value = null;
  shareEntryTried.value = false;
};

const tryShareEntry = async () => {
  const entry = selectedShareEntry.value;
  if (!entry || !currentSettings.value) return;
  shareEntryTried.value = true;
  // Opening Zoom's share window makes it the Share entry, even should the
  // media window not be offered this time ("Check sharing" tries again).
  if (await testShare(entry)) {
    currentSettings.value.zoomShareButtonTitle = entry;
    shareEntries.value = { more: [], toolbar: [] };
  }
};

// --- Automations -------------------------------------------------------------

/** Whether OBS Studio has a media scene, so it shows the media in Zoom itself. */
const obsShowsMedia = computed(
  () =>
    !!currentSettings.value &&
    isSettingInEffect(currentSettings.value, 'obsMediaScene'),
);

const automations = computed(() => [
  {
    disabled: !currentSettings.value?.zoomMeetingManagerMeetingId,
    setting: 'zoomMeetingManagerAutoLaunchMeeting' as const,
  },
  {
    disabled: false,
    setting: 'zoomMeetingManagerAutomateMeetingAudioSettings' as const,
  },
  {
    disabled: false,
    setting: 'zoomMeetingManagerAutomatePostMeetingAudioSettings' as const,
  },
  {
    // OBS Studio already shows the media in Zoom (see obsMediaScene's
    // disableWhen)
    disabled: shareStatus.value !== 'passed' || obsShowsMedia.value,
    setting: 'zoomMeetingManagerAutomateMediaSharing' as const,
  },
  {
    disabled: handStatus.value !== 'passed',
    setting: 'zoomMeetingManagerHandAlert' as const,
  },
]);

/**
 * Lets Zoom share the media window instead of OBS Studio switching to its
 * media scene: the two can't both be on, so this clears OBS Studio's media
 * and image scenes. The rest of the OBS Studio integration (camera scene,
 * recording) stays on.
 */
const switchMediaSharingFromObs = () => {
  const settings = currentSettings.value;
  if (!settings) return;
  settings.obsMediaScene = null;
  settings.obsImageScene = null;
  if (shareStatus.value === 'passed') {
    settings.zoomMeetingManagerAutomateMediaSharing = true;
  }
};

// --- Test --------------------------------------------------------------------

const testSteps = ref<ZoomSelfTestStep[]>([]);
const testRunning = ref(false);
const testOutcome = ref<'' | 'failed' | 'passed'>('');

// When the test couldn't stop sharing (the "Stop share" button is named in
// the user's Zoom language), Zoom is still sharing: the user picks the
// button from Zoom's sharing toolbar, and the test runs again.
const stopShareEntries = ref<string[]>([]);
const selectedStopShareEntry = ref<null | string>(null);
const stopShareEntryFailed = ref(false);

const runTest = async () => {
  testRunning.value = true;
  testOutcome.value = '';
  stopShareEntries.value = [];
  selectedStopShareEntry.value = null;
  stopShareEntryFailed.value = false;
  try {
    const steps = await runZoomSelfTest({
      onProgress: (progress) => {
        testSteps.value = progress;
      },
      prepareMediaWindow: prepareMediaWindowForZoomTest,
      steps: USER_TEST_STEPS,
      titles: getZoomTitlesFromSettings(),
    });
    testOutcome.value = steps.some((s) => s.status === 'failed')
      ? 'failed'
      : 'passed';
    const stopFailed = steps.some(
      (s) => s.id === 'share-stop' && s.status === 'failed',
    );
    if (stopFailed && (await getZoomMeetingState())?.sharing) {
      stopShareEntries.value = await getZoomShareToolbarEntries();
    }
  } finally {
    testRunning.value = false;
  }
};

const tryStopShareEntry = async () => {
  const entry = selectedStopShareEntry.value;
  if (!entry) return;
  testRunning.value = true;
  try {
    stopShareEntryFailed.value = !(await tryZoomStopShareEntry(entry));
  } finally {
    testRunning.value = false;
  }
  // Sharing stopped through that button, now remembered: test it all again.
  if (!stopShareEntryFailed.value) await runTest();
};

// --- Done --------------------------------------------------------------------

const summary = computed(() => {
  const settings = currentSettings.value;
  const enabledCount = automations.value.filter(
    (a) => settings?.[a.setting],
  ).length;
  return [
    {
      status: settings?.zoomMeetingManagerMeetingId ? 'passed' : 'pending',
      text: settings?.zoomMeetingManagerMeetingId
        ? t('zoom-setup-summary-meeting', {
            meetingId: settings.zoomMeetingManagerMeetingId,
          })
        : t('zoom-setup-summary-no-meeting'),
    },
    {
      status: videoStatus.value === 'passed' ? 'passed' : 'pending',
      text: t('zoom-setup-summary-camera'),
    },
    {
      status: micStatus.value === 'passed' ? 'passed' : 'pending',
      text: t('zoom-setup-summary-mic'),
    },
    {
      status: shareStatus.value === 'passed' ? 'passed' : 'pending',
      text: t('zoom-setup-summary-share'),
    },
    {
      status: handStatus.value === 'passed' ? 'passed' : 'pending',
      text: t('zoom-setup-summary-hand'),
    },
    {
      status: enabledCount ? 'passed' : 'pending',
      text: t('zoom-setup-summary-automations', { count: enabledCount }),
    },
  ] as { status: Status; text: string }[];
});

// --- Navigation ----------------------------------------------------------------

const canContinue = computed(() => {
  switch (step.value) {
    case 'checks':
      return checksPassed.value;
    case 'hand':
      return handStatus.value === 'passed';
    case 'meeting':
      return (
        meetingFound.value && (!meetingIdInput.value || !!parsedMeetingId.value)
      );
    case 'mic':
      return micStatus.value === 'passed';
    case 'share':
      return shareStatus.value === 'passed';
    case 'test':
      return !testRunning.value;
    case 'video':
      return videoStatus.value === 'passed';
    case 'welcome':
      return helperStatus.value === 'passed';
    default:
      return true;
  }
});

// Optional steps can be skipped; required ones can't.
const canSkip = computed(
  () =>
    (step.value === 'video' && videoStatus.value !== 'passed') ||
    (step.value === 'mic' && micStatus.value !== 'passed') ||
    (step.value === 'hand' && handStatus.value !== 'passed') ||
    (step.value === 'share' && shareStatus.value !== 'passed') ||
    (step.value === 'test' && !testRunning.value && !testOutcome.value),
);

const saveMeetingId = () => {
  if (currentSettings.value) {
    currentSettings.value.zoomMeetingManagerMeetingId =
      parsedMeetingId.value ?? null;
  }
};

/**
 * On a first setup (nothing turned on yet), turns on every automation whose
 * prerequisites passed, so finishing the assistant leaves M³ doing its job;
 * the user can still switch any of them off on that step.
 */
const preselectAutomations = () => {
  const settings = currentSettings.value;
  if (!settings || automations.value.some((a) => settings[a.setting])) return;
  automations.value.forEach((automation) => {
    if (!automation.disabled) settings[automation.setting] = true;
  });
};

const enterStep = (next: Step) => {
  if (step.value === 'meeting') {
    saveMeetingId();
    stopWatchingMeeting();
  }
  if (next === 'automations') preselectAutomations();
  step.value = next;
  if (next === 'meeting') watchMeeting();
  if (next === 'checks') void runChecks();
  if (next === 'mic' && micStatus.value !== 'passed') void joinAudioForMic();
};

const goNext = () => {
  const next = STEPS[stepIndex.value + 1];
  if (next) enterStep(next);
};

const goBack = () => {
  const previous = STEPS[stepIndex.value - 1];
  if (previous) enterStep(previous);
};

const finish = () => {
  if (currentSettings.value) {
    currentSettings.value.zoomMeetingManagerEnable = true;
  }
  open.value = false;
};

const reset = () => {
  step.value = 'welcome';
  meetingIdInput.value =
    currentSettings.value?.zoomMeetingManagerMeetingId ?? '';
  diagnosis.value = null;
  videoStatus.value =
    currentSettings.value?.zoomVideoOnTitle &&
    currentSettings.value.zoomVideoOffTitle
      ? 'passed'
      : 'pending';
  micStatus.value =
    currentSettings.value?.zoomMicOnTitle &&
    currentSettings.value.zoomMicOffTitle
      ? 'passed'
      : 'pending';
  micAudioJoined.value = false;
  handStatus.value = currentSettings.value?.zoomHandRaisedPhrase
    ? 'passed'
    : 'pending';
  handReactMissing.value = false;
  handEntries.value = { more: [], toolbar: [] };
  handEntryTried.value = false;
  shareStatus.value = 'pending';
  shareEntries.value = { more: [], toolbar: [] };
  shareEntryTried.value = false;
  testSteps.value = [];
  testOutcome.value = '';
  void startHelper();
};

watch(
  open,
  (isOpen) => {
    if (isOpen) reset();
    else stopWatchingMeeting();
  },
  { immediate: true },
);

onBeforeUnmount(stopWatchingMeeting);
</script>

<style scoped>
.zoom-setup {
  max-width: 92vw;
  width: 560px;
}

.zoom-setup__progress {
  background: rgba(128, 128, 128, 0.25);
  border-radius: 3px;
  height: 5px;
  overflow: hidden;
}

.zoom-setup__progress-fill {
  background: var(--q-primary);
  border-radius: 3px;
  height: 100%;
  transition: width 200ms ease;
}

.zoom-setup__body {
  max-height: min(560px, 70vh);
  min-height: 300px;
  overflow: auto;
}

.zoom-setup__done-icon {
  align-items: center;
  background: color-mix(in srgb, currentColor 15%, transparent);
  border-radius: 50%;
  display: flex;
  height: 72px;
  justify-content: center;
  width: 72px;
}

.zoom-setup__summary {
  text-align: left;
  width: 100%;
}

@media (prefers-reduced-motion: no-preference) {
  .zoom-setup-step-enter-active,
  .zoom-setup-step-leave-active {
    transition:
      opacity 180ms ease,
      transform 180ms ease;
  }

  .zoom-setup-step-enter-from {
    opacity: 0;
    transform: translateX(16px);
  }

  .zoom-setup-step-leave-to {
    opacity: 0;
    transform: translateX(-16px);
  }
}
</style>
