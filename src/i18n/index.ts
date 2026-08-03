/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-08-03
import en from './en.json' with { type: 'json' };

// 98.3% translated as of 2026-08-03
import sl from './sl.json' with { type: 'json' };

// 98.2% translated as of 2026-08-03
import fr from './fr.json' with { type: 'json' };

// 91.6% translated as of 2026-08-03
import ty from './ty.json' with { type: 'json' };

// 91.3% translated as of 2026-08-03
import it from './it.json' with { type: 'json' };

// 91.1% translated as of 2026-08-03
import et from './et.json' with { type: 'json' };

// 82.0% translated as of 2026-08-03
import pt from './pt.json' with { type: 'json' };

// 67.8% translated as of 2026-08-03
import de from './de.json' with { type: 'json' };

// 60.4% translated as of 2026-08-03
import ru from './ru.json' with { type: 'json' };

// 56.9% translated as of 2026-08-03
import nl from './nl.json' with { type: 'json' };

// 52.4% translated as of 2026-08-03
import ko from './ko.json' with { type: 'json' };

// 51.2% translated as of 2026-08-03
import es from './es.json' with { type: 'json' };

// 47.7% translated as of 2026-08-03
import hu from './hu.json' with { type: 'json' };

// 40.5% translated as of 2026-08-03
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-08-03
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
