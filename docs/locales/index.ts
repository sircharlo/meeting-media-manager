import {
  enabled as baseEnabled,
  type LanguageValue,
  locales,
} from '../../src/constants/locales';

export const localeOptions = locales;
export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file should import the JSON files for all languages configured in Crowdin.

import am from './am.json';
import cmnHans from './cmn-hans.json';
import de from './de.json';
import el from './el.json';
import en from './en.json';
import es from './es.json';
import et from './et.json';
import fi from './fi.json';
import fr from './fr.json';
import ht from './ht.json';
import hu from './hu.json';
import it from './it.json';
import mg from './mg.json';
import nl from './nl.json';
import ptPt from './pt-pt.json';
import pt from './pt.json';
import ro from './ro.json';
import ru from './ru.json';
import rw from './rw.json';
import sk from './sk.json';
import sl from './sl.json';
import sv from './sv.json';
import sw from './sw.json';
// import tl from './tl.json';
import uk from './uk.json';

const messages: Record<LanguageValue, typeof en> = {
  am,
  cmnHans,
  de,
  el,
  en,
  es,
  et,
  fi,
  fr,
  ht,
  hu,
  it,
  mg,
  nl,
  pt,
  ptPt,
  ro,
  ru,
  rw,
  sk,
  sl,
  sv,
  sw,
  // tl,
  uk,
};

export default messages;
