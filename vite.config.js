import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11', 'iOS >= 12', 'Safari >= 12']
    })
  ],
  
  // Development server configuration
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  
  // Preview server configuration
  preview: {
    host: '0.0.0.0',
    port: 3000,
    cors: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'agents': [
            'src/agents/ReviewGeneratorAgent.js',
            'src/agents/PlatformRoutingAgent.js', 
            'src/agents/UIControllerAgent.js',
            'src/agents/StateManagementAgent.js'
          ],
          'app': ['src/HotelReviewApp.js']
        }
      }
    },
    // PWA assets
    copyPublicDir: true
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': '/src',
      '@agents': '/src/agents',
      '@tests': '/tests'
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  
  // Optimization
  optimizeDeps: {
    include: ['workbox-window']
  },
  
  // Public base path for deployment
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  
  // File watching
  logLevel: 'info',
  clearScreen: false
})