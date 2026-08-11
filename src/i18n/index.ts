/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-08-11
import en from './en.json' with { type: 'json' };

// 99.2% translated as of 2026-08-11
import sl from './sl.json' with { type: 'json' };

// 99.1% translated as of 2026-08-11
import fr from './fr.json' with { type: 'json' };

// 98.8% translated as of 2026-08-11
import et from './et.json' with { type: 'json' };

// 98.3% translated as of 2026-08-11
import it from './it.json' with { type: 'json' };

// 94.0% translated as of 2026-08-11
import ty from './ty.json' with { type: 'json' };

// 78.7% translated as of 2026-08-11
import pt from './pt.json' with { type: 'json' };

// 65.2% translated as of 2026-08-11
import de from './de.json' with { type: 'json' };

// 58.0% translated as of 2026-08-11
import ru from './ru.json' with { type: 'json' };

// 54.6% translated as of 2026-08-11
import nl from './nl.json' with { type: 'json' };

// 50.5% translated as of 2026-08-11
import ko from './ko.json' with { type: 'json' };

// 49.1% translated as of 2026-08-11
import es from './es.json' with { type: 'json' };

// 45.8% translated as of 2026-08-11
import hu from './hu.json' with { type: 'json' };

// 38.9% translated as of 2026-08-11
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-08-11
// import bzs from './bzs.json' with { type: 'json' };

export default {
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
