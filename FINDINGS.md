# LightSpeedUI (`lsui`) — Engineering Findings & Decisions Log

A running engineering log of architectural decisions, ecosystem tradeoffs, tool quirks, and solutions discovered while designing and building **LightSpeedUI**—written as a practical reference for anyone building an Astro-native design system or open-code UI platform.

---

## Architecture & Planning Findings

### F-001: Why Pure `shadcn` Copy-Paste Breaks Down for Interactive Astro UI
- **Problem**: `shadcn/ui` ports in Astro often copy both the `.astro` markup *and* raw client-side interaction JavaScript into user repos. When a focus-trap, Safari keyboard, or ARIA bug is later discovered, every consumer project is stuck with stale, patched-by-hand scripts.
- **Decision / Solution**: Use a **Hybrid Ownership Model**:
  - Copy `.astro` markup, slots, and scoped styles into the user's repo (`src/components/ui/`) via CLI so markup and styling remain 100% open and editable.
  - Keep headless interaction & accessibility state machines (`createPopover`, `createSelection`, `createRovingFocus`, `createDialog`, `createTabs`) in a versioned npm package (`@lsui/behaviors`), inspired by UI SDK and Bejamas UI's `@data-slot` split.

### F-002: Bridging the Gap Between `@astrojs/upgrade` and Astryx Codemods
- **Problem**:
  - We inspected `@astrojs/upgrade`'s source (`packages/upgrade` in `withastro/astro`) and found it is purely a dependency-bumping CLI—it does not run codemods or touch source files.
  - Conversely, Astryx's CLI runs AST codemods on consumer callsites, bit requires manually passing `OLD_VERSION` + manually pinning every package in `npm install`, and explicitly abandons components once ejected (`swizzled`).
  - Worse, in a hybrid UI system, updating `@lsui/behaviors` in `package.json` without updating copied `.astro` files could cause markup and behavior hooks to drift out of sync.
- **Decision / Solution**: Design a **3-stage `npx @lsui/upgrade` pipeline** backed by SHA-256 file hashes stored in `lsui.json`:
  1. **Stage 1**: Ephemeral CLI discovers and bumps all `@lsui/*` npm packages in lockstep (like `@astrojs/upgrade`, with `--dry-run` and breaking-change prompts).
  2. **Stage 2**: Compares local `.astro` files against `lsui.json` hashes—auto-updating untouched files while preserving user-customized files via 3-way merge/diff.
  3. **Stage 3**: Runs AST codemods on callsites and tokens, inserting inline `TODO` comments and generating a codebase-specific `.lsui/UPGRADE.md` checklist where transforms are ambiguous.

### F-003: One Shared AST Pipeline Instead of Separate Parsers
- **Problem**: Supporting Docs-in-Code, `AGENTS.md` generation, AI Skill/MCP metadata, deterministic Code-to-Figma sync, and upgrade codemods could easily devolve into five brittle regex scripts—and TypeScript-only AST tools (`ts-morph` / Babel) cannot parse `.astro` templates or `<style>` blocks.
- **Decision / Solution**: Build a single shared parser package (`@lsui/ast`) in Phase 1 combining **`@astrojs/compiler`** (for `.astro` frontmatter, markup, and `<slot />`s), **`ts-morph`** (for strict TypeScript `Props` unions), and **PostCSS** (for CSS tokens and `@layer` validation). Every downstream tool consumes this single Intermediate Representation (IR).

### F-004: Native Astro Scoped `<style>` + `@layer lsui` Over CSS Modules or Tailwind
- **Problem**: Evaluating how to author component CSS without framework lock-in:
  - **CSS Modules (`.module.css`)** split single-file components into two files, add `class={styles.foo}` noise, and hash class names in ways that fight external theming.
  - **Tailwind CSS** introduces utility lock-in and global Preflight reset expectations that non-Tailwind Astro users don't have.
- **Decision / Solution**: Use Astro's built-in scoped `<style>` blocks (which scope at build time with `:where()` zero-specificity attributes and zero runtime JS) wrapped inside `@layer lsui` and driven strictly by semantic CSS custom properties (`--color-*`, `--space-*`, `--radius-*`) plus ambient DOM `data-*` attributes (`data-theme`, `data-surface`, `data-density`).

### F-005: Plain HTML + `data-*` `mount()` Helper Over Light-DOM Custom Elements
- **Problem**: Interactive `.astro` components need a client-side bridge to attach `@lsui/behaviors` across initial page loads and Astro `<ClientRouter />` View Transitions. Wrapping components in `<lsui-tabs>` custom elements looked appealing at first glance.
- **Finding (via `modern-web-guidance`: `web-components`, `custom-elements`)**:
  - Custom element tags add an extra non-semantic wrapper node in the DOM (which has no ARIA role of its own and can break parent CSS Grid/Flexbox layouts unless carefully mitigated).
  - Browser HTML streaming can fire `connectedCallback` mid-parse *before* all child elements (such as tab panels or options) exist in the DOM.
- **Decision / Solution**: Render pure semantic HTML tagged with `data-lsui-*` attributes and initialize behaviors via an idempotent, View-Transition-safe `mount(selector, setupFn)` helper that runs after DOM readiness and executes returned cleanup callbacks on page swap.

### F-006: Keeping Figma in Sync Without Manual Drift (Early `Button` PoC)
- **Problem**: Manual Figma component libraries silently drift from code, while syncing on every commit creates churn and clobbers designer adjustments. Furthermore, waiting until Phase 5 to test Figma generation risks discovering too late that our `.astro` prop/slot conventions don't map cleanly to Figma.
- **Decision / Solution**:
  - Adopt Astryx's **Figma Librarian** guardrails via **Figma MCP**: release-gated on stable versions, mandatory version-history checkpoint before edits, Astro `<slot />` → native Figma Slots, and stage-only edits (human clicks Publish).
  - Run a **live 1-component Figma MCP proof-of-concept on `Button.astro` in Phase 1** so any AST/prop/token mapping friction is caught and fixed before building the rest of the catalog.

