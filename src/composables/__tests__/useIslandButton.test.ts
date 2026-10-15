import { useIslandButton } from 'src/composables/useIslandButton';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

describe('useIslandButton', () => {
  it('keeps a red button for errors only', () => {
    const colorOf = (status: Parameters<typeof useIslandButton>[0]) =>
      useIslandButton(status).color.value;

    expect(colorOf('normal')).toBe('white-transparent');
    expect(colorOf('off')).toBe('white-transparent');
    expect(colorOf('busy')).toBe('white-transparent');
    expect(colorOf('attention')).toBe('warning');
    expect(colorOf('error')).toBe('negative');
    // Recording shows on its icon instead.
    expect(colorOf('live')).toBe('white-transparent');
  });

  it('fades a button turned off, and marks a live one', () => {
    expect(useIslandButton('off').classes.value).toEqual({
      'island-btn--live': false,
      'island-btn--off': true,
    });
    expect(useIslandButton('live').classes.value).toEqual({
      'island-btn--live': true,
      'island-btn--off': false,
    });
  });

  it('turns white, with the status in the icon, while its popup is open', () => {
    const popupOpen = ref(true);
    const { classes, color, textColor } = useIslandButton('error', popupOpen);

    expect(color.value).toBe('white');
    expect(textColor.value).toBe('negative');
    expect(classes.value['island-btn--off']).toBe(false);

    popupOpen.value = false;
    expect(color.value).toBe('negative');
    expect(textColor.value).toBe('');
  });

  it('shows recording in the icon of an open popup too', () => {
    const { color, textColor } = useIslandButton('live', true);

    expect(color.value).toBe('white');
    expect(textColor.value).toBe('negative');
  });

  it('says when to show a spinner', () => {
    expect(useIslandButton('busy').busy.value).toBe(true);
    expect(useIslandButton('normal').busy.value).toBe(false);
  });
});
