import type { DateInfo, MediaItem, MediaSectionWithConfig } from 'src/types';

import {
  getDisplayedMediaSections,
  getMediaSectionLabel,
  getMoveToSectionTargets,
  moveMediaItemsToSection,
} from 'src/helpers/media-sections';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { isCoWeekMock, isMeetingDayMock } = vi.hoisted(() => ({
  isCoWeekMock: vi.fn(() => false),
  isMeetingDayMock: vi.fn(() => false),
}));

vi.mock('src/helpers/date', () => ({
  isCoWeek: isCoWeekMock,
  isMeetingDay: isMeetingDayMock,
}));

vi.mock('boot/i18n', () => ({
  i18n: {
    global: {
      t: (key: string) =>
        ({
          'imported-media': 'Manually added items',
          lac: 'Living as Christians',
          tgw: "Treasures from God's Word",
        })[key] ?? key,
    },
  },
}));

const item = (uniqueId: string, extra: Partial<MediaItem> = {}): MediaItem =>
  ({ type: 'media', uniqueId, ...extra }) as MediaItem;

const section = (
  uniqueId: string,
  items: MediaItem[] = [],
): MediaSectionWithConfig => ({ config: { uniqueId }, items });

const idsOf = (sections: MediaSectionWithConfig[]) =>
  sections.map((s) => s.config.uniqueId);

const itemIdsOf = (target: MediaSectionWithConfig | undefined) =>
  target?.items?.map((i) => i.uniqueId);

const day = (mediaSections: MediaSectionWithConfig[]): DateInfo =>
  ({ date: new Date(2026, 10, 18), mediaSections }) as DateInfo;

beforeEach(() => {
  isCoWeekMock.mockReturnValue(false);
  isMeetingDayMock.mockReturnValue(false);
});

describe('getDisplayedMediaSections', () => {
  it('lists the meeting sections in meeting order, then only the other sections holding items', () => {
    isMeetingDayMock.mockReturnValue(true);
    const sections = [
      section('custom-1', [item('a')]),
      section('lac'),
      section('custom-empty'),
      section('tgw'),
      section('ayfm'),
      section('imported-media', [item('b')]),
    ];

    expect(idsOf(getDisplayedMediaSections(day(sections), 'mw'))).toEqual([
      'tgw',
      'ayfm',
      'lac',
      'custom-1',
      'imported-media',
    ]);
  });

  it('adds the circuit overseer section in a CO week', () => {
    isMeetingDayMock.mockReturnValue(true);
    isCoWeekMock.mockReturnValue(true);
    const sections = [
      section('circuit-overseer'),
      section('lac'),
      section('ayfm'),
      section('tgw'),
    ];

    expect(idsOf(getDisplayedMediaSections(day(sections), 'mw'))).toEqual([
      'tgw',
      'ayfm',
      'lac',
      'circuit-overseer',
    ]);
  });

  it('shows every section, even empty ones, in stored order on a non-meeting day', () => {
    const sections = [
      section('custom-2'),
      section('imported-media', [item('a')]),
      section('custom-1'),
    ];

    expect(idsOf(getDisplayedMediaSections(day(sections), null))).toEqual([
      'custom-2',
      'imported-media',
      'custom-1',
    ]);
  });

  it('returns the store section objects themselves, without reordering the stored array', () => {
    isMeetingDayMock.mockReturnValue(true);
    const sections = [section('lac'), section('tgw'), section('ayfm')];
    const displayed = getDisplayedMediaSections(day(sections), 'mw');

    expect(displayed[0]).toBe(sections[1]);
    expect(idsOf(sections)).toEqual(['lac', 'tgw', 'ayfm']);
  });

  it('returns nothing without a day', () => {
    expect(getDisplayedMediaSections(null, 'mw')).toEqual([]);
  });
});

describe('getMediaSectionLabel', () => {
  it("uses a renamed section's own label first", () => {
    expect(getMediaSectionLabel({ label: 'Songs', uniqueId: 'custom-1' })).toBe(
      'Songs',
    );
  });

  it('names unnamed custom sections like the imported media section', () => {
    expect(getMediaSectionLabel({ uniqueId: 'custom-1' })).toBe(
      'Manually added items',
    );
    expect(getMediaSectionLabel({ uniqueId: 'imported-media' })).toBe(
      'Manually added items',
    );
  });

  it("uses a meeting section's own name", () => {
    expect(getMediaSectionLabel({ uniqueId: 'tgw' })).toBe(
      "Treasures from God's Word",
    );
  });
});

