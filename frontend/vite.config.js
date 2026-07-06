import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Routed through HAProxy (which does its own /api path-stripping) rather
      // than straight to the backend, since the backend no longer publishes a
      // host port on its own.
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
})
