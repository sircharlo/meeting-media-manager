/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-10-20
import en from './en.json' with { type: 'json' };

// 96.8% translated as of 2026-10-20
import fr from './fr.json' with { type: 'json' };

// 96.5% translated as of 2026-10-20
import it from './it.json' with { type: 'json' };

// 96.1% translated as of 2026-10-20
import sl from './sl.json' with { type: 'json' };

// 95.9% translated as of 2026-10-20
import es from './es.json' with { type: 'json' };

// 87.5% translated as of 2026-10-20
import ty from './ty.json' with { type: 'json' };

// 72.5% translated as of 2026-10-20
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 72.4% translated as of 2026-10-20
import ko from './ko.json' with { type: 'json' };

// 69.6% translated as of 2026-10-20
import et from './et.json' with { type: 'json' };

// 54.4% translated as of 2026-10-20
import de from './de.json' with { type: 'json' };

// 52.0% translated as of 2026-10-20
import pt from './pt.json' with { type: 'json' };

// 38.5% translated as of 2026-10-20
import ru from './ru.json' with { type: 'json' };

// 36.2% translated as of 2026-10-20
import nl from './nl.json' with { type: 'json' };

// 30.4% translated as of 2026-10-20
import hu from './hu.json' with { type: 'json' };

// 25.8% translated as of 2026-10-20
import uk from './uk.json' with { type: 'json' };

// 0.9% translated as of 2026-10-20
// import zh from './zh.json' with { type: 'json' };

// 0.8% translated as of 2026-10-20
// import cmnHant from './cmn-hant.json' with { type: 'json' };

// 0.3% translated as of 2026-10-20
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
