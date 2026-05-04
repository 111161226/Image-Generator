import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/Image-Generator/",          // 前後のスラッシュを確認してください
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // ライブラリを別ファイルに分割して500kB警告を回避する
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // チャンクサイズの警告しきい値を1000kBに引き上げる
    chunkSizeWarningLimit: 1000,
  }
})
