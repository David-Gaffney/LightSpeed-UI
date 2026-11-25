# LightSpeedUI (`lsui`) — AI Agent Guide (`AGENTS.md`)

> Auto-generated from platform ASTs via `pnpm sync:artifacts`. Do not hand-edit.

## Four-Level Astro Platform Architecture

1. **Level 1 — `Origin` (`@lsui/origin`)**: Unstyled accessible `.astro` primitives + headless TypeScript behaviors (`announce()` via `Element.ariaNotify()`/`Document.ariaNotify()`, `mount()`, keyboard navigation, `aria-disabled` focus guards, `buttonAttrs()`). Zero visual CSS.
2. **Level 2 — `Liftoff` (`@lsui/liftoff` + `@lsui/themes`)**: Copy-paste themed `.astro` components layered strictly atop `Origin`, styled inside `@layer lsui` with semantic CSS tokens and ambient `data-*` contexts.
3. **Level 3 — `Landing` (`@lsui/landing`)**: Astro + EmDash CMS page blocks, composed sections, and full-page templates layered strictly atop `Liftoff` (`Origin <- Liftoff <- Landing`).
4. **Level 4 — `Apogee` (`@lsui/apogee`)**: Independent higher-order interactive experiences and site enhancements (Guided Website Tours, Kanban / Transfer Boards, Spotlight Centers).

## Mandatory Engineering & Workflow Rules

1. **Propose Plan Before Any Component / Block / Feature (NEVER SKIP)**: Before writing code for any new primitive (`Origin`), component (`Liftoff`), block/template (`Landing`), or experience (`Apogee`), present its concrete design plan first (HTML semantics, props, slots, keyboard/screen-reader behavior, `modern-web-guidance` checks, tokens/variants, and Baseline/polyfill impact) and **wait for user direction and approval**.
2. **Stop After Every Numbered Part**: Always stop at the end of each numbered Part in [`GUIDE.md`](./GUIDE.md) (authoritative 48-part checklist), mark its checkbox `[x]`, show verification results, and wait for user review before continuing. [`PLAN.md`](./PLAN.md) holds only high-level phase gates.
3. **Continuous `FINDINGS.md`, `BASELINE.md` & `GUIDE.md` Logging**:
   - Log every architectural decision, ecosystem bug, tool quirk, and fix in [`FINDINGS.md`](./FINDINGS.md).
   - Keep [`GUIDE.md`](./GUIDE.md) updated with verified, beginner-friendly step-by-step instructions and current checkbox status whenever a new Part is completed; [`PLAN.md`](./PLAN.md) tracks phase-level gates only.
   - Invoke the `modern-web-guidance` skill **first** for all HTML/CSS/JS tasks (and include the `### Modern Web Guidance` disclosure section when it shapes changes).
   - Record every *Baseline Newly Available* feature, CSS fallback, and conditional polyfill in [`BASELINE.md`](./BASELINE.md) (sorted oldest -> newest, verified via `pnpm check:baseline`).
4. **Pure Astro & Semantic CSS Tokens Only**: Never introduce Tailwind utilities, CSS Modules, or hardcoded hex colors in `@lsui/*`. Keep `--color-*` custom properties unregistered (for live `light-dark()` subtree inheritance), never set `font-size` on `:root`/`html` (for OS `<meta name="text-scale" content="scale">`), and always use `color-mix(in oklab, ...)` (never `in oklch`).
5. **Action vs. Navigation Split**: Use `Button` / `OriginButton` strictly for in-page actions and `LinkButton` / `OriginLink` strictly for URL navigation (never `role="button"` on `<a>`).

## Technical Stack & Verification Gotchas

- **TypeScript 7.1 + `.astro` Type-Checking**: Uses `typescript@7.1.0-beta` + `@astrojs/ts-content-mapper` (with `patches/@astrojs__ts-content-mapper@0.2.0.patch` skipping third-party `node_modules` `.astro` diagnostics). Run `pnpm typecheck` and `pnpm typecheck:apps`—never add `@astrojs/check` or TypeScript 5/6.
- **Artifact Sync & Nimbus Docs Lint Order**: After editing `.astro` or `.css` files, run `pnpm sync:artifacts`, then `pnpm --filter @lsui/docs run build` *before* `pnpm --filter @lsui/docs run lint:docs` (Nimbus resolves internal links against the built route manifest).
- **Astro 7 Agent Backgrounding**: Always keep `--ignore-lock` on `astro preview` in `playwright.config.ts` so Astro 7 does not auto-daemonize preview servers under agent env vars.
- **Read First**: See [`GUIDE.md`](./GUIDE.md) for current status and the authoritative part-by-part checklist, [`PLAN.md`](./PLAN.md) for high-level gates, [`ARCHITECTURE.md`](./ARCHITECTURE.md) for system design, [`ACCESSIBILITY.md`](./ACCESSIBILITY.md) for accessibility commitments & guardrails, [`FIGMA.md`](./FIGMA.md) for Figma Remote MCP sync rules, and [`FINDINGS.md`](./FINDINGS.md) (`F-001`..`F-039`+) for solved edge cases.

## Installed Themes
- **`editorial`** (`@lsui/themes/editorial.css`): Fonts `"Iowan Old Style", "Charter", "Bitstream Charter", "Sitka Text", Georgia, serif`, medium radius `0.1875rem`.
- **`nordic`** (`@lsui/themes/nordic.css`): Fonts `"IBM Plex Sans", "Inter", system-ui, -apple-system, sans-serif`, medium radius `0.5rem`.

