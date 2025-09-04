import { defineBoot } from '@quasar/app-vite/wrappers';
import messages from 'src/i18n';
import { createI18n } from 'vue-i18n';

export type MessageLanguages = keyof typeof messages;
export type MessageSchema = (typeof messages)['en'];

const i18n: ReturnType<typeof createI18n> = createI18n({
  allowComposition: true,
  fallbackLocale: 'en',
  legacy: false,
  locale: 'en',
  messages,
});

export default defineBoot(({ app }) => {
  app.use(i18n);
});

export { i18n };