### F-007: Adopting Nimbus Docs (`@cloudflare/nimbus-docs`) Without Adopting Tailwind
- **Problem**: We wanted early auto-generated docs with native Astro `.astro` layout ownership, `/llms.txt`, `/<slug>/index.md` raw Markdown endpoints, and built-in docs linting—all of which Nimbus provides out of the box (unlike Starlight, whose layouts live inside `node_modules` and need plugins for `llms.txt`). However, Nimbus scaffolds its starter UI with **Tailwind CSS v4**, whose global reset could bleed into live LightSpeedUI previews and violate our zero-Tailwind goal.
- **Decision / Solution**: Two-step dogfooding strategy:
  1. **Phases 0–2**: Use Nimbus for `apps/docs` bit isolate `<ComponentPreview>` boxes from Tailwind's reset so LightSpeedUI components render in a pure CSS environment.
  2. **Phase 3**: Because Nimbus puts all visible layouts and components directly in `apps/docs/src/` while keeping routing/`llms.txt`/search helpers in `@cloudflare/nimbus-docs`, replace Nimbus's starter Tailwind UI files with LightSpeedUI's own pure-CSS `DocsSidebar`, `PrevNext`, `TableOfContents`, `Callout`, `CodeGroup`, and `Prose`—making the entire monorepo 100% Tailwind-free.

### F-008: Expiring Polyfill Ledger (`POLYFILL.md`) Ordered for Easy Removal
- **Problem**: Targeting modern **Web Platform Baseline 2026** APIs (Invoker Commands `commandfor`, Popover API, CSS Anchor Positioning, `@starting-style`) requires conditional polyfills for older browsers today, bit teams almost never remember to delete polyfills once features become *Baseline Widely Available*.
- **Decision / Solution**: Enforce a root `POLYFILL.md` file (verified by CI) sorted chronologically from **oldest *Baseline Newly Available* date at the top → newest at the bottom**, with direct `https://webstatus.dev/features/<id>` links and exact file paths where used. Features at the top of the table are always the next ones to graduate to *Widely Available* and be deleted.

### F-009: Unifying Standalone Astro and EmDash CMS Component Naming
- **Problem**: Astro's core has no standard component naming convention for publishing primitives (bylines, portable text, widget areas, marketing blocks), whereas **EmDash CMS** (built on Astro) already establishes `PortableText`, `Blocks`, `Byline`, `PostCard`, `Pagination`, `WidgetArea`, and block names (`Hero`, `Features`, `Pricing`, `CTA`, `FAQ`, `Split`, `Logos`, `Contact`)—along with gotchas like EmDash image fields being `{ id, src, alt }` objects rather than URL strings.
- **Decision / Solution**: Adopt EmDash's component/block names as the standard LightSpeedUI publishing vocabulary, and type component props to accept **both** plain Astro/`astro:content` data shapes and EmDash objects seamlessly.

---

## Implementation Findings (Phase-by-Phase)

### F-010 (Phase 0, Part 1): Changesets Fixed Lockstep Group vs. Private Internal Packages
- **Issue / Nuance**: `@changesets/cli` refuses to include `"private": true` packages inside a `"fixed"` version group, and `changeset status` requires at least one commit on `baseBranch: "main"` to compute package diffs.
- **Solution**:
  - Placed all 10 public packages (`@lsui/ast`, `@lsui/behaviors`, `@lsui/core`, `@lsui/blocks`, `@lsui/themes`, `@lsui/icons`, `@lsui/cli`, `@lsui/codemods`, `@lsui/mcp`, `@lsui/skill`) in a single `"fixed"` array in `.changeset/config.json`, and explicitly added internal-only packages (`@lsui/figma-sync`, and upcoming `apps/*` in Part 2) to `"ignore"`.
  - Verified with a synthetic patch changeset on `@lsui/behaviors` alone: `changeset status` confirmed all 10 public `@lsui/*` packages bump together in lockstep.

### F-011 (Phase 0, Part 1): Isolating Browser/Astro Types from Node Globals & Topological Builds
- **Issue / Nuance**: Installing `@types/node` at the monorepo root can accidentally expose Node globals (`process`, `Buffer`, Node `Timeout` return types) inside browser-side packages like `@lsui/behaviors` if TypeScript auto-discovers root `@types`.
- **Solution**:
  - Kept `tsconfig.base.json` restricted to `["ES2024", "DOM", "DOM.Iterable"]` and opted into `"types": ["node"]` **only** inside Node-targeted package `tsconfig.json` files (`ast`, `cli`, `codemods`, `mcp`, `figma-sync`). Browser/Astro packages (`behaviors`, `core`, `blocks`, `themes`, `icons`, `skill`) stay strictly browser/ESM-clean.
  - Wired `workspace:*` dependency edges up front so `pnpm -r --filter './packages/*' run build` automatically builds packages in three parallel topological waves without needing extra task-runner bloat in Phase 0.

### F-012 (Phase 0, Part 1): Upgrading to Node 26 LTS & TypeScript `7.0.2` (Native Go `tsc`) + Astro Peer Nuance
- **Issue**: Initial `package.json` used outdated version memory (`@types/node@^22.15.0`, `typescript@^5.9.3`) instead of querying live `npm` dist-tags. Querying `npm view` revealed `@types/node@26.6.6` (matching Node 26 LTS) and `typescript@7.0.2` (the native Go compiler, shipping `@typescript/typescript-darwin-arm64`, etc.).
- **Nuance Discovered**:
  - `typescript@7.0.2` removes the legacy JavaScript compiler API from its root export (`"."` only exports `./lib/version.cjs`, moving experimental AST APIs under `./unstable/ast` and `./unstable/sync`).
  - Meanwhile, `@astrojs/check@0.9.12` (published by Astro for `.astro` Volar typechecking) still declares `peerDependencies: { "typescript": "^5.0.0 || ^6.0.0" }` because its language server calls the JS TypeScript compiler API. (`ts-morph@28.0.0` bundles its own internal compiler inside `@ts-morph/common` and is unaffected.)
