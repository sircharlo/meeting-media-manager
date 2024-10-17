module.exports = {
  // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
  // This option interrupts the configuration hierarchy at this file
  // Remove this if you have an higher level ESLint config file (it usually happens into a monorepos)
  root: true,

  // https://eslint.vuejs.org/user-guide/#how-to-use-a-custom-parser
  // Must use parserOptions instead of "parser" to allow vue-eslint-parser to keep working
  // `parser: 'vue-eslint-parser'` is already included with any 'plugin:vue/**' config and should be omitted
  parserOptions: {
    parser: require.resolve('@typescript-eslint/parser'),
    extraFileExtensions: ['.vue'],
  },

  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  // Rules order is important, please avoid shuffling them
  extends: [
    // Base ESLint recommended rules
    'eslint:recommended',

    // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#usage
    // ESLint typescript rules
    'plugin:@typescript-eslint/strict',
    'plugin:@typescript-eslint/stylistic',

    'plugin:perfectionist/recommended-natural-legacy',

    // See https://eslint.vuejs.org/rules/#available-rules
    'plugin:vue/vue3-recommended',

    // https://github.com/prettier/eslint-config-prettier#installation
    // usage with Prettier, provided by 'eslint-config-prettier'.
    'prettier',
  ],

  plugins: [
    // required to apply rules which need type information
    '@typescript-eslint',

    // https://eslint.vuejs.org/user-guide/#why-doesn-t-it-work-on-vue-files
    // required to lint *.vue files
    'vue',

    // https://github.com/typescript-eslint/typescript-eslint/issues/389#issuecomment-509292674
    // Prettier has not been included as plugin to avoid performance impact
    // add it as an extension for your IDE
    'perfectionist',
  ],

  globals: {
    ga: 'readonly', // Google Analytics
    cordova: 'readonly',
    __statics: 'readonly',
    __QUASAR_SSR__: 'readonly',
    __QUASAR_SSR_SERVER__: 'readonly',
    __QUASAR_SSR_CLIENT__: 'readonly',
    __QUASAR_SSR_PWA__: 'readonly',
    process: 'readonly',
    Capacitor: 'readonly',
    chrome: 'readonly',
  },

  // add your custom rules here
  rules: {
    // eslint rules
    'array-callback-return': 'error',
    'no-constant-binary-expression': 'error',
    'no-constructor-return': 'error',
    'no-template-curly-in-string': 'error',
    'no-unreachable-loop': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-duplicate-imports': 'error',
    'no-self-compare': 'error',
    'no-new-native-nonconstructor': 'error',
    'no-promise-executor-return': 'error',
    'prefer-promise-reject-errors': 'off',

    // vue rules
    'vue/block-lang': ['error', { script: { lang: 'ts' } }],
    'vue/block-order': 'error',
    'vue/component-api-style': ['error', ['script-setup']],
    'vue/define-props-declaration': 'error',
    'vue/enforce-style-attribute': 'error',
    'vue/no-boolean-default': 'error',
    'vue/prefer-true-attribute-shorthand': 'error',

    // typescript-eslint rules
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-import-type-side-effects': 'error',

    quotes: ['warn', 'single', { avoidEscape: true }],

    // this rule, if on, would require explicit return type on the `render` function
    '@typescript-eslint/explicit-function-return-type': 'off',

    // in plain CommonJS modules, you can't use `import foo = require('foo')` to pass this rule, so it has to be disabled
    '@typescript-eslint/no-var-requires': 'off',

    // The core 'no-unused-vars' rules (in the eslint:recommended ruleset)
    // does not work with type definitions
    'no-undef': 'off',
    'no-unused-vars': 'off',

    // allow debugger during development only
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'perfectionist/sort-vue-attributes': [
      'error',
      {
        // Based on: https://eslint.vuejs.org/rules/attributes-order.html
        // Note: I think this matches on attribute strings for everything that comes BEFORE the equal sign (=), if there is one. This makes some things impossible to match.
        // See issue: https://github.com/azat-io/eslint-plugin-perfectionist/issues/112
        // See guide on extended glob matching: https://www.linuxjournal.com/content/bash-extended-globbing
        customGroups: {
          /* eslint-disable perfectionist/sort-objects */
          DEFINITION: '@(is|v-is)',
          LIST_RENDERING: 'v-for',
          CONDITIONALS: 'v-@(if|else-if|else|show|cloak)',
          RENDER_MODIFIERS: 'v-@(pre|once)',
          GLOBAL: '@(id|:id)',
          UNIQUE: '@(ref|:ref|key|:key)',
          SLOT: '@(v-slot|slot|#*)',
          TWO_WAY_BINDING: '@(v-model|v-model:*)',
          OTHER_DIRECTIVES: '@(v-!(on|bind|html|text))', // Matches all "v-" directives except v-on, v-bind, v-html, v-text (these are defined separately below, which are lower in the order of operations)
          ATTR_DYNAMIC: '@(v-bind:*|:*)', // For dynamic bindings, like v-bind:prop or :prop.
          // ATTR_STATIC: "", // For normal props, like prop="example". No glob patterns possible since we are matching on everything BEFORE the equal sign (=), if there is one. Therefore we can't differentiate boolean props from static props.
          // ATTR_SHORTHAND_BOOL: "", // For boolean props, like custom-prop. No glob patterns possible since we are matching on everything BEFORE the equal sign (=), if there is one. Therefore we can't differentiate boolean props from static props.
          EVENTS: '@(v-on|@*)',
          CONTENT: 'v-@(html|text)',
          /* eslint-enable perfectionist/sort-objects */
        },
        groups: [
          'DEFINITION',
          'LIST_RENDERING',
          'CONDITIONALS',
          'RENDER_MODIFIERS',
          'GLOBAL',
          ['UNIQUE', 'SLOT'],
          'TWO_WAY_BINDING',
          'OTHER_DIRECTIVES',
          ['ATTR_DYNAMIC', 'unknown', 'multiline', 'shorthand'], // 'unknown' is a workaround because perfectionist/sort-vue-attributes cannot match on ATTR_STATIC or ATTR_SHORTHAND_BOOL
          'EVENTS',
          'CONTENT',
        ],
        type: 'natural',
      },
    ],
  },
};
