/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-08-27
import en from './en.json' with { type: 'json' };

// 99.2% translated as of 2026-08-27
import sl from './sl.json' with { type: 'json' };

// 99.1% translated as of 2026-08-27
import fr from './fr.json' with { type: 'json' };

// 98.9% translated as of 2026-08-27
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 98.7% translated as of 2026-08-27
import ty from './ty.json' with { type: 'json' };

// 98.3% translated as of 2026-08-27
import it from './it.json' with { type: 'json' };

// 98.1% translated as of 2026-08-27
import et from './et.json' with { type: 'json' };

// 73.9% translated as of 2026-08-27
import pt from './pt.json' with { type: 'json' };

// 61.3% translated as of 2026-08-27
import de from './de.json' with { type: 'json' };

// 57.4% translated as of 2026-08-27
import ko from './ko.json' with { type: 'json' };

// 54.5% translated as of 2026-08-27
import ru from './ru.json' with { type: 'json' };

// 51.4% translated as of 2026-08-27
import nl from './nl.json' with { type: 'json' };

// 46.1% translated as of 2026-08-27
import es from './es.json' with { type: 'json' };

// 43.1% translated as of 2026-08-27
import hu from './hu.json' with { type: 'json' };

// 36.5% translated as of 2026-08-27
import uk from './uk.json' with { type: 'json' };

// 0.4% translated as of 2026-08-27
// import bzs from './bzs.json' with { type: 'json' };

// 0.1% translated as of 2026-08-27
// import zh from './zh.json' with { type: 'json' };

// 0.0% translated as of 2026-08-27
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
