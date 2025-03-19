/**
 * File: frontend/src/vite-env.d.ts
 * Purpose: TypeScript declarations for Vite environment variables
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
