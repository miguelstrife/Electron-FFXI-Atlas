import { defineConfig } from 'vite';

export default defineConfig({
  root: './src', // Your renderer source folder
  build: {
    outDir: '../dist', // Output to project/dist
    emptyOutDir: true,
  },
});