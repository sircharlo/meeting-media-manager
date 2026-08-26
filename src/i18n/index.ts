/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-08-26
import en from './en.json' with { type: 'json' };

// 99.7% translated as of 2026-08-26
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 99.2% translated as of 2026-08-26
import sl from './sl.json' with { type: 'json' };

// 98.9% translated as of 2026-08-26
import et from './et.json' with { type: 'json' };

// 98.7% translated as of 2026-08-26
import ty from './ty.json' with { type: 'json' };

// 98.4% translated as of 2026-08-26
import fr from './fr.json' with { type: 'json' };

// 97.6% translated as of 2026-08-26
import it from './it.json' with { type: 'json' };

// 74.5% translated as of 2026-08-26
import pt from './pt.json' with { type: 'json' };

// 61.8% translated as of 2026-08-26
import de from './de.json' with { type: 'json' };

// 57.8% translated as of 2026-08-26
import ko from './ko.json' with { type: 'json' };

// 55.0% translated as of 2026-08-26
import ru from './ru.json' with { type: 'json' };

// 51.8% translated as of 2026-08-26
import nl from './nl.json' with { type: 'json' };

// 46.5% translated as of 2026-08-26
import es from './es.json' with { type: 'json' };

// 43.5% translated as of 2026-08-26
import hu from './hu.json' with { type: 'json' };

// 36.9% translated as of 2026-08-26
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-08-26
// import bzs from './bzs.json' with { type: 'json' };

// 0.1% translated as of 2026-08-26
// import cmnHant from './cmn-hant.json' with { type: 'json' };

// 0.1% translated as of 2026-08-26
// import zh from './zh.json' with { type: 'json' };

export default {
  cmnHans,
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
