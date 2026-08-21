/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-08-21
import en from './en.json' with { type: 'json' };

// 94.7% translated as of 2026-08-21
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 94.3% translated as of 2026-08-21
import sl from './sl.json' with { type: 'json' };

// 93.9% translated as of 2026-08-21
import fr from './fr.json' with { type: 'json' };

// 93.7% translated as of 2026-08-21
import et from './et.json' with { type: 'json' };

// 93.7% translated as of 2026-08-21
import ty from './ty.json' with { type: 'json' };

// 93.4% translated as of 2026-08-21
import it from './it.json' with { type: 'json' };

// 74.7% translated as of 2026-08-21
import pt from './pt.json' with { type: 'json' };

// 61.9% translated as of 2026-08-21
import de from './de.json' with { type: 'json' };

// 58.0% translated as of 2026-08-21
import ko from './ko.json' with { type: 'json' };

// 55.1% translated as of 2026-08-21
import ru from './ru.json' with { type: 'json' };

// 51.9% translated as of 2026-08-21
import nl from './nl.json' with { type: 'json' };

// 46.6% translated as of 2026-08-21
import es from './es.json' with { type: 'json' };

// 43.6% translated as of 2026-08-21
import hu from './hu.json' with { type: 'json' };

// 37.0% translated as of 2026-08-21
import uk from './uk.json' with { type: 'json' };

// 0.6% translated as of 2026-08-21
// import bzs from './bzs.json' with { type: 'json' };

// 0.1% translated as of 2026-08-21
// import cmnHant from './cmn-hant.json' with { type: 'json' };

// 0.1% translated as of 2026-08-21
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
