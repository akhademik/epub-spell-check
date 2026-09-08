import { svelte } from "@sveltejs/vite-plugin-svelte"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target:
          process.env.VITE_CLOUDFLARE_URL ||
          "https://epub-spell-check.pages.dev",
        changeOrigin: true,
        secure: true
      }
    }
  }
})
