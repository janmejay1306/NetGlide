import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig(async () => {
  // `@tailwindcss/vite` is ESM-only; load it via dynamic import so this config
  // works even when Node treats Vite config execution as CJS.
  const { default: tailwindcss } = await import('@tailwindcss/vite')

  return {
    base: './',
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
