import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM-compatible __dirname replacement
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()], // Keep for potential React component tests
  test: {
    // Environment setup
    environment: 'node', // Use node environment for validation/utility tests

    // Setup files to run before tests
    setupFiles: ['./vitest.setup.ts'],

    // Test file patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // Use forks pool (default, but can be changed if needed)
    // pool: 'forks',

    // Coverage configuration (for measuring test coverage)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '*.config.ts',
        '*.config.mts',
        '.next/',
        'coverage/',
      ],
    },

    // Globals: allows using describe, it, expect without importing
    globals: true,

    // Test timeout (5 seconds)
    testTimeout: 5000,
  },

  // Path aliases (same as Next.js tsconfig)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
