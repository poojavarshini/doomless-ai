import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: mode === "content" ? {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: resolve(directory, "src/content.tsx"),
      formats: ["iife"],
      name: "DoomLessContent",
      fileName: () => "content.js",
    },
  } : {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: resolve(directory, "src/background.ts"),
        popup: resolve(directory, "popup.html"),
        options: resolve(directory, "options.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
}));
