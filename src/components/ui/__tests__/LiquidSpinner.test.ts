import { mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it } from 'vitest';

import LiquidSpinner from '../LiquidSpinner.vue';

installPinia();

const sizeOf = (wrapper: ReturnType<typeof mount>) =>
  (wrapper.element as HTMLElement).style.getPropertyValue(
    '--liquid-spinner-size',
  );

describe('LiquidSpinner', () => {
  it('is a sloshing glass', () => {
    const wrapper = mount(LiquidSpinner);

    expect(wrapper.findComponent({ name: 'LiquidFill' }).props()).toMatchObject(
      { axis: 'y', noBubbles: true, sloshing: true },
    );
  });

  it.each([
    ['as big as the text around it by default', undefined, '1em'],
    ["Quasar's named sizes", 'sm', '24px'],
    ['any CSS size', '64px', '64px'],
  ])('takes %s', (_, size, expected) => {
    const wrapper = mount(LiquidSpinner, { props: { size } });

    expect(sizeOf(wrapper)).toBe(expected);
  });

  it('takes a Quasar color, or else the color of the text around it', () => {
    expect(
      mount(LiquidSpinner, { props: { color: 'primary' } }).classes(),
    ).toContain('text-primary');
    expect(
      mount(LiquidSpinner)
        .classes()
        .some((name) => name.startsWith('text-')),
    ).toBe(false);
  });

  it('is hidden from assistive technology, as q-spinner is', () => {
    const wrapper = mount(LiquidSpinner);

    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });
});
