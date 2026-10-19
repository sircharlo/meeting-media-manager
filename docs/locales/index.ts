/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-10-19
import en from './en.json' with { type: 'json' };

// 99.0% translated as of 2026-10-19
import fr from './fr.json' with { type: 'json' };

// 98.7% translated as of 2026-10-19
import it from './it.json' with { type: 'json' };

// 98.5% translated as of 2026-10-19
import es from './es.json' with { type: 'json' };

// 98.5% translated as of 2026-10-19
import sl from './sl.json' with { type: 'json' };

// 86.4% translated as of 2026-10-19
import ty from './ty.json' with { type: 'json' };

// 74.4% translated as of 2026-10-19
import ko from './ko.json' with { type: 'json' };

// 74.3% translated as of 2026-10-19
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 70.7% translated as of 2026-10-19
import et from './et.json' with { type: 'json' };

// 53.8% translated as of 2026-10-19
import de from './de.json' with { type: 'json' };

// 53.3% translated as of 2026-10-19
import pt from './pt.json' with { type: 'json' };

// 39.4% translated as of 2026-10-19
import ru from './ru.json' with { type: 'json' };

// 37.1% translated as of 2026-10-19
import nl from './nl.json' with { type: 'json' };

// 31.1% translated as of 2026-10-19
import hu from './hu.json' with { type: 'json' };

// 26.4% translated as of 2026-10-19
import uk from './uk.json' with { type: 'json' };

// 1.2% translated as of 2026-10-19
// import zh from './zh.json' with { type: 'json' };

// 0.8% translated as of 2026-10-19
// import cmnHant from './cmn-hant.json' with { type: 'json' };

// 0.3% translated as of 2026-10-19
// import bzs from './bzs.json' with { type: 'json' };

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
