import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { Dark, QIcon } from 'quasar';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

import LiquidSpinner from '../LiquidSpinner.vue';
import NoticeBanner from '../NoticeBanner.vue';

installQuasarPlugin();
installPinia();

type Props = InstanceType<typeof NoticeBanner>['$props'];

const mountNotice = (props: Props, slots = {}) =>
  mount(NoticeBanner, {
    props,
    slots: { default: () => 'Some media items have been hidden.', ...slots },
  });

describe('NoticeBanner', () => {
  it.each([
    ['positive', 'mmm-check'],
    ['info', 'mmm-info'],
    ['warning', 'mmm-warning'],
    ['negative', 'mmm-error'],
    ['neutral', 'mmm-info'],
  ] as const)(
    'shows a %s notice with its own look and the %s icon',
    (type, icon) => {
      const wrapper = mountNotice({ type });

      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['notice', `notice--${type}`, 'q-banner']),
      );
      expect(wrapper.findComponent(QIcon).props('name')).toBe(icon);
      expect(wrapper.text()).toContain('Some media items have been hidden.');
    },
  );

  it('takes the classes its page gives it, for its layout there', () => {
    const wrapper = mount(NoticeBanner, {
      attrs: { class: 'full-width' },
      props: { type: 'info' },
    });

    expect(wrapper.classes()).toContain('full-width');
  });

  it('takes an icon in place of its type’s own', () => {
    const wrapper = mountNotice({ icon: 'mmm-file-hidden', type: 'warning' });

    expect(wrapper.findComponent(QIcon).props('name')).toBe('mmm-file-hidden');
  });

  it('shows a sloshing glass in place of its icon while work is under way', () => {
    const wrapper = mountNotice({ loading: true, type: 'info' });

    expect(wrapper.findComponent(LiquidSpinner).exists()).toBe(true);
    expect(wrapper.findComponent(QIcon).exists()).toBe(false);
  });

  // Its tint and text follow the theme through CSS variables; Quasar's own
  // dark banner would paint it a flat dark grey instead.
  it('never takes the dark QBanner look', () => {
    Dark.set(true);
    try {
      const wrapper = mountNotice({ type: 'negative' });

      expect(wrapper.classes()).not.toContain('q-dark');
      expect(wrapper.classes()).not.toContain('q-banner--dark');
    } finally {
      Dark.set(false);
    }
  });

  it('runs an action when its button is clicked', async () => {
    const onClick = vi.fn();
    const wrapper = mountNotice({
      actions: [{ label: 'Show all media', onClick }],
      type: 'warning',
    });

    const button = wrapper.find('.q-banner__actions button');
    expect(button.text()).toBe('Show all media');
    await button.trigger('click');

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('takes its buttons from its action slot instead', async () => {
    const onClick = vi.fn();
    const wrapper = mountNotice(
      { type: 'warning' },
      { action: () => h('button', { onClick }, 'Open setup') },
    );

    await wrapper.find('.q-banner__actions button').trigger('click');

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has no row of buttons without any', () => {
    const wrapper = mountNotice({ type: 'info' });

    expect(wrapper.find('.q-banner__actions').exists()).toBe(false);
  });

  it('is smaller when dense', () => {
    const wrapper = mountNotice({ dense: true, type: 'info' });

    expect(wrapper.classes()).toContain('q-banner--dense');
    expect(wrapper.findComponent(QIcon).props('size')).toBe('20px');
  });
});
