import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5213,
    proxy: {
      '/api/notifications/stream': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        // SSE 需要禁用缓冲，否则数据会被代理攒住不发送
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // 确保 SSE 响应不被缓冲
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              proxyRes.headers['cache-control'] = 'no-cache'
              proxyRes.headers['x-accel-buffering'] = 'no'
            }
          })
        },
      },
      '/api': 'http://127.0.0.1:3000',
      '/uploads': 'http://127.0.0.1:3000',
    }
  }
})
