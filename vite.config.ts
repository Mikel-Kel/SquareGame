import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
import { fileURLToPath, URL } from "node:url";
import pkg from "./package.json";

// 👇 Date de build (YYYY-MM)
const buildDate = new Date();
const buildYearMonth = `${buildDate.getFullYear()}`;

export default defineConfig({
  // 👇 IMPORTANT pour GitHub Pages
  base: "/SquareGame/",

  plugins: [
    vue(),
    svgLoader({
      svgo: true,
      svgoConfig: {
        plugins: [
          {
            name: "removeAttrs",
            params: {
              attrs: "(fill|stroke|style)",
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // 👇 Version exposée à l'app
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(buildYearMonth),
  },
});