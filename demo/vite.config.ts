import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";
import solidSvg from "@jghiloni/vite-plugin-solid2-svg";

export default defineConfig({
  // Turnkey client mode: no index.html and no mount file — the plugin generates
  // the entries around src/App.tsx (wrapped in src/Document.tsx) and `vite build`
  // prerenders the shell into a purely static dist/client.
  plugins: [
    // `extensions` makes @solidjs/vite-plugin also compile the `?pick=` route
    // modules the fileRoutes plugin emits (their ids end in a query string).
    solid({ start: true, extensions: [".jsx", ".tsx"], diagnostics: false }),
    solidSvg(),
  ],
  server: {
    port: 3000,
  },

  build: {
    target: "esnext",
    assetsInlineLimit: 0,
  },
});
