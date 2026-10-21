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
