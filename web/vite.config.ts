import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['salary.soqiamakkah.com', '91.108.112.8', 'localhost']
    // لا نحتاج proxy - نستخدم Supabase مباشرة
  }
})
