/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales';

export { locales as localeOptions } from '../../src/constants/locales';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-05-10
import en from './en.json';

// 98.9% translated as of 2026-05-10
import fr from './fr.json';

// 98.8% translated as of 2026-05-10
import sl from './sl.json';

// 98.3% translated as of 2026-05-10
import pt from './pt.json';

// 98.1% translated as of 2026-05-10
import et from './et.json';

// 97.5% translated as of 2026-05-10
import es from './es.json';

// 96.8% translated as of 2026-05-10
import de from './de.json';

// 96.8% translated as of 2026-05-10
import ru from './ru.json';

// 96.7% translated as of 2026-05-10
import nl from './nl.json';

// 62.1% translated as of 2026-05-10
import uk from './uk.json';

const messages: Record<LanguageValue, Partial<typeof en>> = {
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
