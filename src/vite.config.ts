import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,  // Change to 3000 (or any free port like 4000, 8080)
    open: true,  // Auto-open browser on start
    hmr: true,   // Hot module replacement
  },
});