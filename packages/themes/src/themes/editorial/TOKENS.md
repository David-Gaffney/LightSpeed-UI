# Editorial Token Reference (`TOKENS.md`)

All components consume semantic tokens—never raw `--*-light` / `--*-dark` primitives or hardcoded hex/OKLCH literals.

## Semantic Color Tokens

| Token | Role | Light Value | Dark Value | Contrast Guarantee |
| :--- | :--- | :--- | :--- | :--- |
| `--color-bg` | Warm archival paper canvas | `oklch(0.982 0.012 85)` | `oklch(0.17 0.012 65)` | Base surface |
| `--color-text` | Primary charcoal ink | `oklch(0.195 0.016 60)` | `oklch(0.955 0.012 82)` | >= 12:1 on `--color-bg` |
| `--color-text-muted` | Bylines, dates & captions | `oklch(0.43 0.02 62)` | `oklch(0.765 0.016 78)` | >= 4.7:1 WCAG AA |
| `--color-surface` | Card & callout paper surface | `oklch(0.995 0.006 85)` | `oklch(0.215 0.014 65)` | Paired with `--color-text` |
| `--color-surface-muted` | Sidebar & pull-quote surface | `oklch(0.945 0.016 82)` | `oklch(0.255 0.016 65)` | Paired with `--color-text` |
| `--color-primary` | Terracotta ink primary fill | `oklch(0.455 0.16 34)` | `oklch(0.775 0.135 42)` | Paired with `--color-on-primary` |
| `--color-on-primary` | Label/icon on `--color-primary` | `oklch(0.99 0.005 85)` | `oklch(0.165 0.022 36)` | >= 5.2:1 WCAG AA |
| `--color-secondary` | Warm stone secondary fill | `oklch(0.93 0.018 80)` | `oklch(0.285 0.018 65)` | Paired with `--color-on-secondary` |
| `--color-border` | Editorial hairline rule | `oklch(0.865 0.018 78)` | `oklch(0.33 0.016 65)` | Decorative separation |
| `--color-border-strong` | Interactive input/button border | `oklch(0.545 0.022 68)` | `oklch(0.63 0.02 72)` | >= 3.1:1 WCAG 1.4.11 |
| `--color-ring` | `:focus-visible` outline | `oklch(0.455 0.16 34)` | `oklch(0.775 0.135 42)` | >= 3.4:1 WCAG 1.4.11 |

## Geometry, Typography & Shadow Tokens

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--font-body` | `"Inter", "Source Sans 3", system-ui, sans-serif` | Body copy & UI controls |
| `--font-heading` | `"Iowan Old Style", "Charter", Georgia, serif` | Article & section display headings |
| `--font-mono` | `"JetBrains Mono", Menlo, Consolas, monospace` | Inline code & code blocks |
| `--radius-sm` / `--radius-md` / `--radius-lg` | `0.125rem` / `0.1875rem` / `0.25rem` | Tailored crisp corners |
| `--shadow-sm` / `--shadow-md` / `--shadow-lg` | Crisp tactile ink elevation | Hairline lift / Popovers / Modals |
| `--image-hero-backdrop` | `light-dark(<image>, <image>)` warm editorial wash (`image-set` / `@supports` fallback) | Applied automatically on `[data-surface="hero"]` |
| `--image-light` / `--image-dark` | Component-level URL tokens on `[data-lsui-themed-image]` | Zero-JS light/dark CSS background & mask images (`light-dark-image`) |
