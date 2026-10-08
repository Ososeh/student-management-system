// Vite serves the React app during development and bundles it for production.
// Vitest reuses this config so tests can understand JSX and browser APIs.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: { environment: 'jsdom', setupFiles: './src/tests/setup.js', globals: true },
});
