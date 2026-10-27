/* eslint-disable perfectionist/sort-imports */
import type { MessageSchema } from 'boot/i18n';
import { enabled, locales } from 'src/constants/locales';

export const localeOptions = locales.filter((locale) =>
  enabled.includes(locale.value),
);

// ! This file will be updated by the update-langs script.

// 100.0% translated as of 2026-10-27
import en from './en.json' with { type: 'json' };

// 99.7% translated as of 2026-10-27
import cmnHans from './cmn-hans.json' with { type: 'json' };

// 99.6% translated as of 2026-10-27
import ko from './ko.json' with { type: 'json' };

// 99.6% translated as of 2026-10-27
import ru from './ru.json' with { type: 'json' };

// 99.6% translated as of 2026-10-27
import uk from './uk.json' with { type: 'json' };

// 99.4% translated as of 2026-10-27
import sl from './sl.json' with { type: 'json' };

// 99.3% translated as of 2026-10-27
import fr from './fr.json' with { type: 'json' };

// 99.3% translated as of 2026-10-27
import hu from './hu.json' with { type: 'json' };

// 99.2% translated as of 2026-10-27
import et from './et.json' with { type: 'json' };

// 99.0% translated as of 2026-10-27
import it from './it.json' with { type: 'json' };

// 99.0% translated as of 2026-10-27
import pt from './pt.json' with { type: 'json' };

// 99.0% translated as of 2026-10-27
import ty from './ty.json' with { type: 'json' };

// 98.8% translated as of 2026-10-27
import es from './es.json' with { type: 'json' };

// 98.8% translated as of 2026-10-27
import nl from './nl.json' with { type: 'json' };

// 98.4% translated as of 2026-10-27
import de from './de.json' with { type: 'json' };

// 0.9% translated as of 2026-10-27
// import zh from './zh.json' with { type: 'json' };

// 0.8% translated as of 2026-10-27
// import cmnHant from './cmn-hant.json' with { type: 'json' };

// 0.5% translated as of 2026-10-27
// import bzs from './bzs.json' with { type: 'json' };

// 0.3% translated as of 2026-10-27
// import ilo from './ilo.json' with { type: 'json' };

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

// Dev only: nothing else accepts hot updates of the locale JSON files, so
// editing a string would make Vite fully reload every window. Swap the edited
// messages into the running i18n instance instead.
if (import.meta.hot) {
  import.meta.hot.accept(async (updated) => {
    if (!updated) return;
    const { i18n } = await import('boot/i18n');
    const updatedMessages = updated.default as Record<string, MessageSchema>;
    for (const [locale, localeMessages] of Object.entries(updatedMessages)) {
      i18n.global.setLocaleMessage(locale, localeMessages);
    }
  });
}
