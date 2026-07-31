import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config([
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Rule objects (not the plugin's own `configs.recommended-latest`/`configs.vite`,
      // which are pre-eslint-9 shaped and not directly spreadable into flat config).
      ...reactHooks.configs['recommended-latest'].rules,
      ...reactRefresh.configs.vite.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // A context + its paired hook exported from one file is the idiomatic pattern (see
      // AuthContext.tsx) — downgrade from the preset's "error" since it's a real, common
      // pattern, not a mistake; it only affects Fast Refresh granularity in dev.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
