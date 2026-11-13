import { describe, expect, it } from 'vitest';

import { piniaBreadcrumbActionTransformer } from '../index';

describe('piniaBreadcrumbActionTransformer', () => {
  it.each([
    // Read-only queries.
    'isSettingInvalid',
    'areDependenciesSatisfied',
    'invalidSettings',
    // The Zoom Meeting Manager's bookkeeping and polling.
    'beginRun',
    'endRun',
    'setRunStep',
    'setMeeting',
    'setRaisedHands',
    // The music store's clock formatter: every second while music plays
    // (MMM-V2-3MW).
    'formatClockTime',
  ])('drops breadcrumbs for frequent actions: %s', (action) => {
    expect(piniaBreadcrumbActionTransformer(action)).toBeNull();
  });

  it.each([
    'addToAdditionMediaMap',
    'requestCancel',
    'abortRun',
    'pauseAutomations',
  ])('keeps breadcrumbs for actions that change something: %s', (action) => {
    expect(piniaBreadcrumbActionTransformer(action)).toBe(action);
  });
});
