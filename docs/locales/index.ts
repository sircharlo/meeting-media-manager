import {
  enabled as baseEnabled,
  type LanguageValue,
  locales,
} from '../../src/constants/locales';

export const localeOptions = locales;
export const enabled: LanguageValue[] = baseEnabled.filter((l) => l !== 'en');

// ! This file should import the JSON files for all languages configured in Crowdin.

import af from './af.json';
import am from './am.json';
import cmnHans from './cmn-hans.json';
import de from './de.json';
import el from './el.json';
import en from './en.json';
import es from './es.json';
import et from './et.json';
import fi from './fi.json';
import fr from './fr.json';
import hu from './hu.json';
import ilo from './ilo.json';
import it from './it.json';
import mg from './mg.json';
import nl from './nl.json';
import pag from './pag.json';
import ptPt from './pt-pt.json';
import pt from './pt.json';
import rmnXRmg from './rmn-x-rmg.json';
import ro from './ro.json';
import ru from './ru.json';
import sk from './sk.json';
import sl from './sl.json';
import sv from './sv.json';
import sw from './sw.json';
import ta from './ta.json';
import tl from './tl.json';
import uk from './uk.json';
import wesXPgw from './wes-x-pgw.json';

const messages: Record<LanguageValue, typeof en> = {
  af,
  am,
  cmnHans,
  de,
  el,
  en,
  es,
  et,
  fi,
  fr,
  hu,
  ilo,
  it,
  mg,
  nl,
  pag,
  pt,
  ptPt,
  rmnXRmg,
  ro,
  ru,
  sk,
  sl,
  sv,
  sw,
  ta,
  tl,
  uk,
  wesXPgw,
};

export default messages;
