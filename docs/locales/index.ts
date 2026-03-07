/* eslint-disable perfectionist/sort-imports */
import {
  enabled as baseEnabled,
  type LanguageValue,
} from '../../src/constants/locales';

export { locales as localeOptions } from '../../src/constants/locales';

export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-03-07
import en from './en.json';

// 99.1% translated as of 2026-03-07
import cmnHans from './cmn-hans.json';

// 98.6% translated as of 2026-03-07
import fi from './fi.json';

// 98.6% translated as of 2026-03-07
import fr from './fr.json';

// 98.1% translated as of 2026-03-07
import ptPt from './pt-pt.json';

// 98.1% translated as of 2026-03-07
import sl from './sl.json';

// 97.8% translated as of 2026-03-07
import hu from './hu.json';

// 97.8% translated as of 2026-03-07
import sv from './sv.json';

// 97.5% translated as of 2026-03-07
import es from './es.json';

// 97.5% translated as of 2026-03-07
import et from './et.json';

// 97.3% translated as of 2026-03-07
import de from './de.json';

// 97.0% translated as of 2026-03-07
import nl from './nl.json';

// 96.2% translated as of 2026-03-07
import ru from './ru.json';

// 86.1% translated as of 2026-03-07
import it from './it.json';

// 80.1% translated as of 2026-03-07
import ko from './ko.json';

// 73.4% translated as of 2026-03-07
import pt from './pt.json';

// 56.3% translated as of 2026-03-07
import uk from './uk.json';

// 50.3% translated as of 2026-03-07
import sw from './sw.json';

// 46.8% translated as of 2026-03-07
import tl from './tl.json';

// 18.0% translated as of 2026-03-07
// import sk from './sk.json';

// 6.3% translated as of 2026-03-07
// import rw from './rw.json';

// 4.6% translated as of 2026-03-07
// import am from './am.json';

// 4.6% translated as of 2026-03-07
// import el from './el.json';

// 4.4% translated as of 2026-03-07
// import ht from './ht.json';

// 4.4% translated as of 2026-03-07
// import mg from './mg.json';

// 4.3% translated as of 2026-03-07
// import ro from './ro.json';

// 0.9% translated as of 2026-03-07
// import pl from './pl.json';

const messages: Record<LanguageValue, Partial<typeof en>> = {
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

export default messages;