- **Solution**:
  - Upgraded the monorepo root and all 11 `@lsui/*` packages to **Node `>=26.0.0`**, **`@types/node@^26.6.6`**, and **`typescript@^7.0.2`** (`target: "ESNext"`), giving near-instant native Go `tsc` builds and typechecks.
  - Strictly exclude TypeScript `5.x` everywhere in our repo: any Astro app (`apps/playground`, `apps/docs`) that invokes `@astrojs/check` will pin **`typescript@^6.0.3`** locally in that app's `devDependencies` until `@astrojs/check` adds TS 7 support, and any peer range we author will start at `>=6.0.0` / `^7.0.2`.

### F-013 (Phase 0, Part 1): Pure ESM-Only (`"type": "module"`), Zero CommonJS
- **Decision**: Ship **100% ESM-only** across the entire monorepo—no CommonJS (`require` / `module.exports`) and no dual `.cjs` + `.mjs` build bloat.
- **Implementation Note (`.js` under `"type": "module"` vs `.mjs`)**: Every `package.json` declares `"type": "module"` with `"module": "ESNext"` in `tsconfig.base.json`. In Node, Astro, Vite, and browsers, `"type": "module"` makes standard `.js` / `.d.ts` outputs native ESM (identical to `.mjs` / `.d.mts`, without forcing `.mts` source extensions everywhere), and Node 26 LTS natively supports `require(esm)` anyway if a legacy tool ever loads a package synchronously.

### F-014 (Phase 0, Part 2): Replacing `astro check` + TS 5/6 with `typescript@7.1.0-beta` & `@astrojs/ts-content-mapper`
- **Problem**: `astro build` strips TypeScript without type-checking, while `@astrojs/check@0.9.12` relies on the legacy JavaScript TypeScript 5/6 compiler API.
- **Solution**: Upgraded root TypeScript to **`7.1.0-beta`** (which introduces `contentMappers` in native Go `tsc`) paired with **`@astrojs/ts-content-mapper@^0.2.0`**. Running `astro sync && tsc --noEmit --runExternalCode` checks both `.ts` and `.astro` files directly inside native `tsc` in ~18ms under `astro/tsconfigs/strictest`—eliminating `@astrojs/check` and TypeScript 5/6 from the entire monorepo. Verified with a negative prop test (`<BaseLayout title={123}>`), which immediately failed with `TS2322` at the exact `.astro` line/column.

### F-015 (Phase 0, Part 2): `skipLibCheck` Does Not Cover Third-Party `.astro` Source Files in `node_modules`
- **Issue**: When running `tsc --noEmit --runExternalCode` in `apps/docs`, our own files passed cleanly, bit `@cloudflare/nimbus-docs`'s internal `Icon.astro` and `NimbusHead.astro` inside `node_modules/.pnpm` failed with unused `@ts-expect-error` and virtual module errors. Because `.astro` packages ship source files rather than `.d.ts` files, TypeScript's `skipLibCheck: true` does not skip them (`withastro/astro#18471`).
- **Solution**: Created a minimal `pnpm patch` (`lsui/patches/@astrojs__ts-content-mapper@0.2.0.patch`) that prepends `// @ts-nocheck\n` (shifting source-map offsets by `NOCHECK.length`) **only** for third-party `node_modules` paths (`/[\\/]\.pnpm[\\/]|[\\/]node_modules[\\/](?!@lsui[\\/])/`). Exported `Props` types on third-party components still type-check at callsites, while 100% of `@lsui/*` and `apps/*` `.astro` files remain strictly checked.

### F-016 (Phase 0, Part 2): Nested `pnpm-workspace.yaml` Trap in `@cloudflare/create-nimbus-docs`
- **Issue**: Scaffolding Nimbus into `apps/docs` writes a nested `apps/docs/pnpm-workspace.yaml` containing `packages: []` (alongside `wasm32` architecture and `esbuild`/`sharp` build-script policies). Left in place, `pnpm` treats `apps/docs` as an independent workspace root and breaks `workspace:*` links to `@lsui/*`.
- **Solution**: Merged `supportedArchitectures`, `allowBuilds`, and `ignoredBuiltDependencies` into the root `lsui/pnpm-workspace.yaml` and deleted `apps/docs/pnpm-workspace.yaml`.

### F-017 (Phase 0, Part 2): Isolating `<ComponentPreview>` Inside Nimbus Without Shadow DOM or Iframes
- **Issue**: Rendering pure-CSS LightSpeedUI components inside Nimbus docs pages faces two CSS bleed sources:
  1. Tailwind v4's Preflight reset inside `@layer base` (`globals.css`).
  2. Nimbus's `prose.css` rules targeting classless tags (`.docs-content :where(details:not([class]))`, `ul:not([class])`, etc.)—which match Astro components because Astro scopes via `data-astro-cid-*` attributes rather than adding `class` attributes.
- **Solution** (via `modern-web-guidance` `css` guide):
  1. Declared `@layer theme, base, lsui, components, utilities;` at the top of `globals.css` and added `[data-lsui-preview] :where(*, *::before, *::after) { all: revert-layer; box-sizing: border-box; }` inside `@layer base`—reverting Tailwind Preflight back to browser defaults while allowing `@layer lsui` component styles above `@layer base` to apply normally.
  2. Wrapped `prose.css` in `@scope (.docs-content) to ([data-lsui-preview])` and replaced inner `.docs-content` prefixes with `:scope` (avoiding the `@scope` gotcha where `.docs-content` inside `@scope (.docs-content)` only matches a nested `.docs-content` descendant). Previews stay in regular Light DOM with `container-type: inline-size` so accessibility tools, View Transitions, and container queries work natively.

### F-018 (Phase 0, Part 3): Astro 7 `isRunByAgent()` Auto-Backgrounding Breaks Playwright `webServer` Without `--ignore-lock`
- **Issue**: Running `pnpm test:e2e` inside an AI coding agent environment failed immediately with `Error: Process from config.webServer exited early`. Inspecting `astro/dist/cli/preview/index.js` in `astro@7.4.13` revealed why: Astro 7 checks `isRunByAgent()` (detecting agent env vars like `OPENCODE_SESSION_ID` / `CLAUDECODE`) and **automatically forks `astro preview` into a detached background daemon**, exiting the foreground process with code `0`—which Playwright interprets as the server crashing!
- **Solution**: Astro 7 explicitly yields agent auto-backgrounding when `--ignore-lock` is passed (`withastro/astro#17903`). Using `astro preview --port 4322 --ignore-lock` inside `playwright.config.ts` keeps preview servers in the foreground under both human terminals and AI coding agents.

