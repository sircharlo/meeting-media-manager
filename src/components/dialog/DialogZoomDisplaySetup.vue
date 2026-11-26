<template>
  <!-- Before a meeting with someone on Zoom: helps put Zoom's window full
       screen on the TV, behind the media display, which hiding it then
       shows (see zoom-display-setup.ts). Over the whole main window, like
       the Zoom automation overlay: M³ hides the media display meanwhile,
       and the user looks at the TV. -->
  <BaseDialog
    v-model="open"
    :dialog-id="DIALOG_ID"
    maximized
    no-backdrop-dismiss
    no-esc-dismiss
    persistent
    transition-hide="fade"
    transition-show="fade"
  >
    <q-card
      class="zoom-display-setup column items-center justify-center text-center"
    >
      <template v-if="finale">
        <DoneCheck v-if="finale === 'ready'" :size="64" variant="solid" />
        <q-icon v-else color="primary" name="mmm-fullscreen" size="64px" />
        <div class="text-h5 text-weight-medium q-mt-lg">
          {{ t(FINALES[finale].title) }}
        </div>
        <p class="zoom-display-setup__text q-mt-md">
          {{ t(FINALES[finale].explain) }}
        </p>
        <q-btn
          class="q-mt-md"
          :label="t('close')"
          no-caps
          outline
          @click="closeFinale"
        />
      </template>

      <template v-else-if="step === 'ask'">
        <q-icon color="primary" name="mmm-video-meeting" size="64px" />
        <div class="text-h5 text-weight-medium q-mt-lg">
          {{
            t(
              meeting === 'we'
                ? 'zoom-display-setup-ask-we'
                : 'zoom-display-setup-ask-mw',
            )
          }}
        </div>
        <p class="zoom-display-setup__text q-mt-md">
          {{ t('zoom-display-setup-ask-explain') }}
        </p>
        <div class="zoom-display-setup__actions">
          <q-btn
            color="primary"
            :label="t('yes')"
            no-caps
            unelevated
            @click="answerYes"
          />
          <q-btn :label="t('no')" no-caps outline @click="answerNo" />
        </div>
        <q-btn
          class="q-mt-lg"
          :label="t('zoom-display-setup-dont-ask')"
          no-caps
          outline
          size="sm"
          @click="confirmTurnOff = true"
        />
      </template>

      <template v-else-if="step === 'explain'">
        <q-icon color="primary" name="mmm-media-display-inactive" size="64px" />
        <div class="text-h5 text-weight-medium q-mt-lg">
          {{ t('zoom-display-setup-explain-title') }}
        </div>
        <p class="zoom-display-setup__text q-mt-md">
          {{
            t(
              augmented
                ? 'zoom-display-setup-explain-auto'
                : 'zoom-display-setup-explain',
            )
          }}
        </p>
        <p class="zoom-display-setup__tip text-caption">
          {{ t('zoom-display-setup-dual-window-tip') }}
        </p>
        <div class="zoom-display-setup__actions">
          <q-btn
            color="primary"
            icon="mmm-media-display-inactive"
            :label="t('zoom-display-setup-hide-media')"
            no-caps
            unelevated
            @click="reveal"
          />
          <q-btn :label="t('back')" no-caps outline @click="step = 'ask'" />
        </div>
      </template>

      <template v-else-if="step === 'placing'">
        <LiquidSpinner color="primary" size="64px" />
        <div class="text-h5 text-weight-medium q-mt-lg">
          {{ t('zoom-display-setup-placing') }}
        </div>
      </template>

      <template v-else-if="step === 'check'">
        <q-icon
          color="primary"
          name="mmm-picture-for-zoom-participants"
          size="64px"
        />
        <div class="text-h5 text-weight-medium q-mt-lg">
          {{ t('zoom-display-setup-check-title') }}
        </div>
        <div
          v-if="placementNote"
          class="zoom-display-setup__note row no-wrap items-center q-mt-md"
          :class="`zoom-display-setup__note--${placementNote.tone}`"
        >
          <q-icon :name="placementNote.icon" size="20px" />
          <span class="q-ml-sm text-left">{{ t(placementNote.key) }}</span>
        </div>
        <p v-else class="zoom-display-setup__text q-mt-md">
          {{ t('zoom-display-setup-check-explain') }}
        </p>
        <div class="zoom-display-setup__actions">
          <q-btn
            color="primary"
            :label="t('yes')"
            no-caps
            unelevated
            @click="allSet"
          />
          <q-btn :label="t('no')" no-caps outline @click="step = 'fix'" />
        </div>
        <q-btn
          v-if="canRetry"
          class="q-mt-md"
          :label="t('try-again')"
          no-caps
          outline
          @click="retry"
        />
      </template>

      <template v-else-if="step === 'fix'">
        <q-icon color="primary" name="mmm-fullscreen" size="64px" />
        <div class="text-h5 text-weight-medium q-mt-lg">
          {{ t('zoom-display-setup-fix-title') }}
        </div>
        <p class="zoom-display-setup__text q-mt-md">
          {{ t('zoom-display-setup-fix-explain') }}
        </p>
        <div class="zoom-display-setup__actions">
          <q-btn
            color="primary"
            :label="t('zoom-display-setup-fix-done')"
            no-caps
            unelevated
            @click="allSet"
          />
          <q-btn
            v-if="augmented"
            :label="t('zoom-display-setup-fix-retry')"
            no-caps
            outline
            @click="retry"
          />
          <q-btn
            :label="t('zoom-display-setup-fix-skip')"
            no-caps
            outline
            @click="finish(true, 'later')"
          />
        </div>
      </template>

      <template v-else>
        <DoneCheck :size="64" variant="solid" />
        <div class="text-h5 text-weight-medium q-mt-lg">
          {{ t('zoom-display-setup-done-title') }}
        </div>
        <p class="zoom-display-setup__text q-mt-md">
          {{ t('zoom-display-setup-done-explain') }}
        </p>
        <div class="zoom-display-setup__actions">
          <q-btn
            color="primary"
            :label="t('zoom-display-setup-show-me')"
            no-caps
            unelevated
            @click="finish(true, 'ready')"
          />
          <q-btn
            :label="t('close')"
            no-caps
            outline
            @click="finish(false, 'ready')"
          />
        </div>
      </template>
    </q-card>
  </BaseDialog>
  <ConfirmDialog
    v-model="confirmTurnOff"
    :cancel-label="t('zoom-display-setup-turn-off-cancel')"
    confirm-color="negative"
    :confirm-label="t('zoom-display-setup-turn-off-confirm')"
    dialog-id="zoom-display-setup-turn-off"
    icon="mmm-warning"
    icon-color="warning"
    :message="t('zoom-display-setup-turn-off-message')"
    persistent
    :title="t('zoom-display-setup-turn-off-title')"
    @cancel="confirmTurnOff = false"
    @confirm="dontAskAgain"
  />
