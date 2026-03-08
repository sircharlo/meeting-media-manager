/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-03-08
import en from './en.json';

// 99.7% translated as of 2026-03-08
import cmnHans from './cmn-hans.json';

// 99.2% translated as of 2026-03-08
import fi from './fi.json';

// 99.2% translated as of 2026-03-08
import fr from './fr.json';

// 99.2% translated as of 2026-03-08
import sl from './sl.json';

// 99.1% translated as of 2026-03-08
import ptPt from './pt-pt.json';

// 98.4% translated as of 2026-03-08
import sv from './sv.json';

// 98.1% translated as of 2026-03-08
import es from './es.json';

// 97.9% translated as of 2026-03-08
import de from './de.json';

// 97.6% translated as of 2026-03-08
import nl from './nl.json';

// 97.3% translated as of 2026-03-08
import hu from './hu.json';

// 97.0% translated as of 2026-03-08
import et from './et.json';

// 96.8% translated as of 2026-03-08
import ru from './ru.json';

// 86.9% translated as of 2026-03-08
import it from './it.json';

// 79.6% translated as of 2026-03-08
import ko from './ko.json';

// 74.1% translated as of 2026-03-08
import pt from './pt.json';

// 57.0% translated as of 2026-03-08
import uk from './uk.json';

// 49.8% translated as of 2026-03-08
import sw from './sw.json';

// 46.4% translated as of 2026-03-08
import tl from './tl.json';

// 17.6% translated as of 2026-03-08
// import sk from './sk.json';

export default {
  cmnHans,
  de,
  en,
  es,
  et,
  fi,
  fr,
  hu,
  it,
  ko,
  nl,
  pt,
  ptPt,
  ru,
  sl,
  sv,
  sw,
  tl,
  uk,
};
