# LightSpeedUI (`lsui`) — AI Agent Guide (`AGENTS.md`)

> Auto-generated from platform ASTs via `pnpm sync:artifacts`. Do not hand-edit.

## Four-Level Astro Platform Architecture

1. **Level 1 — `Origin` (`@lsui/origin`)**: Unstyled accessible `.astro` primitives + headless TypeScript behaviors (`announce()` via `Element.ariaNotify()`/`Document.ariaNotify()`, `mount()`, keyboard navigation, `aria-disabled` focus guards, `buttonAttrs()`). Zero visual CSS.
2. **Level 2 — `Liftoff` (`@lsui/liftoff` + `@lsui/themes`)**: Copy-paste themed `.astro` components layered strictly atop `Origin`, styled inside `@layer lsui` with semantic CSS tokens and ambient `data-*` contexts.
3. **Level 3 — `Landing` (`@lsui/landing`)**: Astro + EmDash CMS page blocks, composed sections, and full-page templates layered strictly atop `Liftoff` (`Origin <- Liftoff <- Landing`).
4. **Level 4 — `Apogee` (`@lsui/apogee`)**: Independent higher-order interactive experiences and site enhancements (Guided Website Tours, Kanban / Transfer Boards, Spotlight Centers).

## Mandatory Engineering Rules

- **Pre-Implementation Design Gate**: Before implementing any new primitive, component, block, template, or Apogee feature, present its concrete plan first and wait for direction/approval.
- **Pure Astro & Semantic CSS Tokens Only**: Never introduce Tailwind utilities, CSS Modules, or hardcoded hex colors in `@lsui/*`.
- **Action vs. Navigation Split**: Use `Button` / `OriginButton` strictly for in-page actions and `LinkButton` / `OriginLink` strictly for URL navigation (never `role="button"` on `<a>`).
- **Baseline 2026 Governance**: Consult `modern-web-guidance` first and record any *Baseline Newly Available* feature, CSS fallback, or conditional polyfill in `BASELINE.md` (`pnpm check:baseline`).

## Installed Themes
- **`editorial`** (`@lsui/themes/editorial.css`): Fonts `"Iowan Old Style", "Charter", "Bitstream Charter", "Sitka Text", Georgia, serif`, medium radius `0.1875rem`.
- **`nordic`** (`@lsui/themes/nordic.css`): Fonts `"IBM Plex Sans", "Inter", system-ui, -apple-system, sans-serif`, medium radius `0.5rem`.

## Components by Level

### Level 1: Origin (`@lsui/origin`)
- **`<OriginButton />`** (`@lsui/origin/Button.astro`, hydration: `optional`): Unstyled accessible action primitive providing safe `<button>` defaults (`type="button"`), optional non-anchor tag rendering (`as`), keyboard activation, focusable `aria-disabled`, and declarative Invoker/Popover triggers.
- **`<OriginLink />`** (`@lsui/origin/LinkButton.astro`, hydration: `optional`): Unstyled accessible navigation primitive rendering a genuine `<a>` element without ever overriding link semantics with `role="button"`.

### Level 2: Liftoff (`@lsui/liftoff`)
- **`<Button />`** (`@lsui/liftoff/Button.astro`, hydration: `optional`): Themed, copy-paste action button built atop OriginButton. Adds semantic token variants, sizes, hover/press/focus states, and WCAG 2.5.8 / 2.5.5 minimum target sizing. For URL navigation, use LinkButton instead.
- **`<LinkButton />`** (`@lsui/liftoff/LinkButton.astro`, hydration: `optional`): Themed navigation link built atop OriginLink. Applies Button visual variants and sizes to a genuine `<a>` element without ever overriding link semantics with `role="button"`.

### Level 3: Landing (`@lsui/landing`)
- *(Planned — design proposal required before implementation)*

### Level 4: Apogee (`@lsui/apogee`)
- *(Planned — design proposal required before implementation)*

See [`COMPONENTS.md`](./COMPONENTS.md) for full prop/slot signatures and [`TOKENS.md`](./TOKENS.md) for semantic token tables.