### F-019 (Phase 0, Part 3): Bidirectional `POLYFILL.md` Governance & Native Node 26 TypeScript Scripts
- **Design**: Wrote `lsui/scripts/check-polyfills.ts` in erasable TypeScript so Node 26 LTS executes it directly (`node scripts/check-polyfills.ts`) in ~20ms with zero `tsx` wrapper dependency, while Vitest imports the exact same `validatePolyfillLedger()` function for unit testing.
- **What It Catches**: Not only verifies that `POLYFILL.md` entries are sorted oldest → newest *Baseline Newly Available* date with valid `https://webstatus.dev/features/<id>` URLs and existing `Used In` files, bit also reverse-scans `packages/*/package.json` and `packages/*/src/**/*.{ts,js,mjs,astro}` to fail CI if someone adds or imports a `*polyfill*` package without registering it in `POLYFILL.md`.

### F-020 (Phase 1, Part 1): Live `light-dark()` Subtree Inheritance + Deterministic Figma Mode Pairs
- **Gotcha** (via `modern-web-guidance` `component-specific-light-dark-theme`): `light-dark()` resolves at computed-value time. If design tokens are `@property`-registered with `syntax: '<color>'`, `:root` resolves `light-dark()` once and passes down a single color—breaking nested `<section data-theme="dark">` callouts. In addition, inherited built-in `<color>` properties (`color`, `accent-color`, `caret-color`) must be re-specified on any element overriding `color-scheme`.
- **Solution**:
  - Kept all `--color-*` semantic tokens unregistered (`--color-primary: light-dark(var(--color-primary-light), var(--color-primary-dark))`) and re-declared `background-color`, `color`, `accent-color`, and `caret-color` on `[data-theme~="light" | "dark" | "auto"]`.
  - Storing explicit `--color-*-light` and `--color-*-dark` custom properties alongside `light-dark()` doubles as a clean AST hook: PostCSS in `@lsui/ast` can extract exact Light and Dark mode columns for Figma Variables without running a browser!

### F-021 (Phase 1, Part 1): Composable `[data-theme~="..."]` Tokens & Nesting-Safe Ambient Density
- **Problem**:
  1. Using exact `[data-theme="dark"]` and `[data-theme="editorial"]` selectors forces authors to write two nested wrapper tags (`<div data-theme="editorial"><section data-theme="dark">`) to combine a theme preset with a color-scheme override.
  2. Selector-based density overrides (`:where([data-density="compact"]) .btn`) break when density containers are nested (`spacious` → `compact`), because equal-specificity rules resolve by stylesheet order rather than DOM proximity.
- **Solution**:
  1. Used whitespace-token attribute matching (`[data-theme~="editorial"]` in `@layer lsui.tokens` and `[data-theme~="dark"]` in `@layer lsui.context`), enabling single-tag `<aside data-theme="editorial dark">` alongside standalone `data-theme="dark"` or `data-theme="editorial"`.
  2. Implemented `[data-density="compact" | "comfortable" | "spacious"]` by reassigning semantic spacing/sizing tokens (`--space-md`, `--control-height-md`, etc.) directly on the container—standard CSS inheritance guarantees the nearest DOM ancestor always wins.

### F-022 (Phase 1, Part 1): Avoiding Chromium `color-mix(in oklch)` Hue Shift & Preserving OS `text-scale`
- **Gotchas** (via `modern-web-guidance` `color` & `respect-os-text-scale`):
  1. Mixing neutrals/low-chroma colors with `color-mix(in oklch, ...)` triggers a Chromium powerless-hue bug (`565837690`) that tints greys pink (`0deg`).
  2. Setting `html { font-size: 16px }` blocks `<meta name="text-scale" content="scale">` from scaling `1rem` to the user's OS accessibility setting.
- **Solution**: Enforced `color-mix(in oklab, ...)` everywhere, kept `:root`/`html` `font-size` unset, capped fluid `clamp()` typography at `max <= 2.5 * min` using `rem + cqi`, and locked all three rules into `packages/themes/tests/themes.test.ts` so regressions fail unit tests automatically.