</template>

<script setup lang="ts">
import BaseDialog from 'components/dialog/BaseDialog.vue';
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import DoneCheck from 'components/ui/DoneCheck.vue';
import LiquidSpinner from 'components/ui/LiquidSpinner.vue';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { wasSetUpThisSession } from 'src/helpers/feature-nudges';
import {
  askZoomDisplaySetup,
  canPlaceZoomForDisplaySetup,
  finishZoomDisplaySetup,
  getDueZoomDisplaySetup,
  hasMeetingStarted,
  isMediaOnItsOwnScreen,
  restoreMediaAfterZoomDisplaySetup,
  retryZoomDisplayPlacement,
  revealZoomForDisplaySetup,
  turnOffZoomDisplaySetup,
  type ZoomDisplayPlacement,
} from 'src/helpers/zoom-display-setup';
import { log } from 'src/shared/vanilla';
import { useAttentionStore } from 'stores/attention';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { isDemoModeActive } from 'stores/demo-mode';
import { useZoomDisplaySetupStore } from 'stores/zoom-display-setup';
import { useZoomStateStore } from 'stores/zoom-state';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

/**
 * The closing screen: 'ready' once Zoom's window was confirmed full screen
 * on the TV, 'later' when the user skipped making it so.
 */
type Finale = 'later' | 'ready';

