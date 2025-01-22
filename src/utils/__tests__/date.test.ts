import type { DateLocale } from 'quasar';

import { describe, expect, it } from 'vitest';

import {
  dateFromString,
  datesAreSame,
  friendlyDayToJsDay,
  getLocalDate,
  getSpecificWeekday,
  isInPast,
} from '../date';

describe('friendlyDayToJsDay', () => {
  // Friendly days: Mon-Sun = 0-6
  // JS days: Sun-Mon = 0-6
  it('should convert dates correctly', () => {
    expect(friendlyDayToJsDay(0)).toBe(1);
    expect(friendlyDayToJsDay(3)).toBe(4);
    expect(friendlyDayToJsDay(6)).toBe(0);
  });
});

describe('datesAreSame', () => {
  it('should return true if dates are the same', () => {
    const date1 = new Date();
    const date2 = new Date(date1.getTime());
    const date3 = new Date(date1.getTime());
    date3.setHours(date1.getHours() + 1);
    expect(datesAreSame(date1, date2)).toBe(true);
    expect(datesAreSame(date1, date3)).toBe(true);
  });

  it('should return false if dates are not the same', () => {
    const date1 = new Date();
    const date2 = new Date(date1.getTime());
    const date3 = new Date(date1.getTime());
    date2.setFullYear(date1.getFullYear() - 1);
    date3.setDate(date1.getDate() + 1);
    expect(datesAreSame(date1, date2)).toBe(false);
    expect(datesAreSame(date1, date3)).toBe(false);
  });
});

describe('isInPast', () => {
  it('should work for past dates', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    expect(isInPast(date)).toBe(true);
  });

  it('should work for future dates', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    expect(isInPast(date)).toBe(false);
  });

  it('should work for today', () => {
    const today = new Date();
    expect(isInPast(today)).toBe(false);
    expect(isInPast(today, true)).toBe(true);
  });
});

describe('getLocalDate', () => {
  it('should return the local date', async () => {
    const { default: messages } = await import('./../../i18n/nl.json');
    const locale: Required<DateLocale> = {
      days: messages['days-long'].split('_'),
      daysShort: messages['days-short'].split('_'),
      months: messages['months-long'].split('_'),
      monthsShort: messages['months-short'].split('_'),
    };

    const date = new Date();
    const dateString = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

    const localDate = getLocalDate(date, locale);
    const localDateFromString = getLocalDate(dateString, locale);
    expect(localDate).toBe(localDateFromString);
    expect(localDate).toBe(
      `${date.getDate()} ${locale.months[date.getMonth()]} ${date.getFullYear()}`,
    );
  });
});

describe('getSpecificWeekday', () => {
  it('should return the date of the specific weekday', () => {
    const date = new Date();
    const monday = getSpecificWeekday(date, 0);
    expect(monday.getDay()).toBe(1);

    const wed = getSpecificWeekday(date, 3);
    expect(wed.getDay()).toBe(4);

    const sun = getSpecificWeekday(date, 6);
    expect(sun.getDay()).toBe(0);
  });
});

describe('dateFromString', () => {
  it('should convert yyyy-mm-dd to date', () => {
    const date = dateFromString('2021-03-01');
    expect(date.getFullYear()).toBe(2021);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(1);
  });

  it('should convert yyyy/mm/dd to date', () => {
    const date = dateFromString('2021/03/01');
    expect(date.getFullYear()).toBe(2021);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(1);
  });

  it('should convert ISO to date', () => {
    const today = new Date();
    const date = dateFromString(today.toISOString());
    expect(date.getFullYear()).toBe(today.getFullYear());
    expect(date.getMonth()).toBe(today.getMonth());
    expect(date.getDate()).toBe(today.getDate());
  });

  it('should reset the time to 00:00:00', () => {
    const date = dateFromString(new Date());
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });
});
