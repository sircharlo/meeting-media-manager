import { config } from '@vue/test-utils';
import { cloneDeep } from 'lodash-es';
import { Quasar, type QuasarPluginOptions } from 'quasar';
import { afterAll, beforeAll, vi } from 'vitest';
import { ref } from 'vue';

export function installQuasarPlugin(options?: Partial<QuasarPluginOptions>) {
  const globalConfigBackup = cloneDeep(config.global);

  beforeAll(() => {
    config.global.plugins.unshift([Quasar, options]);
    config.global.provide = {
      ...config.global.provide,
      ...qLayoutInjections(),
    };
  });

  afterAll(() => {
    config.global = globalConfigBackup;
  });
}

/**
 * Injections for Components with a QPage root Element
 */
function qLayoutInjections() {
  return {
    // layoutKey
    _q_l_: {
      animate: vi.fn(),
      footer: { offset: 0, size: 0, space: false },
      header: { offset: 0, size: 0, space: false },
      height: ref(900),
      instances: {},
      isContainer: ref(false),
      left: { offset: 0, size: 300, space: false },
      right: { offset: 0, size: 300, space: false },
      rows: ref({ bottom: 'lff', middle: 'Lpr', top: 'lHh' }),
      scroll: ref({ direction: 'up', position: 0 }),
      scrollbarWidth: ref(125),
      totalWidth: ref(1200),
      update: vi.fn(),
      view: ref('lHh Lpr lff'),
    },
    // pageContainerKey
    _q_pc_: true,
  };
}
