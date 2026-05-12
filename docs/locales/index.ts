/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales.ts';

export { locales as localeOptions } from '../../src/constants/locales.ts';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-05-12
import en from './en.json' with { type: 'json' };

// 99.2% translated as of 2026-05-12
import fr from './fr.json' with { type: 'json' };

// 99.0% translated as of 2026-05-12
import sl from './sl.json' with { type: 'json' };

// 98.8% translated as of 2026-05-12
import pt from './pt.json' with { type: 'json' };

// 98.6% translated as of 2026-05-12
import et from './et.json' with { type: 'json' };

// 97.8% translated as of 2026-05-12
import es from './es.json' with { type: 'json' };

// 97.1% translated as of 2026-05-12
import de from './de.json' with { type: 'json' };

// 97.1% translated as of 2026-05-12
import ru from './ru.json' with { type: 'json' };

// 97.0% translated as of 2026-05-12
import nl from './nl.json' with { type: 'json' };

// 62.3% translated as of 2026-05-12
import uk from './uk.json' with { type: 'json' };

// 0.7% translated as of 2026-05-12
import bzs from './bzs.json' with { type: 'json' };

const messages: Record<LanguageValue, Partial<typeof en>> = {
  bzs,
  de,
  en,
  es,
  et,
  fr,
  nl,
  pt,
  ru,
  sl,
  uk,
};

export default messages;
