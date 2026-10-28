/// <reference types='vitest' />
import { defaultClientConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';

const apiUrl = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  server: {
    port: 4200,
    host: 'localhost',
    proxy: { '/api': apiUrl },
  },
  preview: {
    port: 4300,
    host: 'localhost',
    proxy: { '/api': apiUrl },
  },
  resolve: {
    // Use the shared lib's TypeScript sources directly (see libs/shared/package.json).
    conditions: ['@pm/source', ...defaultClientConditions],
  },
  plugins: [react(), nxReadySignal()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    // antd is a single large chunk by design; it is cached separately from app code.
    chunkSizeWarningLimit: 1500,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/](antd|@ant-design|rc-[\w-]+|@rc-component)[\\/]/.test(id)) return 'antd';
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react';
          return 'vendor';
        },
      },
    },
  },
}));
