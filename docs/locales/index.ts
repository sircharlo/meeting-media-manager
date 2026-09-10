/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-09-10
import en from './en.json' with { type: 'json' };

// 99.3% translated as of 2026-09-10
import sl from './sl.json' with { type: 'json' };

// 99.2% translated as of 2026-09-10
import fr from './fr.json' with { type: 'json' };

// 98.7% translated as of 2026-09-10
import ko from './ko.json' with { type: 'json' };

// 98.3% translated as of 2026-09-10
import es from './es.json' with { type: 'json' };

// 98.0% translated as of 2026-09-10
import ty from './ty.json' with { type: 'json' };

// 97.1% translated as of 2026-09-10
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 95.5% translated as of 2026-09-10
import it from './it.json' with { type: 'json' };

// 95.1% translated as of 2026-09-10
import et from './et.json' with { type: 'json' };

// 71.8% translated as of 2026-09-10
import pt from './pt.json' with { type: 'json' };

// 59.4% translated as of 2026-09-10
import de from './de.json' with { type: 'json' };

// 53.0% translated as of 2026-09-10
import ru from './ru.json' with { type: 'json' };

// 49.8% translated as of 2026-09-10
import nl from './nl.json' with { type: 'json' };

// 41.8% translated as of 2026-09-10
import hu from './hu.json' with { type: 'json' };

// 35.5% translated as of 2026-09-10
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-09-10
// import zh from './zh.json' with { type: 'json' };

// 0.4% translated as of 2026-09-10
// import bzs from './bzs.json' with { type: 'json' };

// 0.0% translated as of 2026-09-10
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
