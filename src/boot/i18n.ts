import { defineBoot } from '@quasar/app-vite/wrappers';
import messages from 'src/i18n';
import { createI18n } from 'vue-i18n';

export type MessageLanguages = keyof typeof messages;
export type MessageSchema = (typeof messages)['en'];

let i18n: ReturnType<typeof createI18n> = createI18n({});

export default defineBoot(({ app }) => {
  i18n = createI18n({
    allowComposition: true,
    fallbackLocale: 'en',
    legacy: false,
    locale: 'en',
    messages,
  });
  app.use(i18n);
});

export { i18n };
