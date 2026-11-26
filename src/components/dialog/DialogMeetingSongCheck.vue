<template>
  <!-- Today's songs, checked before the meeting (see findSongProblems): a
       song in it twice, or one nobody added yet. Over the whole window,
       since either stops the meeting if nobody fixes it in time. -->
  <BaseDialog
    v-model="open"
    dialog-id="meeting-song-check"
    maximized
    no-backdrop-dismiss
    no-esc-dismiss
    persistent
    transition-hide="fade"
    transition-show="fade"
  >
    <q-card
      class="meeting-song-check column items-center justify-center text-center"
    >
      <q-icon color="warning" name="mmm-music-note" size="64px" />
      <div class="text-h5 text-weight-medium q-mt-lg">
        {{ t('meeting-song-check-title') }}
      </div>
      <p class="meeting-song-check__text q-mt-md">
        {{
          displayed.length
            ? t('meeting-song-check-explain')
            : t('meeting-song-check-all-set')
        }}
      </p>
      <div
        v-for="problem in displayed"
        :key="songProblemKey(problem)"
        class="meeting-song-check__row row items-center q-mt-sm"
      >
        <span class="col text-left">{{ describe(problem) }}</span>
        <div class="meeting-song-check__row-actions">
          <template v-if="problem.kind === 'duplicate'">
            <q-btn
              color="primary"
              :label="t('meeting-song-check-show-me')"
              no-caps
              unelevated
              @click="showMe(problem)"
            />
            <q-btn
              :label="t('meeting-song-check-on-purpose')"
              no-caps
              outline
              @click="markOkay(problem)"
            />
          </template>
          <template v-else>
            <q-btn
              color="primary"
              :label="t('meeting-song-check-add-song')"
              no-caps
              unelevated
              @click="addSong(problem)"
            />
            <q-btn
              v-if="problem.kind === 'no-pt-song'"
              :label="t('meeting-song-check-no-public-talk')"
              no-caps
              outline
              @click="markOkay(problem)"
            />
          </template>
        </div>
      </div>
      <div class="meeting-song-check__actions">
        <q-btn
          :label="displayed.length ? t('later') : t('close')"
          no-caps
          outline
          @click="later"
        />
      </div>
    </q-card>
  </BaseDialog>
</template>

<script setup lang="ts">
import type { MediaSectionIdentifier } from 'src/types';

import { useIntervalFn, useNow } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { CO_WEEK_ADDITIONAL_SECTION } from 'src/constants/media';
import {
  getMeetingStartToday,
  isCoWeek,
  isMwMeetingDay,
  isWeMeetingDay,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  findSongProblems,
  markSongProblemOkay,
  type SongProblem,
  songProblemKey,
} from 'src/helpers/meeting-song-check';
import { datesAreSame, formatDate } from 'src/utils/date';
import { SCREEN_PRIORITY, useAttentionStore } from 'stores/attention';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

// Its turn to show, in the attention store.
const SCREEN_REQUEST = 'meeting-song-check';
// What's put off and still not fixed comes back once, this close to the
// start.
const LAST_CALL_MS = 5 * 60 * 1000;

const { t } = useI18n();
const route = useRoute();
const attention = useAttentionStore();
const currentState = useCurrentStateStore();
const { currentCongregation, currentSongbook, mediaPlaying } =
  storeToRefs(currentState);
const { lookupPeriod } = storeToRefs(useJwStore());

const now = useNow({ scheduler: (tick) => useIntervalFn(tick, 30_000) });
// Changes once a day: what depends on the date alone doesn't run every 30 s.
const todayKey = computed(() => formatDate(now.value, 'YYYY/MM/DD'));

const today = computed(() =>
  lookupPeriod.value[currentCongregation.value]?.find((day) =>
    datesAreSame(day.date, todayKey.value),
  ),
);

const todaysMeeting = computed((): 'mw' | 'we' | null => {
  const date = new Date(todayKey.value);
  if (isMwMeetingDay(date)) return 'mw';
  if (isWeMeetingDay(date)) return 'we';
  return null;
});

const meetingStart = computed(() =>
  todaysMeeting.value ? getMeetingStartToday(now.value) : null,
);
const isBeforeMeeting = computed(
  () => !!meetingStart.value && now.value < meetingStart.value,
);
const isLastCall = computed(
  () =>
    !!meetingStart.value &&
    meetingStart.value.getTime() - now.value.getTime() <= LAST_CALL_MS,
);

// Only once the day's media are in: while they load, the songs aren't all
// there yet.
const problems = computed((): SongProblem[] => {
  const day = today.value;
  const meeting = todaysMeeting.value;
  if (day?.status !== 'complete' || !meeting) return [];
  return findSongProblems(day, {
    coWeek: isCoWeek(day.date),
    meeting,
    songbookPub: currentSongbook.value?.pub,
  });
});