### F-023 (Phase 1, Part 1): Light/Dark CSS Images (`light-dark-image`) with Subtree-Aware `image-set()` Fallback
- **Feature**: CSS `light-dark()` for `<image>` values (<https://webstatus.dev/features/light-dark-image>, Baseline Newly Available `2026-09-14`) lets `background-image`, `mask-image`, and theme backdrops (`--image-hero-backdrop`) switch automatically with `color-scheme`.
- **Gotchas** (via `modern-web-guidance` `dark-mode`):
  1. For browsers without `light-dark()` image support, the zero-JS fallback uses `image-set(var(--image-light) var(--lsui-img-light), var(--image-dark) var(--lsui-img-dark))` where the inactive branch resolves to `type("image/do-not-use")` (so only the active image is downloaded).
  2. **Never set the active option to `type("")`**—browsers treat an empty MIME string as unsupported and drop *every* image! It must be empty whitespace (`--lsui-img-light: ;`).
  3. Unlike native `light-dark()`, custom-property `image-set()` switches do **not** automatically react to `color-scheme` overrides on a subtree—so `[data-theme~="light"]`, `[data-theme~="dark"]`, and `[data-theme~="auto"]` must also flip `--lsui-img-light` and `--lsui-img-dark`.
- **Solution**: Added `--image-hero-backdrop` + `[data-lsui-themed-image]` (`--image-light` / `--image-dark`) in `@lsui/themes`, flipped `--lsui-img-light`/`--lsui-img-dark` on every `[data-theme~=...]` context rule, and added a unit test banning `type("")` alongside a live Chromium E2E test verifying light vs. nested-dark image switching.

### F-024 (Phase 1, Part 2): Separating `<Button>` and `<LinkButton>` + Tokenized `--cursor-interactive`
- **Problem**: Polymorphic buttons that render `<a role="button">` (as warned against in Base UI's docs) destroy native link semantics (breaking screen-reader link lists, `Cmd+Click`, and right-click "Open in New Tab"), mix incompatible attributes (`disabled`, `type="submit"` vs. `href`), and complicate AST → Figma prop extraction. Meanwhile, teams often debate `cursor: default` (W3C/OS standard for buttons) vs. `cursor: pointer`.
- **Solution**:
  - Split **`Button.astro`** (always `<button>`, defaults to `type="button"`, `href?: never`) and **`LinkButton.astro`** (always `<a>`, never `role="button"`, omits `href` + sets `role="link" aria-disabled="true"` when `disabled`) sharing a single `@layer lsui.components` stylesheet (`button.css`).
  - Tokenized button cursor via `--cursor-interactive: default` while keeping `cursor: pointer` on `LinkButton`, giving users an immediate visual cue between actions and navigation while letting any project opt into hand cursors globally in 1 CSS line.

### F-025 (Phase 1, Part 2): Zero-JS Static Buttons + Conditional Polyfills for Declarative Triggers (`POLYFILL.md`)
- **Question Investigated**: Why was `POLYFILL.md` initially empty after adding `light-dark-image`, and which Baseline Newly Available features actually have JS polyfills?
- **Findings via Live `api.webstatus.dev/v1/features/*`**:
  - `light-dark()` for colors (`2024-05-13`) already graduated to **Baseline Widely Available** (`2026-11-13`), while `light-dark-image` (`2026-09-14`, Newly Available) has **no JS polyfill** (handled via our pure-CSS `image-set()` fallback, now also listed in a "CSS-Only Fallbacks" note in `POLYFILL.md`).
  - Conversely, `<Button>`'s declarative overlay attributes—**Popover (`popovertarget`, `2025-01-27`)** and **Invoker Commands (`commandfor`/`command`, `2025-12-12`)**—are *Baseline Newly Available* and have official polyfills (`@oddbird/popover-polyfill` and `invokers-polyfill`).
- **Solution**:
  - Leveraged Astro 7's conditional `<script>` rendering (`{hasInvoker && <script>...}`) so ordinary `<Button>`s emit **0 `<script>` tags and 0 bytes of JS**, while buttons using `commandfor` or `popovertarget` emit a tiny feature-check that dynamically imports `@oddbird/popover-polyfill` or `invokers-polyfill` **only** in browsers lacking native support.
  - Logged both in `POLYFILL.md` (`2025-01-27` → `2025-12-12`) and added `pnpm check:polyfills -- --online` querying `https://api.webstatus.dev/v1/features/<id>` to alert automatically when any polyfill graduates to *Widely Available*.

### F-026 (Phase 1, Part 2): Compile-Time Accessibility Guards Under `typescript@7.1.0-beta` + `strictest`
- **Design**: Used discriminated TypeScript unions and template literal types on `Button.astro` and `LinkButton.astro` (verified in 16ms via `@astrojs/ts-content-mapper`):
  1. `<Button iconOnly>` without `aria-label` fails `tsc` (`Property '"aria-label"' is missing`).
  2. Custom Invoker commands (`command="--my-action"`) are typed as `` BuiltInInvokerCommand | `--${string}` ``, catching unprefixed custom commands at compile time.
  3. Enforced `--target-min-size` (`24px` desktop WCAG 2.5.8, automatically `44px` under `@media (pointer: coarse)` WCAG 2.5.5) via `min-block-size` / `min-inline-size` so buttons never clip scaled text.

### F-027 (Phase 1, Part 2): Evolving `POLYFILL.md` into a 3-Section `BASELINE.md` Ledger
- **Insight**: Tracking only JavaScript npm polyfills misses two other categories of temporary Baseline debt: (1) *Newly Available* features used progressively without a polyfill (e.g., `@scope`, View Transitions), and (2) *CSS-only fallback blocks* (`::-webkit-scrollbar`, `image-set()` MIME switches) that can be deleted once their Baseline feature hits the 30-month *Widely Available* mark.
- **Solution**: Replaced `POLYFILL.md` with **`lsui/BASELINE.md`** and `lsui/scripts/check-baseline.ts` (`pnpm check:baseline` / `pnpm check:baseline -- --online`), enforcing three oldest → newest sections:
  1. **Baseline Newly Available Features Used** — grouped under ascending `Baseline 2024`, `Baseline 2025`, and `Baseline 2026` headings (verifying row dates match their year heading).
  2. **CSS-Only Fallbacks** — cross-checked against Section 1 so legacy CSS fallback blocks (like `@supports not (scrollbar-color: auto)` in `apps/docs/src/styles/globals.css` and `image-set()` in `@lsui/themes`) are retired in order.
  3. **Active Polyfills** — cross-checked against Section 1 and reverse-scanned across `packages/*` so no unlisted `*polyfill*` package or import can slip in.

### F-028 (Phase 1, Part 3): Using Astro 7's Native Rust `@astrojs/compiler-rs` Over Legacy WASM `@astrojs/compiler`
- **Discovery**: Inspecting Astro `7.4.13`'s dependency tree showed Astro 7 replaced the older Go WASM `@astrojs/compiler` with **`@astrojs/compiler-rs`** (`0.5.3`, backed by native N-API bindings `@astrojs/compiler-binding-darwin-arm64`). Its synchronous `parse(source)` returns an OXC ESTree-compatible JSON AST (`frontmatter`, `body` JSX elements, `comments`, and exact `start`/`end` byte offsets) in ~0.2ms with zero WASM cold start.
- **Solution**: Built `@lsui/ast` on `@astrojs/compiler-rs` (for `.astro` template `<slot>`s, root tags, `<script>`/`<style>` blocks, and frontmatter spans) + `ts-morph` (`28.0.0`, resolving discriminated `Props` unions and default destructuring values) + `postcss` (`8.5.33`, extracting theme tokens and rejecting hardcoded hex colors or `color-mix(in oklch)`).

### F-029 (Phase 1, Part 3): `rewriteRelativeImportExtensions: true` for Seamless Node 26 + `tsc` Execution
- **Issue**: Running `node scripts/sync-artifacts.ts` directly against unbuilt TypeScript source (`packages/ast/src/index.ts`) initially threw `ERR_MODULE_NOT_FOUND` on `./color.js` specifiers because Node 26's native TypeScript loader does not rewrite `.js` → `.ts`.
- **Solution**: Enabled `"allowImportingTsExtensions": true` + `"rewriteRelativeImportExtensions": true` in `tsconfig.base.json` and used `.ts` relative specifiers in `packages/ast/src/*`. Node 26 and Vitest execute `.ts` source directly with zero build step, while `tsc` automatically rewrites specifiers to `.js` in emitted `dist/` bundles.

### F-030 (Phase 1, Part 3): Preventing `:root` Token Collisions Inside Host Tailwind Docs Shells
- **Issue**: Nimbus's Tailwind v4 `@theme` block in `apps/docs/src/styles/globals.css` defines `--color-primary`, `--color-border`, and `--radius-lg` inside `@layer theme` on `:root`. Because `@layer lsui` sits above `@layer theme`, an unguarded `:where(:root)` selector in `nordic.css` would overwrite Nimbus's own docs chrome colors outside `[data-lsui-preview]`.
- **Solution**: Scoped root fallback selectors in `base.css`, `nordic.css`, and `editorial.css` to `:where(:root:not([data-mode])), [data-theme~="..."]`. Standalone Astro apps still receive default theme tokens on `:root`, Nimbus's `[data-mode]` docs shell stays untouched, and `<ComponentPreview>` applies `data-theme="nordic light"` / `"editorial dark"` cleanly on its preview container.

### F-031 (Phase 1, Part 3): `nimbus-docs lint` Link Checking Against Newly Generated MDX Routes
- **Nuance**: Running `nimbus-docs lint` immediately after `pnpm sync:artifacts` generated new `.mdx` files (`components/button.mdx`, `components/link-button.mdx`) initially flagged `/components/button/` as a broken internal link because Nimbus resolves link targets against the built route inventory from the previous `astro build`—and requires trailing slashes (`/components/button/`).
- **Solution**: Standardized generated internal doc links with trailing slashes and ran `astro build` before `nimbus-docs lint`, passing `✓ 6 file(s) lint clean` and auto-generating `/components/button/index.md`, `/components/llms.txt`, and OG cards.

### F-032 (Architecture Revision): Four-Level Platform Separation (`Origin` · `Liftoff` · `Landing` · `Apogee`) & Nimbus Section Tabs
- **Problem**: Treating behaviors, unstyled primitives, themed UI components, CMS page blocks, and complex add-on widgets (like Website Tours or Kanban boards) as one flat catalog blurs responsibilities—forcing users who only want unstyled accessible primitives to inherit theme opinions, or cluttering core UI with specialized interactive experiences.
- **Decision / Solution**: Separated LightSpeedUI into four explicit platform levels enforced by `@lsui/ast`:
  1. **Level 1 — `Origin` (`@lsui/origin`)**: Unstyled accessible `.astro` primitives (`OriginButton`, `OriginLink`), pure attribute builders (`buttonAttrs`, `linkAttrs`), keyboard/focus engines, `mount()`, and `announce()`. Zero visual CSS (`@lsui/ast` throws if any `Origin` primitive imports or embeds `<style>`).
  2. **Level 2 — `Liftoff` (`@lsui/liftoff` + `@lsui/themes`)**: Copy-paste themed `.astro` components (`Button`, `LinkButton`, etc.) layered strictly atop `@lsui/origin`.
  3. **Level 3 — `Landing` (`@lsui/landing`)**: Astro + EmDash CMS page blocks, composed sections, and templates layered strictly atop `@lsui/liftoff` (`Origin ← Liftoff ← Landing`).
  4. **Level 4 — `Apogee` (`@lsui/apogee`)**: Independent higher-order interactive experiences (Guided Website Tours, Kanban boards, Spotlight centers) that consume `@lsui/origin` behaviors without coupling to `Landing`.
  - Configured Nimbus `apps/docs` with 5 multi-collection Top Header Section Tabs (`Overview` · `Origin` · `Liftoff` · `Landing` · `Apogee`) via `sidebar: { scope: "section" }`, giving each level its own scoped sidebar and `/<level>/llms.txt` index.

### F-033 (Level 1 — `Origin`): Why `Element.ariaNotify()` / `Document.ariaNotify()` Beats Hidden `aria-live` Nodes for `announce()`
- **Investigation**: We inspected UI SDK's Kanban showcase (`https://ui-sdk-showcase-seven.vercel.app`) and `@ui-sdk/core`'s `announce()` implementation to see how drag/transfer screen-reader announcements work today:
  - UI SDK's Kanban composes `createTransfer` + `createRovingFocus` + `spatialMove` + `transferMessage` and calls `announce(text, { priority: "assertive" })` on pickup, move, and drop.
  - Under the hood, UI SDK still appends hidden `[data-ui-sdk-announcer]` `aria-live="polite" | "assertive"` `<div>`s to `document.body`—which requires a separate `prepareAnnouncements(doc)` pre-mount workaround (because screen readers often drop text injected in the same tick a live region mounts) **and** breaks when a modal `<dialog>` opens via `.showModal()`, because `document.body` children outside the modal become `inert` and are silenced!
- **Why `ariaNotify()` Is Better (`https://webstatus.dev/features/arianotify`, Baseline Newly Available `2026-09-14`)**:
  - Supported across Chrome 141+, Edge 141+, Firefox 150+, and Safari 27+.
  - Fires imperative screen-reader announcements (`priority: "normal" | "high"`) with **zero hidden DOM nodes**, **zero `prepareAnnouncements()` timing races**, and **full compatibility inside top-layer `<dialog>` / `[popover]` elements**.
  - Calling `target.ariaNotify(msg, { priority })` on the active interactive element (avoiding `<html>`/`<body>`, which browsers ignore in the a11y tree) automatically inherits the nearest ancestor `lang` attribute so screen readers pick the right voice/accent!
- **Recommended `Origin` Implementation (`packages/origin/src/announce.ts`)**:
  1. If `options.target` is a non-`html`/`body` element with `typeof target.ariaNotify === "function"`, call `target.ariaNotify(text, { priority })`.
  2. Else if `typeof doc.ariaNotify === "function"`, call `doc.ariaNotify(text, { priority })`.
  3. Else lazily create a visually-hidden `aria-live` region (`polite` / `assertive`) for pre-Baseline-2026 browsers—and track `2026-09-14` `ariaNotify()` in `BASELINE.md` so the fallback can be deleted once `arianotify` graduates to *Widely Available*.

### F-034 (Phase 1, Part 4 Prep): Figma Desktop MCP (Read-Only) vs. Remote Figma MCP (`use_figma` Write-to-Canvas)
- **Discovery**: Checking Figma's official MCP server documentation revealed that Figma's local Desktop MCP server (`http://127.0.0.1:3845/mcp`) is **read-only** (design-to-code & Code Connect only; no `use_figma`). Creating/editing variables, components, variants, and slots via `use_figma` requires Figma's **Remote MCP server (`https://mcp.figma.com/mcp`)** and edit access on the target Figma Design file (with a local Figma Desktop Development Plugin bridge available as an offline fallback if needed).

### F-035 (Nimbus Multi-Collection Sidebars): Why `getSidebar(slug, { collection })` Alone Showed `Overview` on Secondary Collections & How `SidebarTransform` Solves It
- **Bug**: Clicking `Origin`, `Liftoff`, `Landing`, or `Apogee` in the top navigation bar still rendered the `Overview` sidebar (`Introduction`, `Platform Levels`).
- **Root Cause (in `@cloudflare/nimbus-docs` `runtime.js` + `sidebar.ts`)**:
  1. `buildStructuralTree(pageCollection)` only swaps `effectivePrimary` for `docs-<v>` version collections (`versions.others`)—for non-version secondary collections (`origin`, `liftoff`, `landing`, `apogee`), `getSidebar()` always builds from `nimbusConfig.sidebar.items`. Because `astro.config.ts` only listed `items: ["index", "levels"]`, every collection received the `Overview` sidebar.
  2. Furthermore, Nimbus's built-in `scope: "section"` (`scopeToCurrentSection`) unwraps the outer group header (`scopeToGroup`) and falls back to the entire multi-collection tree on `"/"` (`currentSegment === undefined`).
- **Solution**:
  1. Registered all 5 top-level sections (`Overview`, `Origin (Level 1)`, `Liftoff (Level 2)`, `Landing (Level 3)`, `Apogee (Level 4)`) via `autogenerate: { collection: "<level>" }` in `apps/docs/astro.config.ts` so Nimbus's `getBreadcrumbs()`, `llms-full.txt`, and `nimbus-docs check` index the full multi-level tree.
  2. Updated `@lsui/ast`'s `buildDocsMdxByLevel()` to generate `index.mdx` (`Overview`), `core-goals.mdx` (`Core Goals of <Level>`), and `Catalog` items (plus `catalog.mdx` when a level's catalog is still upcoming), and added stale-MDX pruning in `scripts/sync-artifacts.ts`.
  3. Added `getLevelSidebar(currentSlug, collection)` in `apps/docs/src/lib/sidebar.ts` using Nimbus's `getSidebar(..., { transform })` hook to scope each tab's rail to its expanded `<Level> (Level N)` group → `Overview`, `Core Goals of <Level>`, and an expanded `Catalog` group containing that level's components.
- **Outcome / Locked Docs Layout**: After testing live navigation across all 5 top-header tabs, we found this exact layout (`Overview` tab + per-level `<Level> (Level N)` → `Overview`, `Core Goals of <Level>`, and `Catalog` → items) best for the LightSpeedUI documentation, and wired `TheFrontmatter.svg` (`251×251`, `#EE46DD`, >= 3.2:1 contrast on both light and dark surfaces, omitting duplicate `<clipPath id>` attributes) across the top navbar, mobile drawer, OG cards, and favicon.

### F-036 (Platform Boundary): Where Reduced Motion Lives Across `Origin`, `Liftoff`, and `Apogee`
- **Question**: Does `OriginButton` (`@lsui/origin/Button.astro`) need reduced-motion handling at the `Origin` level, or should reduced motion live in `Liftoff` and above?
- **Decision / Boundary**:
  1. **CSS Visual Reduced Motion Belongs in `Liftoff` (`@lsui/liftoff` + `@lsui/themes`) and Above**: `Origin` primitives (`OriginButton`, `OriginLink`) carry **zero visual CSS, zero transitions, and zero spatial animations** (enforced by `@lsui/ast` so consumers bringing bespoke CSS inherit no unwanted styles), and `OriginButton`'s JS helpers perform no animation or scrolling—so `OriginButton` itself needs no reduced-motion CSS. Visual motion starts in `Liftoff`, where `button.css` opts into spatial press feedback (`scale: 0.98`) strictly inside `@media (prefers-reduced-motion: no-preference)` (disabling it under `[data-motion="reduced" | "none"]` while preserving non-spatial color/background transitions) and `@lsui/themes/base.css` scales `--duration-*` tokens under `@media (prefers-reduced-motion: reduce)` and `[data-motion="reduced" | "none"]`.
  2. **JS Programmatic Motion Awareness Belongs in `Origin` (`@lsui/origin`) When Needed**: Whenever a headless JS behavior in `Origin` (Phase 2) or an interactive experience in `Apogee` (e.g., `<Tour />` step scrolling or roving-focus `scrollIntoView`) triggers programmatic scrolling, WAAPI `element.animate()`, or waits on transition completion (`element.getAnimations()`), `@lsui/origin` will check both OS `matchMedia("(prefers-reduced-motion: reduce)")` and nearest `[data-motion="reduced" | "none"]` so programmatic JS motion respects reduced-motion preferences even without `Liftoff` CSS.

### F-037 (Phase 1, Part 4 Setup): OpenCode Figma Remote MCP Setup, OAuth (No API Key) & `skills/` vs. `skills-figquery/`
- **Verified Support**: Figma's official MCP client matrix (`https://developers.figma.com/docs/figma-mcp-server/`) explicitly supports **OpenCode** for Desktop MCP, Remote MCP (`https://mcp.figma.com/mcp`), and **Write to canvas (`use_figma`)**.
- **`skills/` vs. `skills-figquery/` (`figma/mcp-server-guide`) — Critical Difference**:
  - **`skills/` (Use This)**: Standard Figma Plugin API skills (`figma-use`, `figma-generate-library`, `figma-generate-design`, `figma-code-connect`, `figma-create-new-file`, `figma-spec`, etc.) used by **OpenCode**, Claude Code, VS Code, and all standard MCP clients. `use_figma` runs standard Figma Plugin API JavaScript (`figma.createAutoLayout()`, `figma.variables.createVariableCollection()`, `figma.combineAsVariants()`, `node.query()`, etc.).
  - **`skills-figquery/` (Do NOT Use Outside Cursor)**: A Cursor-only skill tree (`.cursor-plugin/plugin.json`) targeting a proprietary `$fig` plan-builder runtime where `figma.create*` methods do not exist. Loading `skills-figquery/` in OpenCode would instruct the model to call `$fig.*` and fail at runtime.
- **OpenCode V2 Setup & Authentication Flow**:
  1. Register the remote server globally: `opencode mcp add figma --global --url https://mcp.figma.com/mcp`.
  2. Install `figma/mcp-server-guide`'s `skills/*` directories (keeping each skill's sibling `references/` folder intact) into `~/.config/opencode/skills/` (global) or `.opencode/skills/` (project).
  3. **No Figma API key / Personal Access Token is required**: Run `/mcps` inside OpenCode, select `figma`, and click **Allow access** in the browser OAuth prompt (requires Edit access on the target file; writing outside Drafts requires a Full seat on a Professional, Education, Organization, or Enterprise plan).
  4. Create an empty Figma Design file (`https://www.figma.com/design/...`) inside the target Figma project/folder (e.g., `LightSpeed-UI`) so `use_figma` has a concrete `fileKey` to write Variables and Component Sets into.

