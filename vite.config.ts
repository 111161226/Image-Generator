import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "Image-Generator" : './' ,          // この行を追加
  plugins: [react()],
})
