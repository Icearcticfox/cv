import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, 'site'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'site/index.html'),
        resume: resolve(__dirname, 'site/resume.html'),
      },
    },
  },
})
