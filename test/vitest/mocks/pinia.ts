import { createTestingPinia, type TestingOptions } from '@pinia/testing';
import { config } from '@vue/test-utils';
import { cloneDeep } from 'lodash-es';
import { afterAll, beforeAll, vi } from 'vitest';

export function installPinia(options?: TestingOptions) {
  const globalConfigBackup = cloneDeep(config.global);

  beforeAll(() => {
    config.global.plugins.unshift(
      createTestingPinia({ ...options, createSpy: vi.fn }),
    );
  });

  afterAll(() => {
    config.global = globalConfigBackup;
  });
}
