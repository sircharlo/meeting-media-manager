/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-07-16
import en from './en.json' with { type: 'json' };

// 98.2% translated as of 2026-07-16
import sl from './sl.json' with { type: 'json' };

// 98.0% translated as of 2026-07-16
import fr from './fr.json' with { type: 'json' };

// 97.5% translated as of 2026-07-16
import ty from './ty.json' with { type: 'json' };

// 97.4% translated as of 2026-07-16
import pt from './pt.json' with { type: 'json' };

// 97.2% translated as of 2026-07-16
import it from './it.json' with { type: 'json' };

// 96.8% translated as of 2026-07-16
import es from './es.json' with { type: 'json' };

// 96.3% translated as of 2026-07-16
import ru from './ru.json' with { type: 'json' };

// 96.2% translated as of 2026-07-16
import nl from './nl.json' with { type: 'json' };

// 96.1% translated as of 2026-07-16
import de from './de.json' with { type: 'json' };

// 93.6% translated as of 2026-07-16
import hu from './hu.json' with { type: 'json' };

// 92.3% translated as of 2026-07-16
import et from './et.json' with { type: 'json' };

// 65.0% translated as of 2026-07-16
import uk from './uk.json' with { type: 'json' };

// 64.3% translated as of 2026-07-16
import ko from './ko.json' with { type: 'json' };

// 0.9% translated as of 2026-07-16
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