interface PlacementNote {
  icon: string;
  key: string;
  tone: 'positive' | 'warning';
}

type Step = 'ask' | 'check' | 'done' | 'explain' | 'fix' | 'placing';

const DIALOG_ID = 'zoom-display-setup';
// How long the closing screen stays, unless closed sooner.
const FINALE_MS = 5000;

const FINALES: Record<Finale, { explain: string; title: string }> = {
  later: {
    explain: 'zoom-display-setup-later-explain',
    title: 'zoom-display-setup-later-title',
  },
  ready: {
    explain: 'zoom-display-setup-ready-explain',
    title: 'zoom-display-setup-ready-title',
  },
};
// Lets startup settle first: the Zoom startup check asks its own question
// then (see zoom-meeting-day.ts), and this one waits for it.
const FIRST_TRY_DELAY_MS = 15_000;
const TRY_INTERVAL_MS = 30_000;

const PLACEMENT_NOTES: Record<ZoomDisplayPlacement, PlacementNote> = {
  failed: {
    icon: 'mmm-warning',
    key: 'zoom-display-setup-placement-failed',
    tone: 'warning',
  },
  'full-screen': {
    icon: 'mmm-check',
    key: 'zoom-display-setup-placement-full-screen',
    tone: 'positive',
  },
  'no-meeting': {
    icon: 'mmm-warning',
    key: 'zoom-display-setup-placement-no-meeting',
    tone: 'warning',
  },
  'no-second-window': {
    icon: 'mmm-warning',
    key: 'zoom-display-setup-placement-no-second-window',
    tone: 'warning',
  },
  'not-full-screen': {
    icon: 'mmm-warning',
    key: 'zoom-display-setup-placement-not-full-screen',
    tone: 'warning',
  },
};

// Worth another try once the user fixed what was missing.
const RETRYABLE = new Set<ZoomDisplayPlacement>([
  'failed',
  'no-meeting',
  'no-second-window',
]);

const { t } = useI18n();
const route = useRoute();

const store = useZoomDisplaySetupStore();
const { meeting } = storeToRefs(store);
const currentState = useCurrentStateStore();
const { currentCongregation } = storeToRefs(currentState);
const congregationSettings = useCongregationSettingsStore();
const attention = useAttentionStore();
const zoomState = useZoomStateStore();

// The closing screen, once a setup the user went through is over (after its
// tour, if any). Not after "No": nothing was set up then.
const finale = ref<Finale | null>(null);
// The closing screen to show once the tour ends.
let finaleAfterTour: Finale | null = null;
let finaleTimer: ReturnType<typeof setTimeout> | undefined;

// Only the user's answers (or the meeting starting) close it; the closing
// screen also goes by itself.
const open = computed({
  get: () => meeting.value !== null || finale.value !== null,
  set: () => undefined,
});

const step = ref<Step>('ask');
// Whether M³ puts Zoom's window on the TV itself, for this setup.
const augmented = ref(false);
// What M³ did with Zoom's window (null: left to the user).
const placement = ref<null | ZoomDisplayPlacement>(null);

const placementNote = computed(() =>
  placement.value ? PLACEMENT_NOTES[placement.value] : null,
);
const canRetry = computed(
  () => augmented.value && !!placement.value && RETRYABLE.has(placement.value),
);

const closeFinale = () => {
  clearTimeout(finaleTimer);
  finale.value = null;
};

const showFinale = (kind: Finale) => {
  clearTimeout(finaleTimer);
  finale.value = kind;
  finaleTimer = setTimeout(closeFinale, FINALE_MS);
};

/** Ends the setup, with its tour or not, then its closing screen, if any. */
const finish = (tour: boolean, finaleKind: Finale | null = null) => {
  finishZoomDisplaySetup({ tour });
  if (tour) finaleAfterTour = finaleKind;
  else if (finaleKind) showFinale(finaleKind);
};

const answerYes = () => {
  augmented.value = canPlaceZoomForDisplaySetup();
  step.value = 'explain';
};

const answerNo = () => {
  log('Zoom display setup: nobody on Zoom for this meeting', 'zoom', 'info');
  finish(false);
};

