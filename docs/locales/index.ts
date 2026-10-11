/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-10-11
import en from './en.json' with { type: 'json' };

// 99.3% translated as of 2026-10-11
import fr from './fr.json' with { type: 'json' };

// 93.5% translated as of 2026-10-11
import sl from './sl.json' with { type: 'json' };

// 91.5% translated as of 2026-10-11
import es from './es.json' with { type: 'json' };

// 91.5% translated as of 2026-10-11
import it from './it.json' with { type: 'json' };

// 85.3% translated as of 2026-10-11
import ty from './ty.json' with { type: 'json' };

// 77.1% translated as of 2026-10-11
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 76.5% translated as of 2026-10-11
import ko from './ko.json' with { type: 'json' };

// 73.4% translated as of 2026-10-11
import et from './et.json' with { type: 'json' };

// 55.4% translated as of 2026-10-11
import pt from './pt.json' with { type: 'json' };

// 51.4% translated as of 2026-10-11
import de from './de.json' with { type: 'json' };

// 41.0% translated as of 2026-10-11
import ru from './ru.json' with { type: 'json' };

// 38.5% translated as of 2026-10-11
import nl from './nl.json' with { type: 'json' };

// 32.4% translated as of 2026-10-11
import hu from './hu.json' with { type: 'json' };

// 27.4% translated as of 2026-10-11
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-10-11
// import zh from './zh.json' with { type: 'json' };

// 0.4% translated as of 2026-10-11
// import bzs from './bzs.json' with { type: 'json' };

// 0.1% translated as of 2026-10-11
// import cmnHant from './cmn-hant.json' with { type: 'json' };

const messages: Partial<Record<LanguageValue, Partial<typeof en>>> = {
  cmnHans,
  de,
  en,
  es,
  et,
  fr,
  hu,
  it,
  ko,
  nl,
  pt,
  ru,
  sl,
  ty,
  uk,
};

export default messages;
