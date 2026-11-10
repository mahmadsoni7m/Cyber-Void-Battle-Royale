import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Capacitor loads the app from a local WebView origin; absolute /assets paths cause a blank screen.
  base: './',
  plugins: [react()],
  build: { assetsInlineLimit: 4096, sourcemap: false }
});