// Turning the question off for good is confirmed first.
const confirmTurnOff = ref(false);

const dontAskAgain = () => {
  confirmTurnOff.value = false;
  turnOffZoomDisplaySetup();
};

const place = async (run: () => Promise<null | ZoomDisplayPlacement>) => {
  if (augmented.value) step.value = 'placing';
  try {
    placement.value = await run();
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'placeZoomForDisplay' } } });
    placement.value = augmented.value ? 'failed' : null;
  }
  step.value = 'check';
};

const reveal = () => place(revealZoomForDisplaySetup);

const retry = () => place(retryZoomDisplayPlacement);

// The media display shows again, over Zoom's window, while the user reads.
const allSet = () => {
  restoreMediaAfterZoomDisplaySetup();
  step.value = 'done';
};

// Only on the media calendar, over nothing else (no other dialog, tour or
// profile picker: see the attention store), with no Zoom check or
// automation and no media showing; not in the session the profile was set
// up in, nor before its quick-start tour (which points at the same
// buttons), nor in demo mode.
const isGoodMoment = (congId: string) =>
  route.name === 'media-calendar' &&
  !attention.isScreenTaken &&
  !zoomState.checkRunning &&
  !zoomState.runActive &&
  !currentState.mediaPlaying.url &&
  !wasSetUpThisSession(congId) &&
  !!congregationSettings.quickStartTourSeen[congId] &&
  !isDemoModeActive();

let asking = false;

const tryToAsk = async () => {
  const congId = currentCongregation.value;
  if (asking || meeting.value !== null || !congId) return;
  if (!isGoodMoment(congId)) return;
  const due = getDueZoomDisplaySetup();
  if (!due) return;
  asking = true;
  try {
    // Without a TV of its own, there's nothing to set up (and the setup is
    // asked again once the media window fills one).
    if (!(await isMediaOnItsOwnScreen())) return;
    if (currentCongregation.value !== congId || !isGoodMoment(congId)) return;
    askZoomDisplaySetup(due);
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'askZoomDisplaySetup' } } });
  } finally {
    asking = false;
  }
};

const tick = () => {
  // Unanswered, the question makes way for the meeting once it starts.
  if (meeting.value !== null && step.value === 'ask') {
    if (hasMeetingStarted()) {
      log('Zoom display setup: unanswered by meeting time', 'zoom', 'info');
      finish(false);
    }
    return;
  }
  void tryToAsk();
};

let firstTry: ReturnType<typeof setTimeout> | undefined;
let interval: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  firstTry = setTimeout(tick, FIRST_TRY_DELAY_MS);
  interval = setInterval(tick, TRY_INTERVAL_MS);
});

onBeforeUnmount(() => {
  clearTimeout(firstTry);
  clearInterval(interval);
  clearTimeout(finaleTimer);
});

watch(meeting, (value) => {
  if (value === null) {
    // The question closed meanwhile (at meeting time): so does its
    // confirmation.
    confirmTurnOff.value = false;
    return;
  }
  // Each time it's asked, the setup starts over from the question.
  step.value = 'ask';
  augmented.value = false;
  placement.value = null;
});

// The tour is over, however it ended: then comes the closing screen.
watch(
  () => store.tourStep,
  (value, previous) => {
    if (value !== null || previous === null || !finaleAfterTour) return;
    const kind = finaleAfterTour;
    finaleAfterTour = null;
    showFinale(kind);
  },
);
</script>

<style lang="scss" scoped>
.zoom-display-setup {
  background: rgba(10, 10, 14, 0.92);
  color: #fff;
  height: 100%;
  padding: 24px;
  width: 100%;
}

.zoom-display-setup__text {
  max-width: 560px;
  opacity: 0.9;
}

.zoom-display-setup__tip {
  max-width: 520px;
  opacity: 0.7;
}

.zoom-display-setup__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.zoom-display-setup__note {
  border-radius: 8px;
  max-width: 560px;
  padding: 10px 14px;

  &--positive {
    background: color-mix(in srgb, var(--q-positive) 22%, transparent);
  }

  &--warning {
    background: color-mix(in srgb, var(--q-warning) 22%, transparent);
  }
}
</style>
