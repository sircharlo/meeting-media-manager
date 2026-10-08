/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_ID: string;
  readonly APP_NAME: string;
  readonly IS_BETA: boolean;
  readonly IS_DEV: boolean;
  readonly IS_TEST: boolean;
  readonly PRODUCT_NAME: string;
  readonly repository: string;
  readonly SENTRY_DSN: string;
  readonly version: string;
  readonly VITEST: boolean | undefined;
}
