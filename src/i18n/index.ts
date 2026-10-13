/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-10-13
import en from './en.json' with { type: 'json' };

// 99.4% translated as of 2026-10-13
import fr from './fr.json' with { type: 'json' };

// 98.8% translated as of 2026-10-13
import es from './es.json' with { type: 'json' };

// 96.4% translated as of 2026-10-13
import it from './it.json' with { type: 'json' };

// 95.6% translated as of 2026-10-13
import sl from './sl.json' with { type: 'json' };

// 83.1% translated as of 2026-10-13
import ty from './ty.json' with { type: 'json' };

// 75.0% translated as of 2026-10-13
import ko from './ko.json' with { type: 'json' };

// 74.9% translated as of 2026-10-13
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 71.3% translated as of 2026-10-13
import et from './et.json' with { type: 'json' };

// 53.7% translated as of 2026-10-13
import pt from './pt.json' with { type: 'json' };

// 50.8% translated as of 2026-10-13
import de from './de.json' with { type: 'json' };

// 39.8% translated as of 2026-10-13
import ru from './ru.json' with { type: 'json' };

// 37.4% translated as of 2026-10-13
import nl from './nl.json' with { type: 'json' };

// 31.3% translated as of 2026-10-13
import hu from './hu.json' with { type: 'json' };

// 26.6% translated as of 2026-10-13
import uk from './uk.json' with { type: 'json' };

// 1.2% translated as of 2026-10-13
// import zh from './zh.json' with { type: 'json' };

// 0.8% translated as of 2026-10-13
// import cmnHant from './cmn-hant.json' with { type: 'json' };

// 0.3% translated as of 2026-10-13
// import bzs from './bzs.json' with { type: 'json' };

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
