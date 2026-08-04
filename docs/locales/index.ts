/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-08-04
import en from './en.json' with { type: 'json' };

// 96.5% translated as of 2026-08-04
import fr from './fr.json' with { type: 'json' };

// 96.2% translated as of 2026-08-04
import et from './et.json' with { type: 'json' };

// 95.8% translated as of 2026-08-04
import sl from './sl.json' with { type: 'json' };

// 95.7% translated as of 2026-08-04
import it from './it.json' with { type: 'json' };

// 89.1% translated as of 2026-08-04
import ty from './ty.json' with { type: 'json' };

// 79.7% translated as of 2026-08-04
import pt from './pt.json' with { type: 'json' };

// 66.0% translated as of 2026-08-04
import de from './de.json' with { type: 'json' };

// 58.8% translated as of 2026-08-04
import ru from './ru.json' with { type: 'json' };

// 55.3% translated as of 2026-08-04
import nl from './nl.json' with { type: 'json' };

// 51.0% translated as of 2026-08-04
import ko from './ko.json' with { type: 'json' };

// 49.7% translated as of 2026-08-04
import es from './es.json' with { type: 'json' };

// 46.3% translated as of 2026-08-04
import hu from './hu.json' with { type: 'json' };

// 39.2% translated as of 2026-08-04
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-08-04
// import bzs from './bzs.json' with { type: 'json' };

const messages: Partial<Record<LanguageValue, Partial<typeof en>>> = {
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
