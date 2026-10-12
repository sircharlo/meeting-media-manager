/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-10-12
import en from './en.json' with { type: 'json' };

// 99.3% translated as of 2026-10-12
import fr from './fr.json' with { type: 'json' };

// 98.8% translated as of 2026-10-12
import es from './es.json' with { type: 'json' };

// 98.8% translated as of 2026-10-12
import it from './it.json' with { type: 'json' };

// 97.9% translated as of 2026-10-12
import sl from './sl.json' with { type: 'json' };

// 85.3% translated as of 2026-10-12
import ty from './ty.json' with { type: 'json' };

// 77.0% translated as of 2026-10-12
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 76.4% translated as of 2026-10-12
import ko from './ko.json' with { type: 'json' };

// 73.3% translated as of 2026-10-12
import et from './et.json' with { type: 'json' };

// 55.3% translated as of 2026-10-12
import pt from './pt.json' with { type: 'json' };

// 52.1% translated as of 2026-10-12
import de from './de.json' with { type: 'json' };

// 40.9% translated as of 2026-10-12
import ru from './ru.json' with { type: 'json' };

// 38.4% translated as of 2026-10-12
import nl from './nl.json' with { type: 'json' };

// 32.3% translated as of 2026-10-12
import hu from './hu.json' with { type: 'json' };

// 27.4% translated as of 2026-10-12
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-10-12
// import zh from './zh.json' with { type: 'json' };

// 0.3% translated as of 2026-10-12
// import bzs from './bzs.json' with { type: 'json' };

// 0.1% translated as of 2026-10-12
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
