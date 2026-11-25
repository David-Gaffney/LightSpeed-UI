# How to Build LightSpeedUI (`lsui`) From Scratch (`GUIDE.md`)

A crystal-clear, step-by-step tutorial for recreating **LightSpeedUI (`lsui`)**—a four-level, Astro-native UI platform built on modern HTML, CSS, TypeScript, and **Web Platform Baseline 2026**.

If you know the basics of **HTML, CSS, JavaScript, TypeScript, Astro, and Node.js**, you can follow this guide from an empty folder and understand *every single piece* of how a modern open-code UI platform, token system, AST compiler pipeline, documentation site, and accessibility test suite fit together.

> **Living Guide Note:** This file is the **source of truth for what has been done and what is still ongoing** (13 Phases / 48 bite-sized Parts). Phases **1–8 (30 Parts)** are complete and contain verified, battle-tested instructions. Phases **9–13 (18 Parts)** are planned checklists, expanded into full hands-on tutorials with verified commands and code as each Part is implemented. [`PLAN.md`](./PLAN.md) remains the high-level roadmap and review-gate reference; if phase status or numbering disagrees, **this file wins**.

---

## Status & Source of Truth

**Current status:** Phases 1–10 complete (38/48 Parts). Parts 11.1–13.4 planned (10/48 Parts). **Next milestone:** Phase 11, Part 1 — build Level 3 `Landing` marketing & editorial blocks (high-level `PLAN.md` Phase 4). **Mandatory gate first:** for each new block/template, present the concrete design plan (landmarks, heading hierarchy, token usage, `Liftoff` composition, `modern-web-guidance` checks, Baseline impact) and wait for user approval before writing code.

| This guide (detailed, authoritative) | `PLAN.md` (high-level gates) | Status | Parts |
| :--- | :--- | :--- | :--- |
| Phases 1–3 | Phase 0 — repo/tooling bootstrap | Complete | 11 |
| Phases 4–8 | Phase 1 — four-level foundation, tokens, Button, AST, Figma PoC | Complete | 19 |
| Phase 9 | Phase 2 — Origin behavior & primitives | Planned | 4 |
| Phase 10 | Phase 3 — Liftoff catalog & docs dogfooding | Planned | 4 |
| Phase 11 | Phase 4, Part 1 — Landing blocks/template | Planned | 3 |
| Phase 12 | Phase 4, Part 2 — Apogee flagships | Planned | 3 |
| Phase 13 | Phase 5 — CLI, upgrades, skill, MCP, Figma Librarian | Planned | 4 |

**Full verification command** (run from `./lsui` at the end of each numbered Part):

```sh
pnpm sync:artifacts && pnpm check:artifacts && pnpm build && pnpm typecheck && pnpm typecheck:apps && pnpm --filter @lsui/docs run build && pnpm --filter @lsui/docs run lint:docs && pnpm check:baseline && pnpm test && pnpm test:e2e
```

> Keep `pnpm --filter @lsui/docs run build` before `lint:docs` — Nimbus validates internal links against the built route manifest.

---

## Review Gates & Non-Negotiable Invariants

Migrated here from `PLAN.md` so this guide carries the rules alongside the steps:

1. **Design plan before any component / block / feature** — present semantics, props, slots, keyboard/screen-reader behavior, `modern-web-guidance` checks, tokens/variants, and Baseline/polyfill impact; wait for user direction and approval.
2. **Stop after every numbered Part** — tick its checkbox here, show verification output, log decisions in `FINDINGS.md`, and wait for review before continuing.
3. **Code is the single source of truth** — `.astro` JSDoc + strict `Props` and semantic CSS tokens generate docs, registry manifests, AI context, upgrade data, and Figma specs (never maintain those by hand).
4. **Strict level layering** — `Origin ← Liftoff ← Landing` one-way only; `Apogee` stays independent and consumes `Origin` behaviors without coupling to `Landing`.
5. **Baseline 2026 governance** — consult `modern-web-guidance` first for HTML/CSS/JS work and **update `BASELINE.md` in the same Part** that introduces any Newly Available feature, CSS fallback, or polyfill (Sections 1–3, oldest → newest), then verify with `pnpm check:baseline`.
6. **Pure Astro + semantic tokens** — no Tailwind utilities, CSS Modules, or hardcoded hex in `@lsui/*`; never register `--color-*` via `@property`, never set `font-size` on `:root`/`html`, and always use `color-mix(in oklab, ...)`.
7. **Action vs. navigation split** — `Button`/`OriginButton` for in-page actions, `LinkButton`/`OriginLink` for URLs; never `role="button"` on an `<a>`.

For system design, file layout, and rationale, see [`ARCHITECTURE.md`](./ARCHITECTURE.md); for solved edge cases see [`FINDINGS.md`](./FINDINGS.md).

---

## Table of Contents

