/* eslint-disable no-fallthrough */
import type { DateLocale, DateOptions, DateUnitOptions } from 'quasar';

const MILLISECONDS_IN_DAY = 86400000;
const MILLISECONDS_IN_HOUR = 3600000;
const MILLISECONDS_IN_MINUTE = 60000;
const defaultMask = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
const token =
  /\[((?:[^\]\\]|\\]|\\)*)\]|do|d{1,4}|Mo|M{1,4}|m{1,2}|wo|w{1,2}|Qo|Do|DDDo|D{1,4}|YY(?:YY)?|H{1,2}|h{1,2}|s{1,2}|S{1,3}|Z{1,2}|a{1,2}|[AQExX]/g;
const defaultDateLocale = {
  days: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
  daysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
  firstDayOfWeek: 0, // 0-6, 0 - Sunday, 1 Monday, ...
  format24h: false,
  months:
    'January_February_March_April_May_June_July_August_September_October_November_December'.split(
      '_',
    ),
  monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
  pluralDay: 'days',
};

const formatter = {
  // Meridiem: AM, PM
  A(date: Date) {
    return date.getHours() < 12 ? 'AM' : 'PM';
  },

  // Meridiem: am, pm
  a(date: Date) {
    return date.getHours() < 12 ? 'am' : 'pm';
  },

  // Meridiem: a.m., p.m.
  aa(date: Date) {
    return date.getHours() < 12 ? 'a.m.' : 'p.m.';
  },

  // Day of month: 1, 2, ..., 31
  D(date: Date) {
    return date.getDate();
  },

  // Day of week: 0, 1, ..., 6
  d(date: Date) {
    return date.getDay();
  },

  // Day of month: 01, 02, ..., 31
  DD(date: Date) {
    return pad(date.getDate());
  },

  // Day of week: Su, Mo, ...
  dd(date: Date, dateLocale: DateLocale) {
    return dateLocale.days?.[date.getDay()].slice(0, 2);
  },

  // Day of year: 1, 2, ..., 366
  DDD(date: Date) {
    return getDayOfYear(date);
  },

  // Day of week: Sun, Mon, ...
  ddd(date: Date, dateLocale: DateLocale) {
    return dateLocale.daysShort?.[date.getDay()];
  },

  // Day of year: 001, 002, ..., 366
  DDDD(date: Date) {
    return pad(getDayOfYear(date), 3);
  },

  // Day of week: Sunday, Monday, ...
  dddd(date: Date, dateLocale: DateLocale) {
    return dateLocale.days?.[date.getDay()];
  },

  // Day of year: 1st, 2nd, ..., 366th
  DDDo(date: Date) {
    return getOrdinal(getDayOfYear(date));
  },

  // Day of month: 1st, 2nd, ..., 31st
  Do(date: Date) {
    return getOrdinal(date.getDate());
  },

  // Day of week: 0th, 1st, ..., 6th
  do(date: Date) {
    return getOrdinal(date.getDay());
  },

  // Day of ISO week: 1, 2, ..., 7
  E(date: Date) {
    return date.getDay() || 7;
  },

  // Hour: 0, 1, ... 23
  H(date: Date) {
    return date.getHours();
  },

  // Hour: 1, 2, ..., 12
  h(date: Date) {
    const hours = date.getHours();
    return hours === 0 ? 12 : hours > 12 ? hours % 12 : hours;
  },

  // Hour: 00, 01, ..., 23
  HH(date: Date) {
    return pad(date.getHours());
  },

  // Hour: 01, 02, ..., 12
  hh(date: Date) {
    return pad(this.h(date));
  },

  // Month: 1, 2, ..., 12
  M(date: Date) {
    return date.getMonth() + 1;
  },

  // Minute: 0, 1, ..., 59
  m(date: Date) {
    return date.getMinutes();
  },

  // Month: 01, 02, ..., 12
  MM(date: Date) {
    return pad(date.getMonth() + 1);
  },

  // Minute: 00, 01, ..., 59
  mm(date: Date) {
    return pad(date.getMinutes());
  },

  // Month Short Name: Jan, Feb, ...
  MMM(date: Date, dateLocale: DateLocale) {
    return dateLocale.monthsShort?.[date.getMonth()];
  },

  // Month Name: January, February, ...
  MMMM(date: Date, dateLocale: DateLocale) {
    return dateLocale.months?.[date.getMonth()];
  },

  // Month: 1st, 2nd, ..., 12th
  Mo(date: Date) {
    return getOrdinal(date.getMonth() + 1);
  },

  // Quarter: 1, 2, 3, 4
  Q(date: Date) {
    return Math.ceil((date.getMonth() + 1) / 3);
  },

  // Quarter: 1st, 2nd, 3rd, 4th
  Qo(date: Date) {
    return getOrdinal(this.Q(date));
  },

  // Second: 0, 1, ..., 59
  s(date: Date) {
    return date.getSeconds();
  },

  // 1/10 of second: 0, 1, ..., 9
  S(date: Date) {
    return Math.floor(date.getMilliseconds() / 100);
  },

  // Second: 00, 01, ..., 59
  ss(date: Date) {
    return pad(date.getSeconds());
  },

  // 1/100 of second: 00, 01, ..., 99
  SS(date: Date) {
    return pad(Math.floor(date.getMilliseconds() / 10));
  },

  // Millisecond: 000, 001, ..., 999
  SSS(date: Date) {
    return pad(date.getMilliseconds(), 3);
  },

  // Week of Year: 1 2 ... 52 53
  w(date: Date) {
    return getWeekOfYear(date);
  },

  // Week of Year: 1st 2nd ... 52nd 53rd
  wo(date: Date) {
    return getOrdinal(getWeekOfYear(date));
  },

  // Week of Year: 01 02 ... 52 53
  ww(date: Date) {
    return pad(getWeekOfYear(date));
  },

  // Seconds timestamp: 512969520
  X(date: Date) {
    return Math.floor(date.getTime() / 1000);
  },

  // Milliseconds timestamp: 512969520900
  x(date: Date) {
    return date.getTime();
  },

  // Year: 00, 01, ..., 99
  YY(date: Date, dateLocale: DateLocale, forcedYear?: number) {
    // workaround for < 1900 with new Date()
    const y = this.YYYY(date, dateLocale, forcedYear) % 100;
    return y >= 0 ? pad(y) : '-' + pad(Math.abs(y));
  },

  // Year: 1900, 1901, ..., 2099
  YYYY(date: Date, _dateLocale: DateLocale, forcedYear?: number) {
    // workaround for < 1900 with new Date()
    return forcedYear !== void 0 && forcedYear !== null
      ? forcedYear
      : date.getFullYear();
  },
};

