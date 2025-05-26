import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@react-pdf/renderer', '@react-pdf/font', '@react-pdf/layout']
  },
  build: {
    commonjsOptions: {
      include: [/@react-pdf\/renderer/]
    }
  }
})