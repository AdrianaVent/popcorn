import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Custom rules
  {
    rules: {
      semi: ['error', 'never'], // no semicolons at the end of lines
      quotes: ['error', 'single'], // enforce single quotes
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], // warn on unused variables; args/vars prefixed with _ are intentionally unused
      'react/react-in-jsx-scope': 'off', // React import not required in Next.js
    },
  },
  // Disable next/image rule in test files — mocks use plain <img> intentionally
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
  // Override default ignores from eslint-config-next
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Node.js scripts use CommonJS require — not linted
    'scripts/**',
  ]),
])

export default eslintConfig