describe('getMoveToSectionTargets', () => {
  const buildSections = () => [
    section('tgw', [item('t1'), item('t2')]),
    section('ayfm', [item('a1'), item('hidden', { hidden: true })]),
    section('lac', [
      item('group', { children: [item('child')] }),
      item('divider', { type: 'divider' }),
    ]),
  ];

  it('leaves out the section that already holds every item', () => {
    expect(
      idsOf(getMoveToSectionTargets(buildSections(), ['t1', 't2'])),
    ).toEqual(['ayfm', 'lac']);
  });

  it('offers every section when the items come from more than one', () => {
    expect(
      idsOf(getMoveToSectionTargets(buildSections(), ['t1', 'a1'])),
    ).toEqual(['tgw', 'ayfm', 'lac']);
  });

  it('ignores hidden items and dividers, which never move with a selection', () => {
    expect(
      idsOf(
        getMoveToSectionTargets(buildSections(), ['t1', 'hidden', 'divider']),
      ),
    ).toEqual(['ayfm', 'lac']);
  });

  it("offers nothing for a group's children or unknown items", () => {
    expect(getMoveToSectionTargets(buildSections(), ['child'])).toEqual([]);
    expect(getMoveToSectionTargets(buildSections(), ['missing'])).toEqual([]);
    expect(getMoveToSectionTargets(buildSections(), [])).toEqual([]);
  });
});

describe('moveMediaItemsToSection', () => {
  it('appends the items to the target section in display order', () => {
    const sections = [
      section('tgw', [item('t1'), item('t2'), item('t3')]),
      section('ayfm', [item('a1'), item('a2')]),
      section('lac', [item('l1')]),
    ];

    const moved = moveMediaItemsToSection(sections, ['a2', 't3', 't1'], 'lac');

    expect(moved.map((m) => m.uniqueId)).toEqual(['t1', 't3', 'a2']);
    expect(sections.map((s) => itemIdsOf(s))).toEqual([
      ['t2'],
      ['a1'],
      ['l1', 't1', 't3', 'a2'],
    ]);
  });

  it('leaves the items already in the target section where they are', () => {
    const sections = [
      section('tgw', [item('t1')]),
      section('ayfm', [item('a1'), item('a2')]),
    ];

    const moved = moveMediaItemsToSection(sections, ['a1', 't1'], 'ayfm');

    expect(moved.map((m) => m.uniqueId)).toEqual(['t1']);
    expect(itemIdsOf(sections[1])).toEqual(['a1', 'a2', 't1']);
  });

  it('keeps hidden items, dividers and group children in place', () => {
    const sections = [
      section('tgw', [
        item('t1'),
        item('hidden', { hidden: true }),
        item('divider', { type: 'divider' }),
        item('group', { children: [item('child')] }),
      ]),
      section('lac'),
    ];

    const moved = moveMediaItemsToSection(
      sections,
      ['t1', 'hidden', 'divider', 'child'],
      'lac',
    );

    expect(moved.map((m) => m.uniqueId)).toEqual(['t1']);
    expect(itemIdsOf(sections[0])).toEqual(['hidden', 'divider', 'group']);
    expect(itemIdsOf(sections[1])).toEqual(['t1']);
  });

  it('moves a whole group when the group itself is given', () => {
    const group = item('group', { children: [item('child')] });
    const sections = [section('tgw', [group]), section('lac')];

    moveMediaItemsToSection(sections, ['group'], 'lac');

    expect(sections[1]?.items).toEqual([group]);
  });

  it("does nothing when the target section isn't one of the sections", () => {
    const sections = [section('tgw', [item('t1')])];

    expect(moveMediaItemsToSection(sections, ['t1'], 'lac')).toEqual([]);
    expect(itemIdsOf(sections[0])).toEqual(['t1']);
  });
});
