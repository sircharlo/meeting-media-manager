/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-09-06
import en from './en.json' with { type: 'json' };

// 98.5% translated as of 2026-09-06
import ty from './ty.json' with { type: 'json' };

// 98.2% translated as of 2026-09-06
import sl from './sl.json' with { type: 'json' };

// 98.1% translated as of 2026-09-06
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 97.9% translated as of 2026-09-06
import ko from './ko.json' with { type: 'json' };

// 97.5% translated as of 2026-09-06
import fr from './fr.json' with { type: 'json' };

// 96.5% translated as of 2026-09-06
import it from './it.json' with { type: 'json' };

// 96.0% translated as of 2026-09-06
import et from './et.json' with { type: 'json' };

// 72.5% translated as of 2026-09-06
import pt from './pt.json' with { type: 'json' };

// 60.0% translated as of 2026-09-06
import de from './de.json' with { type: 'json' };

// 53.5% translated as of 2026-09-06
import ru from './ru.json' with { type: 'json' };

// 50.3% translated as of 2026-09-06
import nl from './nl.json' with { type: 'json' };

// 45.8% translated as of 2026-09-06
import es from './es.json' with { type: 'json' };

// 42.2% translated as of 2026-09-06
import hu from './hu.json' with { type: 'json' };

// 35.8% translated as of 2026-09-06
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-09-06
// import zh from './zh.json' with { type: 'json' };

// 0.4% translated as of 2026-09-06
// import bzs from './bzs.json' with { type: 'json' };

// 0.0% translated as of 2026-09-06
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
