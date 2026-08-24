/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-08-24
import en from './en.json' with { type: 'json' };

// 98.7% translated as of 2026-08-24
import ty from './ty.json' with { type: 'json' };

// 98.5% translated as of 2026-08-24
import sl from './sl.json' with { type: 'json' };

// 98.4% translated as of 2026-08-24
import fr from './fr.json' with { type: 'json' };

// 97.6% translated as of 2026-08-24
import it from './it.json' with { type: 'json' };

// 94.4% translated as of 2026-08-24
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 93.4% translated as of 2026-08-24
import et from './et.json' with { type: 'json' };

// 74.4% translated as of 2026-08-24
import pt from './pt.json' with { type: 'json' };

// 61.7% translated as of 2026-08-24
import de from './de.json' with { type: 'json' };

// 57.7% translated as of 2026-08-24
import ko from './ko.json' with { type: 'json' };

// 54.9% translated as of 2026-08-24
import ru from './ru.json' with { type: 'json' };

// 51.7% translated as of 2026-08-24
import nl from './nl.json' with { type: 'json' };

// 46.4% translated as of 2026-08-24
import es from './es.json' with { type: 'json' };

// 43.4% translated as of 2026-08-24
import hu from './hu.json' with { type: 'json' };

// 36.8% translated as of 2026-08-24
import uk from './uk.json' with { type: 'json' };

// 0.4% translated as of 2026-08-24
// import bzs from './bzs.json' with { type: 'json' };

// 0.1% translated as of 2026-08-24
// import zh from './zh.json' with { type: 'json' };

// 0.0% translated as of 2026-08-24
// import cmnHant from './cmn-hant.json' with { type: 'json' };

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
