import { describe, expect, it, vi } from 'vitest';

import {
  createAudioOutputRecovery,
  isAudioOutputError,
} from '../audio-output-recovery';

const AUDIO_RENDERER_ERROR = {
  code: 3,
  message: 'PipelineStatus::AUDIO_RENDERER_ERROR: audio render error',
} as MediaError;

/** A media element that failed with the given error, at the given time. */
const failedElement = (error: MediaError | null, currentTime = 42.5) =>
  ({ currentTime, error, load: vi.fn() }) as unknown as HTMLMediaElement & {
    load: ReturnType<typeof vi.fn>;
  };

describe('audio output recovery', () => {
  it.each([
    [AUDIO_RENDERER_ERROR, true],
    [{ code: 3, message: 'PIPELINE_ERROR_DECODE: format error' }, false],
    [{ code: 4, message: 'MEDIA_ELEMENT_ERROR: Format error' }, false],
    [null, false],
  ])('tells an audio output failure from others: %o', (error, expected) => {
    expect(isAudioOutputError(error as MediaError | null)).toBe(expected);
  });

  it('loads the element again to resume where it was, once per load', () => {
    const recovery = createAudioOutputRecovery();
    const element = failedElement(AUDIO_RENDERER_ERROR);

    expect(recovery.recover(element)).toEqual({ attempt: 1, resumeAt: 42.5 });
    expect(element.load).toHaveBeenCalledOnce();
    expect(recovery.takeResumeTime(element)).toBe(42.5);
    // Any later load (seeking back to the start, say) starts as usual.
    expect(recovery.takeResumeTime(element)).toBeNull();
  });

  it('stops trying after a couple of failures of the same playback', () => {
    const recovery = createAudioOutputRecovery();
    const element = failedElement(AUDIO_RENDERER_ERROR);

    expect(recovery.recover(element)?.attempt).toBe(1);
    expect(recovery.recover(element)?.attempt).toBe(2);
    expect(recovery.recover(element)).toBeNull();
    expect(element.load).toHaveBeenCalledTimes(2);

    // The next playback (a new element) gets its own tries.
    expect(recovery.recover(failedElement(AUDIO_RENDERER_ERROR))?.attempt).toBe(
      1,
    );
  });

  it('leaves other playback errors alone', () => {
    const recovery = createAudioOutputRecovery();
    const element = failedElement({
      code: 4,
      message: 'MEDIA_ELEMENT_ERROR: Format error',
    } as MediaError);

    expect(recovery.recover(element)).toBeNull();
    expect(element.load).not.toHaveBeenCalled();
    expect(recovery.takeResumeTime(element)).toBeNull();
  });
});
