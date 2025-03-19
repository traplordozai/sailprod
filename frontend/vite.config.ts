/**
 * File: frontend/vite.config.ts
 * Purpose: TypeScript version of Vite configuration
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

export default defineConfig(({ command, mode }) => ({
  plugins: [react()] as any[],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  preview: {
    port: 3000,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.onrender.com',
      'sa1l-frontend.onrender.com',
    ],
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.onrender.com',
      'sa1l-frontend.onrender.com',
    ],
  }
}))