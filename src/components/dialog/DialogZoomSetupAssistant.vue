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
          <q-icon name="mmm-picture-for-zoom-participants" size="xs" />
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
            <p
              v-if="shortcutsChanged"
              class="text-caption text-grey row no-wrap q-mt-sm"
            >
              <q-icon class="q-mr-xs q-mt-xs" name="mmm-info" size="14px" />
              {{ t('zoom-setup-shortcuts-changed') }}
            </p>
            <div class="row q-gutter-sm q-mt-sm">
              <q-btn
                class="btn-tonal"
                color="primary"
                :disable="checking"
                flat
                icon="mmm-refresh"
                :label="t('zoom-setup-check-again')"
                :loading="checking"
                no-caps
                @click="runChecks"
              />
            </div>
          </div>

          <!-- The camera button's names, in the user's Zoom language -->
          <div v-else-if="step === 'video'" key="video">
            <div class="text-h6 q-mb-sm">{{ t('zoom-setup-video-title') }}</div>
            <p>{{ t('zoom-setup-video-intro') }}</p>
            <template v-if="videoStatus === 'passed'">
              <StatusRow
                status="passed"
                :text="
                  t('zoom-setup-video-done', {
                    off: currentSettings?.zoomVideoOffTitle,
                    on: currentSettings?.zoomVideoOnTitle,
                  })
                "
              />
              <q-btn
                class="q-mt-sm"
                color="primary"
                dense
                flat
                :label="t('zoom-setup-learn-again')"
                no-caps
                @click="videoStatus = 'pending'"
              />
            </template>
            <template v-else>
              <div class="text-subtitle2 q-mb-sm">
                {{ t('zoom-setup-video-question') }}
              </div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="choice in VIDEO_CHOICES"
                  :key="choice.label"
                  class="col-6"
                >
                  <q-btn
                    class="zoom-setup__choice btn-tonal full-width"
                    color="primary"
                    :disable="videoStatus === 'running'"
                    flat
                    no-caps
                    @click="learnVideo(choice.cameraIsOn)"
                  >
                    <div class="column items-center q-py-sm">
                      <q-icon :name="choice.icon" size="md" />
                      <div class="q-mt-xs">{{ t(choice.label) }}</div>
                    </div>
                  </q-btn>
                </div>
              </div>
              <StatusRow
                v-if="videoStatus === 'running' || videoStatus === 'failed'"
                class="q-mt-md"
                :status="videoStatus"
                :text="
                  videoStatus === 'failed'
                    ? t('zoom-setup-video-failed')
                    : t('zoom-setup-video-learning')
                "
              />
            </template>
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
              <div class="text-subtitle2 q-mt-md q-mb-xs">
                {{ t('zoom-setup-share-pick') }}
              </div>
              <div class="zoom-setup__entries action-popup__scroll">
                <template v-for="group in shareGroups" :key="group.label">
                  <div class="text-caption text-grey q-mt-xs">
                    {{ t(group.label) }}
                  </div>
                  <q-option-group
                    v-model="selectedShareEntry"
                    dense
                    :options="
                      group.entries.map((entry) => ({
                        label: entry,
                        value: entry,
                      }))
                    "
                    type="radio"
                  />
                </template>
              </div>
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
            <q-btn
              class="btn-tonal q-mt-md"
              color="primary"
              flat
              icon="mmm-play"
              :label="t('zoom-setup-test-run')"
              :loading="testRunning"
              no-caps
              @click="runTest"
            />
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
import StatusRow from 'components/dialog/ZoomSetupStatusRow.vue';
import { storeToRefs } from 'pinia';
import { getZoomHelperErrorMessageKey } from 'src/constants/zoom';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import {
  diagnoseZoom,
  getZoomMeetingState,
  getZoomShareEntries,
  getZoomTitlesFromSettings,
  learnZoomVideoTitles,
  testZoomShareEntry,
} from 'src/helpers/zoom';
import {
  runZoomSelfTest,
  type ZoomSelfTestStep,
} from 'src/helpers/zoom-self-test';
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
] as const;

const VIDEO_CHOICES = [
  { cameraIsOn: true, icon: 'mmm-video', label: 'zoom-setup-video-on' },
  { cameraIsOn: false, icon: 'mmm-video-off', label: 'zoom-setup-video-off' },
] as const;

// The host-only part of the self-test: it never mutes other people.
const USER_TEST_STEPS = [
  'meeting',
  'leave-audio',
  'join-audio',
  'video-off',
  'video-on',
  'share-start',
  'share-stop',
  'restore',
] as const;