- [Status & Source of Truth](#status--source-of-truth)
- [Review Gates & Non-Negotiable Invariants](#review-gates--non-negotiable-invariants)

- [Before You Start: What You Are Building & Why](#before-you-start-what-you-are-building--why)
- [Prerequisites](#prerequisites)
- [**Phase 1: Monorepo, Node 26 ESM & Native TypeScript 7.1 Setup**](#phase-1-monorepo-node-26-esm--native-typescript-71-setup)
  - [Part 1.1: Create the Workspace Folder, `pnpm-workspace.yaml` & Root `package.json`](#part-11-create-the-workspace-folder-pnpm-workspaceyaml--root-packagejson)
  - [Part 1.2: Configure Browser-Safe Base TypeScript & Node Script TypeScript](#part-12-configure-browser-safe-base-typescript--node-script-typescript)
  - [Part 1.3: Create the 12 Package Skeletons Across the 4 Platform Levels](#part-13-create-the-12-package-skeletons-across-the-4-platform-levels)
  - [Part 1.4: Configure Lockstep Package Versioning with Changesets](#part-14-configure-lockstep-package-versioning-with-changesets)
- [**Phase 2: Apps Scaffolding, `.astro` Type-Checking & Preview CSS Isolation**](#phase-2-apps-scaffolding-astro-type-checking--preview-css-isolation)
  - [Part 2.1: Build `apps/playground` — Your Clean Astro Test App](#part-21-build-appsplayground--your-clean-astro-test-app)
  - [Part 2.2: Enable Native TypeScript 7.1 `.astro` Type-Checking (`@astrojs/ts-content-mapper`)](#part-22-enable-native-typescript-71-astro-type-checking-astrojsts-content-mapper)
  - [Part 2.3: Scaffold `apps/docs` with Nimbus Docs & Unify the Workspace](#part-23-scaffold-appsdocs-with-nimbus-docs--unify-the-workspace)
  - [Part 2.4: Isolate Live `<ComponentPreview>` Demos Using CSS `@layer` & `@scope`](#part-24-isolate-live-componentpreview-demos-using-css-layer--scope)
- [**Phase 3: Automated Testing & Web Platform Baseline 2026 Governance**](#phase-3-automated-testing--web-platform-baseline-2026-governance)
  - [Part 3.1: Set Up Fast Unit Testing with Vitest](#part-31-set-up-fast-unit-testing-with-vitest)
  - [Part 3.2: Set Up Browser & WCAG 2.2 AA Accessibility Tests with Playwright + `axe-core`](#part-32-set-up-browser--wcag-22-aa-accessibility-tests-with-playwright--axe-core)
  - [Part 3.3: Create the 3-Section `BASELINE.md` Ledger & `check-baseline.ts` Script](#part-33-create-the-3-section-baselinemd-ledger--check-baselinets-script)
- [**Phase 4: Semantic CSS Tokens, Themes & Ambient DOM Contexts (`@lsui/themes`)**](#phase-4-semantic-css-tokens-themes--ambient-dom-contexts-lsuithemes)
  - [Part 4.1: Set Up `@layer lsui` Cascade Order, Modern Reset & OS `text-scale` Support](#part-41-set-up-layer-lsui-cascade-order-modern-reset--os-text-scale-support)
  - [Part 4.2: Implement Live `light-dark()` Color & `<image>` Tokens with `image-set()` Fallbacks](#part-42-implement-live-light-dark-color--image-tokens-with-image-set-fallbacks)
  - [Part 4.3: Build the 6 Ambient `data-*` Contexts (Zero Prop-Drilling)](#part-43-build-the-6-ambient-data--contexts-zero-prop-drilling)
  - [Part 4.4: Create the `Nordic` & `Editorial` Themes + Token Unit Tests](#part-44-create-the-nordic--editorial-themes--token-unit-tests)
- [**Phase 5: Level 1 — `Origin` Unstyled Primitives & Headless Behaviors (`@lsui/origin`)**](#phase-5-level-1--origin-unstyled-primitives--headless-behaviors-lsuiorigin)
  - [Part 5.1: Build `mount()` (View-Transition-Safe Mounter) & Conditional Baseline Polyfills](#part-51-build-mount-view-transition-safe-mounter--conditional-baseline-polyfills)
  - [Part 5.2: Build `announce()` Using Baseline 2026 `ariaNotify()` + Lazy `aria-live` Fallback](#part-52-build-announce-using-baseline-2026-arianotify--lazy-aria-live-fallback)
  - [Part 5.3: Build Focusable `aria-disabled` Guards & Pure Attribute Helpers (`buttonAttrs`, `linkAttrs`)](#part-53-build-focusable-aria-disabled-guards--pure-attribute-helpers-buttonattrs-linkattrs)
  - [Part 5.4: Build Unstyled `OriginButton` & `OriginLink` `.astro` Primitives + Unit Tests](#part-54-build-unstyled-originbutton--originlink-astro-primitives--unit-tests)
- [**Phase 6: Level 2 — `Liftoff` First Styled Component Slice (`@lsui/liftoff`)**](#phase-6-level-2--liftoff-first-styled-component-slice-lsuiliftoff)
  - [Part 6.1: Write Shared Token Styles (`button.css`) with Hit-Target Floors & Reduced Motion](#part-61-write-shared-token-styles-buttoncss-with-hit-target-floors--reduced-motion)
  - [Part 6.2: Layer `<Button>` & `<LinkButton>` Strictly Atop `Origin`](#part-62-layer-button--linkbutton-strictly-atop-origin)
  - [Part 6.3: Wire Up Playground Demos & End-to-End Accessibility Tests](#part-63-wire-up-playground-demos--end-to-end-accessibility-tests)
- [**Phase 7: AST Single-Source-of-Truth Pipeline (`@lsui/ast`) & 5-Tab Nimbus Docs**](#phase-7-ast-single-source-of-truth-pipeline-lsuiast--5-tab-nimbus-docs)
  - [Part 7.1: Parse CSS Tokens & Convert OKLCH Colors to sRGB/Hex (`postcss` + `color.ts`)](#part-71-parse-css-tokens--convert-oklch-colors-to-srgbhex-postcss--colorts)
  - [Part 7.2: Parse `.astro` Templates & TypeScript `Props` Unions (`@astrojs/compiler-rs` + `ts-morph`)](#part-72-parse-astro-templates--typescript-props-unions-astrojscompiler-rs--ts-morph)
  - [Part 7.3: Generate Registry JSON, `AGENTS.md`/`COMPONENTS.md`/`TOKENS.md` & `figma-spec.json`](#part-73-generate-registry-json-agentsmdcomponentsmdtokensmd--figma-specjson)
  - [Part 7.4: Configure 5 Top-Navbar Section Tabs, Brand Logo & Per-Level Sidebars in Nimbus Docs](#part-74-configure-5-top-navbar-section-tabs-brand-logo--per-level-sidebars-in-nimbus-docs)
  - [Part 7.5: Run `pnpm sync:artifacts` & Full End-to-End Verification](#part-75-run-pnpm-syncartifacts--full-end-to-end-verification)
- [**Phase 8: Live 1-Component Code-to-Figma Sync PoC (`@lsui/figma-sync`)**](#phase-8-live-1-component-code-to-figma-sync-poc-lsuifigma-sync)
  - [Part 8.1: Connect Figma Remote MCP (`https://mcp.figma.com/mcp`) & Install `skills/`](#part-81-connect-figma-remote-mcp-httpsmcpfigmacommcp--install-skills)
  - [Part 8.2: Sync `Primitives`, 4-Mode `Theme Colors` & 2-Mode `Geometry & Spacing` Variables](#part-82-sync-primitives-4-mode-theme-colors--2-mode-geometry--spacing-variables)
  - [Part 8.3: Build the 30-Variant `Liftoff` `Button` Component Set & 4-Mode Theme Showcase](#part-83-build-the-30-variant-liftoff-button-component-set--4-mode-theme-showcase)
- [**Upcoming Phases (9–13): Living Roadmap**](#upcoming-phases-913-living-roadmap)

---

## Before You Start: What You Are Building & Why

Most component libraries mix everything—keyboard behavior, HTML tags, color palettes, page layouts, and complex widgets—into one big folder. That creates friction when a team wants accessible primitives with their own CSS, or wants to switch themes without rewriting markup.

**LightSpeedUI (`lsui`)** solves this with **two big ideas**:

### 1. Four Clean Platform Levels
Levels 1–3 follow a **strict one-way dependency rule (`Origin ← Liftoff ← Landing`)**, where lower levels never import from higher levels, while Level 4 (`Apogee`) sits alongside as an independent add-on tier:

```text
Level 3: Landing (@lsui/landing)  ──▶  Page sections, EmDash CMS blocks & full templates
   │  imports
   ▼
Level 2: Liftoff (@lsui/liftoff)  ──▶  Themed copy-paste .astro components + @lsui/themes CSS tokens
   │  imports
   ▼
Level 1: Origin  (@lsui/origin)   ──▶  Unstyled accessible .astro primitives + keyboard/focus + ariaNotify()


Level 4: Apogee  (@lsui/apogee)   ──▶  Independent rich experiences (Website Tours, Kanban, Spotlight)
```

### 2. Code as the Single Source of Truth
Instead of writing documentation tables, registry JSON files, AI guides, and Figma specs by hand (which quickly fall out of date), you write **structured JSDoc comments + strict TypeScript `Props` inside `.astro` files** and **semantic CSS variables inside `.css` files**. A small AST compiler (`@lsui/ast`) reads your code and generates everything else automatically!

---

## Prerequisites

Make sure the following are installed on your machine:

1. **Node.js `>= 26.0.0` (LTS)**: Node 26 runs TypeScript `.ts` scripts natively (`node scripts/my-script.ts`) without needing extra runners like `tsx`.
   ```bash
   node --version   # v26.x.x
   ```
2. **pnpm `>= 12.x`**: Used to link multiple packages together inside one monorepo (`workspace:*`).
   ```bash
   pnpm --version   # 12.x.x
   ```
3. **Git** and a code editor (VS Code, Zed, Cursor, OpenCode, etc.).

> **Optional AI Tip:** If you use an AI coding assistant alongside your editor, install the `modern-web-guidance` skill so you (or your agent) can query current **Web Platform Baseline 2026** HTML/CSS/DOM best practices before writing UI code instead of relying on outdated Stack Overflow snippets.

---

## Phase 1: Monorepo, Node 26 ESM & Native TypeScript 7.1 Setup

- [x] **Phase status:** Complete — 4/4 Parts

In Phase 1, you will create the monorepo folder structure, configure pure ECMAScript Modules (`"type": "module"`), set up TypeScript 7.1 (the ultra-fast native Go `tsc` compiler), and wire all workspace packages together.

### Part 1.1: Create the Workspace Folder, `pnpm-workspace.yaml` & Root `package.json`

- [x] **Status:** Complete — pnpm exec tsc --version → 7.1.0-beta

1. Create your project folder and initialize Git:
   ```bash
   mkdir lsui && cd lsui
   git init -b main
   ```
2. Create **`.gitignore`** so build outputs and dependencies stay out of Git:
   ```gitignore
   node_modules/
   dist/
   .astro/
   test-results/
   playwright-report/
   *.tsbuildinfo
   .DS_Store
   ```
3. Create **`pnpm-workspace.yaml`** to tell `pnpm` where your apps and packages live:
   ```yaml
   packages:
     - "apps/*"
     - "packages/*"

   supportedArchitectures:
     cpu:
       - current
       - wasm32
   allowBuilds:
     esbuild: false
     sharp: false
   ignoredBuiltDependencies:
     - esbuild
     - sharp
   ```
4. Create the root **`package.json`**. Notice `"type": "module"` (pure ESM—no legacy CommonJS `require()`) and `"typescript": "7.1.0-beta"`:
   ```json
   {
     "name": "lsui-monorepo",
     "version": "0.0.1",
     "private": true,
     "description": "LightSpeedUI (lsui) — Astro-native UI platform",
     "type": "module",
     "packageManager": "pnpm@12.20.0",
     "engines": {
       "node": ">=26.0.0"
     },
     "scripts": {
       "build": "pnpm -r --filter './packages/*' run build",
       "build:apps": "pnpm -r --filter './apps/*' run build",
       "typecheck": "tsc -p tsconfig.json --noEmit && pnpm -r --filter './packages/*' run typecheck",
       "typecheck:apps": "pnpm -r --filter './apps/*' run typecheck",
       "test": "vitest run",
       "test:e2e": "playwright test",
       "sync:artifacts": "node scripts/sync-artifacts.ts",
       "check:artifacts": "node scripts/sync-artifacts.ts --check",
       "check:baseline": "node scripts/check-baseline.ts",
       "changeset": "changeset",
       "changeset:status": "changeset status",
       "version-packages": "changeset version"
     },
     "devDependencies": {
       "@astrojs/ts-content-mapper": "^0.2.0",
       "@axe-core/playwright": "^4.14.0",
       "@changesets/cli": "^2.31.1",
       "@playwright/test": "^1.65.1",
       "@types/node": "^26.6.6",
       "typescript": "7.1.0-beta",
       "vitest": "^5.1.1"
     }
   }
   ```
5. Run `pnpm install` to install the root dev tools.

**Verify Before Moving On:** Run `pnpm exec tsc --version` — it should print `Version 7.1.0-beta`.

---

### Part 1.2: Configure Browser-Safe Base TypeScript & Node Script TypeScript

- [x] **Status:** Complete — tsc -p tsconfig.json --noEmit → 0 errors

**Why two `tsconfig` files?** If `@types/node` is active everywhere by default, browser code can accidentally use Node-only globals like `process` or `Buffer` and crash in the browser! Keeping `tsconfig.base.json` restricted to browser/ES globals prevents that bug completely.

1. Create **`tsconfig.base.json`** (shared by all packages):
   ```json
   {
     "$schema": "https://json.schemastore.org/tsconfig",
     "compilerOptions": {
       "target": "ESNext",
       "lib": ["ESNext", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "moduleResolution": "Bundler",
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "exactOptionalPropertyTypes": true,
       "noImplicitOverride": true,
       "verbatimModuleSyntax": true,
       "allowImportingTsExtensions": true,
       "rewriteRelativeImportExtensions": true,
       "isolatedModules": true,
       "skipLibCheck": true,
       "declaration": true,
       "declarationMap": true,
       "sourceMap": true
     }
   }
   ```
   > **Why `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`?** Node 26 runs `.ts` files directly when imports end in `.ts` (e.g., `import { foo } from "./foo.ts"`), while `tsc` automatically rewrites `.ts` to `.js` inside compiled `dist/` files!
2. Create root **`tsconfig.json`** (for Node-side scripts and tests at the repo root, where `"types": ["node"]` *is* wanted):
   ```json
   {
     "extends": "./tsconfig.base.json",
     "compilerOptions": {
       "noEmit": true,
       "allowImportingTsExtensions": true,
       "types": ["node"]
     },
     "include": [
       "scripts/**/*.ts",
       "tests/**/*.ts",
       "vitest.config.ts",
       "playwright.config.ts"
     ]
   }
   ```

**Verify Before Moving On:** Run `pnpm exec tsc -p tsconfig.json --noEmit` (it may say no inputs found yet until we add `vitest.config.ts`—no syntax errors should appear).

---

### Part 1.3: Create the 12 Package Skeletons Across the 4 Platform Levels

- [x] **Status:** Complete — pnpm build → 12 packages, 0 errors

Create the folders under `packages/` for the 4 platform levels plus supporting tooling packages:

```bash
mkdir -p packages/{origin,liftoff,landing,apogee,themes,icons,ast,cli,codemods,mcp,skill,figma-sync}/src
```

For each package, create:
- **`packages/<name>/package.json`** with `"name": "@lsui/<name>"`, `"version": "0.0.1"`, `"type": "module"`, `"exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } }`, and `"scripts": { "build": "tsc -p tsconfig.json", "typecheck": "tsc -p tsconfig.json --noEmit" }` (mark `"private": true` **only** on `@lsui/figma-sync`, since it is an internal release runner).
- **`packages/<name>/tsconfig.json`** extending `../../tsconfig.base.json` with `"rootDir": "src"` and `"outDir": "dist"` (add `"types": ["node"]` **only** in Node-targeted packages: `ast`, `cli`, `codemods`, `mcp`, `figma-sync`).
- **`packages/<name>/src/index.ts`** exporting `export const PACKAGE_NAME = "@lsui/<name>";`.

Wire the one-way workspace dependencies right away:
- `packages/liftoff/package.json` → `"dependencies": { "@lsui/origin": "workspace:*", "@lsui/themes": "workspace:*" }`
- `packages/landing/package.json` → `"dependencies": { "@lsui/liftoff": "workspace:*" }`
- `packages/apogee/package.json` → `"dependencies": { "@lsui/origin": "workspace:*" }`

Run `pnpm install` and `pnpm build`.

**Verify Before Moving On:** `pnpm build` compiles all 12 packages in topological order (`origin` & `themes` before `liftoff`, `liftoff` before `landing`) with 0 errors.

---

### Part 1.4: Configure Lockstep Package Versioning with Changesets

- [x] **Status:** Complete — pnpm changeset:status → lockstep group resolved

Because `Liftoff` components rely on `Origin` behaviors and `Themes` tokens, mismatched versions cause subtle bugs. Configure Changesets so every public `@lsui/*` package always releases with the **exact same version number** (lockstep versioning).

1. Create **`.changeset/config.json`**:
   ```json
   {
     "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
     "changelog": "@changesets/cli/changelog",
     "commit": false,
     "fixed": [
       [
         "@lsui/origin",
         "@lsui/liftoff",
         "@lsui/landing",
         "@lsui/apogee",
         "@lsui/ast",
         "@lsui/themes",
         "@lsui/icons",
         "@lsui/cli",
         "@lsui/codemods",
         "@lsui/mcp",
         "@lsui/skill"
       ]
     ],
     "linked": [],
     "access": "public",
     "baseBranch": "main",
     "updateInternalDependencies": "patch",
     "ignore": ["@lsui/figma-sync", "@lsui/docs", "@lsui/playground"]
   }
   ```
   > **Gotcha:** Changesets refuses to put `"private": true` packages inside `"fixed"`, which is why `@lsui/figma-sync` and the `apps/*` projects go in `"ignore"`.

**Verify Before Moving On:** Commit your initial setup (`git add . && git commit -m "chore: bootstrap monorepo"`) and run `pnpm changeset:status`.

---

## Phase 2: Apps Scaffolding, `.astro` Type-Checking & Preview CSS Isolation

- [x] **Phase status:** Complete — 4/4 Parts

In Phase 2, you will create two Astro apps inside `apps/`:
1. **`apps/playground`** (port `4322`) — a minimal, zero-Tailwind Astro app that simulates a real user installing your components.
2. **`apps/docs`** (port `4321`) — your documentation site powered by `@cloudflare/nimbus-docs` (which gives you `/llms.txt`, `/<slug>/index.md`, Pagefind search, and social OG cards out of the box).

### Part 2.1: Build `apps/playground` — Your Clean Astro Test App

- [x] **Status:** Complete — pnpm --filter @lsui/playground run build → clean dist/index.html

1. Create `apps/playground/package.json`:
   ```json
   {
     "name": "@lsui/playground",
     "version": "0.0.1",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "astro dev --port 4322",
       "build": "astro build",
       "preview": "astro preview --port 4322",
       "typecheck": "astro sync && tsc --noEmit --runExternalCode"
     },
     "dependencies": {
       "@lsui/apogee": "workspace:*",
       "@lsui/icons": "workspace:*",
       "@lsui/landing": "workspace:*",
       "@lsui/liftoff": "workspace:*",
       "@lsui/origin": "workspace:*",
       "@lsui/themes": "workspace:*",
       "astro": "^7.4.13"
     }
   }
   ```
2. Create `apps/playground/astro.config.mjs` (`import { defineConfig } from "astro/config"; export default defineConfig({});`), a minimal `src/layouts/BaseLayout.astro`, and `src/pages/index.astro`.

**Verify Before Moving On:** Run `pnpm install && pnpm --filter @lsui/playground run build` — Astro should build `apps/playground/dist/index.html` cleanly.

---

### Part 2.2: Enable Native TypeScript 7.1 `.astro` Type-Checking (`@astrojs/ts-content-mapper`)

- [x] **Status:** Complete — TS2322 repro on wrong prop, then passed after revert

**Why not `astro check`?** Legacy `@astrojs/check` requires TypeScript 5/6's JavaScript compiler API, whereas TypeScript 7.1's native Go compiler supports `contentMappers` via `@astrojs/ts-content-mapper`—type-checking `.astro` files in **~18ms**!

1. Create **`apps/playground/tsconfig.json`** (you will use this exact same `contentMappers` block in `apps/docs/tsconfig.json`, `packages/origin/tsconfig.check.json`, and `packages/liftoff/tsconfig.check.json`):
   ```json
   {
     "extends": "astro/tsconfigs/strictest",
     "compilerOptions": {
       "target": "ESNext",
       "lib": ["ESNext", "DOM", "DOM.Iterable"],
       "allowImportingTsExtensions": true,
       "rewriteRelativeImportExtensions": true,
       "noEmit": true
     },
     "contentMappers": [
       {
         "package": "@astrojs/ts-content-mapper",
         "extensions": [".astro"]
       }
     ],
     "include": [".astro/types.d.ts", "src/**/*"]
   }
   ```
2. **Important Gotcha & Fix (`skipLibCheck` and `node_modules` `.astro` files):** Because third-party Astro packages (like Nimbus Docs) ship raw `.astro` source files instead of `.d.ts` files, TypeScript's `skipLibCheck: true` does not skip their internal script errors (`withastro/astro#18471`).
   Patch `@astrojs/ts-content-mapper` with `pnpm patch @astrojs/ts-content-mapper@0.2.0` so `dist/transform.js` prepends `// @ts-nocheck\n` (and shifts source-map offsets by `15` characters) **only** when `fileName` matches third-party `node_modules` (`/[\\/]\.pnpm[\\/]|[\\/]node_modules[\\/](?!@lsui[\\/])/`). Your own `@lsui/*` and `apps/*` `.astro` files stay 100% strictly checked!

**Verify Before Moving On:** Temporarily pass a wrong prop type (like `<BaseLayout title={123}>`) in `apps/playground/src/pages/index.astro` and run `pnpm --filter @lsui/playground run typecheck`. `tsc` should immediately fail with `TS2322` at that exact `.astro` line, then pass when reverted!

---

### Part 2.3: Scaffold `apps/docs` with Nimbus Docs & Unify the Workspace

- [x] **Status:** Complete — pnpm --filter @lsui/docs run build + pnpm typecheck:apps passed

1. Scaffold Nimbus into `apps/docs`:
   ```bash
   pnpm dlx @cloudflare/create-nimbus-docs@latest apps/docs
   ```
2. **Critical Trap:** `create-nimbus-docs` creates a nested `apps/docs/pnpm-workspace.yaml` with `packages: []`. Delete `apps/docs/pnpm-workspace.yaml` immediately so `pnpm` treats `apps/docs` as part of your root monorepo!
3. Add `"@lsui/origin": "workspace:*"`, `"@lsui/liftoff": "workspace:*"`, `"@lsui/landing": "workspace:*"`, `"@lsui/apogee": "workspace:*"`, `"@lsui/themes": "workspace:*"`, and `"@lsui/icons": "workspace:*"` to `apps/docs/package.json`, add `"typecheck": "astro sync && tsc --noEmit --runExternalCode"`, and add the `contentMappers` block from Part 2.2 to `apps/docs/tsconfig.json`.

**Verify Before Moving On:** Run `pnpm install && pnpm --filter @lsui/docs run build && pnpm typecheck:apps`.

---

### Part 2.4: Isolate Live `<ComponentPreview>` Demos Using CSS `@layer` & `@scope`

- [x] **Status:** Complete — DevTools: native button border/padding intact in preview

**The Problem:** Nimbus's starter UI uses Tailwind v4 (which resets borders, padding, and typography inside `@layer base`) and `prose.css` (which styles `ul:not([class])`, `button`, etc. inside `.docs-content`). Without isolation, those styles leak into your pure-CSS LightSpeedUI previews!

**The Pure-CSS Solution (No Iframes or Shadow DOM Needed):**

1. At line 1 of **`apps/docs/src/styles/globals.css`**, declare the cascade layer order so `lsui` sits above Tailwind's `base` reset, and revert `@layer base` inside `[data-lsui-preview]`:
   ```css
   @layer theme, base, lsui, components, utilities;
   @import "tailwindcss";

   /* Inside @layer base in globals.css: */
   @layer base {
     [data-lsui-preview] :where(*, *::before, *::after) {
       all: revert-layer;
       box-sizing: border-box;
     }
   }
   ```
2. Wrap **`apps/docs/src/styles/prose.css`** in a CSS `@scope` donut boundary so Markdown prose styles stop right at `[data-lsui-preview]`:
   ```css
   @scope (.docs-content) to ([data-lsui-preview]) {
     :scope {
       font-size: 1rem;
       line-height: 1.75rem;
       color: var(--nb-foreground);
     }
     /* Replace inner .docs-content selectors with :scope */
   }
   ```
   > **Gotcha:** Inside `@scope (.docs-content)`, always write `:scope` instead of repeating `.docs-content`—repeating `.docs-content` would only match a *nested* `.docs-content` inside `.docs-content`!
   >
   > **BASELINE.md:** `@scope` is Baseline 2026 Newly Available (`2026-03-24`). Add it to Section 1 **in this Part** with `apps/docs/src/styles/prose.css` as `Used In`, then run `pnpm check:baseline`.
3. Create **`apps/docs/src/components/ComponentPreview.astro`** rendering `<div class="lsui-preview-stage" data-lsui-preview data-theme={theme} data-surface={surface} data-density={density}><slot /></div>` with `container-type: inline-size` (so container queries work inside previews!), and register `ComponentPreview` in `apps/docs/src/components.ts`.

**Verify Before Moving On:** Place `<ComponentPreview><button type="button">Test</button></ComponentPreview>` in `apps/docs/src/content/docs/index.mdx` and verify in DevTools that the native browser border and padding are intact (not stripped to `0px` by Tailwind Preflight).

---

## Phase 3: Automated Testing & Web Platform Baseline 2026 Governance

- [x] **Phase status:** Complete — 3/3 Parts

### Part 3.1: Set Up Fast Unit Testing with Vitest

- [x] **Status:** Complete — pnpm test (Vitest) passed

Create **`vitest.config.ts`** at the monorepo root:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tests/**/*.test.ts",
      "packages/*/src/**/*.test.ts",
      "packages/*/tests/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
  },
});
```

**Verify Before Moving On:** Add a simple sanity test in `tests/` and run `pnpm test`.

---

### Part 3.2: Set Up Browser & WCAG 2.2 AA Accessibility Tests with Playwright + `axe-core`

- [x] **Status:** Complete — pnpm test:e2e (Playwright + axe-core) passed

1. Install Chromium for Playwright:
   ```bash
   pnpm exec playwright install chromium
   ```
2. Create **`playwright.config.ts`** spinning up both `playground` (`4322`) and `docs` (`4321`):
   ```ts
   import { defineConfig, devices } from "@playwright/test";

   export default defineConfig({
     testDir: "./tests/e2e",
     fullyParallel: true,
     projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
     webServer: [
       {
         command:
           "pnpm --filter @lsui/playground run build && pnpm --filter @lsui/playground exec astro preview --port 4322 --ignore-lock",
         url: "http://localhost:4322",
         reuseExistingServer: !process.env.CI,
       },
       {
         command:
           "pnpm --filter @lsui/docs run build && pnpm --filter @lsui/docs exec astro preview --port 4321 --ignore-lock",
         url: "http://localhost:4321",
         reuseExistingServer: !process.env.CI,
       },
     ],
   });
   ```
   > **Astro 7 Gotcha (`--ignore-lock`):** When Astro 7 detects an AI coding agent environment variable, `astro preview` automatically forks into the background and exits code `0`, causing Playwright to think the server crashed! Passing `--ignore-lock` keeps `astro preview` in the foreground everywhere.

**Verify Before Moving On:** Create `tests/e2e/playground.spec.ts` using `@axe-core/playwright` (`new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()`) and run `pnpm test:e2e`.

---

### Part 3.3: Create the 3-Section `BASELINE.md` Ledger & `check-baseline.ts` Script

- [x] **Status:** Complete — pnpm check:baseline and --online passed; reverse scan covers root + packages/* + apps/*

Modern web features (*Baseline Newly Available*) graduate to *Baseline Widely Available* **30 months** after cross-browser release. Without a tracker, teams leave polyfills and CSS fallbacks in their codebase forever!

1. Create **`BASELINE.md`** at the repo root with 3 tables, each sorted **oldest → newest** from top to bottom (so items at the top are always the next ones ready to delete):
   - **Section 1: Baseline Newly Available Features Used** (grouped under `### Baseline 2024`, `### Baseline 2025`, `### Baseline 2026`).
   - **Section 2: CSS-Only Fallbacks** (e.g., `::-webkit-scrollbar`, `image-set()`).
   - **Section 3: Active Polyfills** (conditional JS polyfills).
2. Create **`scripts/check-baseline.ts`** to validate:
   - Dates are strictly ascending (`YYYY-MM-DD`) and match their `Baseline YYYY` heading.
   - Every `https://webstatus.dev/features/<id>` URL is valid and every `Used In` file path exists.
   - **Reverse scan:** Scans the root `package.json` plus `packages/*` and `apps/*` (both `package.json` dependencies and `src/**/*` `import` / `require` / `export` specifiers) and fails CI if anyone installs or loads a polyfill without listing its file and mechanism in `BASELINE.md`. Detect any name containing `polyfill` plus a small explicit shim list (`whatwg-fetch`, `core-js`, `@webcomponents/custom-elements`, `intersection-observer`); a genuinely opaque vendor name still has to be registered in the ledger by hand.
   - **`--online` flag:** Fetches `https://api.webstatus.dev/v1/features/<id>` to alert you when a feature graduates to `widely` available!
3. Create **`.github/workflows/verify.yml`** so the full verification command actually runs on every `pull_request` and push to `main`: check out the repo, install pnpm from `packageManager`, set up Node 26 with the pnpm cache, `pnpm install --frozen-lockfile`, install Playwright Chromium, then run all ten commands from the verification block above in order. In GitHub repo settings, make the **Full verification** job a required check on `main`—the workflow reports status; branch protection is what blocks a red build from merging.

**Rule for every later Part:** whenever a Part adopts a *Baseline Newly Available* feature, adds a CSS-only fallback, or loads a polyfill, **update `BASELINE.md` in that same Part** (Sections 1–3, oldest → newest) and re-run `pnpm check:baseline`. This applies to `Origin` controllers just as much as to app-side shims under `apps/*`; the reverse scan catches dependencies and imports but cannot infer the feature date, WebStatus link, or fallback mechanism for you.

**Verify Before Moving On:** Run `pnpm check:baseline` and `pnpm check:baseline -- --online`.

---

## Phase 4: Semantic CSS Tokens, Themes & Ambient DOM Contexts (`@lsui/themes`)

- [x] **Phase status:** Complete — 4/4 Parts

Now you will build LightSpeedUI's pure-CSS styling foundation in `packages/themes`—using semantic CSS custom properties inside `@layer lsui` with **zero Tailwind** and **zero CSS Modules**.

### Part 4.1: Set Up `@layer lsui` Cascade Order, Modern Reset & OS `text-scale` Support

- [x] **Status:** Complete — Verified by the theme contract suite in Part 4.4

Create **`packages/themes/src/base.css`** declaring internal sub-layers:
```css
@layer lsui {
  @layer reset, tokens, context, base, components, utilities;
}
```
Follow two critical accessibility rules in `@layer reset` and `@layer tokens`:
1. **Never set `font-size: 16px` on `:root` or `html`!** Leaving root `font-size` unset lets `<meta name="text-scale" content="scale">` scale `1rem` smoothly to the user's operating-system accessibility font size.
2. **Use fluid `clamp()` with `rem + cqi` (`max <= 2.5 * min`)**: For example, `--text-2xl: clamp(1.375rem, 1.15rem + 1.1cqi, 1.875rem);` so headings adapt to their *container* width while still scaling when the user zooms to 200%.
3. **Avoid `:root` collisions in host docs**: Scope root token defaults to `:where(:root:not([data-mode])), [data-theme]` so standalone Astro apps get tokens on `:root`, while Nimbus's `[data-mode]` shell stays untouched outside `[data-lsui-preview]`.

---

### Part 4.2: Implement Live `light-dark()` Color & `<image>` Tokens with `image-set()` Fallbacks

- [x] **Status:** Complete — Verified by the image-set fallback test in Part 4.4

1. **Keep `--color-*` custom properties unregistered (do NOT use `@property` with `syntax: '<color>'`)**:
   ```css
   --color-primary: light-dark(var(--color-primary-light), var(--color-primary-dark));
   ```
   > **Why?** `light-dark()` resolves at *computed-value time*. If you register `--color-primary` as `<color>`, `:root` computes it once (say, light blue) and passes that static color down—breaking nested `<section data-theme="dark">` callouts! Keeping `--color-primary-light` and `--color-primary-dark` as explicit variables also lets our AST parser extract both Light and Dark mode columns for Figma without opening a browser!
2. **Always mix colors in `oklab`, never `oklch`**:
   Use `color-mix(in oklab, var(--color-text) 8%, transparent)` — mixing neutral greys in `oklch` hits a Chromium powerless-hue quirk that tints greys pink!
3. **Support Baseline 2026 `light-dark()` `<image>` values (`https://webstatus.dev/features/light-dark-image`)**:
   Pair `light-dark(var(--image-light), var(--image-dark))` with an `@supports not (background-image: light-dark(url("a.png"), url("b.png")))` fallback using `image-set(var(--image-light) var(--lsui-img-light), var(--image-dark) var(--lsui-img-dark))` where the inactive branch resolves to `type("image/do-not-use")` and the active branch is empty whitespace (`--lsui-img-light: ;` — **never** `type("")`, which drops both images!).

> **BASELINE.md:** `light-dark()` image values are Baseline 2026 Newly Available (`2026-09-14`) and the `image-set()` MIME switch is a CSS-only fallback. Add both to Sections 1 and 2 **in this Part**, with the exact token files as `Used In`, then run `pnpm check:baseline`.
---

### Part 4.3: Build the 6 Ambient `data-*` Contexts (Zero Prop-Drilling)

- [x] **Status:** Complete — Verified by the six-context theme suite (Part 4.4) and the inverse-surface contrast assertions (Part 6.3)

Instead of passing `theme="dark"` or `compact={true}` props down through 10 nested Astro/CMS components, add rules in `@layer lsui.context` (`packages/themes/src/base.css`) for **6 HTML `data-*` attributes** that any parent `<section>`, `<aside>`, or `<body>` can set:

1. **`data-theme`** (`[data-theme~="nordic"]`, `[data-theme~="editorial"]`, `[data-theme~="dark"]`, `[data-theme~="light"]`) — whitespace-matched (`~=`) so `<section data-theme="editorial dark">` switches both palette and color scheme on a single element! Always re-declare `color-scheme`, `background-color`, `color`, `accent-color`, and `caret-color` on scheme overrides.
2. **`data-surface`** (`canvas`, `card`, `muted`, `hero`, `inverse`) — swaps `--color-bg`, `--color-surface`, and `--color-text` for distinct page bands. For **`inverse`**, remap the *whole* surface context, not just the labels:
   ```css
   [data-surface="inverse"] {
     --color-surface: var(--color-surface-inverse);
     --color-ring: var(--color-text-inverse);
     --color-border: color-mix(in oklab, var(--color-text-inverse) 45%, var(--color-surface-inverse));
     --color-border-strong: color-mix(in oklab, var(--color-text-inverse) 62%, var(--color-surface-inverse));
   }
   ```
   Otherwise the page-level ring/border tokens fail WCAG 1.4.11's 3:1 minimum against the inverted background. Leave `color-scheme` inherited—forcing it on the surface would require re-declaring every inherited `<color>` property (`color`, `accent-color`, `caret-color`, ...).
3. **`data-density`** (`compact`, `comfortable`, `spacious`) — reassigns `--space-*`, `--control-height-*`, and `--control-pad-inline-*` directly on the container so nested containers always inherit from the closest ancestor.
4. **`data-contrast`** (`more`) — strengthens borders and focus rings (paired with `@media (prefers-contrast: more)`).
5. **`data-motion`** (`reduced`, `none`, `full`) — scales `--duration-*` tokens alongside `@media (prefers-reduced-motion: reduce)`.
6. **`data-layout`** (`container`, `prose`, `full-bleed`) — responsive max-inline-size layout wrappers.

---

### Part 4.4: Create the `Nordic` & `Editorial` Themes + Token Unit Tests

- [x] **Status:** Complete — pnpm check:baseline && pnpm test passed

1. Create two complete themes under `packages/themes/src/themes/`:
   - **`nordic/`** (`theme.css`, `DESIGN.md`, `TOKENS.md`) — crisp geometric sans-serif (`IBM Plex Sans` / `Inter`), cool slate neutrals, cobalt primary, `0.5rem` medium radius.
   - **`editorial/`** (`theme.css`, `DESIGN.md`, `TOKENS.md`) — warm paper surfaces, literary serif headings (`Iowan Old Style` / `Charter`), terracotta accent, `0.1875rem` sharp radius.
2. Export `./base.css`, `./nordic.css`, and `./editorial.css` from `packages/themes/package.json`.
3. Add `packages/themes/tests/themes.test.ts` asserting no `:root`/`html` `font-size` rules, no `color-mix(in oklch)`, no `type("")` in `image-set()`, and `clamp()` `max <= 2.5 * min`.

**Verify Before Moving On:** Run `pnpm check:baseline && pnpm test` — all theme contract checks should pass.

---

## Phase 5: Level 1 — `Origin` Unstyled Primitives & Headless Behaviors (`@lsui/origin`)

- [x] **Phase status:** Complete — 4/4 Parts

Now you will build **Level 1 (`Origin`)** inside `packages/origin`. Everything here is **100% unstyled**—its job is semantic HTML, keyboard handling, focus management, screen-reader announcements, and conditional Baseline polyfills.

### Part 5.1: Build `mount()` (View-Transition-Safe Mounter) & Conditional Baseline Polyfills

- [x] **Status:** Complete — `mount()` lifecycle suite in `packages/origin/tests/mount.test.ts` + Origin suite in Part 5.4

1. **Why `mount()` instead of `<lsui-button>` Custom Elements?** Wrapping components in custom elements adds extra non-semantic tags to the DOM (which can break CSS Grid/Flexbox children) and fires `connectedCallback` before child HTML finishes streaming.
   Create **`packages/origin/src/mount.ts`**:
   - Queries `document.querySelectorAll(selector)` once DOM is ready, stores cleanup callbacks in a `WeakMap` (plus a strong `Set` for iteration), cleans up on `astro:before-swap`, and re-mounts on `astro:page-load` so Astro `<ClientRouter />` View Transitions work seamlessly!
   - Ordinary DOM removals do **not** fire those events, so also install one `MutationObserver` on `document` (`{ childList: true, subtree: true }`). Schedule a single cleanup pass per mutation batch in a microtask and re-check `el.isConnected` before calling cleanup—a node that was merely moved/reinserted during the batch must not be torn down. Prune the `Set` when a cleanup runs; the `WeakMap` alone is not iterable.
   - Deduplicate registrations by `(selector, setup)` using the function reference as identity: a second `mount()` call with the same pair is a no-op so `setup` stays idempotent instead of attaching duplicate listeners.
2. Add **`packages/origin/tests/mount.test.ts`** with `// @vitest-environment happy-dom` (install `happy-dom` as a root devDependency) and verify: cleanup runs for a card removed with `replaceChildren()`, no cleanup runs when the node is reinserted in the same mutation batch, and a duplicate `(selector, setup)` registration calls `setup` only once.
3. Install `@oddbird/popover-polyfill` and `invokers-polyfill` in `packages/origin`, create **`packages/origin/src/polyfills.ts`** with feature-detected dynamic `import()` helpers (`!Object.hasOwn(HTMLElement.prototype, "popover")` and `!("commandForElement" in HTMLButtonElement.prototype)`), and log both polyfills in `BASELINE.md` Section 3 **in this Part** while adding Popover (`2025-01-27`) and Invoker Commands (`2025-12-12`) to Section 1 with the same `Used In` files. Run `pnpm check:baseline` before moving on.

---

### Part 5.2: Build `announce()` Using Baseline 2026 `ariaNotify()` + Lazy `aria-live` Fallback

- [x] **Status:** Complete — ariaNotify paths and forced aria-live fallback unit-tested

Traditional libraries append hidden `<div aria-live="polite">` nodes to `document.body`. That has two big bugs: screen readers drop messages injected in the same tick the `<div>` mounts, and opening a `<dialog>` with `.showModal()` marks siblings on `document.body` as `inert`—silencing announcements!

Create **`packages/origin/src/announce.ts`** using **Baseline 2026 `ariaNotify()`** (`https://webstatus.dev/features/arianotify`):
1. If `options.target` is a connected semantic element (not `<html>` or `<body>`) with `typeof target.ariaNotify === "function"`, call `target.ariaNotify(trimmed, { priority: priority === "assertive" ? "high" : "normal" })` (which also inherits the nearest `lang` attribute for screen-reader voice selection!). Check `target.isConnected !== false` so a removed node is never notified.
2. Otherwise, if `typeof doc.ariaNotify === "function"`, call `doc.ariaNotify(...)`.
3. Otherwise, lazily create a visually-hidden `aria-live` region (`polite` / `assertive`) and update it on the next frame for older browsers. **Host the region inside the active top-layer context**—an open `<dialog>` or `[popover]:popover-open`—and only fall back to `doc.body ?? doc.documentElement`; a body-level region becomes `inert` when a modal dialog opens, which is the exact bug `ariaNotify()` was chosen to avoid. Key the region cache by the **host element**, not the document, so a region created inside a dialog is discarded when that dialog closes. Schedule with `doc.defaultView?.requestAnimationFrame` (falling back to `setTimeout`) so an iframe `doc` override animates in the correct window. Record `ariaNotify()` (`2026-09-14`) in `BASELINE.md` Section 1 **in this Part**—the `aria-live` path is a JS fallback, not a Section 3 polyfill—then run `pnpm check:baseline`.
4. Add a forced-fallback unit test that deletes both `ariaNotify` methods and asserts the live region receives text inside an open dialog.

---

### Part 5.3: Build Focusable `aria-disabled` Guards & Pure Attribute Helpers (`buttonAttrs`, `linkAttrs`)

- [x] **Status:** Complete — buttonAttrs()/linkAttrs() unit-tested in Part 5.4

1. Create **`packages/origin/src/aria-disabled.ts`**:
   - `ensureAriaDisabledGuard()`: Captures `click` and `Enter`/`Space` `keydown` events on `[aria-disabled="true"]` and calls `preventDefault()` + `stopImmediatePropagation()`, keeping disabled toolbar buttons reachable via `Tab` without firing actions.
   - `ensureSimulatedButtonKeys()`: Delegates `Enter` (on `keydown`) and `Space` (on `keyup`, matching native `<button>` behavior!) when a consumer renders `<OriginButton as="span">`.
2. Create **`packages/origin/src/attrs/button-attrs.ts`**:
   - `buttonAttrs(options)`: Returns `{ type: "button", ... }` for native `<button>`, or `{ role: "button", tabindex: 0, "data-lsui-simulated-button": "" }` for `"span" | "div"`. Never allows `"a"`!
   - `linkAttrs(options)`: Returns `{ href }` when active, or `{ href: undefined, role: "link", "aria-disabled": "true" }` when `disabled`—never `role="button"`.

---

### Part 5.4: Build Unstyled `OriginButton` & `OriginLink` `.astro` Primitives + Unit Tests

- [x] **Status:** Complete — build/typecheck/baseline/tests + E2E override regressions passed

1. Create **`packages/origin/src/primitives/button/Button.astro`** (`@title OriginButton`, `@level origin`) and **`LinkButton.astro`** (`@title OriginLink`, `@level origin`):
   - Include the structured frontmatter JSDoc header (`@title`, `@level`, `@description`, `@category`, `@hydration`, `@accessibility`, `@keyboard`, `@slots`).
   - Use a TypeScript discriminated union so `iconOnly: true` **requires** `"aria-label": string` at compile time!
   - Render conditional `<script>` blocks (`{hasInvoker && <script>...}`) so plain buttons emit **zero `<script>` tags and 0 bytes of client JS**!
   - Keep **zero `<style>` blocks and zero `.css` imports** in `Origin`.
   - Make computed semantics authoritative: strip `role`, `tabindex`, `aria-disabled`, `data-lsui-simulated-button`, and `data-icon-only` from `rest` **before** spreading it, then spread `computedAttrs` last. Astro emits duplicate attributes instead of overwriting, and the browser keeps the first duplicate—so spread order alone does not protect you. For `OriginLink`, delete `role`/`tabindex` at runtime as well because `role` is intentionally absent from its typed props. Add an E2E case that passes hostile props and asserts the rendered attributes remain the computed ones.
   - **Stage note:** The visible-label / `aria-describedby` discipline used by `OriginInput` and `OriginSelect` is generic form guidance and logically belongs here with the first Origin primitives; it is implemented in Part 9.4 (see F-055) rather than invented there.
2. Export `./Button.astro` and `./LinkButton.astro` in `packages/origin/package.json` and add unit tests in `packages/origin/tests/origin.test.ts` testing `buttonAttrs()`, `linkAttrs()`, and `announce()` (`Element.ariaNotify` vs `Document.ariaNotify`).

**Verify Before Moving On:** Run `pnpm build && pnpm typecheck && pnpm check:baseline && pnpm test`.

---

## Phase 6: Level 2 — `Liftoff` First Styled Component Slice (`@lsui/liftoff`)

- [x] **Phase status:** Complete — 3/3 Parts

Now you will layer **Level 2 (`Liftoff`)** on top of `Origin`—adding visual variants, sizes, WCAG target sizing, and reduced-motion polish without duplicating a single line of `Origin`'s behavior logic!

### Part 6.1: Write Shared Token Styles (`button.css`) with Hit-Target Floors & Reduced Motion

- [x] **Status:** Complete — Verified by contract test + E2E in Part 6.3

Create **`packages/liftoff/src/components/button/button.css`** wrapped inside `@layer lsui { @layer components { ... } }`:
- Use `min-block-size: max(var(--btn-height), var(--target-min-size, 1.5rem))` (never fixed `height`, so multi-line or OS-scaled text never overflows!). `--target-min-size` is `24px` (`1.5rem`, WCAG 2.5.8 AA) on fine pointers and automatically expands to `44px` (`2.75rem`, WCAG 2.5.5) under `@media (pointer: coarse)` in `base.css`.
- Tokenize button cursor as `cursor: var(--cursor-interactive, default)` on `<button>` while keeping `cursor: pointer` on `<a href>`.
- Style `data-variant="primary" | "secondary" | "outline" | "ghost" | "danger"` and `data-size="sm" | "md" | "lg"` using semantic CSS variables exclusively.
- Define the disabled state with **`[data-lsui-button]:is(:disabled, [aria-disabled="true"])`**—use `:is()`, **not `:where()`**. `:where()` contributes zero specificity, so `[data-lsui-button][data-variant="..."]` would keep supplying the variant's colors. Set `background-color: color-mix(in oklab, var(--color-surface) 88%, var(--color-text))`, `color: var(--color-text)`, `border-color: var(--color-border)`, and `border-style: dashed` (a non-color state cue). Never dim the element with `opacity: 0.55`: opacity fades the label *and* the focus ring together, while focusable `aria-disabled="true"` controls must stay legible and rely on the `Origin` JS guard to block activation.
- Keep the keyboard focus ring on `outline`: `[data-lsui-button]:focus-visible { outline: var(--ring-width) solid var(--color-ring); outline-offset: var(--ring-offset); }`. The remapped `--color-ring` from Part 4.3 makes this pass contrast on inverse surfaces, and the existing `@media (forced-colors: active)` block swaps in `Highlight` for system colors.
- Wrap press scaling (`scale: 0.98`) inside `@media (prefers-reduced-motion: no-preference)` and reset `scale: none` under `:where([data-motion="reduced"], [data-motion="none"])` while keeping subtle color/background transitions intact.

---

### Part 6.2: Layer `<Button>` & `<LinkButton>` Strictly Atop `Origin`

- [x] **Status:** Complete — packages/liftoff/tests/button-contract.test.ts passed

1. Create **`packages/liftoff/src/components/button/Button.astro`** (`@title Button`, `@level liftoff`):
   - Import `OriginButton from "@lsui/origin/Button.astro"` and `"./button.css"`.
   - Accept `variant = "primary"`, `size = "md"`, and forward `data-lsui-button=""`, `data-variant={variant}`, `data-size={size}`, slots (`default`, `icon-start`, `icon-end`), and all `OriginButton` props directly to `<OriginButton>`.
2. Create **`packages/liftoff/src/components/button/LinkButton.astro`** (`@title LinkButton`, `@level liftoff`) wrapping `OriginLink` with the exact same `button.css` variants and sizes.
3. Add contract tests in `packages/liftoff/tests/button-contract.test.ts` verifying `@level liftoff`, `@lsui/origin` delegation, zero hardcoded `#hex` colors, and zero `role="button"` on links.

---

### Part 6.3: Wire Up Playground Demos & End-to-End Accessibility Tests

- [x] **Status:** Complete — pnpm test && pnpm test:e2e passed, including inverse contrast assertions

1. Build two pages in `apps/playground/src/pages/`:
   - `index.astro` — renders `<Button>` and `<LinkButton>` across `Nordic` Light/Dark, `Editorial` Light/Dark, nested `data-surface="hero"` / `"inverse"` (one inverse panel in each of the four theme/mode zones), `data-density="compact"`, and themed `light-dark()` hero images. Keep `aria-disabled` demos **off this page**: `OriginButton` emits a conditional `<script>` when `aria-disabled="true"`, which would break the zero-JS assertion.
   - `triggers.astro` — renders declarative `commandfor`/`command="show-modal"` `<dialog>` triggers, `popovertarget` popovers, focusable `aria-disabled="true"` buttons (including one inside an inverse panel), disabled `LinkButton`s, and `<OriginButton as="span">` wired with `mount()` + `announce()`.
2. Expand `tests/e2e/playground.spec.ts` to verify zero `<script>` tags on `index.astro`, `0` WCAG 2.2 AA `axe-core` violations, `>= 24x24px` desktop targets, `>= 44x44px` coarse-pointer touch targets, keyboard `Enter` activation on `<OriginButton as="span">`, and computed contrast across all four inverse panels: focus ring and border **>= 3:1**, focusable disabled label **>= 4.5:1** against both its own fill and the inverse surface. Axe does not reliably check focus-ring contrast, so sample the computed colors directly.

**Verify Before Moving On:** Run `pnpm test && pnpm test:e2e`.

---

## Phase 7: AST Single-Source-of-Truth Pipeline (`@lsui/ast`) & 5-Tab Nimbus Docs

- [x] **Phase status:** Complete — 5/5 Parts

In Phase 7, you will build the compiler inside `packages/ast` that reads your `.astro` components and `.css` themes and automatically generates your documentation pages, static CLI registry JSON, AI context files, and Figma sync spec!

### Part 7.1: Parse CSS Tokens & Convert OKLCH Colors to sRGB/Hex (`postcss` + `color.ts`)

- [x] **Status:** Complete — AST color + CSS validation tests + 165-token browser-parity fixture passed

1. Install `@astrojs/compiler-rs`, `ts-morph`, and `postcss` in `packages/ast`.
2. Create **`packages/ast/src/color.ts`** implementing pure-math `oklch(...)` → OKLab → linear sRGB → gamma-encoded sRGB `{ r, g, b, a, hex }` conversion (used for both `TOKENS.md` hex previews and Figma `RGBA` variable floats!).
3. Create **`packages/ast/src/parse-css.ts`** using PostCSS to:
   - Extract `--space-*` and `--control-*` dimensions from `base.css` and `--color-*-light` / `--color-*-dark` pairs + `--radius-*` from each theme in `packages/themes/src/themes/*`.
   - Validate component CSS (`validateComponentCss`): fail immediately if any component stylesheet forgets `@layer lsui`, uses a hardcoded `#hex` color, or uses `color-mix(in oklch)`.
4. Check in **`packages/ast/tests/fixtures/oklch-parity.json`**: every real theme OKLCH literal (plus the pure-white and near-white edge cases) paired with sRGB bytes sampled once in Chromium. Assert `parseCssColorToRgba()` is within **1/255 per channel**. Keep the linear-channel conversion unless a fixture fails—do not invent a gamut mapper, since browsers do not implement a stable one for relative color syntax.

---

### Part 7.2: Parse `.astro` Templates & TypeScript `Props` Unions (`@astrojs/compiler-rs` + `ts-morph`)

- [x] **Status:** Complete — AST extraction / boundary tests passed

Create **`packages/ast/src/parse-component.ts`**:
1. Walk `packages/{origin,liftoff,landing,apogee}/src/**/*.astro` and parse each file with Astro 7's native Rust parser (`parse` from `@astrojs/compiler-rs`) in ~0.2ms.
2. Parse the frontmatter JSDoc block (`@title`, `@level`, `@description`, `@category`, `@hydration`, `@accessibility`, `@keyboard`, `@slots`) and verify that every `<slot>` in the template is documented in `@slots` (and vice versa!).
3. Enforce platform boundaries automatically:
   - Throw an error if any `origin` primitive contains `<style>` or imports `.css`.
   - Throw an error if any level imports a package above it (enforcing **`Origin ← Liftoff ← Landing`** while keeping **`Apogee`** independent).
4. Load the frontmatter TypeScript into `ts-morph` to extract every property on `export type Props` (including discriminated unions like `iconOnly: true` → `"aria-label": string`), default values from `const { variant = "primary" } = Astro.props`, SHA-256 file hashes, and deterministic Figma property classifications (`VARIANT`, `BOOLEAN`, `TEXT`, `SKIPPED_NON_VISUAL`).

---

### Part 7.3: Generate Registry JSON, `AGENTS.md`/`COMPONENTS.md`/`TOKENS.md` & `figma-spec.json`

- [x] **Status:** Complete — pnpm check:artifacts → 25 artifacts in sync

Create **`packages/ast/src/generators.ts`** with four pure generator functions from your parsed AST Intermediate Representation (IR):
1. **`buildDocsMdxByLevel(components)`**: Emits `index.mdx` (`Overview`), `core-goals.mdx` (`Core Goals of <Level>`), and `Catalog` component pages (or `catalog.mdx` for levels whose catalog is still upcoming) across `apps/docs/src/content/{origin,liftoff,landing,apogee}/`.
2. **`buildRegistryArtifacts({ components, monorepoRoot })`**: Emits `apps/docs/public/r/index.json`, level-namespaced `/r/<level>/<slug>.json` manifests (with embedded source files and SHA-256 hashes for future 3-stage CLI upgrades), plus default `/r/<slug>.json` aliases for `Liftoff`.
3. **`buildAiContextFiles({ components, themes })`**: Emits root `AGENTS.md`, `COMPONENTS.md`, and `TOKENS.md`.
4. **`buildFigmaSpec({ components, baseTokens, themes })`**: Emits `packages/figma-sync/generated/figma-spec.json` containing 4-mode color variables (`Nordic Light/Dark`, `Editorial Light/Dark`), geometry variables, and Figma Component Set definitions for styled `Liftoff`/`Landing` components.

---

### Part 7.4: Configure 5 Top-Navbar Section Tabs, Brand Logo & Per-Level Sidebars in Nimbus Docs

- [x] **Status:** Complete — Manual docs nav check: 5 tabs + per-level sidebars

1. **Register the 5 content collections** (`docs`, `origin`, `liftoff`, `landing`, `apogee`) in **`apps/docs/src/content.config.ts`** using `docsCollection({ base: "<level>" })`, and add catch-all route files at `apps/docs/src/pages/{origin,liftoff,landing,apogee}/[...slug].astro` using `getCollectionStaticPaths("<level>")` and `getCollectionPage(Astro, "<level>")`.
2. **Register all 5 top-level sections in `apps/docs/astro.config.ts`** (`Overview`, `Origin (Level 1)`, `Liftoff (Level 2)`, `Landing (Level 3)`, `Apogee (Level 4)`) so Nimbus's breadcrumbs, `/llms-full.txt`, and `nimbus-docs check` index every collection.
3. **Scope the left sidebar per active level (`apps/docs/src/lib/sidebar.ts`)**:
   > **Nimbus Gotcha:** Calling `getSidebar(slug, { collection })` alone only swaps trees for `docs-<v>` version collections! Use Nimbus's `getSidebar(currentSlug, { collection, transform })` hook so clicking **Origin** in the top navbar scopes the sidebar to an expanded **`Origin (Level 1)`** group → `Overview`, `Core Goals of Origin`, and an expanded **`Catalog`** group → `OriginButton` & `OriginLink` (and likewise for `Liftoff`, `Landing`, and `Apogee`).
4. **Render the 5 Section Tabs & Project Logo (`TheFrontmatter.svg`) in `apps/docs/src/components/Header.astro`**:
   - Put the vector path and `#EE46DD` brand fill (>= 3.2:1 contrast on both light and dark surfaces, omitting duplicate `<clipPath id>` attributes) into `apps/docs/src/components/logo.ts` so `Logo.astro`, the mobile drawer, `public/favicon.svg`, and build-time social OG cards (`src/pages/og/_card.ts`) all share one logo definition.

---

### Part 7.5: Run `pnpm sync:artifacts` & Full End-to-End Verification

- [x] **Status:** Complete — Full verification suite passed; 25 artifacts synced

Create **`scripts/sync-artifacts.ts`** to write all 25 AST-generated artifacts (and prune stale generated `.mdx` files in `--check` / write mode), then run the complete verification suite from `./lsui`:

```bash
pnpm sync:artifacts && \
pnpm check:artifacts && \
pnpm build && \
pnpm typecheck && \
pnpm typecheck:apps && \
pnpm --filter @lsui/docs run build && \
pnpm --filter @lsui/docs run lint:docs && \
pnpm check:baseline && \
pnpm test && \
pnpm test:e2e
```

> **Docs Lint Order Tip:** Always run `pnpm --filter @lsui/docs run build` *before* `pnpm --filter @lsui/docs run lint:docs` after generating new `.mdx` pages—Nimbus validates internal Markdown links against the built route manifest!

**Verify Before Moving On:** Start `pnpm --filter @lsui/docs run dev`, open `http://localhost:4321/`, click through `Overview`, `Origin`, `Liftoff`, `Landing`, and `Apogee` in the top navbar, and confirm every sidebar, live `<ComponentPreview>`, `/origin/llms.txt`, and `/r/liftoff/button.json` endpoint works!

---

## Phase 8: Live 1-Component Code-to-Figma Sync PoC (`@lsui/figma-sync`)

- [x] **Phase status:** Complete — 3/3 Parts

In Phase 8, you will push your `@lsui/themes` CSS tokens and `Liftoff` `<Button>` directly from `packages/figma-sync/generated/figma-spec.json` into a live Figma Design file using Figma's Remote MCP server—proving your AST contract works end-to-end before scaling to 20+ components!

### Part 8.1: Connect Figma Remote MCP (`https://mcp.figma.com/mcp`) & Install `skills/`

- [x] **Status:** Complete — Figma Remote MCP connected; read-only session check

1. **Why Remote MCP instead of Desktop MCP?** Figma's local Desktop MCP (`127.0.0.1:3845/mcp`) is read-only. Writing Variables and Components via `use_figma` requires Figma's Remote MCP (`https://mcp.figma.com/mcp`).
2. Add the server and official `skills/` (for OpenCode; **do not** install `skills-figquery/`, which is Cursor-only and uses a custom `$fig` global instead of the standard Figma Plugin API):
   ```bash
   opencode mcp add figma --global --url https://mcp.figma.com/mcp

   mkdir -p ~/.config/opencode/skills && \
   git clone --depth 1 https://github.com/figma/mcp-server-guide.git /tmp/figma-mcp-guide && \
   cp -R /tmp/figma-mcp-guide/skills/* ~/.config/opencode/skills/ && \
   rm -rf /tmp/figma-mcp-guide
   ```
3. Run `/mcps` in your client, select **`figma`**, and click **Allow access** in your browser (uses Figma OAuth—no Personal Access Token needed). Create a blank Figma Design file (`https://www.figma.com/design/:fileKey/...`) in your project folder.

**Verify Before Moving On:** Confirm `figma` shows as connected in `/mcps` and run a read-only `create_session` + `use_figma` check listing `figma.root.children`.

---

### Part 8.2: Sync `Primitives`, 4-Mode `Theme Colors` & 2-Mode `Geometry & Spacing` Variables

- [x] **Status:** Complete — use_figma: 32 colors / 24 dimensions / 128 primitives / 3 text styles

1. Ensure `buildFigmaSpec()` (`packages/ast/src/generators.ts`) emits explicit **variable `scopes`** (`["FRAME_FILL", "SHAPE_FILL"]`, `["TEXT_FILL", "SHAPE_FILL"]`, `["STROKE_COLOR", "FRAME_FILL"]`, `["GAP"]`, `["WIDTH_HEIGHT"]`, `["CORNER_RADIUS"]`) and **`codeSyntax`** (`"var(--color-primary)"`) on every token—never leave Figma's default `ALL_SCOPES`!
2. Create `buildTokensSyncScript(spec)` in **`packages/figma-sync/src/scripts.ts`** to idempotently create or update:
   - **`Primitives`** (`Value` mode, `v.scopes = []` hidden from pickers) holding raw `{ r, g, b, a }` values in `0..1` float range.
   - **`Theme Colors`** (`Nordic Light`, `Nordic Dark`, `Editorial Light`, `Editorial Dark`) aliasing each mode to `Primitives` via `{ type: "VARIABLE_ALIAS", id: primVar.id }` and setting `v.setVariableCodeSyntax("WEB", token.codeSyntax)`.
   - **`Geometry & Spacing`** (`Nordic`, `Editorial` modes) so switching theme mode flips both colors *and* corner radii (`8px` Nordic vs. `3px` Editorial)!
   - Shared Text Styles (`Button / sm`, `Button / md`, `Button / lg`) after awaiting `figma.loadFontAsync({ family: "Inter", style: "Medium" })`.

**Verify Before Moving On:** Execute `buildTokensSyncScript(spec)` via `use_figma` and confirm `32` semantic colors, `24` dimensions, `128` hidden primitives, and `3` text styles return with `planModeLimitReached: false`.

---

### Part 8.3: Build the 30-Variant `Liftoff` `Button` Component Set & 4-Mode Theme Showcase

- [x] **Status:** Complete — use_figma component set + 1x showcase screenshot inspected

1. **Crucial AST Mapping Rule (`TEXT_SLOT` vs. `SLOT`)**: Inline interactive controls (`<button>`, `<a>`) use `<slot />` for their visible text label. In `@lsui/ast`, classify inline `default` slots as `"TEXT_SLOT"` so Figma receives a variable-bound `TextNode` wired to a `Label` (`TEXT`) property (`labelNode.componentPropertyReferences = { characters: labelKey }`), reserving `createSlot()` (`"SLOT"`) for container components like `Card` or `Dialog`.
2. Create `buildButtonComponentSyncScript(spec, ledger)` in **`packages/figma-sync/src/scripts.ts`**:
   - Create `16x16` vector `Icon / Plus` and `Icon / ArrowRight` dependency components first (`Tier 0` atoms).
   - Derive the variant/size axes from `buttonSpec.variantAxes` and disabled states from `booleanProperties`; every fill, stroke, corner radius, `minHeight`, padding, and gap binds to a Figma Variable resolved from its semantic CSS token via the ledger—including icon strokes, the component-set outline, the showcase fill, and its header (**no literal colors**). Emit a `VARIANT_PLAN` with a named page-split plan and a guard that fails before exceeding Figma's 30-variant cap (`disabled=false|true` still renders a native Boolean toggle).
   - Call `addComponentProperty(...)` (`Label`, `Show Icon Start`, `Icon Start`, `Show Icon End`, `Icon End`) on each `ComponentNode` **before** `figma.combineAsVariants(createdVariants, page)`, then position the 30 variants in a `5 × 6` grid and call `buttonSet.resizeWithoutConstraints(...)`.
   - Build a **`Button — Multi-Theme Showcase`** frame next to the Component Set with one card per mode derived from `spec.variableCollections.colors.modes`, each calling `card.setExplicitVariableModeForCollection(...)` (measure widest child and set `showcase.counterAxisSizingMode = "FIXED"` *before* setting `card.layoutSizingHorizontal = "FILL"` to prevent clipping!).

**Verify Before Moving On:** Run `pnpm test` (`packages/figma-sync/tests/figma-sync.test.ts`), execute `buildButtonComponentSyncScript` via `use_figma`, and inspect the returned `1x` showcase screenshot to confirm crisp colors, icons, and corner-radius shifts across all 4 theme modes!

---

## Upcoming Phases (9–13): Living Roadmap

> **Status:** Not started — 0/18 Parts complete. These are **planned checklists**, not verified tutorials: each Part is expanded into full hands-on instructions with real commands/code only after implementation and review. **Mandatory gate:** present a design plan and get user approval before writing any component, block, or experience code (see [Review Gates](#review-gates--non-negotiable-invariants)). Tick a box only when the step is done and its verification result is recorded in `FINDINGS.md`.

- [x] **Phase 9 status:** Complete — 4/4 Parts (high-level `PLAN.md` Phase 2 satisfied)
- [ ] **Phase 10 status:** Planned — 0/4 Parts (`PLAN.md` Phase 3)
- [ ] **Phase 11 status:** Planned — 0/3 Parts (`PLAN.md` Phase 4, Part 1)
- [ ] **Phase 12 status:** Planned — 0/3 Parts (`PLAN.md` Phase 4, Part 2)
- [ ] **Phase 13 status:** Planned — 0/4 Parts (`PLAN.md` Phase 5)

### Phase 9: Expanding Level 1 `Origin` — Focus Controllers & Unstyled Primitives (`@lsui/origin`)

### Part 9.1: Build `createRovingFocus()` & `createTypeahead()` headless controllers
- [x] **Status:** Complete — design gate approved; `pnpm test` 45/45 and `pnpm typecheck` passed
- [x] Record the controller contracts in `FINDINGS.md`: focusable selector, `Arrow`/`Home`/`End` keys, wrap behavior, and typeahead buffer reset rules (F-052).
- [x] Add `packages/origin/src/controllers/roving-focus.ts` and `typeahead.ts` with headless setup/cleanup compatible with `mount()`. Native `focusgroup` is preferred; roving tabindex is installed only when unsupported.
- [x] Add unit tests for tab stop management, keyboard navigation, cleanup, and view-transition re-mount (`packages/origin/tests/controllers.test.ts`).
- [x] Verify with `pnpm test && pnpm typecheck`. Recorded limited-availability `focusgroup` in `BASELINE.md` Section 4 with a feature-detected fallback; no Section 1–3 change, so `pnpm check:baseline` remains 8 Newly Available / 3 CSS fallbacks / 2 polyfills.

### Part 9.2: Build `createFocusTrap()`, `createDismissableLayer()`, and `createSelection()` controllers + reduced-motion helper
- [x] **Status:** Complete — design gate approved; `pnpm test` 53/53 and `pnpm test:e2e` 7/7 passed
- [x] Specify trap entry/exit focus, Escape/light-dismiss behavior, selection semantics, and programmatic `prefers-reduced-motion` checks before coding (F-053).
- [x] Add the three controllers under `packages/origin/src/controllers/` plus `reduced-motion.ts`; keep zero visual CSS. Native modal dialogs and popovers are never double-handled.
- [x] Add browser focus tests (tab cycling, focus restoration, dismissal) and verify artifacts via `pnpm sync:artifacts && pnpm check:artifacts`.
- [x] Verify with `pnpm test && pnpm test:e2e && pnpm check:artifacts`. Recorded limited-availability `closedby` in `BASELINE.md` Section 4.

### Part 9.3: Build unstyled `OriginDialog` (`<dialog>` + Invoker Commands) and `OriginPopover` (Popover API + CSS Anchor Positioning)
- [x] **Status:** Complete — design gate approved; `pnpm test` 56/56 and `pnpm test:e2e` 8/8 passed
- [x] Write the JSDoc contract (`@title`, `@level origin`, `@accessibility`, `@keyboard`, `@slots`) and confirm `modern-web-guidance` guidance for dialogs, popovers, and anchor positioning (F-054).
- [x] Build the two `.astro` primitives with declarative `commandfor`/`popovertarget` triggers and conditional polyfill loading via `ensureDeclarativeTriggers()`.
- [x] Record Limited-Availability Anchor Positioning in `BASELINE.md` Section 4 with `@supports` progressive enhancement; no polyfill package. Section 3 "Used In" extended for the new popover polyfill import; feature counts unchanged (`check:baseline` 8/3/2). Verified no `<style>` or `.css` import in Level 1.
- [x] Verify with `pnpm build && pnpm typecheck && pnpm check:baseline && pnpm test && pnpm test:e2e`.

### Part 9.4: Build unstyled `OriginTabs`, `OriginSelect`, and `OriginInput` primitives + docs updates
- [x] **Status:** Complete — blanket authorization covered the design gate; `pnpm test` 57/57 and `pnpm test:e2e` 9/9 passed
- [x] Define ARIA patterns (tablist/tabpanel, native select labeling, input labeling) and keyboard maps in the design plan (F-055).
- [x] Implement the three Level 1 primitives, reusing Part 9.1 roving focus for tabs where `focusgroup` is unsupported; native controls own select/input behavior.
- [x] Export new `.astro` entry points; regenerated `AGENTS.md`, `COMPONENTS.md`, registry JSON, and Origin docs with `pnpm sync:artifacts` (35 artifacts).
- [x] Verify with `pnpm check:artifacts && pnpm test && pnpm test:e2e`; F-055 records the stage note that form labeling belongs conceptually in Part 5.4.

### Phase 10: Expanding Level 2 `Liftoff` — Core UI, Astro + EmDash Content & Dogfooding Docs (`@lsui/liftoff`)

### Part 10.1: Build styled Core UI components (`Input`, `Card`, `Badge`, `Dialog`, `Popover`, `Tabs`, `Select`)
- [x] **Status:** Complete — blanket authorization covered the design gate; `pnpm test` 65/65 passed
- [x] Confirm each new component delegates behavior to a Level 1 primitive and uses only `@layer lsui` semantic tokens (no hex, no Tailwind, no CSS Modules) (F-056).
- [x] Add shared component CSS plus hit-target floors and `@supports` anchor gating consistent with `button.css`.
- [x] Add contract tests asserting `@level liftoff`, `@lsui/origin` delegation, and one-way layer boundaries.
- [x] Verify with `pnpm sync:artifacts && pnpm check:artifacts && pnpm test`. Registry grew to 56 artifacts (16 platform items).

### Part 10.2: Build Astro + EmDash Content & Publishing components (`Prose`, `PortableText`, `Blocks`, `TableOfContents`, `Byline`, `PostCard`, `Pagination`)
- [x] **Status:** Complete — blanket authorization covered the design gate; `pnpm test` 68/68 passed
- [x] Define the two accepted data shapes (`astro:content` and EmDash) and normalize them in one adapter before rendering (F-057).
- [x] Implement the seven components with semantic HTML landmarks, heading order, and keyboard-accessible pagination (native anchors with `rel`).
- [x] Add fixture tests for both data shapes and regenerate docs/registry/figma spec via `pnpm sync:artifacts` (77 artifacts).
- [x] Verify with `pnpm check:artifacts && pnpm typecheck && pnpm test`.

### Part 10.3: Build Documentation UI components (`Callout`, `CodeGroup`, `DocsSidebar`, `PrevNext`)
- [x] **Status:** Complete — blanket authorization covered the design gate; `pnpm test` 68/68 passed
- [x] Define accessible patterns for callouts, tabbed code groups, nested navigation, and previous/next links (F-058).
- [x] Implement components in `@lsui/liftoff` with `@layer lsui` styles; `CodeGroup` delegates to `OriginTabs`.
- [x] Add contract tests and verify generated docs pages include the new components (registry 27 platform items).
- [x] Verify with `pnpm test && pnpm check:artifacts`.

### Part 10.4: Dogfood `Liftoff` Docs components into `apps/docs/src/` (remove starter Tailwind UI)
- [x] **Status:** Complete — design gate approved; full verification command passed (see below; F-060)
- [x] Inventory every Nimbus starter component currently used in `apps/docs/src/` and map it to a LightSpeedUI replacement. Remaining: sidebar, tabs, pagination, TOC, page actions, search dialog/trigger and dialog content in `apps/docs/src/components/ui/` still contain Tailwind utility classes.
- [x] Consult `modern-web-guidance` first: searched `command palette search dialog`, `disclosure sidebar navigation`, `table of contents navigation`, `tabs`, `dialog`, `pagination navigation`; retrieved `dialog`, `tabs`, `scrollspy` and consulted `navigation-drawer`. Applied native-dialog rules (no `role="dialog"`/`aria-modal`/manual focus trap, `overscroll-behavior: contain`, feature-detected Invoker Commands) and native scrollspy rules (`scroll-target-group: auto` + `:target-current` with an `IntersectionObserver` fallback).
- [x] Record CSS `scroll-target-group` / `:target-current` (Limited availability: Chrome/Edge 140, unsupported in Firefox/Safari) in `BASELINE.md` §4, ordered oldest → newest, with its feature-detected fallback.
- [x] Add a default slot and pass-through `<nav>` attributes to Liftoff `PrevNext.astro` so it can wrap the docs pager; dogfood `PrevNext` in `Pagination.astro` and Liftoff `DocsSidebar` in `DocsLayout.astro`.
- [x] Convert `DocsLayout.astro`, `TOC.astro`, `MobileTOC.astro`, `Pagination*.astro` to semantic `ne-*` classes in new `styles/chrome-e.css`; keep `<ComponentPreview>` isolation and every Nimbus runtime contract (`virtual:nimbus/*`, Pagefind attrs, `<AgentDirective />`) intact.
- [x] Add `tabindex="-1"` to TOC fragment targets and mirror `.target-current` alongside `aria-current` in `toc.client.ts`.
- [x] Replace the remaining Nimbus starter chrome in `apps/docs/src/components/ui/` with semantic token-styled classes (`chrome-a.css` … `chrome-d.css`) and register `Callout`/`CodeGroup` as MDX globals.
- [x] Remove `@import "tailwindcss"` from `globals.css`, import the five local semantic stylesheets, keep the former `@theme` tokens as plain `:root` custom properties, add a minimal Preflight replacement that preserves `<ComponentPreview>`'s `revert-layer` isolation, and drop `@tailwindcss/vite` + `tailwindcss` from `apps/docs` (lockfile updated; `tailwind-merge` stays because `lib/cn.ts` uses it for class merging).
- [x] Add `tests/e2e/docs-chrome.spec.ts` covering axe-core WCAG 2.2 AA on the full docs chrome, native search-dialog focus return, the mobile sidebar drawer, and TOC/pager semantics.
- [x] Confirm no Tailwind utility classes remain in `apps/docs/src/` and run axe-core on docs chrome, not just previews. Token-aware scan of all `.astro`/`.ts`/`.mdx` found `0` utilities (the only substring hit is Nimbus's non-utility `top-level` marker); `tests/e2e/docs-chrome.spec.ts` runs axe-core WCAG 2.2 AA over the whole page plus both native-dialog states.
- [x] Verify with `pnpm sync:artifacts && pnpm check:artifacts && pnpm build && pnpm typecheck && pnpm typecheck:apps && pnpm --filter @lsui/docs run build && pnpm --filter @lsui/docs run lint:docs && pnpm check:baseline && pnpm test && pnpm test:e2e` — all green: 89 artifacts in sync, 40 docs pages built, 40 files lint clean, Baseline 8/3/2, **68/68 unit** and **13/13 E2E** (4 new docs-chrome tests). Fixed a real Astro duplicate-attribute bug in Liftoff `PrevNext` (resolve `aria-label` before the spread) and a strict-locator bug in the new test. One benign LightningCSS warning about `:target-current` remains (see F-060).

### Phase 11: Level 3 `Landing` — Astro + EmDash Page Blocks & Templates (`@lsui/landing`)

### Part 11.1: Build marketing & editorial blocks (`Hero`, `Features`, `Pricing`, `CTA`, `FAQ`, `Split`)
- [ ] **Status:** Planned — design gate per block
- [ ] Write a design plan for each block: landmarks, heading hierarchy, token usage, and `Liftoff` component composition.
- [ ] Implement blocks in `packages/landing/src/` with strict one-way imports (`Landing → Liftoff → Origin`).
- [ ] Add AST boundary verification and contract tests; regenerate the Landing catalog with `pnpm sync:artifacts`.
- [ ] Verify with `pnpm check:artifacts && pnpm test && pnpm typecheck`.

### Part 11.2: Build `ArticleGrid` & CMS `Blocks` dispatcher supporting both `astro:content` and EmDash schemas
- [ ] **Status:** Planned — design gate first
- [ ] Document the normalizer contract for both CMS shapes, including missing-field fallbacks.
- [ ] Implement `ArticleGrid` and the `Blocks` dispatcher with semantic list/article markup and accessible pagination.
- [ ] Add fixture tests for both schemas and verify no `Landing` import leaks into lower levels.
- [ ] Verify with `pnpm test && pnpm check:artifacts`.

### Part 11.3: Build a complete starter page template demonstrating composition
- [ ] **Status:** Planned — design gate first
- [ ] Compose the new blocks into one starter template using section-level `data-theme`, `data-surface`, and `data-density`.
- [ ] Verify theme switching and nested contexts with Playwright computed-style assertions.
- [ ] Add the template to the playground/docs preview and run full axe-core scan.
- [ ] Verify with `pnpm test:e2e && pnpm check:artifacts`.

### Phase 12: Level 4 `Apogee` — Independent Interactive Experiences (`@lsui/apogee`)

### Part 12.1: Build `<Tour />` guided website tours
- [ ] **Status:** Planned — design gate first
- [ ] Specify step semantics, anchor positioning, top-layer spotlight, keyboard navigation, Escape/dismiss behavior, and `ariaNotify()` announcements.
- [ ] Implement `<Tour />` consuming `@lsui/origin` behaviors without importing `Landing`.
- [ ] Add reduced-motion handling and, **in this Part**, record any Newly Available API, CSS fallback, or polyfill in `BASELINE.md` Sections 1–3 (oldest → newest) with `pnpm check:baseline`.
- [ ] Verify with `pnpm build && pnpm check:baseline && pnpm test && pnpm test:e2e`.

### Part 12.2: Build an accessible Pointer + Keyboard Kanban / Transfer Board
- [ ] **Status:** Planned — design gate first
- [ ] Define drag alternatives (keyboard move commands, `ariaNotify()` confirmations) and focus-management rules before coding.
- [ ] Implement the board with `createRovingFocus()` / `createSelection()` from Part 9 and no direct coupling to `Landing`.
- [ ] Rebuild board columns with `replaceChildren()` so the `mount()` MutationObserver sees one batched childList record and cleans up detached cards; never leave stale listeners in memory.
- [ ] Add pointer and keyboard E2E tests, including move/cancel and focus restoration.
- [ ] Verify with `pnpm test && pnpm test:e2e`.

### Part 12.3: Build a keyboard-driven Spotlight / Command Center compatible with Astro View Transitions
- [ ] **Status:** Planned — design gate first
- [ ] Specify dialog semantics, typeahead, result list ARIA, and cleanup across `astro:before-swap` / `astro:page-load`.
- [ ] If this Part uses CSS View Transitions (Baseline 2025-10-14), add the feature and any fallback to `BASELINE.md` Sections 1–3 **in this Part** and run `pnpm check:baseline`.
- [ ] Implement the experience using `mount()` + `announce()` and verify zero leaked listeners after transitions.
- [ ] Add keyboard-only E2E coverage and record any known limitation in `ACCESSIBILITY.md`.
- [ ] Verify with `pnpm test && pnpm test:e2e`.

### Phase 13: Level-Aware CLI, 3-Stage Upgrades, AI Skill, MCP & Figma Librarian

### Part 13.1: Build `@lsui/cli` (`init`, `add`, `theme install`)
- [ ] **Status:** Planned — design gate first
- [ ] Define `lsui.json` shape and SHA-256 hash recording for copied component files.
- [ ] Implement `lsui init`, `lsui add` (`origin/*`, `liftoff/*`, `landing/*`, `apogee/*`), and `lsui theme install` reading the generated registry JSON.
- [ ] Replace the "planned" install banners in generated docs with working commands once published (see `HY4.md` M-07).
- [ ] Verify with CLI integration tests and `pnpm check:artifacts`.

### Part 13.2: Build 3-stage `@lsui/upgrade` + `@lsui/codemods`
- [ ] **Status:** Planned — design gate first
- [ ] Stage 1: lockstep package bumps with `--dry-run`; Stage 2: hash-checked 3-way component sync/diff; Stage 3: AST transforms, `TODO`s, and `.lsui/UPGRADE.md`.
- [ ] Add fixture-based codemod tests covering user-modified component files.
- [ ] Verify with `pnpm test && pnpm check:artifacts` and a dry-run against a copied consumer app.

### Part 13.3: Package `@lsui/skill` and `@lsui/mcp`
- [ ] **Status:** Planned — design gate first
- [ ] Bundle the installable AI Skill from the generated agent context files.
- [ ] Implement the multi-level MCP server exposing component props, tokens, and registry data.
- [ ] Verify MCP tool listing and one end-to-end inspection query; update `FIGMA.md`/docs links as needed.

### Part 13.4: Finalize the release-gated `@lsui/figma-sync` Librarian
- [ ] **Status:** Planned — design gate first
- [ ] Add version-history checkpoints for Figma Variables and Component Sets across the full catalog.
- [ ] Remove hardcoded icon/showcase values in favor of token-driven generation (see `HY4.md` L-11).
- [ ] Verify idempotent re-sync against a test Figma file and document the release gate in `FIGMA.md`.
