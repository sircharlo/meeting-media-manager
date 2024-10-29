export default {
  '**/*': 'prettier --write --ignore-unknown',
  '**/*.{js,ts,mjs,mts,vue}': 'eslint --fix',
  '**/*.{ts,mts,vue}?(x)': () => 'yarn type-check',
};