## Components by Level

### Level 1: Origin (`@lsui/origin`)
- **`<OriginButton />`** (`@lsui/origin/Button.astro`, hydration: `optional`): Unstyled accessible action primitive providing safe `<button>` defaults (`type="button"`), optional non-anchor tag rendering (`as`), keyboard activation, focusable `aria-disabled`, and declarative Invoker/Popover triggers.
- **`<OriginLink />`** (`@lsui/origin/LinkButton.astro`, hydration: `optional`): Unstyled accessible navigation primitive rendering a genuine `<a>` element without ever overriding link semantics with `role="button"`.
- **`<OriginDialog />`** (`@lsui/origin/Dialog.astro`, hydration: `optional`): Unstyled native modal dialog primitive using Invoker Commands; the browser owns focus containment, inert page, Escape dismissal and focus restoration.
- **`<OriginInput />`** (`@lsui/origin/Input.astro`, hydration: `none`): Unstyled native text input with a bound label, persistent hint and native constraint attributes.
- **`<OriginPopover />`** (`@lsui/origin/Popover.astro`, hydration: `optional`): Unstyled native Popover API surface with declarative triggers, conditional polyfill loading and optional focus return to the trigger.
- **`<OriginSelect />`** (`@lsui/origin/Select.astro`, hydration: `none`): Unstyled native select with a bound label and optional persistent hint; no custom listbox role invention.
- **`<OriginTabs />`** (`@lsui/origin/Tabs.astro`, hydration: `optional`): Unstyled headless tabs using native focusgroup with a roving-focus fallback; tabs and panels are supplied via named slots.

### Level 2: Liftoff (`@lsui/liftoff`)
- **`<Button />`** (`@lsui/liftoff/Button.astro`, hydration: `optional`): Themed, copy-paste action button built atop OriginButton. Adds semantic token variants, sizes, hover/press/focus states, and WCAG 2.5.8 / 2.5.5 minimum target sizing. For URL navigation, use LinkButton instead.
- **`<LinkButton />`** (`@lsui/liftoff/LinkButton.astro`, hydration: `optional`): Themed navigation link built atop OriginLink. Applies Button visual variants and sizes to a genuine `<a>` element without ever overriding link semantics with `role="button"`.
- **`<Blocks />`** (`@lsui/liftoff/Blocks.astro`, hydration: `none`): Themed section wrapper for CMS block sequences.
- **`<Byline />`** (`@lsui/liftoff/Byline.astro`, hydration: `none`): Themed author/date metadata row.
- **`<Pagination />`** (`@lsui/liftoff/Pagination.astro`, hydration: `none`): Themed previous/next navigation with real links.
- **`<PortableText />`** (`@lsui/liftoff/PortableText.astro`, hydration: `none`): Themed container for normalized portable-text blocks supplied through the default slot.
- **`<PostCard />`** (`@lsui/liftoff/PostCard.astro`, hydration: `none`): Themed article teaser card with a real navigation link.
- **`<Prose />`** (`@lsui/liftoff/Prose.astro`, hydration: `none`): Themed long-form article container with semantic heading rhythm.
- **`<TableOfContents />`** (`@lsui/liftoff/TableOfContents.astro`, hydration: `none`): Themed table-of-contents navigation built from consumer-supplied anchor links.
- **`<Badge />`** (`@lsui/liftoff/Badge.astro`, hydration: `none`): Themed inline status badge styled entirely with semantic tokens.
- **`<Card />`** (`@lsui/liftoff/Card.astro`, hydration: `none`): Themed surface container styled entirely with semantic tokens.
- **`<Dialog />`** (`@lsui/liftoff/Dialog.astro`, hydration: `optional`): Themed native modal dialog built atop OriginDialog.
- **`<Input />`** (`@lsui/liftoff/Input.astro`, hydration: `none`): Themed text input built atop OriginInput with semantic token styling.
- **`<Popover />`** (`@lsui/liftoff/Popover.astro`, hydration: `optional`): Themed native popover built atop OriginPopover.
- **`<Select />`** (`@lsui/liftoff/Select.astro`, hydration: `none`): Themed native select built atop OriginSelect with semantic token styling.
- **`<Tabs />`** (`@lsui/liftoff/Tabs.astro`, hydration: `optional`): Themed headless tabs built atop OriginTabs using native focusgroup where supported.
- **`<Callout />`** (`@lsui/liftoff/Callout.astro`, hydration: `none`): Themed documentation callout with a semantic label and non-color type marker.
- **`<CodeGroup />`** (`@lsui/liftoff/CodeGroup.astro`, hydration: `optional`): Themed tabbed code group built atop OriginTabs.
- **`<DocsSidebar />`** (`@lsui/liftoff/DocsSidebar.astro`, hydration: `none`): Themed nested documentation navigation landmark.
- **`<PrevNext />`** (`@lsui/liftoff/PrevNext.astro`, hydration: `none`): Themed previous/next documentation links.

### Level 3: Landing (`@lsui/landing`)
- *(Planned — design proposal required before implementation)*

### Level 4: Apogee (`@lsui/apogee`)
- *(Planned — design proposal required before implementation)*

See [`COMPONENTS.md`](./COMPONENTS.md) for full prop/slot signatures and [`TOKENS.md`](./TOKENS.md) for semantic token tables.
