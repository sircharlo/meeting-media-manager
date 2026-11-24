import type { CalendarDayStatus, SpecialWeekKind } from 'src/types';

import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import WeekCalendar from '../WeekCalendar.vue';

installQuasarPlugin();
installPinia();

// Tuesday 24 November 2026: this week runs from Monday the 23rd.
const TODAY = new Date(2026, 10, 24, 12);
const SIX_WEEKS = { max: new Date(2027, 0, 3), min: new Date(2026, 10, 23) };

const mountCalendar = (
  props: Partial<{
    dayStatuses: Partial<Record<string, CalendarDayStatus>>;
    max: Date;
    min: Date;
    modelValue: string;
    specialWeeks: Partial<Record<string, SpecialWeekKind>>;
  }> = {},
) =>
  mount(WeekCalendar, {
    attachTo: document.body,
    props: { modelValue: '2026/11/26', ...SIX_WEEKS, ...props },
  });

const dayButton = (
  wrapper: ReturnType<typeof mountCalendar>,
  dateKey: string,
) => wrapper.get(`button[data-date="${dateKey}"]`);

const weekTitles = (wrapper: ReturnType<typeof mountCalendar>) =>
  wrapper.findAll('.week-calendar__label-title').map((title) => title.text());

describe('WeekCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('shows one Monday-to-Sunday row per week, named relative to this week', () => {
    const wrapper = mountCalendar();

    expect(
      wrapper.findAll('.week-calendar__weekday').map((day) => day.text()),
    ).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(weekTitles(wrapper)).toEqual([
      'This week',
      'Next week',
      'In 2 weeks',
      'In 3 weeks',
      'In 4 weeks',
      'In 5 weeks',
    ]);

    const ranges = wrapper
      .findAll('.week-calendar__label-range')
      .map((range) => range.text());
    expect(ranges[0]).toContain('23');
    expect(ranges[0]).toContain('29');
    // The week across New Year keeps its label short: no years.
    expect(ranges.at(-1)).toMatch(/28.*3/);
    expect(ranges.at(-1)).not.toMatch(/202[67]/);
    expect(wrapper.findAll('button[data-date]')).toHaveLength(42);
    expect(wrapper.findAll('button[data-date]:disabled')).toHaveLength(0);
  });

  it('defaults to six weeks from this Monday when no range is given', () => {
    const wrapper = mount(WeekCalendar, {
      props: { modelValue: '2026/11/26' },
    });

    expect(weekTitles(wrapper)).toHaveLength(6);
    const days = wrapper.findAll('button[data-date]');
    expect(days[0]?.attributes('data-date')).toBe('2026/11/23');
    expect(days.at(-1)?.attributes('data-date')).toBe('2027/01/03');
  });

  it('names weeks before this one as past weeks', () => {
    const wrapper = mountCalendar({ min: new Date(2026, 10, 9) });

    expect(weekTitles(wrapper).slice(0, 3)).toEqual([
      '2 weeks ago',
      'Last week',
      'This week',
    ]);
  });

  it.each<[CalendarDayStatus, string, string]>([
    ['ready', '2026/11/26', 'Ready'],
    ['pending', '2026/12/17', 'Not ready yet'],
    ['error', '2026/12/13', 'Error'],
    ['added', '2026/12/05', 'Manually added items'],
  ])(
    'tints a %s day and names its status for screen readers',
    (status, dateKey, label) => {
      const wrapper = mountCalendar({ dayStatuses: { [dateKey]: status } });
      const day = dayButton(wrapper, dateKey);

      expect(day.classes()).toContain(`week-calendar__status--${status}`);
      expect(day.attributes('aria-label')).toMatch(new RegExp(`, ${label}$`));
      expect(wrapper.get('.week-calendar__legend').text()).toContain(label);
    },
  );

  it('disables days outside the range and ignores their status', () => {
    const wrapper = mountCalendar({
      dayStatuses: { '2026/11/23': 'ready' },
      max: new Date(2026, 11, 2),
      min: new Date(2026, 10, 25),
    });

    const beforeRange = dayButton(wrapper, '2026/11/23');
    expect(beforeRange.attributes('disabled')).toBeDefined();
    expect(beforeRange.classes()).not.toContain('week-calendar__status--ready');
    expect(
      dayButton(wrapper, '2026/12/03').attributes('disabled'),
    ).toBeDefined();
    expect(
      dayButton(wrapper, '2026/11/25').attributes('disabled'),
    ).toBeUndefined();
  });

  it('marks today and the selected day', () => {
    const wrapper = mountCalendar();

    expect(dayButton(wrapper, '2026/11/24').attributes('aria-current')).toBe(
      'date',
    );
    const selected = dayButton(wrapper, '2026/11/26');
    expect(selected.attributes('aria-pressed')).toBe('true');
    expect(selected.classes()).toContain('week-calendar__day--selected');
  });

  it('emits the picked day', async () => {
    const wrapper = mountCalendar();

    await dayButton(wrapper, '2026/12/03').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026/12/03']]);
  });

  it('keeps one day in the tab order and moves it with the arrow keys', async () => {
    const wrapper = mountCalendar();
    expect(wrapper.findAll('button[tabindex="0"]')).toHaveLength(1);
    expect(dayButton(wrapper, '2026/11/26').attributes('tabindex')).toBe('0');

    await dayButton(wrapper, '2026/11/26').trigger('keydown', {
      key: 'ArrowDown',
    });
    await nextTick();
    expect((document.activeElement as HTMLElement).dataset.date).toBe(
      '2026/12/03',
    );
    expect(dayButton(wrapper, '2026/12/03').attributes('tabindex')).toBe('0');

    await dayButton(wrapper, '2026/12/03').trigger('keydown', {
      key: 'ArrowLeft',
    });
    await nextTick();
    expect((document.activeElement as HTMLElement).dataset.date).toBe(
      '2026/12/02',
    );
  });

  it('names a special week under its dates and adds its colour to the legend', () => {
    const plain = mountCalendar();
    expect(plain.find('.week-calendar__label-special').exists()).toBe(false);
    expect(plain.get('.week-calendar__legend').text()).not.toContain(
      "Circuit overseer's visit",
    );

    const wrapper = mountCalendar({
      dayStatuses: { '2026/12/08': 'co', '2026/12/13': 'co' },
      specialWeeks: { '2026/12/07': 'co' },
    });

    const captions = wrapper.findAll('.week-calendar__label-special');
    expect(captions.map((caption) => caption.text())).toEqual(['CO visit']);
    expect(captions[0]?.classes()).toContain(
      'week-calendar__label-special--co',
    );
    expect(dayButton(wrapper, '2026/12/08').classes()).toContain(
      'week-calendar__status--co',
    );
    expect(dayButton(wrapper, '2026/12/08').attributes('aria-label')).toMatch(
      /, Circuit overseer's visit$/,
    );
    expect(wrapper.get('.week-calendar__legend').text()).toContain(
      "Circuit overseer's visit",
    );
    expect(wrapper.get('.week-calendar__legend').text()).not.toContain(
      'Memorial week',
    );
  });

  it('does not move past the edge of the range', async () => {
    const wrapper = mountCalendar({ modelValue: '2026/11/23' });

    await dayButton(wrapper, '2026/11/23').trigger('keydown', {
      key: 'ArrowUp',
    });
    await nextTick();

    expect(dayButton(wrapper, '2026/11/23').attributes('tabindex')).toBe('0');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
