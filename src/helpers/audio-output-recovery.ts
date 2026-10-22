// Chromium stops a <video> or <audio> with "PipelineStatus::AUDIO_RENDERER_
// ERROR" when the audio output it plays to fails mid-playback: the device
// was unplugged or changed (an HDMI display or projector, a Bluetooth
// speaker), its driver reset, or another app took it over (MMM-V2-3MH,
// MMM-V2-3J0). The file is fine, and loading it again opens a new audio
// output, so the media window picks up where it was instead of cutting a
// song short in the middle of a meeting. A device that keeps failing still
// ends the media after a couple of tries, as any other playback error does.

const AUDIO_OUTPUT_ERROR = 'AUDIO_RENDERER_ERROR';
const MAX_RECOVERIES = 2;

/** Whether a media element failed because its audio output did. */
export const isAudioOutputError = (error: MediaError | null | undefined) =>
  !!error?.message?.includes(AUDIO_OUTPUT_ERROR);

export interface AudioOutputRecovery {
  /** Which try this is for the element, from 1. */
  attempt: number;
  /** Where playback resumes, in seconds. */
  resumeAt: number;
}

export const createAudioOutputRecovery = () => {
  // Per element, so each playback gets its own tries: the media window
  // renders a new element for every item it plays.
  const attempts = new WeakMap<HTMLMediaElement, number>();
  const resumeTimes = new WeakMap<HTMLMediaElement, number>();

  return {
    /**
     * When the element failed because of its audio output, loads it again
     * to resume where it was (see takeResumeTime).
     * @returns The recovery, or null when it isn't one or was tried enough.
     */
    recover(element: HTMLMediaElement): AudioOutputRecovery | null {
      if (!isAudioOutputError(element.error)) return null;
      const attempt = (attempts.get(element) ?? 0) + 1;
      if (attempt > MAX_RECOVERIES) return null;
      attempts.set(element, attempt);
      const resumeAt = element.currentTime;
      resumeTimes.set(element, resumeAt);
      element.load();
      return { attempt, resumeAt };
    },

    /**
     * Where an element loaded again by recover() resumes, once; null for
     * any other load, which starts from the beginning as usual.
     */
    takeResumeTime(element: HTMLMediaElement): null | number {
      const resumeAt = resumeTimes.get(element);
      if (resumeAt === undefined) return null;
      resumeTimes.delete(element);
      return resumeAt;
    },
  };
};
