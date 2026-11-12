import { useZoomStateStore } from 'stores/zoom-state';

// Asking the user before the Zoom startup check touches Zoom: the check
// brings Zoom's window forward and presses a few of its buttons for a few
// seconds, so it waits for the user to say when it may run, and never
// operates Zoom behind their back before a meeting.
//
// The question is shown by DialogZoomCheckPrompt, which answers it.

/**
 * What the user said when asked whether M³ may test Zoom, or 'unanswered'
 * when nobody did in time.
 */
export type ZoomCheckPromptAnswer = 'run' | 'skip' | 'unanswered';

/**
 * How long the question waits for an answer. The dialog may not be there to
 * answer it at all (a window that doesn't show it, or one where it failed to
 * mount), and the check must never wait on it for ever: after this it gives
 * up on the question and asks again later (see zoom-startup-check.ts).
 */
export const CHECK_PROMPT_TIMEOUT_MS = 2 * 60_000;

let awaitingAnswer: ((answer: ZoomCheckPromptAnswer) => void) | null = null;

/** Answers the question, whoever answers first: later answers change nothing. */
const settle = (answer: ZoomCheckPromptAnswer) => {
  // The question always goes away when it is answered, even if nothing is
  // waiting for the answer any more (the check gave up on it, see the timeout
  // below): otherwise the dialog stays on screen and its buttons do nothing.
  useZoomStateStore().closeCheckPrompt();
  const resolve = awaitingAnswer;
  if (!resolve) return;
  awaitingAnswer = null;
  resolve(answer);
};

/**
 * Asks the user whether a check may run now, and resolves to what they chose
 * (see DialogZoomCheckPrompt), or to 'unanswered' if they didn't say within
 * `timeoutMs`.
 */
export const askBeforeCheckingZoom = (timeoutMs = CHECK_PROMPT_TIMEOUT_MS) => {
  // A question left over from an earlier ask is not worth waiting for.
  settle('unanswered');
  return new Promise<ZoomCheckPromptAnswer>((resolve) => {
    const timer = setTimeout(() => settle('unanswered'), timeoutMs);
    awaitingAnswer = (answer) => {
      clearTimeout(timer);
      resolve(answer);
    };
    useZoomStateStore().promptForCheck();
  });
};

/** The user's answer to askBeforeCheckingZoom(), from DialogZoomCheckPrompt. */
export const answerZoomCheckPrompt = (answer: 'run' | 'skip') => {
  settle(answer);
};
