# LightSpeedUI (`lsui`) — AI Agent Guide (`AGENTS.md`)

> Auto-generated from platform ASTs via `pnpm sync:artifacts`. Do not hand-edit.

## Four-Level Astro Platform Architecture

1. **Level 1 — `Origin` (`@lsui/origin`)**: Unstyled accessible `.astro` primitives + headless TypeScript behaviors (`announce()` via `Element.ariaNotify()`/`Document.ariaNotify()`, `mount()`, keyboard navigation, `aria-disabled` focus guards, `buttonAttrs()`). Zero visual CSS.
2. **Level 2 — `Liftoff` (`@lsui/liftoff` + `@lsui/themes`)**: Copy-paste themed `.astro` components layered strictly atop `Origin`, styled inside `@layer lsui` with semantic CSS tokens and ambient `data-*` contexts.
3. **Level 3 — `Landing` (`@lsui/landing`)**: Astro + EmDash CMS page blocks, composed sections, and full-page templates layered strictly atop `Liftoff` (`Origin <- Liftoff <- Landing`).
4. **Level 4 — `Apogee` (`@lsui/apogee`)**: Independent higher-order interactive experiences and site enhancements (Guided Website Tours, Kanban / Transfer Boards, Spotlight Centers).

## Mandatory Engineering & Workflow Rules

1. **Propose Plan Before Any Component / Block / Feature (NEVER SKIP)**: Before writing code for any new primitive (`Origin`), component (`Liftoff`), block/template (`Landing`), or experience (`Apogee`), present its concrete design plan first (HTML semantics, props, slots, keyboard/screen-reader behavior, `modern-web-guidance` checks, tokens/variants, and Baseline/polyfill impact) and **wait for user direction and approval**.
2. **Stop After Every Numbered Part**: Always stop at the end of each numbered Part in [`PLAN.md`](./PLAN.md), mark its checkbox `[x]`, show verification results, and wait for user review before continuing.
3. **Continuous `FINDINGS.md`, `BASELINE.md` & `GUIDE.md` Logging**:
   - Log every architectural decision, ecosystem bug, tool quirk, and fix in [`FINDINGS.md`](./FINDINGS.md).
   - Keep [`GUIDE.md`](./GUIDE.md) updated with verified, beginner-friendly step-by-step instructions whenever a new Part in [`PLAN.md`](./PLAN.md) is completed.
   - Invoke the `modern-web-guidance` skill **first** for all HTML/CSS/JS tasks (and include the `### Modern Web Guidance` disclosure section when it shapes changes).
   - Record every *Baseline Newly Available* feature, CSS fallback, and conditional polyfill in [`BASELINE.md`](./BASELINE.md) (sorted oldest -> newest, verified via `pnpm check:baseline`).
4. **Pure Astro & Semantic CSS Tokens Only**: Never introduce Tailwind utilities, CSS Modules, or hardcoded hex colors in `@lsui/*`. Keep `--color-*` custom properties unregistered (for live `light-dark()` subtree inheritance), never set `font-size` on `:root`/`html` (for OS `<meta name="text-scale" content="scale">`), and always use `color-mix(in oklab, ...)` (never `in oklch`).
5. **Action vs. Navigation Split**: Use `Button` / `OriginButton` strictly for in-page actions and `LinkButton` / `OriginLink` strictly for URL navigation (never `role="button"` on `<a>`).

## Technical Stack & Verification Gotchas

- **TypeScript 7.1 + `.astro` Type-Checking**: Uses `typescript@7.1.0-beta` + `@astrojs/ts-content-mapper` (with `patches/@astrojs__ts-content-mapper@0.2.0.patch` skipping third-party `node_modules` `.astro` diagnostics). Run `pnpm typecheck` and `pnpm typecheck:apps`—never add `@astrojs/check` or TypeScript 5/6.
- **Artifact Sync & Nimbus Docs Lint Order**: After editing `.astro` or `.css` files, run `pnpm sync:artifacts`, then `pnpm --filter @lsui/docs run build` *before* `pnpm --filter @lsui/docs run lint:docs` (Nimbus resolves internal links against the built route manifest).
- **Astro 7 Agent Backgrounding**: Always keep `--ignore-lock` on `astro preview` in `playwright.config.ts` so Astro 7 does not auto-daemonize preview servers under agent env vars.
- **Read First**: See [`PLAN.md`](./PLAN.md) for the Current Agent Handoff Snapshot, [`ARCHITECTURE.md`](./ARCHITECTURE.md) for system design, and [`FINDINGS.md`](./FINDINGS.md) (`F-001`..`F-034`+) for solved edge cases.

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
