import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:5000'),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Firebase into separate chunk
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
          // Split React Router into separate chunk
          router: ['react-router-dom'],
          // Split PDF generation into separate chunk
          pdf: ['html2pdf.js', 'react-to-pdf']
        }
      }
    },
    // Enable gzip compression
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps in production for smaller bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1600
  },
  server: {
    // Enable hot reload optimization
    hmr: {
      overlay: false
    }
  },
  // Enable CSS optimization
  css: {
    devSourcemap: false
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['html2pdf.js']
  }
})
