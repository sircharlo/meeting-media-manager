import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { QExpansionItem } from 'quasar';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

installQuasarPlugin();

// The shims in test/vitest/setup/setup.quasar.ts that make happy-dom behave
// like the browsers M³ runs in.
describe('test environment', () => {
  const rejections: unknown[] = [];
  const onRejection = (reason: unknown) => rejections.push(reason);

  afterEach(() => {
    process.off('unhandledRejection', onRejection);
    rejections.length = 0;
    vi.restoreAllMocks();
  });

  it('leaves no unhandled rejection when a component unmounts mid-animation', async () => {
    process.on('unhandledRejection', onRejection);
    const animate = vi.spyOn(Element.prototype, 'animate');
    const expanded = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            QExpansionItem,
            { duration: 1000, label: 'Section', modelValue: expanded.value },
            () => h('div', 'content'),
          ),
      }),
    );

    // QExpansionItem slides its content open with el.animate(), and cancels
    // that animation when it's unmounted before the slide ends.
    expanded.value = true;
    await vi.waitFor(() => expect(animate).toHaveBeenCalled());
    wrapper.unmount();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(rejections).toEqual([]);
  });
});
