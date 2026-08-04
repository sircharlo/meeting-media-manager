/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-08-04
import en from './en.json' with { type: 'json' };

// 96.9% translated as of 2026-08-04
import et from './et.json' with { type: 'json' };

// 96.5% translated as of 2026-08-04
import sl from './sl.json' with { type: 'json' };

// 96.4% translated as of 2026-08-04
import fr from './fr.json' with { type: 'json' };

// 89.9% translated as of 2026-08-04
import ty from './ty.json' with { type: 'json' };

// 89.5% translated as of 2026-08-04
import it from './it.json' with { type: 'json' };

// 80.4% translated as of 2026-08-04
import pt from './pt.json' with { type: 'json' };

// 66.7% translated as of 2026-08-04
import de from './de.json' with { type: 'json' };

// 59.5% translated as of 2026-08-04
import ru from './ru.json' with { type: 'json' };

// 56.1% translated as of 2026-08-04
import nl from './nl.json' with { type: 'json' };

// 51.7% translated as of 2026-08-04
import ko from './ko.json' with { type: 'json' };

// 50.4% translated as of 2026-08-04
import es from './es.json' with { type: 'json' };

// 47.0% translated as of 2026-08-04
import hu from './hu.json' with { type: 'json' };

// 40.0% translated as of 2026-08-04
import uk from './uk.json' with { type: 'json' };

// 1.3% translated as of 2026-08-04
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
