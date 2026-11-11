import type { MediaConversionJob } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useMediaConversionStore } from '../media-conversion';

const job = (overrides: Partial<MediaConversionJob>): MediaConversionJob => ({
  id: overrides.id ?? 'job',
  mediaUniqueId: overrides.mediaUniqueId ?? 'item',
  percent: null,
  problem: { codec: 'AVI', missing: 'picture' },
  source: 'additional',
  sourcePath: '/add/a.avi',
  status: 'queued',
  title: 'a.avi',
  ...overrides,
});

describe('media-conversion store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('has no percentage until a conversion reports one', () => {
    const store = useMediaConversionStore();
    store.jobs.push(job({ id: 'a' }), job({ id: 'b' }));
    expect(store.isBusy).toBe(true);
    expect(store.percent).toBeNull();
  });

  it('counts waiting conversions as not started in the overall percentage', () => {
    const store = useMediaConversionStore();
    store.jobs.push(
      job({ id: 'a', percent: 60, status: 'converting' }),
      job({ id: 'b' }),
      job({ id: 'c', percent: 100, status: 'done' }),
    );
    expect(store.percent).toBe(30);
  });

  it("finds an item's latest conversion", () => {
    const store = useMediaConversionStore();
    store.jobs.push(
      job({ id: 'old', mediaUniqueId: 'x', status: 'cancelled' }),
      job({ id: 'new', mediaUniqueId: 'x' }),
    );
    expect(store.jobForItem('x')?.id).toBe('new');
    expect(store.jobForItem('y')).toBeUndefined();
  });

  it('dismisses finished conversions only', () => {
    const store = useMediaConversionStore();
    store.jobs.push(
      job({ id: 'done', status: 'done' }),
      job({ id: 'running', status: 'converting' }),
    );
    store.dismissJob('done');
    store.dismissJob('running');
    expect(store.jobs.map((j) => j.id)).toEqual(['running']);
  });

  it('knows no problem for files it never checked', () => {
    const store = useMediaConversionStore();
    store.checks['/a.mp4'] = {
      key: '1:1',
      problem: { codec: 'AC3', missing: 'sound' },
    };
    expect(store.problemFor('/a.mp4')?.missing).toBe('sound');
    expect(store.problemFor('/b.mp4')).toBeNull();
    expect(store.problemFor('')).toBeNull();
  });
});
