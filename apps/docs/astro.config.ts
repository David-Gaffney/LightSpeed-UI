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
    items: [
      {
        label: "Overview",
        items: ["index", "levels"],
      },
      {
        label: "Origin (Level 1)",
        autogenerate: { collection: "origin" },
      },
      {
        label: "Liftoff (Level 2)",
        autogenerate: { collection: "liftoff" },
      },
      {
        label: "Landing (Level 3)",
        autogenerate: { collection: "landing" },
      },
      {
        label: "Apogee (Level 4)",
        autogenerate: { collection: "apogee" },
      },
    ],
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
