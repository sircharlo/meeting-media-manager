import { beforeEach, describe, expect, it, vi } from 'vitest';

import { __testables, takeYeartextPreviewOffer } from '../yeartext-preview';

const meeting = vi.hoisted(() => ({ start: null as Date | null }));

vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getMeetingStartToday: () => meeting.start,
}));

// December 15, 2026, at 10:00.
const NOW = new Date(2026, 11, 15, 10, 0);

beforeEach(() => {
  __testables.reset();
  meeting.start = null;
});

describe('takeYeartextPreviewOffer', () => {
  // The question stays up until answered; changing the profile, the
  // yeartext or the connection used to show it again, and stack it.
  it('offers each year once per session', () => {
    expect(takeYeartextPreviewOffer(2027, NOW)).toBe(true);
    expect(takeYeartextPreviewOffer(2027, NOW)).toBe(false);
  });

  it('waits until the meeting is over, then offers it', () => {
    meeting.start = new Date(2026, 11, 15, 10, 10);
    expect(takeYeartextPreviewOffer(2027, NOW)).toBe(false);

    const afterTheMeeting = new Date(2026, 11, 15, 13, 0);
    expect(takeYeartextPreviewOffer(2027, afterTheMeeting)).toBe(true);
  });
});
