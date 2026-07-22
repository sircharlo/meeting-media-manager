/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-07-22
import en from './en.json' with { type: 'json' };

// 99.1% translated as of 2026-07-22
import sl from './sl.json' with { type: 'json' };

// 99.0% translated as of 2026-07-22
import fr from './fr.json' with { type: 'json' };

// 98.5% translated as of 2026-07-22
import ty from './ty.json' with { type: 'json' };

// 98.4% translated as of 2026-07-22
import pt from './pt.json' with { type: 'json' };

// 98.2% translated as of 2026-07-22
import et from './et.json' with { type: 'json' };

// 98.2% translated as of 2026-07-22
import it from './it.json' with { type: 'json' };

// 97.8% translated as of 2026-07-22
import es from './es.json' with { type: 'json' };

// 97.3% translated as of 2026-07-22
import ru from './ru.json' with { type: 'json' };

// 97.2% translated as of 2026-07-22
import nl from './nl.json' with { type: 'json' };

// 97.1% translated as of 2026-07-22
import de from './de.json' with { type: 'json' };

// 93.4% translated as of 2026-07-22
import hu from './hu.json' with { type: 'json' };

// 66.1% translated as of 2026-07-22
import uk from './uk.json' with { type: 'json' };

// 64.4% translated as of 2026-07-22
import ko from './ko.json' with { type: 'json' };

// 0.9% translated as of 2026-07-22
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
