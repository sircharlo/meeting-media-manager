/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-07-13
import en from './en.json' with { type: 'json' };

// 99.0% translated as of 2026-07-13
import fr from './fr.json' with { type: 'json' };

// 98.5% translated as of 2026-07-13
import pt from './pt.json' with { type: 'json' };

// 98.1% translated as of 2026-07-13
import sl from './sl.json' with { type: 'json' };

// 97.8% translated as of 2026-07-13
import es from './es.json' with { type: 'json' };

// 97.3% translated as of 2026-07-13
import ru from './ru.json' with { type: 'json' };

// 97.2% translated as of 2026-07-13
import nl from './nl.json' with { type: 'json' };

// 97.1% translated as of 2026-07-13
import de from './de.json' with { type: 'json' };

// 97.0% translated as of 2026-07-13
import ty from './ty.json' with { type: 'json' };

// 96.8% translated as of 2026-07-13
import hu from './hu.json' with { type: 'json' };

// 95.4% translated as of 2026-07-13
import et from './et.json' with { type: 'json' };

// 66.5% translated as of 2026-07-13
import ko from './ko.json' with { type: 'json' };

// 65.2% translated as of 2026-07-13
import uk from './uk.json' with { type: 'json' };

// 0.9% translated as of 2026-07-13
// import bzs from './bzs.json' with { type: 'json' };

export default {
  de,
  en,
  es,
  et,
  fr,
  hu,
  ko,
  nl,
  pt,
  ru,
  sl,
  ty,
  uk,
};
