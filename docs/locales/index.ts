/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-07-14
import en from './en.json' with { type: 'json' };

// 98.4% translated as of 2026-07-14
import sl from './sl.json' with { type: 'json' };

// 98.2% translated as of 2026-07-14
import fr from './fr.json' with { type: 'json' };

// 97.7% translated as of 2026-07-14
import pt from './pt.json' with { type: 'json' };

// 97.5% translated as of 2026-07-14
import it from './it.json' with { type: 'json' };

// 97.1% translated as of 2026-07-14
import es from './es.json' with { type: 'json' };

// 96.6% translated as of 2026-07-14
import ru from './ru.json' with { type: 'json' };

// 96.5% translated as of 2026-07-14
import nl from './nl.json' with { type: 'json' };

// 96.3% translated as of 2026-07-14
import de from './de.json' with { type: 'json' };

// 96.2% translated as of 2026-07-14
import ty from './ty.json' with { type: 'json' };

// 96.1% translated as of 2026-07-14
import hu from './hu.json' with { type: 'json' };

// 94.7% translated as of 2026-07-14
import et from './et.json' with { type: 'json' };

// 66.0% translated as of 2026-07-14
import ko from './ko.json' with { type: 'json' };

// 64.7% translated as of 2026-07-14
import uk from './uk.json' with { type: 'json' };

// 0.9% translated as of 2026-07-14
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
