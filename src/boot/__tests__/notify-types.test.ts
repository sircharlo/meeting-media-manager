import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { Notify } from 'quasar';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import 'boot/notify-types';

installQuasarPlugin({ plugins: { Notify } });
installPinia();

// Notify renders into its own global node, which Quasar sets up as it's
// installed with a first app.
beforeAll(() => {
  mount(defineComponent({ render: () => h('div') }));
});

// Each toast gets a class of its own to find it by, as a dismissed one may
// still be leaving.
let shown = 0;
const findToast = (classes: string) =>
  document.querySelector(`.q-notification.${classes}`);

const show = async (
  options: Exclude<Parameters<typeof Notify.create>[0], string>,
) => {
  const classes = `test-toast-${++shown}`;
  const dismiss = Notify.create({ ...options, classes });
  await nextTick();
  return { dismiss, toast: findToast(classes) };
};

describe('notify types', () => {
  it.each([
    ['positive', 'mmm-check'],
    ['info', 'mmm-info'],
    ['warning', 'mmm-warning'],
    ['negative', 'mmm-error'],
  ] as const)(
    'gives a %s toast its solid fill, white text and the %s icon',
    async (type, icon) => {
      const { dismiss, toast } = await show({ message: 'Hello', type });

      expect(toast?.classList).toContain(`bg-notice-${type}`);
      expect(toast?.classList).toContain('text-white');
      expect(
        toast?.querySelector('.q-notification__icon')?.outerHTML,
      ).toContain(icon);
      dismiss();
    },
  );

  // Quasar's own warning is orange with dark text; this one is a deeper
  // orange, which white text reads well on.
  it('no longer gives a warning dark text', async () => {
    const { dismiss, toast } = await show({
      message: 'Careful',
      type: 'warning',
    });

    expect(toast).not.toBeNull();
    expect(toast?.classList).not.toContain('text-dark');
    expect(toast?.classList).not.toContain('bg-warning');
    dismiss();
  });

  it("keeps Quasar's own grey ongoing toast, with its spinner", async () => {
    const { dismiss, toast } = await show({ message: 'Busy', type: 'ongoing' });

    expect(toast?.classList).toContain('bg-grey-8');
    expect(toast?.querySelector('.q-notification__spinner')).not.toBeNull();
    dismiss();
  });

  it('lets a toast keep an icon of its own', async () => {
    const { dismiss, toast } = await show({
      icon: 'mmm-music-note',
      message: 'Music',
      type: 'info',
    });

    expect(toast?.querySelector('.q-notification__icon')?.outerHTML).toContain(
      'mmm-music-note',
    );
    dismiss();
  });

  it('shows a warning with a white close button, and the warning icon', async () => {
    const dismiss = createTemporaryNotification({
      classes: 'test-toast-wrapper',
      message: 'Careful',
      type: 'warning',
    });
    await nextTick();
    const toast = findToast('test-toast-wrapper');

    expect(toast?.classList).toContain('bg-notice-warning');
    expect(toast?.querySelector('.q-notification__icon')?.outerHTML).toContain(
      'mmm-warning',
    );
    expect(
      toast?.querySelector('.q-notification__actions .q-btn')?.classList,
    ).toContain('text-white');
    dismiss?.();
  });
});
