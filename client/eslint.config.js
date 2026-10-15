// ESLint checks JavaScript/JSX for common mistakes. Browser and Node globals
// are both available because this project includes client and config files.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

// Flat config entries are applied in order: ignore build output, enable the
// recommended JavaScript rules, then add browser/Node globals and React checks.
export default [
  // Generated production bundles should not be linted as hand-written code.
  { ignores: ['dist'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      // JSX syntax and ES modules are accepted; browser APIs and Node config
      // APIs are recognized as globals instead of reported as undefined.
      ecmaVersion: 'latest',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      // React hook rules catch invalid hook usage; refresh rules support Vite's
      // component hot reload during development.
      ...reactHooks.configs['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
];
