/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-08-03
import en from './en.json' with { type: 'json' };

// 99.2% translated as of 2026-08-03
import sl from './sl.json' with { type: 'json' };

// 98.8% translated as of 2026-08-03
import fr from './fr.json' with { type: 'json' };

// 92.4% translated as of 2026-08-03
import ty from './ty.json' with { type: 'json' };

// 92.1% translated as of 2026-08-03
import it from './it.json' with { type: 'json' };

// 91.8% translated as of 2026-08-03
import et from './et.json' with { type: 'json' };

// 82.7% translated as of 2026-08-03
import pt from './pt.json' with { type: 'json' };

// 68.4% translated as of 2026-08-03
import de from './de.json' with { type: 'json' };

// 60.9% translated as of 2026-08-03
import ru from './ru.json' with { type: 'json' };

// 57.4% translated as of 2026-08-03
import nl from './nl.json' with { type: 'json' };

// 52.8% translated as of 2026-08-03
import ko from './ko.json' with { type: 'json' };

// 51.6% translated as of 2026-08-03
import es from './es.json' with { type: 'json' };

// 48.1% translated as of 2026-08-03
import hu from './hu.json' with { type: 'json' };

// 40.8% translated as of 2026-08-03
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-08-03
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
