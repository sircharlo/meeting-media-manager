import { createPinia, setActivePinia } from 'pinia';
import { useZoomStateStore } from 'stores/zoom-state';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Zoom check prompt', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows the question, and keeps it up until it is answered', async () => {
    const { answerZoomCheckPrompt, askBeforeCheckingZoom } =
      await import('../zoom-check-prompt');
    const zoomState = useZoomStateStore();

    const answer = askBeforeCheckingZoom();
    expect(zoomState.checkPrompt).toBe(true);

    answerZoomCheckPrompt('run');
    expect(await answer).toBe('run');
    expect(zoomState.checkPrompt).toBe(false);
  });

  it('stops waiting when nobody answers, and closes the question', async () => {
    const { answerZoomCheckPrompt, askBeforeCheckingZoom } =
      await import('../zoom-check-prompt');
    const zoomState = useZoomStateStore();

    const answer = askBeforeCheckingZoom(10);
    expect(zoomState.checkPrompt).toBe(true);

    expect(await answer).toBe('unanswered');
    expect(zoomState.checkPrompt).toBe(false);
    // Answering afterwards changes nothing: the question is over.
    expect(() => answerZoomCheckPrompt('run')).not.toThrow();
  });

  it('gives up on a question left over when a new one is asked', async () => {
    const { answerZoomCheckPrompt, askBeforeCheckingZoom } =
      await import('../zoom-check-prompt');

    const first = askBeforeCheckingZoom(60_000);
    const second = askBeforeCheckingZoom(60_000);

    // Only the newest question can be answered.
    expect(await first).toBe('unanswered');
    answerZoomCheckPrompt('run');
    expect(await second).toBe('run');
  });

  it("passes the user's skip on, and stops asking", async () => {
    const { answerZoomCheckPrompt, askBeforeCheckingZoom } =
      await import('../zoom-check-prompt');
    const zoomState = useZoomStateStore();

    const answer = askBeforeCheckingZoom();
    answerZoomCheckPrompt('skip');

    expect(await answer).toBe('skip');
    expect(zoomState.checkPrompt).toBe(false);
  });
});
