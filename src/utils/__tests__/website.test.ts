import { describe, expect, it } from 'vitest';

import { isSiteAvailable } from '../website';

const jwOrg = { baseUrl: 'jw.org' };
const other = { baseUrl: 'example.test' };

// A different Website must never fall back to jw.org's own sites.
describe('isSiteAvailable', () => {
  it('offers JW Stream and the conventions site only for jw.org', () => {
    expect(isSiteAvailable('stream', jwOrg)).toBe(true);
    expect(isSiteAvailable('jwevent', jwOrg)).toBe(true);
    expect(isSiteAvailable('stream', other)).toBe(false);
    expect(isSiteAvailable('jwevent', other)).toBe(false);
  });

  it('always offers the main site', () => {
    expect(isSiteAvailable(undefined, jwOrg)).toBe(true);
    expect(isSiteAvailable(undefined, other)).toBe(true);
  });
});
