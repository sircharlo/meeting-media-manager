/* eslint-disable no-fallthrough */
import type { DateLocale, DateOptions, DateUnitOptions } from 'quasar';

import { errorCatcher } from 'src/helpers/error-catcher';
import { capitalize, pad } from 'src/utils/general';

export const dateFromString = (lookupDate?: Date | string | undefined) => {
  try {
    const date = lookupDate ? new Date(lookupDate) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  } catch (error) {
    errorCatcher(error);
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }
};

export const isInPast = (lookupDate: Date) => {
  try {
    if (!lookupDate) return false;
    const now = dateFromString();
    return getDateDiff(lookupDate, now, 'days') < 0;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const friendlyDayToJsDay = (day?: number) => {
  try {
    if (!day) day = -1;
    const firstDay = day === 6 ? 0 : parseInt(day.toString()) + 1;
    const correctedFirstDay = firstDay > 7 ? firstDay - 7 : firstDay;
    return correctedFirstDay;
  } catch (error) {
    errorCatcher(error);
    return 0;
  }
};

export const getLocalDate = (
  dateObj: Date | string,
  locale: Required<DateLocale>,
) => {
  const parsedDate = typeof dateObj === 'string' ? new Date(dateObj) : dateObj;
  return formatDate(parsedDate, 'D MMMM YYYY', locale);
};

export const datesAreSame = (date1: Date, date2: Date) => {
  try {
    if (!date1 || !date2) throw new Error('Missing date for comparison');
    return date1.toDateString() === date2.toDateString();
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const getSpecificWeekday = (
  lookupDate: Date | string,
  desiredWeekday: number,
) => {
  try {
    if (!lookupDate) return new Date();
    if (desiredWeekday === null) throw new Error('No desired weekday');
    lookupDate = dateFromString(lookupDate);
    desiredWeekday++;
    desiredWeekday = desiredWeekday === 7 ? 0 : desiredWeekday;
    const difference = (lookupDate.getDay() - desiredWeekday + 7) % 7;
    const newDate = new Date(lookupDate.valueOf());
    newDate.setDate(newDate.getDate() - difference);
    return newDate;
  } catch (error) {
    errorCatcher(error);
    return new Date();
  }
};

// Taken from Quasar Date Utils

const MILLISECONDS_IN_DAY = 86400000;
const MILLISECONDS_IN_HOUR = 3600000;
const MILLISECONDS_IN_MINUTE = 60000;
const defaultMask = 'YYYY-MM-DD';
const token = /\[((?:[^\]\\]|\\]|\\)*)\]|d{1,4}|M{1,4}|D{1,4}|YY(?:YY)?/g;
const defaultDateLocale: Required<DateLocale> = {
  days: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
  daysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
  months:
    'January_February_March_April_May_June_July_August_September_October_November_December'.split(
      '_',
    ),
  monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
};

const formatter = {
  // Day of month: 1, 2, ..., 31
  D(date: Date) {
    return date.getDate();
  },

  // Day of month: 01, 02, ..., 31
  DD(date: Date) {
    return pad(date.getDate());
  },

  // Day of week: Su, Mo, ...
  dd(date: Date, dateLocale: Required<DateLocale>) {
    return dateLocale.days[date.getDay()].slice(0, 2);
  },

  // Day of week: Sun, Mon, ...
  ddd(date: Date, dateLocale: Required<DateLocale>) {
    return dateLocale.daysShort[date.getDay()];
  },

  // Day of week: Sunday, Monday, ...
  dddd(date: Date, dateLocale: Required<DateLocale>) {
    return dateLocale.days[date.getDay()];
  },

  // Month: 1, 2, ..., 12
  M(date: Date) {
    return date.getMonth() + 1;
  },

  // Month: 01, 02, ..., 12
  MM(date: Date) {
    return pad(date.getMonth() + 1);
  },

  // Month Short Name: Jan, Feb, ...
  MMM(date: Date, dateLocale: Required<DateLocale>) {
    return dateLocale.monthsShort?.[date.getMonth()];
  },

  // Month Name: January, February, ...
  MMMM(date: Date, dateLocale: Required<DateLocale>) {
    return dateLocale.months?.[date.getMonth()];
  },

  // Year: 00, 01, ..., 99
  YY(date: Date, dateLocale: Required<DateLocale>, forcedYear?: number) {
    // workaround for < 1900 with new Date()
    const y = this.YYYY(date, dateLocale, forcedYear) % 100;
    return y >= 0 ? pad(y) : '-' + pad(Math.abs(y));
  },

  // Year: 1900, 1901, ..., 2099
  YYYY(date: Date, _dateLocale: Required<DateLocale>, forcedYear?: number) {
    // workaround for < 1900 with new Date()
    return forcedYear !== void 0 && forcedYear !== null
      ? forcedYear
      : date.getFullYear();
  },
};

export function addToDate(date: Date, mod: DateOptions) {
  return getChange(date, mod, 1);
}

export function formatDate(
  val: Date | number | string | undefined,
  mask?: string,
  dateLocale?: Required<DateLocale>,
): string {
  if ((val !== 0 && !val) || val === Infinity || val === -Infinity) {
    return '';
  }

  const date = new Date(val);

  // @ts-expect-error: Date constructor can return NaN
  if (isNaN(date)) {
    return '';
  }

  if (mask === void 0) {
    mask = defaultMask;
  }

  const locale = getDateLocale(dateLocale);

  return mask.replace(token, (match, text) =>
    match in formatter
      ? formatter[match as keyof typeof formatter](date, locale)
      : text === void 0
        ? match
        : text.split('\\]').join(']'),
  );
}

export function getDateDiff(
  date: Date | number | string,
  subtract: Date | number | string,
  unit: `${DateUnitOptions}s` | DateUnitOptions = 'days',
): number {
  const sub = new Date(subtract),
    t = new Date(date);

  switch (unit) {
    case 'hour':
    case 'hours':
      return getDiff(
        startOfDate(t, 'hour'),
        startOfDate(sub, 'hour'),
        MILLISECONDS_IN_HOUR,
      );
    case 'minute':
    case 'minutes':
      return getDiff(
        startOfDate(t, 'minute'),
        startOfDate(sub, 'minute'),
        MILLISECONDS_IN_MINUTE,
      );
    case 'month':
    case 'months':
      return (
        (t.getFullYear() - sub.getFullYear()) * 12 +
        t.getMonth() -
        sub.getMonth()
      );
    case 'second':
    case 'seconds':
      return getDiff(
        startOfDate(t, 'second'),
        startOfDate(sub, 'second'),
        1000,
      );

    case 'year':
    case 'years':
      return t.getFullYear() - sub.getFullYear();

    case 'date':
    case 'day':
    case 'days':
    default:
      return getDiff(
        startOfDate(t, 'day'),
        startOfDate(sub, 'day'),
        MILLISECONDS_IN_DAY,
      );
  }
}

export function getMaxDate(
  date: Date | number | string,
  ...args: (Date | number | string)[]
): Date {
  let t = new Date(date);
  Array.prototype.slice.call(args, 1).forEach((d) => {
    // @ts-expect-error: Date is not Number
    t = Math.max(t, new Date(d));
  });
  return t;
}

export function getMinDate(
  date: Date | number | string,
  ...args: (Date | number | string)[]
) {
  let t = new Date(date);
  Array.prototype.slice.call(args, 1).forEach((d) => {
    // @ts-expect-error: Date is not Number
    t = Math.min(t, new Date(d));
  });
  return t;
}

export function subtractFromDate(
  date: Date | number | string,
  mod: DateOptions,
) {
  return getChange(date, mod, -1);
}

function applyYearMonthDayChange(date: Date, mod: DateOptions, sign: number) {
  let month = date.getMonth(),
    year = date.getFullYear();

  const day = date.getDate();

  if (mod.year !== void 0) {
    year += sign * mod.year;
    delete mod.year;
  }

  if (mod.month !== void 0) {
    month += sign * mod.month;
    delete mod.month;
  }

  date.setDate(1);
  date.setMonth(2);

  date.setFullYear(year);
  date.setMonth(month);
  date.setDate(Math.min(day, daysInMonth(date)));

  if (mod.date !== void 0) {
    date.setDate(date.getDate() + sign * mod.date);
    delete mod.date;
  }

  return date;
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getChange(
  date: Date | number | string,
  rawMod: DateOptions,
  sign: number,
) {
  const d = new Date(date),
    mod = normalizeMod(rawMod),
    t =
      mod.year !== void 0 || mod.month !== void 0 || mod.date !== void 0
        ? applyYearMonthDayChange(d, mod, sign) // removes year/month/day
        : d;

  for (const key in mod) {
    const op = capitalize(key);
    // @ts-expect-error: op is not a key of Date
    t[`set${op}`](t[`get${op}`]() + sign * mod[key]);
  }

  return t;
}

function getDateLocale(paramDateLocale?: Required<DateLocale>) {
  return paramDateLocale ?? defaultDateLocale;
}

function getDiff(t: Date, sub: Date, interval: number) {
  return (
    (t.getTime() -
      t.getTimezoneOffset() * MILLISECONDS_IN_MINUTE -
      (sub.getTime() - sub.getTimezoneOffset() * MILLISECONDS_IN_MINUTE)) /
    interval
  );
}

function normalizeMod(mod: DateOptions) {
  const acc = { ...mod };

  if (mod.years !== void 0) {
    acc.year = mod.years;
    delete acc.years;
  }

  if (mod.months !== void 0) {
    acc.month = mod.months;
    delete acc.months;
  }

  if (mod.days !== void 0) {
    acc.date = mod.days;
    delete acc.days;
  }
  if (mod.day !== void 0) {
    acc.date = mod.day;
    delete acc.day;
  }

  if (mod.hour !== void 0) {
    acc.hours = mod.hour;
    delete acc.hour;
  }

  if (mod.minute !== void 0) {
    acc.minutes = mod.minute;
    delete acc.minute;
  }

  if (mod.second !== void 0) {
    acc.seconds = mod.second;
    delete acc.second;
  }

  if (mod.millisecond !== void 0) {
    acc.milliseconds = mod.millisecond;
    delete acc.millisecond;
  }

  return acc;
}

function startOfDate(date: Date | number | string, unit: DateUnitOptions) {
  const prefix = 'set';
  const t = new Date(date);

  switch (unit) {
    case 'year':
    case 'years':
      t[`${prefix}Month`](0);
    case 'month':
    case 'months':
      t[`${prefix}Date`](1);
    case 'date':
    case 'day':
    case 'days':
      t[`${prefix}Hours`](0);
    case 'hour':
    case 'hours':
      t[`${prefix}Minutes`](0);
    case 'minute':
    case 'minutes':
      t[`${prefix}Seconds`](0);
    case 'second':
    case 'seconds':
      t[`${prefix}Milliseconds`](0);
  }
  return t;
}
