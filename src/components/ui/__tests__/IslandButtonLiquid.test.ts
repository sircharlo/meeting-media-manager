import { mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it } from 'vitest';

import IslandButtonLiquid from '../IslandButtonLiquid.vue';

installPinia();

const mountLiquid = (
  props: InstanceType<typeof IslandButtonLiquid>['$props'],
) =>
  mount(IslandButtonLiquid, {
    props,
    slots: { default: '<i class="the-icon" />' },
  });

describe('IslandButtonLiquid', () => {
  it('shows nothing until asked to', () => {
    const wrapper = mountLiquid({ sloshing: true });

    expect(wrapper.findComponent({ name: 'LiquidFill' }).exists()).toBe(false);
    expect(wrapper.find('.the-icon').exists()).toBe(false);
  });

  it('draws the icon again where the liquid covers it', () => {
    const wrapper = mountLiquid({ showing: true, sloshing: true });

    const clipId = wrapper.find('clipPath').attributes('id');
    const ink = wrapper.find('.island-liquid__ink');
    expect(ink.find('.the-icon').exists()).toBe(true);
    expect(ink.attributes('style')).toContain(`url(#${clipId})`);
    expect(ink.attributes('aria-hidden')).toBe('true');
  });

  it('turns blue, with a white icon under it, on an open popup’s button', () => {
    const wrapper = mountLiquid({ open: true, showing: true, sloshing: true });

    expect(wrapper.find('.island-liquid--open').exists()).toBe(true);
    expect(wrapper.find('.island-liquid__ink--open').exists()).toBe(true);
  });

  it('starts a new liquid, with its own clip path, for each restart key', async () => {
    const wrapper = mountLiquid({ restartKey: 1, showing: true });
    const firstId = wrapper.find('clipPath').attributes('id');

    await wrapper.setProps({ restartKey: 2 });

    expect(wrapper.find('clipPath').attributes('id')).not.toBe(firstId);
  });
});
