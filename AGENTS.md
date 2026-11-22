# LightSpeedUI (`lsui`) — AI Agent Guide (`AGENTS.md`)

> Auto-generated from component & theme ASTs via `pnpm sync:artifacts`. Do not hand-edit.

## Core Rules for Coding Agents

1. **Pure Astro & Semantic CSS Tokens Only**: Author components as single-file `.astro` templates styled inside `@layer lsui` using semantic CSS custom properties (`--color-*`, `--space-*`, `--radius-*`). Never introduce Tailwind utilities, CSS Modules, or hardcoded hex colors.
2. **Action vs. Navigation Split**: Use `<Button>` strictly for in-page actions (`<button>`) and `<LinkButton href="...">` strictly for URL navigation (`<a>`). Never place `role="button"` on an `<a>` element or pass `href` to `<Button>`.
3. **Ambient DOM Context Over Prop-Drilling**: Set `data-theme` (`"light"`, `"dark"`, `"nordic"`, `"editorial"`, or combined `"editorial dark"`), `data-surface` (`"canvas"`, `"card"`, `"muted"`, `"hero"`, `"inverse"`), `data-density` (`"compact"`, `"comfortable"`, `"spacious"`), and `data-layout` on container elements rather than prop-drilling theme state.
4. **Baseline 2026 Governance**: Consult `modern-web-guidance` before writing HTML/CSS/JS, and record any *Baseline Newly Available* feature, CSS fallback, or conditional polyfill in `BASELINE.md` (`pnpm check:baseline`).

## Installed Themes
- **`editorial`** (`@lsui/themes/editorial.css`): Fonts `"Iowan Old Style", "Charter", "Bitstream Charter", "Sitka Text", Georgia, serif`, medium radius `0.1875rem`.
- **`nordic`** (`@lsui/themes/nordic.css`): Fonts `"IBM Plex Sans", "Inter", system-ui, -apple-system, sans-serif`, medium radius `0.5rem`.

## Available Components
- **`<Button />`** (`@lsui/core/Button.astro`, hydration: `optional`): Triggers an in-page action, form submission, or declarative dialog/popover command. For URL navigation, use LinkButton instead.
- **`<LinkButton />`** (`@lsui/core/LinkButton.astro`, hydration: `optional`): Navigates to a URL using a semantic `<a>` element styled to match Button variants. Never overrides link semantics with `role="button"`.

See [`COMPONENTS.md`](./COMPONENTS.md) for full prop/slot signatures and [`TOKENS.md`](./TOKENS.md) for semantic token tables.
