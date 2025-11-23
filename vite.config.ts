import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  // CRITICAL FOR GITHUB PAGES:
  base: '/Cadmian-Calendar/', 
  
  server: {
    open: false,
    port: 5173,
    // FIXED: Removed 'https: true' (basicSsl plugin handles this automatically)
    // CRITICAL FOR LOCAL DEV:
    cors: {
      origin: "*", 
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }
  },
})