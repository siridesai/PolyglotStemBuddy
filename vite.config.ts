import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@react-pdf/renderer', 'base64-js'],
    exclude: ['@react-pdf/font', '@react-pdf/layout']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /node_modules\/.*base64-js.*/],
      transformMixedEsModules: true
    }
  }
})