const localeOptions: { englishName: string; label: string; value: string }[] =
  [];

// As a sort of rule, let's only enable a language once it's reached a threshold of 50% translated in Crowdin.
// Modify this file along with docs/locales/index.ts to enable a language both on the docs website and in the app.

// import af from 'src/i18n/af.json';
// localeOptions.push({
//   englishName: 'Afrikaans',
//   label: 'Afrikaans',
//   value: 'af',
// }); // Afrikaans;
// import am from 'src/i18n/am.json';
// localeOptions.push({
//   englishName: 'Amharic',
//   label: 'አማርኛ',
//   value: 'am',
// }); // Amharic
import cmnHans from 'src/i18n/cmn-hans.json';
localeOptions.push({
  englishName: 'Chinese, Simplified',
  label: '简体中文',
  value: 'cmnHans',
}); // Simplified Chinese
import de from 'src/i18n/de.json';
localeOptions.push({
  englishName: 'German',
  label: 'Deutsch',
  value: 'de',
}); // German
// import el from 'src/i18n/el.json';
// localeOptions.push({
//   englishName: 'Greek',
//   label: 'Ελληνικά',
//   value: 'el',
// }); // Greek
import en from 'src/i18n/en.json';
localeOptions.push({ englishName: 'English', label: 'English', value: 'en' }); // English
import es from 'src/i18n/es.json';
localeOptions.push({
  englishName: 'Spanish',
  label: 'Español',
  value: 'es',
}); // Spanish
import et from 'src/i18n/et.json';
localeOptions.push({
  englishName: 'Estonian',
  label: 'Eesti',
  value: 'et',
}); // Estonian
// import fi from 'src/i18n/fi.json';
// localeOptions.push({
//   englishName: 'Finnish',
//   label: 'Suomi',
//   value: 'fi',
// }); // Finnish
import fr from 'src/i18n/fr.json';
localeOptions.push({
  englishName: 'French',
  label: 'Français',
  value: 'fr',
}); // French
// import hu from 'src/i18n/hu.json';
// localeOptions.push({
//   englishName: 'Hungarian',
//   label: 'Magyar',
//   value: 'hu',
// }); // Hungarian
// import ilo from 'src/i18n/ilo.json';
// localeOptions.push({ englishName: 'Ilocano', label: 'Ilocano', value: 'ilo' }); // Ilocano
import it from 'src/i18n/it.json';
localeOptions.push({
  englishName: 'Italian',
  label: 'Italiano',
  value: 'it',
}); // Italian
// import mg from 'src/i18n/mg.json';
// localeOptions.push({
//   englishName: 'Malagasy',
//   label: 'Malagasy',
//   value: 'mg',
// }); // Malagasy
import nl from 'src/i18n/nl.json';
localeOptions.push({
  englishName: 'Dutch',
  label: 'Nederlands',
  value: 'nl',
}); // Dutch
// import pag from 'src/i18n/pag.json';
// localeOptions.push({
//   englishName: 'Pangasinan',
//   label: 'Pangasinan',
//   value: 'pag',
// }); // Pangasinan
import pt from 'src/i18n/pt.json';
localeOptions.push({
  englishName: 'Portuguese - Brazil',
  label: 'Português - Brasil',
  value: 'pt',
}); // Portuguese (Brazil)
import ptPt from 'src/i18n/pt-pt.json';
localeOptions.push({
  englishName: 'Portuguese - Portugal',
  label: 'Português - Portugal',
  value: 'ptPt',
}); // Portuguese (Portugal)
// import rmnXRmg from 'src/i18n/rmn-x-rmg.json';
// localeOptions.push({
//   englishName: 'Romani - Southern Greece',
//   label: 'Romani - Southern Greece',
//   value: 'rmnXRmg',
// }); // Romani (Southern Greece)
// import ro from 'src/i18n/ro.json';
// localeOptions.push({
//   englishName: 'Romanian',
//   label: 'Română',
//   value: 'ro',
// }); // Romanian
import ru from 'src/i18n/ru.json';
localeOptions.push({
  englishName: 'Russian',
  label: 'Русский',
  value: 'ru',
}); // Russian
// import sk from 'src/i18n/sk.json';
// localeOptions.push({
//   englishName: 'Slovak',
//   label: 'Slovenčina',
//   value: 'sk',
// }); // Slovak
import sl from 'src/i18n/sl.json';
localeOptions.push({
  englishName: 'Slovenian',
  label: 'Slovenščina',
  value: 'sl',
}); // Slovenian
import sv from 'src/i18n/sv.json';
localeOptions.push({
  englishName: 'Swedish',
  label: 'Svenska',
  value: 'sv',
}); // Swedish
import sw from 'src/i18n/sw.json';
localeOptions.push({
  englishName: 'Swahili',
  label: 'Kiswahili',
  value: 'sw',
}); // Swahili
// import ta from 'src/i18n/ta.json';
// localeOptions.push({
//   englishName: 'Tamil',
//   label: 'தமிழ்',
//   value: 'ta',
// }); // Tamil
// import tl from 'src/i18n/tl.json';
// localeOptions.push({ englishName: 'Tagalog', label: 'Tagalog', value: 'tl' }); // Tagalog
import uk from 'src/i18n/uk.json';
localeOptions.push({
  englishName: 'Ukrainian',
  label: 'Українська',
  value: 'uk',
}); // Ukrainian
// import wesXPgw from 'src/i18n/wes-x-pgw.json';
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
