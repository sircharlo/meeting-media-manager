/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-09-23
import en from './en.json' with { type: 'json' };

// 99.7% translated as of 2026-09-23
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 99.3% translated as of 2026-09-23
import sl from './sl.json' with { type: 'json' };

// 99.2% translated as of 2026-09-23
import fr from './fr.json' with { type: 'json' };

// 98.8% translated as of 2026-09-23
import ko from './ko.json' with { type: 'json' };

// 98.7% translated as of 2026-09-23
import ty from './ty.json' with { type: 'json' };

// 98.4% translated as of 2026-09-23
import es from './es.json' with { type: 'json' };

// 98.4% translated as of 2026-09-23
import it from './it.json' with { type: 'json' };

// 94.9% translated as of 2026-09-23
import et from './et.json' with { type: 'json' };

// 71.5% translated as of 2026-09-23
import pt from './pt.json' with { type: 'json' };

// 59.3% translated as of 2026-09-23
import de from './de.json' with { type: 'json' };

// 52.9% translated as of 2026-09-23
import ru from './ru.json' with { type: 'json' };

// 49.7% translated as of 2026-09-23
import nl from './nl.json' with { type: 'json' };

// 41.7% translated as of 2026-09-23
import hu from './hu.json' with { type: 'json' };

// 35.4% translated as of 2026-09-23
import uk from './uk.json' with { type: 'json' };

// 0.5% translated as of 2026-09-23
// import zh from './zh.json' with { type: 'json' };

// 0.4% translated as of 2026-09-23
// import bzs from './bzs.json' with { type: 'json' };

// 0.0% translated as of 2026-09-23
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
