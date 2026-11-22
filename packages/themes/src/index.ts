export const PACKAGE_NAME = "@lsui/themes";

export const THEME_NAMES = ["nordic", "editorial"] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export const CONTEXT_ATTRIBUTES = [
  "data-theme",
  "data-surface",
  "data-density",
  "data-contrast",
  "data-motion",
  "data-layout",
] as const;
export type ContextAttribute = (typeof CONTEXT_ATTRIBUTES)[number];

export type ThemeMode = "light" | "dark" | "auto";
export type SurfaceMode = "canvas" | "card" | "muted" | "inverse" | "hero";
export type DensityMode = "compact" | "comfortable" | "spacious";
export type ContrastMode = "normal" | "more";
export type MotionMode = "full" | "reduced" | "none";
export type LayoutMode = "container" | "prose" | "stack" | "grid" | "split";

export interface ThemeMetadata {
  id: ThemeName;
  label: string;
  summary: string;
  cssExport: `@lsui/themes/${ThemeName}.css`;
  designDocPath: `themes/${ThemeName}/DESIGN.md`;
  tokensDocPath: `themes/${ThemeName}/TOKENS.md`;
}

export const THEMES: Record<ThemeName, ThemeMetadata> = {
  nordic: {
    id: "nordic",
    label: "Nordic",
    summary: "Calm, spacious, technical design system with cool slate neutrals and arctic blue accents.",
    cssExport: "@lsui/themes/nordic.css",
    designDocPath: "themes/nordic/DESIGN.md",
    tokensDocPath: "themes/nordic/TOKENS.md",
  },
  editorial: {
    id: "editorial",
    label: "Editorial",
    summary: "Warm literary publishing palette with crisp serif display typography and terracotta accents.",
    cssExport: "@lsui/themes/editorial.css",
    designDocPath: "themes/editorial/DESIGN.md",
    tokensDocPath: "themes/editorial/TOKENS.md",
  },
};

export const REQUIRED_SEMANTIC_COLOR_TOKENS = [
  "--color-bg",
  "--color-text",
  "--color-text-muted",
  "--color-surface",
  "--color-surface-muted",
  "--color-surface-inverse",
  "--color-text-inverse",
  "--color-primary",
  "--color-primary-hover",
  "--color-on-primary",
  "--color-secondary",
  "--color-secondary-hover",
  "--color-on-secondary",
  "--color-accent",
  "--color-on-accent",
  "--color-border",
  "--color-border-strong",
  "--color-ring",
  "--color-info",
  "--color-info-surface",
  "--color-on-info-surface",
  "--color-success",
  "--color-success-surface",
  "--color-on-success-surface",
  "--color-warning",
  "--color-warning-surface",
  "--color-on-warning-surface",
  "--color-danger",
  "--color-danger-surface",
  "--color-on-danger-surface",
] as const;
