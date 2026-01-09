import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/agent-api': {
        target: 'http://1.1.1.2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent-api/, '')
      },
      '/agent-service': {
        target: 'http://10.255.216.2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent-service/, '')
      }
    }
  }
})
