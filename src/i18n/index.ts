import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file should only import the JSON files for the enabled languages.
// ! The import statements for the disabled languages should be commented out.

// import am from './am.json';
import cmnHans from './cmn-hans.json';
import de from './de.json';
// import el from './el.json';
import en from './en.json';
import es from './es.json';
import et from './et.json';
// import fi from './fi.json';
import fr from './fr.json';
// import gaa from './gaa.json';
// import ht from './ht.json';
import hu from './hu.json';
import it from './it.json';
import ko from './ko.json';
// import mg from './mg.json';
import nl from './nl.json';
import ptPt from './pt-pt.json';
import pt from './pt.json';
// import ro from './ro.json';
import ru from './ru.json';
// import rw from './rw.json';
// import sk from './sk.json';
import sl from './sl.json';
import sv from './sv.json';
import sw from './sw.json';
import tl from './tl.json';
import uk from './uk.json';

export default {
  // am,
  cmnHans,
  de,
  // el,
  en,
  es,
  et,
  // fi,
  fr,
  // gaa,
  // ht,
  hu,
  it,
  ko,
  // mg,
  nl,
  pt,
  ptPt,
  // ro,
  ru,
  // rw,
  // sk,
  sl,
  sv,
  sw,
  tl,
  uk,
};