/**
 * What the user put off (Later, or going to fix it), per profile and day:
 * it isn't asked about again that session, except once in the last minutes
 * before the start, for what's still not fixed then.
 */
interface PutOff {
  beforeLastCall: boolean;
  keys: string[];
}
const putOff = ref<Record<string, PutOff>>({});
const dayKey = computed(() => `${currentCongregation.value}|${todayKey.value}`);

const toAsk = computed(() => {
  const entry = putOff.value[dayKey.value];
  const comesBack = !!entry?.beforeLastCall && isLastCall.value;
  return problems.value.filter(
    (problem) => comesBack || !entry?.keys.includes(songProblemKey(problem)),
  );
});

// On the media calendar, where the songs are added, never during the
// meeting, and never over media playing.
const askKeys = computed(() => {
  if (
    route.name !== 'media-calendar' ||
    !isBeforeMeeting.value ||
    !!mediaPlaying.value.url
  ) {
    return '';
  }
  return toAsk.value.map((problem) => songProblemKey(problem)).join('|');
});

// Showing: only its buttons close it, so it's never missed. It stays when
// the meeting starts, and once the songs are fixed some other way, it says
// so and waits for Close.
const shown = ref(false);
// What it lists, kept while it fades out once closed.
const displayed = ref<SongProblem[]>([]);

const open = computed({
  get: () => shown.value,
  set: () => undefined,
});

const describe = (problem: SongProblem) => {
  if (problem.kind === 'duplicate') {
    return t('meeting-song-check-duplicate', { number: problem.song });
  }
  if (problem.kind === 'no-pt-song') return t('meeting-song-check-no-pt-song');
  return t('meeting-song-check-no-co-song');
};

const close = () => {
  shown.value = false;
};

const putOffAll = () => {
  const keys = problems.value.map((problem) => songProblemKey(problem));
  const earlier = putOff.value[dayKey.value]?.keys ?? [];
  putOff.value[dayKey.value] = {
    beforeLastCall: !isLastCall.value,
    keys: [...new Set([...earlier, ...keys])],
  };
};

const later = () => {
  putOffAll();
  close();
};

const goToToday = () => {
  currentState.selectedDate = todayKey.value;
};

// Brings the song's first item into view, once today's media list shows.
const showMe = (problem: Extract<SongProblem, { kind: 'duplicate' }>) => {
  putOffAll();
  close();
  goToToday();
  void nextTick(() => {
    try {
      document
        .querySelector(`[data-id="${CSS.escape(problem.firstItemId)}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      errorCatcher(error, {
        contexts: { fn: { name: 'meetingSongCheck.showMe' } },
      });
    }
  });
};

// Answering the last one closes it: that's the user's own answer.
const markOkay = (problem: SongProblem) => {
  if (today.value) markSongProblemOkay(today.value, problem);
  if (!problems.value.length) close();
};

// The song picker opens for that section, on today's media (see
// HeaderCalendar's openSongPicker).
const addSong = (problem: SongProblem) => {
  const section: MediaSectionIdentifier =
    problem.kind === 'no-pt-song' ? 'pt' : CO_WEEK_ADDITIONAL_SECTION;
  putOffAll();
  close();
  goToToday();
  globalThis.dispatchEvent(
    new CustomEvent('openSongPicker', { detail: { section } }),
  );
};

const askForTurn = () => {
  attention.request(SCREEN_REQUEST, {
    open: () => {
      if (!askKeys.value) return false;
      shown.value = true;
    },
    priority: SCREEN_PRIORITY.meetingSongCheck,
  });
};

onBeforeUnmount(() => {
  attention.withdraw(SCREEN_REQUEST);
});

// Asks again whenever something new needs asking about: the day's media
// coming in, a song changing, the last call.
watch(
  askKeys,
  (keys) => {
    if (shown.value) return;
    if (keys) askForTurn();
    else attention.withdraw(SCREEN_REQUEST);
  },
  { immediate: true },
);

// While it shows, the list follows the songs.
watch(
  [shown, problems],
  () => {
    if (shown.value) displayed.value = problems.value;
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.meeting-song-check {
  background: rgba(10, 10, 14, 0.92);
  color: #fff;
  height: 100%;
  padding: 24px;
  width: 100%;
}

.meeting-song-check__text {
  max-width: 600px;
  opacity: 0.9;
}

.meeting-song-check__row {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  gap: 12px;
  max-width: 600px;
  padding: 10px 14px;
  width: 100%;
}

.meeting-song-check__row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meeting-song-check__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}
</style>
