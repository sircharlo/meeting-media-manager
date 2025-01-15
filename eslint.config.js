import js from '@eslint/js';
import pluginQuasar from '@quasar/app-vite/eslint';
import skipFormattingConfig from '@vue/eslint-config-prettier/skip-formatting';
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript';
import perfectionist from 'eslint-plugin-perfectionist';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default defineConfigWithVueTs([
  {
    ignores: [
      '**/.DS_Store',
      '.yarn/',
      'src/css/mmm-icons.css',
      'build/',
      '!build/svg2font.js',
      'src/renderer/',
      'src/main/',
      'docs/src/**/*',
      '!docs/src/en/**/*',
      'LICENSE.md',
      'docs/.vitepress/dist',
      'docs/.vitepress/cache',
    ],
  },

  ...pluginQuasar.configs.recommended(),
  js.configs.recommended,

  // https://eslint.vuejs.org
  ...pluginVue.configs['flat/recommended'],

  // https://typescript-eslint.io/rules/
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.vue'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },

  // https://github.com/vuejs/eslint-config-typescript
  // https://typescript-eslint.io/users/configs#recommended-configurations
  vueTsConfigs.strict,
  vueTsConfigs.stylistic,

  // https://typescript-eslint.io/rules/
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.vue'],
    rules: {
      // Turn off the recommended rules that you don't need.
    },
  },

  perfectionist.configs['recommended-natural'],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node, // SSR, Electron, config files
        browser: 'readonly', // bex related
        Capacitor: 'readonly',
        chrome: 'readonly', // bex related
        cordova: 'readonly',
        ga: 'readonly', // Google Analytics
        process: 'readonly', // process.env.*
      },

      sourceType: 'module',
    },

    rules: {
      // https://eslint.org/docs/latest/rules/
      'array-callback-return': 'error',
      'no-constant-binary-expression': 'error',
      'no-constructor-return': 'error',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-duplicate-imports': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-promise-executor-return': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'prefer-promise-reject-errors': 'off',

      // https://eslint.vuejs.org/rules/
      'vue/attributes-order': ['error', { alphabetical: true }],
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/block-order': 'error',
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-props-declaration': 'error',
      'vue/enforce-style-attribute': 'error',
      'vue/no-boolean-default': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
    },
  },

  skipFormattingConfig,
]);