export function addToDate(date: Date, mod: DateOptions) {
  return getChange(date, mod, 1);
}

export function adjustDate(date: Date, rawMod: DateOptions, utc?: boolean) {
  const d = new Date(date),
    middle = utc === true ? 'UTC' : '',
    mod = normalizeMod(rawMod),
    t =
      mod.year !== void 0 || mod.month !== void 0 || mod.date !== void 0
        ? applyYearMonthDay(d, mod, middle) // removes year/month/day
        : d;

  for (const key in mod) {
    const op = key.charAt(0).toUpperCase() + key.slice(1);
    // @ts-expect-error: op is not a key of Date
    t[`set${middle}${op}`](mod[key]);
  }

  return t;
}

export function buildDate(mod: DateOptions, utc?: boolean) {
  return adjustDate(new Date(), mod, utc);
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function formatDate(
  val: Date | number | string | undefined,
  mask?: string,
  dateLocale?: DateLocale,
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

export function getDayOfYear(date: Date) {
  return getDateDiff(date, startOfDate(date, 'year'), 'days') + 1;
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

export function getWeekOfYear(date: Date) {
  // Remove time components of date
  const thursday = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  // Change date to Thursday same week
  thursday.setDate(thursday.getDate() - ((thursday.getDay() + 6) % 7) + 3);

  // Take January 4th as it is always in week 1 (see ISO 8601)
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);

  // Change date to Thursday same week
  firstThursday.setDate(
    firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3,
  );

  // Check if daylight-saving-time-switch occurred and correct for it
  const ds = thursday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
  thursday.setHours(thursday.getHours() - ds);

  // Number of weeks between target Thursday and first Thursday
  // @ts-expect-error: Date is not Number
  const weekDiff = (thursday - firstThursday) / (MILLISECONDS_IN_DAY * 7);
  return 1 + Math.floor(weekDiff);
}

export function pad(v: number | string, length = 2, char = '0') {
  if (v === void 0 || v === null) {
    return v;
  }

  const val = '' + v;
  return val.length >= length
    ? val
    : new Array(length - val.length + 1).join(char) + val;
}

export function startOfDate(
  date: Date | number | string,
  unit: DateUnitOptions,
  utc?: boolean,
) {
  const prefix = `set${utc === true ? 'UTC' : ''}` as const;
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

export function subtractFromDate(
  date: Date | number | string,
  mod: DateOptions,
) {
  return getChange(date, mod, -1);
}

function applyYearMonthDay(date: Date, mod: DateOptions, middle: '' | 'UTC') {
  const month =
      mod.month !== void 0 ? mod.month - 1 : date[`get${middle}Month`](),
    year = mod.year !== void 0 ? mod.year : date[`get${middle}FullYear`](),
    maxDay = new Date(year, month + 1, 0).getDate(),
    day = Math.min(
      maxDay,
      mod.date !== void 0 ? mod.date : date[`get${middle}Date`](),
    );

  date[`set${middle}Date`](1);
  date[`set${middle}Month`](2);

  date[`set${middle}FullYear`](year);
  date[`set${middle}Month`](month);
  date[`set${middle}Date`](day);

  delete mod.year;
  delete mod.month;
  delete mod.date;

  return date;
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

function getDateLocale(paramDateLocale?: DateLocale) {
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

function getOrdinal(n: number) {
  if (n >= 11 && n <= 13) {
    return `${n}th`;
  }
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
  }
  return `${n}th`;
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
