import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/hirams/', // leading / is important for production on server
  server: {
    proxy: {
      '/api': {
        target: 'https://lgu.net.ph/apiHirams/public',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
