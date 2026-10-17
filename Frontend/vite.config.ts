import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveBackendOrigin } from './src/config/backendOrigin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // The e2e test frontend must be given its backend address explicitly and may
  // not point at the live :5001. Checked here too, so the server REFUSES TO START
  // rather than serving a page that fails later (src/config/backend.ts).
  if (mode === 'e2e') {
    const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
    resolveBackendOrigin({ MODE: mode, VITE_BACKEND_ORIGIN: env.VITE_BACKEND_ORIGIN });
  }
  return {
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
  };
});
