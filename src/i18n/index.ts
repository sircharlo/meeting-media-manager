/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-10-12
import en from './en.json' with { type: 'json' };

// 97.7% translated as of 2026-10-12
import fr from './fr.json' with { type: 'json' };

// 97.1% translated as of 2026-10-12
import es from './es.json' with { type: 'json' };

// 97.1% translated as of 2026-10-12
import it from './it.json' with { type: 'json' };

// 96.2% translated as of 2026-10-12
import sl from './sl.json' with { type: 'json' };

// 83.8% translated as of 2026-10-12
import ty from './ty.json' with { type: 'json' };

// 75.7% translated as of 2026-10-12
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 75.1% translated as of 2026-10-12
import ko from './ko.json' with { type: 'json' };

// 72.0% translated as of 2026-10-12
import et from './et.json' with { type: 'json' };

// 54.5% translated as of 2026-10-12
import pt from './pt.json' with { type: 'json' };

// 51.6% translated as of 2026-10-12
import de from './de.json' with { type: 'json' };

// 40.5% translated as of 2026-10-12
import ru from './ru.json' with { type: 'json' };

// 38.1% translated as of 2026-10-12
import nl from './nl.json' with { type: 'json' };

// 32.1% translated as of 2026-10-12
import hu from './hu.json' with { type: 'json' };

// 27.3% translated as of 2026-10-12
import uk from './uk.json' with { type: 'json' };

// 1.2% translated as of 2026-10-12
// import zh from './zh.json' with { type: 'json' };

// 1.0% translated as of 2026-10-12
// import bzs from './bzs.json' with { type: 'json' };

// 0.8% translated as of 2026-10-12
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
