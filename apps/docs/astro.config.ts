import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import nimbus, {
  defineConfig as defineNimbusConfig,
} from "@cloudflare/nimbus-docs";
import { tableScroll } from "@cloudflare/nimbus-docs/markdown";

const nimbusConfig = defineNimbusConfig({
  site: "https://lightspeedui.dev",
  title: "LightSpeedUI",
  description: "Four-level Astro-native UI platform built on Web Platform Baseline 2026.",
  locale: "en",
  github: "https://github.com/David-Gaffney/LightSpeed-UI",
  editPattern: "https://github.com/David-Gaffney/LightSpeed-UI/edit/main/apps/docs/{path}",
  socialImageAlt: "LightSpeedUI documentation preview",
  sidebar: {
    items: ["index", "levels"],
  },
});

export default defineConfig({
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    nimbus(nimbusConfig, {
      rules: {
        "nimbus/frontmatter-shape": "error",
        "nimbus/internal-link": "error",
      },
      markdown: {
        hastPlugins: [tableScroll()],
        features: { headingAttributes: true },
      },
    }),
  ],
});