### F-038 (Phase 1, Part 4 Live PoC): AST ↔ Figma Refinements Discovered Syncing `Nordic`/`Editorial` Tokens & `Liftoff` `Button`
- **Live Execution Summary**: Connected to Figma Remote MCP (`fileKey: cKBop8W8EjLtVKFhSM3XHq`) and executed `@lsui/figma-sync`'s generated scripts (`packages/figma-sync/src/scripts.ts`), creating **128** hidden `Primitives` (`scopes = []`), **32** `Theme Colors` semantic variables (`VARIABLE_ALIAS` across all 4 modes: `Nordic Light`, `Nordic Dark`, `Editorial Light`, `Editorial Dark` + `WEB` `var(--...)` code syntax), **24** `Geometry & Spacing` variables (`Nordic` & `Editorial` modes), **3** shared `Button / sm|md|lg` Text Styles, **2** `16×16` vector dependency icons (`Icon / Plus`, `Icon / ArrowRight`), a **30-variant `Button` Component Set** (`5 variants × 3 sizes × 2 disabled states`), and a **4-mode Multi-Theme Showcase** verified via live canvas screenshot.
- **Four Real-World AST & Plugin API Refinements Locked into `@lsui/ast` & `@lsui/figma-sync`**:
  1. **`TEXT_SLOT` vs. `SLOT` Distinction (`packages/ast/src/parse-component.ts`)**: Mapping `<Button>`'s default `<slot />` to a raw Figma `SlotNode` (`createSlot()`) would leave buttons without editable Inspector text or bound foreground color/typography tokens. Inline interactive elements (`button`, `a`, `span`, `label`) now classify their `default` `<slot />` as `"TEXT_SLOT"` → generating a variable-bound `TextNode` wired to a `Label` (`TEXT`) component property and shared `Button / <size>` TextStyle, reserving `"SLOT"` (`createSlot()`) for layout containers (`Card`, `Dialog`, `Section`).
  2. **Deterministic Variable `scopes` & `codeSyntax` in `figma-spec.json` (`packages/ast/src/generators.ts`)**: Leaving Figma's default `ALL_SCOPES` pollutes every property picker. `buildFigmaSpec()` now emits exact `scopes` (`["FRAME_FILL", "SHAPE_FILL"]`, `["TEXT_FILL", "SHAPE_FILL"]`, `["STROKE_COLOR", "FRAME_FILL"]`, `["GAP"]`, `["WIDTH_HEIGHT"]`, `["CORNER_RADIUS"]`) and `codeSyntax: "var(--...)"` directly in `figma-spec.json`, while `Primitives` receive `scopes = []`.
  3. **Boolean Variant Axis (`disabled=false | true`)**: Encoding `disabled` as `"false"` / `"true"` in variant names (`variant=primary, size=md, disabled=false`, `5 × 3 × 2 = 30` variants—at Figma's recommended 30-variant cap) causes Figma to render a native Boolean toggle switch in the Properties panel while letting `disabled=true` variants apply `opacity = 0.55` matching `button.css`.
  4. **Auto-Layout `FIXED` Parent Before `FILL` Children**: Setting `card.layoutSizingHorizontal = "FILL"` inside a `VERTICAL` `showcase` frame whose counter-axis still hugs (`AUTO`) can clamp cards to the header width. Measuring the widest child first, resizing `showcase` with `counterAxisSizingMode = "FIXED"`, and *then* setting `card.layoutSizingHorizontal = "FILL"` prevents horizontal clipping across all 4 theme cards.

### F-039 (Community Health): GitHub-Recognized `ACCESSIBILITY.md` & `.github/ISSUE_TEMPLATE/accessibility.yml`
- **Context**: GitHub (Nov 2026) recognizes `ACCESSIBILITY.md` in the repository root as a first-class community health file surfaced directly on the repository overview page alongside a default `accessibility` issue label.
- **Implementation**: Added root [`ACCESSIBILITY.md`](./ACCESSIBILITY.md) and [`.github/ISSUE_TEMPLATE/accessibility.yml`](./.github/ISSUE_TEMPLATE/accessibility.yml) modeled on GitHub's maintainer guidance and the Open Source Accessibility Toolkit example—clearly distinguishing our WCAG 2.2 AA target from formal third-party conformance claims, documenting expectations for both human contributors and AI coding agents, making screenshots/recordings/severity optional with zero disability disclosure required, and transparently listing current manual screen-reader and Figma canvas limitations.
