# Nordic Token Reference (`TOKENS.md`)

All components consume semantic tokens—never raw `--*-light` / `--*-dark` primitives or hardcoded hex/OKLCH literals.

## Semantic Color Tokens

| Token | Role | Light Value | Dark Value | Contrast Guarantee |
| :--- | :--- | :--- | :--- | :--- |
| `--color-bg` | Page canvas background | `oklch(0.988 0.005 248)` | `oklch(0.165 0.015 252)` | Base surface |
| `--color-text` | Primary body & heading ink | `oklch(0.205 0.018 252)` | `oklch(0.955 0.007 248)` | >= 12:1 on `--color-bg` |
| `--color-text-muted` | Secondary metadata & captions | `oklch(0.435 0.02 252)` | `oklch(0.765 0.014 248)` | >= 4.7:1 WCAG AA |
| `--color-surface` | Card & dialog surface | `oklch(1 0 0)` | `oklch(0.215 0.017 252)` | Paired with `--color-text` |
| `--color-surface-muted` | Sidebar, code bar & muted bands | `oklch(0.952 0.009 248)` | `oklch(0.255 0.018 252)` | Paired with `--color-text` |
| `--color-primary` | Primary interactive fill | `oklch(0.445 0.145 252)` | `oklch(0.765 0.125 245)` | Paired with `--color-on-primary` |
| `--color-on-primary` | Label/icon on `--color-primary` | `oklch(0.99 0 0)` | `oklch(0.16 0.022 252)` | >= 5.5:1 WCAG AA |
| `--color-secondary` | Secondary button/chip fill | `oklch(0.935 0.012 248)` | `oklch(0.285 0.02 252)` | Paired with `--color-on-secondary` |
| `--color-border` | Subtle structural divider | `oklch(0.875 0.012 250)` | `oklch(0.325 0.018 252)` | Decorative separation |
| `--color-border-strong` | Interactive input/button border | `oklch(0.555 0.02 250)` | `oklch(0.625 0.02 250)` | >= 3.1:1 WCAG 1.4.11 |
| `--color-ring` | `:focus-visible` outline | `oklch(0.445 0.145 252)` | `oklch(0.765 0.125 245)` | >= 3.5:1 WCAG 1.4.11 |

## Geometry, Typography & Shadow Tokens

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--font-body` | `"IBM Plex Sans", "Inter", system-ui, sans-serif` | Body copy & UI controls |
| `--font-heading` | `"IBM Plex Sans", "Inter", system-ui, sans-serif` | Section & article headings |
| `--font-mono` | `"IBM Plex Mono", "JetBrains Mono", ui-monospace` | Inline code & code blocks |
| `--radius-sm` / `--radius-md` / `--radius-lg` | `0.375rem` / `0.5rem` / `0.75rem` | Badges / Controls / Cards & Modals |
| `--shadow-sm` / `--shadow-md` / `--shadow-lg` | Cool slate diffused elevation | Subtle lift / Popovers / Modals |
| `--image-hero-backdrop` | `light-dark(<image>, <image>)` arctic radial glow (`image-set` / `@supports` fallback) | Applied automatically on `[data-surface="hero"]` |
| `--image-light` / `--image-dark` | Component-level URL tokens on `[data-lsui-themed-image]` | Zero-JS light/dark CSS background & mask images (`light-dark-image`) |
| `--cursor-interactive` | `default` (override to `pointer` if desired) | Tokenized cursor for `<Button>` (`<LinkButton>` keeps `pointer`) |
| `--target-min-size` | `1.5rem` (`24px`), `2.75rem` (`44px`) on `@media (pointer: coarse)` | Minimum hit target enforced on interactive controls |