const MEETING_POLL_MS = 2000;
const MEDIA_WINDOW_SETTLE_MS = 1500;

const open = defineModel<boolean>({ default: false });

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { currentSettings, mediaWindowVisible } = storeToRefs(currentState);

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

const CHECKS = [
  {
    fix: 'zoom-setup-fix-meeting',
    id: 'meeting',
    label: 'zoom-setup-check-meeting',
  },
  {
    fix: 'zoom-setup-fix-toolbar',
    id: 'toolbar',
    label: 'zoom-setup-check-toolbar',
  },
  {
    fix: 'zoom-setup-fix-buttons',
    id: 'videoButton',
    label: 'zoom-setup-check-buttons',
  },
  {
    fix: 'zoom-setup-fix-participants',
    id: 'participantsPanel',
    label: 'zoom-setup-check-participants',
  },
  {
    fix: 'zoom-setup-fix-host',
    id: 'hostControls',
    label: 'zoom-setup-check-host',
  },
] as const;

const checks = computed(() =>
  CHECKS.map((check) => {
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

const shortcutsChanged = computed(
  () =>
    !!diagnosis.value?.toolbar &&
    (diagnosis.value.audioShortcutDefault === false ||
      diagnosis.value.videoShortcutDefault === false),
);

const runChecks = async () => {
  checking.value = true;
  try {
    diagnosis.value = (await diagnoseZoom()) ?? { meeting: false };
  } finally {
    checking.value = false;
  }
};

// --- Video -----------------------------------------------------------------

const videoStatus = ref<Status>('pending');

const learnVideo = async (cameraIsOn: boolean) => {
  videoStatus.value = 'running';
  const result = await learnZoomVideoTitles(cameraIsOn);
  videoStatus.value = result.ok ? 'passed' : 'failed';
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

// Share is nearly always in Zoom's toolbar, so its entries come first.
const shareGroups = computed(() =>
  [
    {
      entries: shareEntries.value.toolbar,
      label: 'zoom-setup-share-in-toolbar' as const,
    },
    {
      entries: shareEntries.value.more,
      label: 'zoom-setup-share-in-more' as const,
    },
  ].filter((group) => group.entries.length),
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
  const wasVisible = mediaWindowVisible.value;
  if (!wasVisible) {
    toggleMediaWindowVisibility(true);
    await new Promise((resolve) => {
      setTimeout(resolve, MEDIA_WINDOW_SETTLE_MS);
    });
  }
  try {
    return await check();
  } finally {
    if (!wasVisible) toggleMediaWindowVisibility(false);
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
    disabled: shareStatus.value !== 'passed',
    setting: 'zoomMeetingManagerAutomateMediaSharing' as const,
  },
]);

// --- Test --------------------------------------------------------------------

const testSteps = ref<ZoomSelfTestStep[]>([]);
const testRunning = ref(false);
const testOutcome = ref<'' | 'failed' | 'passed'>('');

const runTest = async () => {
  testRunning.value = true;
  testOutcome.value = '';
  try {
    const steps = await runZoomSelfTest({
      onProgress: (progress) => {
        testSteps.value = progress;
      },
      prepareMediaWindow: async () => {
        const wasVisible = mediaWindowVisible.value;
        if (!wasVisible) {
          toggleMediaWindowVisibility(true);
          await new Promise((resolve) => {
            setTimeout(resolve, MEDIA_WINDOW_SETTLE_MS);
          });
        }
        return () => {
          if (!wasVisible) toggleMediaWindowVisibility(false);
        };
      },
      steps: USER_TEST_STEPS,
      titles: getZoomTitlesFromSettings(),
    });
    testOutcome.value = steps.some((s) => s.status === 'failed')
      ? 'failed'
      : 'passed';
  } finally {
    testRunning.value = false;
  }
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
      status: shareStatus.value === 'passed' ? 'passed' : 'pending',
      text: t('zoom-setup-summary-share'),
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
    case 'meeting':
      return (
        meetingFound.value && (!meetingIdInput.value || !!parsedMeetingId.value)
      );
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
    (step.value === 'share' && shareStatus.value !== 'passed') ||
    (step.value === 'test' && !testRunning.value && !testOutcome.value),
);

const saveMeetingId = () => {
  if (currentSettings.value) {
    currentSettings.value.zoomMeetingManagerMeetingId =
      parsedMeetingId.value || null;
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

.zoom-setup__choice {
  border-radius: 12px;
  min-height: 96px;
}

.zoom-setup__entries {
  max-height: 180px;
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
