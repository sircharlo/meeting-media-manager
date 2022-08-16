module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  ignorePatterns: ['docs/**/*.min.js', 'static/*'],
  extends: [
    'eslint:recommended',
    'plugin:vue/recommended',
    'plugin:nuxt/recommended',
    '@nuxtjs/eslint-config-typescript',
    'prettier',
  ],
  // add your custom rules here
  rules: {
    'vue/valid-attribute-name': ['error'],
    'vue/valid-model-definition': ['error'],
    'vue/multi-word-component-names': 'off',
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/no-unsupported-features': [
      'error',
      {
        version: '2.7.0',
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
  },
}
