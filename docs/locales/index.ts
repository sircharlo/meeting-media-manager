/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-08-24
import en from './en.json' with { type: 'json' };

// 99.0% translated as of 2026-08-24
import sl from './sl.json' with { type: 'json' };

// 98.9% translated as of 2026-08-24
import fr from './fr.json' with { type: 'json' };

// 98.5% translated as of 2026-08-24
import ty from './ty.json' with { type: 'json' };

// 98.1% translated as of 2026-08-24
import it from './it.json' with { type: 'json' };

// 95.0% translated as of 2026-08-24
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 94.0% translated as of 2026-08-24
import et from './et.json' with { type: 'json' };

// 75.0% translated as of 2026-08-24
import pt from './pt.json' with { type: 'json' };

// 62.2% translated as of 2026-08-24
import de from './de.json' with { type: 'json' };

// 58.3% translated as of 2026-08-24
import ko from './ko.json' with { type: 'json' };

// 55.4% translated as of 2026-08-24
import ru from './ru.json' with { type: 'json' };

// 52.3% translated as of 2026-08-24
import nl from './nl.json' with { type: 'json' };

// 47.0% translated as of 2026-08-24
import es from './es.json' with { type: 'json' };

// 43.9% translated as of 2026-08-24
import hu from './hu.json' with { type: 'json' };

// 37.3% translated as of 2026-08-24
import uk from './uk.json' with { type: 'json' };

// 1.0% translated as of 2026-08-24
// import bzs from './bzs.json' with { type: 'json' };

// 0.5% translated as of 2026-08-24
// import cmnHant from './cmn-hant.json' with { type: 'json' };

// 0.1% translated as of 2026-08-24
// import zh from './zh.json' with { type: 'json' };

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
