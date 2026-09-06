import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    // jsdom for everything, so a component test does not need a per-file
    // `// @vitest-environment jsdom` pragma. The existing pragmas stay valid.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Existing tests import describe/it/expect explicitly, which still works;
    // globals just removes the requirement for new ones.
    globals: true,
    css: false,
  },
});
