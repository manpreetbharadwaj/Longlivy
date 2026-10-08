// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'ios/*', 'android/*', '.expo/*', '.test-build/*', 'patches/*'],
  },
  {
    rules: {
      // Web-HTML rule: React Native renders ' and " in JSX text verbatim.
      'react/no-unescaped-entities': 'off',
      // React Compiler diagnostics (eslint-plugin-react-hooks v6). This app
      // does not use the React Compiler, and these flag valid Reanimated
      // shared-value writes and long-standing ref/timer patterns in the audio,
      // GPS and timer hooks. Kept visible as warnings, not hidden; adopt them
      // when migrating to the compiler.
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  {
    // Node/CommonJS tooling config.
    files: ['*.config.js', 'babel.config.js', 'metro.config.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]);
