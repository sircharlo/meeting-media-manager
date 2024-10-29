export default {
  '**/*.{ts,mts,vue}?(x)': () => 'yarn type-check',
  '*.{js,ts,mjs,mts,vue,scss,html,md,json}':
    'prettier --write --ignore-unknown --ignore-path .gitignore',
  '*.{js,ts,mjs,mts,vue}': 'eslint --fix',
};
