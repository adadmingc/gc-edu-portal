import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/index.tsx',  // dev: Hono app export default만 필요
    }),
  ],
  build: {
    ssr: 'src/server.ts',
    outDir: 'dist',
    rollupOptions: {
      external: ['better-sqlite3'],
    },
  },
})
