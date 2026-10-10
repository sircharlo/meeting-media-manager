/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-10-10
import en from './en.json' with { type: 'json' };

// 99.3% translated as of 2026-10-10
import fr from './fr.json' with { type: 'json' };

// 96.0% translated as of 2026-10-10
import es from './es.json' with { type: 'json' };

// 96.0% translated as of 2026-10-10
import it from './it.json' with { type: 'json' };

// 94.4% translated as of 2026-10-10
import sl from './sl.json' with { type: 'json' };

// 89.5% translated as of 2026-10-10
import ty from './ty.json' with { type: 'json' };

// 80.8% translated as of 2026-10-10
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 80.2% translated as of 2026-10-10
import ko from './ko.json' with { type: 'json' };

// 77.0% translated as of 2026-10-10
import et from './et.json' with { type: 'json' };

// 58.0% translated as of 2026-10-10
import pt from './pt.json' with { type: 'json' };

// 53.9% translated as of 2026-10-10
import de from './de.json' with { type: 'json' };

// 42.9% translated as of 2026-10-10
import ru from './ru.json' with { type: 'json' };

// 40.3% translated as of 2026-10-10
import nl from './nl.json' with { type: 'json' };

// 33.8% translated as of 2026-10-10
import hu from './hu.json' with { type: 'json' };

// 28.7% translated as of 2026-10-10
import uk from './uk.json' with { type: 'json' };

// 0.4% translated as of 2026-10-10
// import zh from './zh.json' with { type: 'json' };

// 0.3% translated as of 2026-10-10
// import bzs from './bzs.json' with { type: 'json' };

// 0.0% translated as of 2026-10-10
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
