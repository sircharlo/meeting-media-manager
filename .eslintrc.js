module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  ignorePatterns: ['docs/**/*.min.js', 'static/*', 'dist/*', 'build/*'],
  extends: [
    'eslint:recommended',
    'plugin:vue/recommended',
    'plugin:nuxt/recommended',
    '@nuxtjs/eslint-config-typescript',
    'prettier',
  ],
  // Add your custom rules here
  rules: {
    'array-callback-return': 'error',
    // 'capitalized-comments': ['error', 'always', { ignoreInlineComments: true }],
    'dot-notation': 'error',
    'logical-assignment-operators': ['error', 'always'],
    // 'no-await-in-loop': 'error',
    'no-confusing-arrow': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-constant-binary-expression': 'error',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-duplicate-imports': 'error',
    'no-floating-decimal': 'error',
    // 'no-implicit-coercion': 'error',
    'no-lonely-if': 'error',
    'no-self-compare': 'error',
    'no-template-curly-in-string': 'error',
    'no-unneeded-ternary': 'error',
    'no-unreachable-loop': 'error',
    'no-use-before-define': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'operator-assignment': ['error', 'always'],
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    'vue/valid-attribute-name': ['error'],
    'vue/valid-model-definition': ['error'],
    'no-magic-numbers': [
      'error',
      {
        ignoreArrayIndexes: true,
        ignore: [-2, -1, 0, 0.1, 0.5, 1, 2, 3, 4, 5, 6, 10],
      },
    ],
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always',
          normal: 'always',
          component: 'always',
        },
      },
    ],
    'vue/no-unsupported-features': [
      'error',
      {
        version: '2.7.0',
      },
    ],
  },
}
