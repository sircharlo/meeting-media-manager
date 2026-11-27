import { defineStore } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { computed, nextTick, ref, watch } from 'vue';

/**
 * Which goes first when several things that open on their own want the
 * screen at the same time: the highest. Before a meeting, Zoom comes first:
 * its check's result, then its question, then the Zoom display question
 * (which also waits for today's check, see DialogZoomDisplaySetup); then
 * today's song check, the missing special dates, the quick-start tour, and
 * feature tips last. What's still on its way keeps its place meanwhile (see
 * keepPlace): the Zoom steps while they run, the Zoom display question until
 * it's asked.
 */
export const SCREEN_PRIORITY = {
  featureTip: 10,
  meetingSongCheck: 40,
  missingDates: 30,
  quickStartTour: 20,
  zoomCheckPrompt: 50,
  zoomCheckResult: 60,
  zoomDisplayQuestion: 45,
} as const;

/** Something waiting for its turn to open (see request). */
export interface ScreenRequest {
  /**
   * Opens it, now that the screen is free and it's its turn: from then on,
   * what it opened holds the screen (a dialog, a tour). Returns false if it
   * no longer wants to open, and the next one goes.
   */
  open: () => boolean | undefined;
  priority: number;
}

/**
 * Whether something has the user's attention, so that whatever opens on its
 * own waits for it instead of opening over it, or under it, and opens one at
 * a time, most important first. The screen is taken while:
 *
 * - a dialog is open (they register in the dialog-state store);
 * - the profile picker is up, including while it picks a profile by itself
 *   at startup, when no dialog shows;
 * - something that isn't a dialog claimed it: a tour, the setup wizard (see
 *   useScreenClaim);
 * - something was just given its turn, until what it opened shows.
 *
 * What opens on its own asks for its turn (request) instead of opening: the
 * feature tips, the quick-start tour, the missing-dates screen, today's song
 * check, and the Zoom questions and check result. What the user opens still
 * opens at once.
 *
 * Notifications wait for the screens that cover the whole window (see
 * holdsNotifications). Keyboard shortcuts still look at dialogs only
 * (dialog-state's isAnyDialogOpen), not at this.
 */
export const useAttentionStore = defineStore('attention', () => {
  const dialogState = useDialogStateStore();
  const currentState = useCurrentStateStore();

  /** What claimed the screen, by name (e.g. 'zoom-display-tour'). */
  const claims = ref(new Set<string>());

  /** The claims that cover the whole window too: tours, not the wizard. */
  const takeoverClaims = ref(new Set<string>());

  /** What waits for its turn, by name (e.g. 'feature-tip'). */
  const waiting = ref(new Map<string, ScreenRequest>());

  /** The places kept for what's on its way, by name, with their priority. */
  const keptPlaces = ref(new Map<string, number>());

  // Something was just given its turn: what it opened shows (and holds the
  // screen) in Vue's next update, and nothing else opens until then.
  const handingOver = ref(false);

  const isScreenTaken = computed(
    () =>
      claims.value.size > 0 ||
      dialogState.isAnyDialogOpen ||
      !!currentState.congregationSwitcherOpen ||
      handingOver.value,
  );

  // What waits with a lower priority than a kept place waits for it too.
  const lowestPriorityToOpen = computed(() =>
    Math.max(0, ...keptPlaces.value.values()),
  );

  const mayOpen = (screenRequest: ScreenRequest) =>
    screenRequest.priority >= lowestPriorityToOpen.value;

  const hasRequestToOpen = computed(() =>
    [...waiting.value.values()].some((screenRequest) => mayOpen(screenRequest)),
  );

  /**
   * Whether new notifications wait instead of showing (see
   * createTemporaryNotification): while a screen covers the whole window (a
   * full-window dialog, a tour), and while one may be about to (something
   * is being given its turn, or can be now).
   */
  const holdsNotifications = computed(
    () =>
      takeoverClaims.value.size > 0 ||
      dialogState.isTakeoverOpen ||
      handingOver.value ||
      (!isScreenTaken.value && hasRequestToOpen.value),
  );

  /**
   * Claims the screen under `name`. A `takeover` covers the whole window (a
   * tour): notifications wait for it too (see holdsNotifications).
   */
  const claim = (name: string, { takeover = false } = {}) => {
    claims.value.add(name);
    if (takeover) takeoverClaims.value.add(name);
  };

  const release = (name: string) => {
    claims.value.delete(name);
    takeoverClaims.value.delete(name);
  };

  const isClaimed = (name: string) => claims.value.has(name);

  const takeNext = () => {
    let next: [string, ScreenRequest] | undefined;
    for (const entry of waiting.value) {
      if (!mayOpen(entry[1])) continue;
      if (!next || entry[1].priority > next[1].priority) next = entry;
    }
    if (next) waiting.value.delete(next[0]);
    return next?.[1];
  };

  /** Gives the free screen to what's waiting, most important first. */
  const openNext = () => {
    while (!isScreenTaken.value) {
      const next = takeNext();
      if (!next) return;
      // It looks at the screen as it is: still free.
      if (next.open() === false) continue;
      handingOver.value = true;
      void nextTick(() => {
        handingOver.value = false;
      });
      return;
    }
  };

  /**
   * Asks for the screen under `name`, replacing an earlier request by that
   * name: it opens at once if the screen is free, else when it's its turn.
   */
  const request = (name: string, screenRequest: ScreenRequest) => {
    waiting.value.set(name, screenRequest);
    openNext();
  };

  /** No longer waits for the screen under `name`. */
  const withdraw = (name: string) => {
    waiting.value.delete(name);
  };

  const isWaiting = (name: string) => waiting.value.has(name);

  /**
   * Keeps a place under `name`, at `priority`, for something on its way
   * that can't ask for its turn yet (it waits for something still running):
   * until it's let go (releasePlace), what waits with a lower priority
   * doesn't open, so it doesn't get ahead of it. What's already showing
   * stays.
   */
  const keepPlace = (name: string, priority: number) => {
    keptPlaces.value.set(name, priority);
  };

  /** Lets go of the place kept under `name`, if any. */
  const releasePlace = (name: string) => {
    keptPlaces.value.delete(name);
  };

  const isPlaceKept = (name: string) => keptPlaces.value.has(name);

  watch(
    () => !isScreenTaken.value && hasRequestToOpen.value,
    (ready) => {
      if (ready) openNext();
    },
  );

  return {
    claim,
    claims,
    holdsNotifications,
    isClaimed,
    isPlaceKept,
    isScreenTaken,
    isWaiting,
    keepPlace,
    keptPlaces,
    release,
    releasePlace,
    request,
    takeoverClaims,
    waiting,
    withdraw,
  };
});
