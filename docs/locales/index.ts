const localeOptions: { englishName: string; label: string; value: string }[] =
  [];

// As a sort of rule, let's only enable a language once it's reached a threshold of 50% translated in Crowdin.
// Modify this file along with src/i18n/index.ts to enable a language both on the docs website and in the app.

// import af from './af.json';
// localeOptions.push({
//   englishName: 'Afrikaans',
//   label: 'Afrikaans',
//   value: 'af',
// }); // Afrikaans;
// import am from './am.json';
// localeOptions.push({
//   englishName: 'Amharic',
//   label: 'አማርኛ',
//   value: 'am',
// }); // Amharic
import cmnHans from './cmn-hans.json';
localeOptions.push({
  englishName: 'Chinese, Simplified',
  label: '简体中文',
  value: 'cmnHans',
}); // Simplified Chinese
import de from './de.json';
localeOptions.push({
  englishName: 'German',
  label: 'Deutsch',
  value: 'de',
}); // German
// import el from './el.json';
// localeOptions.push({
//   englishName: 'Greek',
//   label: 'Ελληνικά',
//   value: 'el',
// }); // Greek
import en from './en.json';
localeOptions.push({ englishName: 'English', label: 'English', value: 'en' }); // English
import es from './es.json';
localeOptions.push({
  englishName: 'Spanish',
  label: 'Español',
  value: 'es',
}); // Spanish
import et from './et.json';
localeOptions.push({
  englishName: 'Estonian',
  label: 'Eesti',
  value: 'et',
}); // Estonian
// import fi from './fi.json';
// localeOptions.push({
//   englishName: 'Finnish',
//   label: 'Suomi',
//   value: 'fi',
// }); // Finnish
import fr from './fr.json';
localeOptions.push({
  englishName: 'French',
  label: 'Français',
  value: 'fr',
}); // French
// import hu from './hu.json';
// localeOptions.push({
//   englishName: 'Hungarian',
//   label: 'Magyar',
//   value: 'hu',
// }); // Hungarian
// import ilo from './ilo.json';
// localeOptions.push({ englishName: 'Ilocano', label: 'Ilocano', value: 'ilo' }); // Ilocano
import it from './it.json';
localeOptions.push({
  englishName: 'Italian',
  label: 'Italiano',
  value: 'it',
}); // Italian
// import mg from './mg.json';
// localeOptions.push({
//   englishName: 'Malagasy',
//   label: 'Malagasy',
//   value: 'mg',
// }); // Malagasy
import nl from './nl.json';
localeOptions.push({
  englishName: 'Dutch',
  label: 'Nederlands',
  value: 'nl',
}); // Dutch
// import pag from './pag.json';
// localeOptions.push({
//   englishName: 'Pangasinan',
//   label: 'Pangasinan',
//   value: 'pag',
// }); // Pangasinan
import pt from './pt.json';
localeOptions.push({
  englishName: 'Portuguese - Brazil',
  label: 'Português - Brasil',
  value: 'pt',
}); // Portuguese (Brazil)
import ptPt from './pt-pt.json';
localeOptions.push({
  englishName: 'Portuguese - Portugal',
  label: 'Português - Portugal',
  value: 'ptPt',
}); // Portuguese (Portugal)
// import rmnXRmg from './rmn-x-rmg.json';
// localeOptions.push({
//   englishName: 'Romani - Southern Greece',
//   label: 'Romani - Southern Greece',
//   value: 'rmnXRmg',
// }); // Romani (Southern Greece)
// import ro from './ro.json';
// localeOptions.push({
//   englishName: 'Romanian',
//   label: 'Română',
//   value: 'ro',
// }); // Romanian
import ru from './ru.json';
localeOptions.push({
  englishName: 'Russian',
  label: 'Русский',
  value: 'ru',
}); // Russian
// import sk from './sk.json';
// localeOptions.push({
//   englishName: 'Slovak',
//   label: 'Slovenčina',
//   value: 'sk',
// }); // Slovak
import sl from './sl.json';
localeOptions.push({
  englishName: 'Slovenian',
  label: 'Slovenščina',
  value: 'sl',
}); // Slovenian
import sv from './sv.json';
localeOptions.push({
  englishName: 'Swedish',
  label: 'Svenska',
  value: 'sv',
}); // Swedish
import sw from './sw.json';
localeOptions.push({
  englishName: 'Swahili',
  label: 'Kiswahili',
  value: 'sw',
}); // Swahili
// import ta from './ta.json';
// localeOptions.push({
//   englishName: 'Tamil',
//   label: 'தமிழ்',
//   value: 'ta',
// }); // Tamil
// import tl from './tl.json';
// localeOptions.push({ englishName: 'Tagalog', label: 'Tagalog', value: 'tl' }); // Tagalog
import uk from './uk.json';
localeOptions.push({
  englishName: 'Ukrainian',
  label: 'Українська',
  value: 'uk',
}); // Ukrainian
// import wesXPgw from './wes-x-pgw.json';
// localeOptions.push({
//   englishName: 'Nigerian Pidgin',
//   label: 'Nigerian Pidgin',
//   value: 'wesXPgw',
// }); // Nigerian Pidgin

export { localeOptions };
export default {
  // af,
  // am,
  cmnHans,
  de,
  // el,
  en,
  es,
  et,
  // fi,
  fr,
  // hu,
  // ilo,
  it,
  // mg,
  nl,
  // pag,
  pt,
  ptPt,
  // rmnXRmg,
  // ro,
  ru,
  // sk,
  sl,
  sv,
  sw,
  // ta,
  // tl,
  uk,
  // wesXPgw,
};
