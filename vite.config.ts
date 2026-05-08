import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/server.ts',
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
