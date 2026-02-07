import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'], // Support NEXT_PUBLIC_ variables
  optimizeDeps: {
    include: ['react-quill-new', 'react-quill-new/dist/quill.snow.css']
  }
})
