import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import LayoutComponent from './../LayoutComponent.vue';

installQuasarPlugin();

describe('layout example', () => {
  it('should mount component properly', () => {
    const wrapper = mount(LayoutComponent);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(wrapper.exists()).to.be.true;
  });
});