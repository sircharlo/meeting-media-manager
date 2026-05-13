import { describe, expect, it } from 'vitest';

import { fetchLatestVersion } from '../api.ts';

describe('fetchLatestVersion', () => {
  it('should fetch the latest version', async () => {
    const version = await fetchLatestVersion();
    expect(version).toBe('v1.2.3');
  });
});
