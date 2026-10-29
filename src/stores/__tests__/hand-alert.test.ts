import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useHandAlertStore } from '../hand-alert';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('hand alert store', () => {
  it('keeps raised hands in the order they were raised', () => {
    const store = useHandAlertStore();

    store.setRaisedHands(['Ana']);
    store.setRaisedHands(['Ana', 'Carlos']);
    // Zoom's participant list order changes as people join and leave; the
    // order hands went up in shouldn't.
    store.setRaisedHands(['Carlos', 'Ana']);
    expect(store.raisedHands).toEqual(['Ana', 'Carlos']);

    // A lowered hand leaves the list; raising it again puts it last.
    store.setRaisedHands(['Carlos']);
    expect(store.raisedHands).toEqual(['Carlos']);
    store.setRaisedHands(['Carlos', 'Ana']);
    expect(store.raisedHands).toEqual(['Carlos', 'Ana']);
  });

  it('ignores duplicate names and follows the manual switch', () => {
    const store = useHandAlertStore();

    store.setRaisedHands(['Ana', 'Ana']);
    expect(store.raisedHands).toEqual(['Ana']);
    expect(store.active).toBe(true);

    store.clear();
    expect(store.active).toBe(false);

    store.toggleManual();
    expect(store.active).toBe(true);
    store.toggleManual();
    expect(store.active).toBe(false);
  });
});
