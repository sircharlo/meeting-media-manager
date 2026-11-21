/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_ID: string;
  readonly APP_NAME: string;
  readonly IS_BETA: boolean;
  readonly IS_DEV: boolean;
  readonly IS_TEST: boolean;
  readonly MSIX_IDENTITY_NAME: string;
  readonly MSIX_PUBLISHER: string;
  readonly PRODUCT_NAME: string;
  readonly repository: string;
  readonly SENTRY_DSN: string;
  readonly version: string;
  readonly VITEST: boolean | undefined;
}
