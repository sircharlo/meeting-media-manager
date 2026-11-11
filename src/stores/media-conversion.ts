import type {
  MediaConversionJob,
  MediaConversionStatus,
  MediaItem,
  PlaybackProblem,
} from 'src/types';

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const ACTIVE_STATUSES = new Set<MediaConversionStatus>([
  'converting',
  'preparing',
  'queued',
]);

export const isActiveConversion = (job?: MediaConversionJob) =>
  !!job && ACTIVE_STATUSES.has(job.status);

/**
 * Files that can't play on this computer, and their conversions into files
 * that can (see helpers/media-conversion). Session state: whether a file plays
 * depends on the computer, so every session checks again.
 */
export const useMediaConversionStore = defineStore('media-conversion', () => {
  /**
   * What was found for each file checked this session, by path. `key` (its
   * size and modification time) tells when the file changed since.
   */
  const checks = ref<
    Record<string, { key: string; problem: null | PlaybackProblem }>
  >({});
  const jobs = ref<MediaConversionJob[]>([]);
  /** Items whose conversion waits for the user to confirm it. */
  const pendingConfirmation = ref<MediaItem[] | null>(null);

  const activeJobs = computed(() => jobs.value.filter(isActiveConversion));
  const isBusy = computed(() => activeJobs.value.length > 0);

  /**
   * How far the active conversions are, all together: waiting ones count as
   * not started. Null while none reports a percentage yet.
   */
  const percent = computed<null | number>(() => {
    const active = activeJobs.value;
    if (!active.some((job) => job.percent !== null)) return null;
    const total = active.reduce((sum, job) => sum + (job.percent ?? 0), 0);
    return total / active.length;
  });

  const problemFor = (path?: string) =>
    (path && checks.value[path]?.problem) || null; // NOSONAR: '' has no check

  /** The item's latest conversion, if it had one this session. */
  const jobForItem = (uniqueId: string) =>
    jobs.value.findLast((job) => job.mediaUniqueId === uniqueId);

  const updateJob = (id: string, changes: Partial<MediaConversionJob>) => {
    const job = jobs.value.find((j) => j.id === id);
    if (job) Object.assign(job, changes);
  };

  /** Takes a finished conversion off the media sync popup. */
  const dismissJob = (id: string) => {
    jobs.value = jobs.value.filter(
      (job) => job.id !== id || isActiveConversion(job),
    );
  };

  return {
    activeJobs,
    checks,
    dismissJob,
    isBusy,
    jobForItem,
    jobs,
    pendingConfirmation,
    percent,
    problemFor,
    updateJob,
  };
});
