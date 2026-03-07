/* eslint-disable perfectionist/sort-imports */
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-03-07
import en from './en.json';

// 99.7% translated as of 2026-03-07
import cmnHans from './cmn-hans.json';

// 99.2% translated as of 2026-03-07
import fi from './fi.json';

// 99.2% translated as of 2026-03-07
import fr from './fr.json';

// 99.2% translated as of 2026-03-07
import sl from './sl.json';

// 99.1% translated as of 2026-03-07
import ptPt from './pt-pt.json';

// 98.4% translated as of 2026-03-07
import sv from './sv.json';

// 98.1% translated as of 2026-03-07
import es from './es.json';

// 97.9% translated as of 2026-03-07
import de from './de.json';

// 97.6% translated as of 2026-03-07
import nl from './nl.json';

// 97.3% translated as of 2026-03-07
import hu from './hu.json';

// 97.0% translated as of 2026-03-07
import et from './et.json';

// 96.8% translated as of 2026-03-07
import ru from './ru.json';

// 86.9% translated as of 2026-03-07
import it from './it.json';

// 79.6% translated as of 2026-03-07
import ko from './ko.json';

// 74.1% translated as of 2026-03-07
import pt from './pt.json';

// 57.0% translated as of 2026-03-07
import uk from './uk.json';

// 49.8% translated as of 2026-03-07
import sw from './sw.json';

// 46.4% translated as of 2026-03-07
import tl from './tl.json';

// 17.6% translated as of 2026-03-07
// import sk from './sk.json';

// 5.9% translated as of 2026-03-07
// import rw from './rw.json';

// 5.2% translated as of 2026-03-07
// import el from './el.json';

// 4.9% translated as of 2026-03-07
// import ro from './ro.json';

// 4.1% translated as of 2026-03-07
// import am from './am.json';

// 4.0% translated as of 2026-03-07
// import ht from './ht.json';

// 4.0% translated as of 2026-03-07
// import mg from './mg.json';

// 1.6% translated as of 2026-03-07
// import pl from './pl.json';

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
