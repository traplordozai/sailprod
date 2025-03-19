/**
 * File: frontend/vite.config.js
 * Purpose: Vite bundler configuration
 */
module.exports = {
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      input: 'src/index.tsx'
    }
  }
}
