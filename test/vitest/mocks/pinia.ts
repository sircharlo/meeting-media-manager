import { createTestingPinia, type TestingOptions } from '@pinia/testing';
import { config } from '@vue/test-utils';
import { afterAll, beforeAll, vi } from 'vitest';

export function installPinia(options?: TestingOptions) {
  const globalConfigBackup = structuredClone(config.global);

  beforeAll(() => {
    config.global.plugins.unshift(
      createTestingPinia({ ...options, createSpy: vi.fn }),
    );
  });

  afterAll(() => {
    config.global = globalConfigBackup;
  });
}
