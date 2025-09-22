import react from '@vitejs/plugin-react'
import { viteMockServe } from 'vite-plugin-mock'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteMockServe({
      mockPath: './src/mock', // mock文件存放路径
      enable: true, // 开发环境开启mock
      watchFiles: true, // 监听mock文件变化
    })
  ],
  server: {
    port: 3000,
    open: true
  }
})