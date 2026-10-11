/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-10-11
import en from './en.json' with { type: 'json' };

// 99.3% translated as of 2026-10-11
import fr from './fr.json' with { type: 'json' };

// 98.8% translated as of 2026-10-11
import it from './it.json' with { type: 'json' };

// 93.4% translated as of 2026-10-11
import sl from './sl.json' with { type: 'json' };

// 91.4% translated as of 2026-10-11
import es from './es.json' with { type: 'json' };

// 85.3% translated as of 2026-10-11
import ty from './ty.json' with { type: 'json' };

// 77.0% translated as of 2026-10-11
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 76.4% translated as of 2026-10-11
import ko from './ko.json' with { type: 'json' };

// 73.3% translated as of 2026-10-11
import et from './et.json' with { type: 'json' };

// 55.3% translated as of 2026-10-11
import pt from './pt.json' with { type: 'json' };

// 51.4% translated as of 2026-10-11
import de from './de.json' with { type: 'json' };

// 40.9% translated as of 2026-10-11
import ru from './ru.json' with { type: 'json' };

// 38.4% translated as of 2026-10-11
import nl from './nl.json' with { type: 'json' };

// 32.3% translated as of 2026-10-11
import hu from './hu.json' with { type: 'json' };

// 27.4% translated as of 2026-10-11
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-10-11
// import zh from './zh.json' with { type: 'json' };

// 0.3% translated as of 2026-10-11
// import bzs from './bzs.json' with { type: 'json' };

// 0.1% translated as of 2026-10-11
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
