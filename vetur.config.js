// vetur.config.js
/** @type {import('vls').VeturConfig} */
module.exports = {
  // **optional** default: `{}`
  // override vscode settings part
  // Notice: It only affects the settings used by Vetur.
  settings: {
    'vetur.useWorkspaceDependencies': true,
    'vetur.validation.template': false,
    'vetur.validation.script': false,
    'vetur.validation.interpolation': true,
    'vetur.experimental.templateInterpolationService': false,
  },
  // **optional** default: `[{ root: './' }]`
  // support monorepos
  projects: [
    {
      // **required**
      // Where is your project?
      // It is relative to `vetur.config.js`.
      root: '.',
      // **optional** default: `'package.json'`
      // Where is `package.json` in the project?
      // We use it to determine the version of vue.
      // It is relative to root property.
      package: './package.json',
      // **optional**
      // Where is TypeScript config file in the project?
      // It is relative to root property.
      tsconfig: './src/renderer/tsconfig.json',
      // **optional** default: `[]`
      // Register globally Vue component glob.
      // If you set it, you can get completion by that components.
      // It is relative to root property.
      // Notice: It won't actually do it. You need to use `require.context` or `Vue.component`
      globalComponents: ['./src/renderer/components/**/*.vue'],
    },
  ],
}
