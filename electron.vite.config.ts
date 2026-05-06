import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    entry: 'electron/main.ts',
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    entry: 'electron/preload.ts',
  },
  renderer: {
    plugins: [react(), tailwindcss()],
  },
})
