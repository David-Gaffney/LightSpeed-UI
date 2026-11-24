# How to Build LightSpeedUI (`lsui`) From Scratch (`GUIDE.md`)

A crystal-clear, step-by-step tutorial for recreating **LightSpeedUI (`lsui`)**—a four-level, Astro-native UI platform built on modern HTML, CSS, TypeScript, and **Web Platform Baseline 2026**.

If you know the basics of **HTML, CSS, JavaScript, TypeScript, Astro, and Node.js**, you can follow this guide from an empty folder and understand *every single piece* of how a modern open-code UI platform, token system, AST compiler pipeline, documentation site, and accessibility test suite fit together.

> **Living Guide Note:** Phases **1 through 8** (30 bite-sized Parts) contain complete, battle-tested instructions for everything built and verified so far. Phases **9 through 13** outline the upcoming milestones and are expanded with verified commands and code as each milestone is completed.

---

## Table of Contents

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

In Phase 1, you will create the monorepo folder structure, configure pure ECMAScript Modules (`"type": "module"`), set up TypeScript 7.1 (the ultra-fast native Go `tsc` compiler), and wire all workspace packages together.

### Part 1.1: Create the Workspace Folder, `pnpm-workspace.yaml` & Root `package.json`

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

In Phase 2, you will create two Astro apps inside `apps/`:
1. **`apps/playground`** (port `4322`) — a minimal, zero-Tailwind Astro app that simulates a real user installing your components.
2. **`apps/docs`** (port `4321`) — your documentation site powered by `@cloudflare/nimbus-docs` (which gives you `/llms.txt`, `/<slug>/index.md`, Pagefind search, and social OG cards out of the box).

### Part 2.1: Build `apps/playground` — Your Clean Astro Test App

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

1. Scaffold Nimbus into `apps/docs`:
   ```bash
   pnpm dlx @cloudflare/create-nimbus-docs@latest apps/docs
   ```
2. **Critical Trap:** `create-nimbus-docs` creates a nested `apps/docs/pnpm-workspace.yaml` with `packages: []`. Delete `apps/docs/pnpm-workspace.yaml` immediately so `pnpm` treats `apps/docs` as part of your root monorepo!
3. Add `"@lsui/origin": "workspace:*"`, `"@lsui/liftoff": "workspace:*"`, `"@lsui/landing": "workspace:*"`, `"@lsui/apogee": "workspace:*"`, `"@lsui/themes": "workspace:*"`, and `"@lsui/icons": "workspace:*"` to `apps/docs/package.json`, add `"typecheck": "astro sync && tsc --noEmit --runExternalCode"`, and add the `contentMappers` block from Part 2.2 to `apps/docs/tsconfig.json`.

**Verify Before Moving On:** Run `pnpm install && pnpm --filter @lsui/docs run build && pnpm typecheck:apps`.

---

### Part 2.4: Isolate Live `<ComponentPreview>` Demos Using CSS `@layer` & `@scope`

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
3. Create **`apps/docs/src/components/ComponentPreview.astro`** rendering `<div class="lsui-preview-stage" data-lsui-preview data-theme={theme} data-surface={surface} data-density={density}><slot /></div>` with `container-type: inline-size` (so container queries work inside previews!), and register `ComponentPreview` in `apps/docs/src/components.ts`.

**Verify Before Moving On:** Place `<ComponentPreview><button type="button">Test</button></ComponentPreview>` in `apps/docs/src/content/docs/index.mdx` and verify in DevTools that the native browser border and padding are intact (not stripped to `0px` by Tailwind Preflight).

---

## Phase 3: Automated Testing & Web Platform Baseline 2026 Governance

### Part 3.1: Set Up Fast Unit Testing with Vitest

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

Modern web features (*Baseline Newly Available*) graduate to *Baseline Widely Available* **30 months** after cross-browser release. Without a tracker, teams leave polyfills and CSS fallbacks in their codebase forever!

1. Create **`BASELINE.md`** at the repo root with 3 tables, each sorted **oldest → newest** from top to bottom (so items at the top are always the next ones ready to delete):
   - **Section 1: Baseline Newly Available Features Used** (grouped under `### Baseline 2024`, `### Baseline 2025`, `### Baseline 2026`).
   - **Section 2: CSS-Only Fallbacks** (e.g., `::-webkit-scrollbar`, `image-set()`).
   - **Section 3: Active Polyfills** (conditional JS polyfills).
2. Create **`scripts/check-baseline.ts`** to validate:
   - Dates are strictly ascending (`YYYY-MM-DD`) and match their `Baseline YYYY` heading.
   - Every `https://webstatus.dev/features/<id>` URL is valid and every `Used In` file path exists.
   - **Reverse scan:** Scans `packages/*/package.json` and `packages/*/src/**/*` to fail CI if anyone installs or imports a `*polyfill*` package without listing it in `BASELINE.md`!
   - **`--online` flag:** Fetches `https://api.webstatus.dev/v1/features/<id>` to alert you when a feature graduates to `widely` available!

**Verify Before Moving On:** Run `pnpm check:baseline` and `pnpm check:baseline -- --online`.

---

## Phase 4: Semantic CSS Tokens, Themes & Ambient DOM Contexts (`@lsui/themes`)

Now you will build LightSpeedUI's pure-CSS styling foundation in `packages/themes`—using semantic CSS custom properties inside `@layer lsui` with **zero Tailwind** and **zero CSS Modules**.

### Part 4.1: Set Up `@layer lsui` Cascade Order, Modern Reset & OS `text-scale` Support

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

1. **Keep `--color-*` custom properties unregistered (do NOT use `@property` with `syntax: '<color>'`)**:
   ```css
   --color-primary: light-dark(var(--color-primary-light), var(--color-primary-dark));
   ```
   > **Why?** `light-dark()` resolves at *computed-value time*. If you register `--color-primary` as `<color>`, `:root` computes it once (say, light blue) and passes that static color down—breaking nested `<section data-theme="dark">` callouts! Keeping `--color-primary-light` and `--color-primary-dark` as explicit variables also lets our AST parser extract both Light and Dark mode columns for Figma without opening a browser!
2. **Always mix colors in `oklab`, never `oklch`**:
   Use `color-mix(in oklab, var(--color-text) 8%, transparent)` — mixing neutral greys in `oklch` hits a Chromium powerless-hue quirk that tints greys pink!
3. **Support Baseline 2026 `light-dark()` `<image>` values (`https://webstatus.dev/features/light-dark-image`)**:
   Pair `light-dark(var(--image-light), var(--image-dark))` with an `@supports not (background-image: light-dark(url("a.png"), url("b.png")))` fallback using `image-set(var(--image-light) var(--lsui-img-light), var(--image-dark) var(--lsui-img-dark))` where the inactive branch resolves to `type("image/do-not-use")` and the active branch is empty whitespace (`--lsui-img-light: ;` — **never** `type("")`, which drops both images!).

---

### Part 4.3: Build the 6 Ambient `data-*` Contexts (Zero Prop-Drilling)

Instead of passing `theme="dark"` or `compact={true}` props down through 10 nested Astro/CMS components, add rules in `@layer lsui.context` (`packages/themes/src/base.css`) for **6 HTML `data-*` attributes** that any parent `<section>`, `<aside>`, or `<body>` can set:

1. **`data-theme`** (`[data-theme~="nordic"]`, `[data-theme~="editorial"]`, `[data-theme~="dark"]`, `[data-theme~="light"]`) — whitespace-matched (`~=`) so `<section data-theme="editorial dark">` switches both palette and color scheme on a single element! Always re-declare `color-scheme`, `background-color`, `color`, `accent-color`, and `caret-color` on scheme overrides.
2. **`data-surface`** (`canvas`, `card`, `muted`, `hero`, `inverse`) — swaps `--color-bg`, `--color-surface`, and `--color-text` for distinct page bands.
3. **`data-density`** (`compact`, `comfortable`, `spacious`) — reassigns `--space-*`, `--control-height-*`, and `--control-pad-inline-*` directly on the container so nested containers always inherit from the closest ancestor.
4. **`data-contrast`** (`more`) — strengthens borders and focus rings (paired with `@media (prefers-contrast: more)`).
5. **`data-motion`** (`reduced`, `none`, `full`) — scales `--duration-*` tokens alongside `@media (prefers-reduced-motion: reduce)`.
6. **`data-layout`** (`container`, `prose`, `full-bleed`) — responsive max-inline-size layout wrappers.

---

### Part 4.4: Create the `Nordic` & `Editorial` Themes + Token Unit Tests

1. Create two complete themes under `packages/themes/src/themes/`:
   - **`nordic/`** (`theme.css`, `DESIGN.md`, `TOKENS.md`) — crisp geometric sans-serif (`IBM Plex Sans` / `Inter`), cool slate neutrals, cobalt primary, `0.5rem` medium radius.
   - **`editorial/`** (`theme.css`, `DESIGN.md`, `TOKENS.md`) — warm paper surfaces, literary serif headings (`Iowan Old Style` / `Charter`), terracotta accent, `0.1875rem` sharp radius.
2. Export `./base.css`, `./nordic.css`, and `./editorial.css` from `packages/themes/package.json`.
3. Add `packages/themes/tests/themes.test.ts` asserting no `:root`/`html` `font-size` rules, no `color-mix(in oklch)`, no `type("")` in `image-set()`, and `clamp()` `max <= 2.5 * min`.

**Verify Before Moving On:** Run `pnpm check:baseline && pnpm test` — all theme contract checks should pass.

---

## Phase 5: Level 1 — `Origin` Unstyled Primitives & Headless Behaviors (`@lsui/origin`)

Now you will build **Level 1 (`Origin`)** inside `packages/origin`. Everything here is **100% unstyled**—its job is semantic HTML, keyboard handling, focus management, screen-reader announcements, and conditional Baseline polyfills.

### Part 5.1: Build `mount()` (View-Transition-Safe Mounter) & Conditional Baseline Polyfills

1. **Why `mount()` instead of `<lsui-button>` Custom Elements?** Wrapping components in custom elements adds extra non-semantic tags to the DOM (which can break CSS Grid/Flexbox children) and fires `connectedCallback` before child HTML finishes streaming.
   Create **`packages/origin/src/mount.ts`**:
   - Queries `document.querySelectorAll(selector)` once DOM is ready, stores cleanup callbacks in a `WeakMap`, cleans up on `astro:before-swap`, and re-mounts on `astro:page-load` so Astro `<ClientRouter />` View Transitions work seamlessly!
2. Install `@oddbird/popover-polyfill` and `invokers-polyfill` in `packages/origin`, create **`packages/origin/src/polyfills.ts`** with feature-detected dynamic `import()` helpers (`!Object.hasOwn(HTMLElement.prototype, "popover")` and `!("commandForElement" in HTMLButtonElement.prototype)`), and log both in `BASELINE.md` Section 3.

---

### Part 5.2: Build `announce()` Using Baseline 2026 `ariaNotify()` + Lazy `aria-live` Fallback

Traditional libraries append hidden `<div aria-live="polite">` nodes to `document.body`. That has two big bugs: screen readers drop messages injected in the same tick the `<div>` mounts, and opening a `<dialog>` with `.showModal()` marks siblings on `document.body` as `inert`—silencing announcements!

Create **`packages/origin/src/announce.ts`** using **Baseline 2026 `ariaNotify()`** (`https://webstatus.dev/features/arianotify`):
1. If `options.target` is a semantic element (not `<html>` or `<body>`) with `typeof target.ariaNotify === "function"`, call `target.ariaNotify(trimmed, { priority: priority === "assertive" ? "high" : "normal" })` (which also inherits the nearest `lang` attribute for screen-reader voice selection!).
2. Otherwise, if `typeof doc.ariaNotify === "function"`, call `doc.ariaNotify(...)`.
3. Otherwise, lazily create a visually-hidden `aria-live` region (`polite` / `assertive`) on `doc.body` and update it inside `requestAnimationFrame` for older browsers. Record `ariaNotify()` (`2026-09-14`) in `BASELINE.md` Section 1!

---

### Part 5.3: Build Focusable `aria-disabled` Guards & Pure Attribute Helpers (`buttonAttrs`, `linkAttrs`)

1. Create **`packages/origin/src/aria-disabled.ts`**:
   - `ensureAriaDisabledGuard()`: Captures `click` and `Enter`/`Space` `keydown` events on `[aria-disabled="true"]` and calls `preventDefault()` + `stopImmediatePropagation()`, keeping disabled toolbar buttons reachable via `Tab` without firing actions.
   - `ensureSimulatedButtonKeys()`: Delegates `Enter` (on `keydown`) and `Space` (on `keyup`, matching native `<button>` behavior!) when a consumer renders `<OriginButton as="span">`.
2. Create **`packages/origin/src/attrs/button-attrs.ts`**:
   - `buttonAttrs(options)`: Returns `{ type: "button", ... }` for native `<button>`, or `{ role: "button", tabindex: 0, "data-lsui-simulated-button": "" }` for `"span" | "div"`. Never allows `"a"`!
   - `linkAttrs(options)`: Returns `{ href }` when active, or `{ href: undefined, role: "link", "aria-disabled": "true" }` when `disabled`—never `role="button"`.

---

### Part 5.4: Build Unstyled `OriginButton` & `OriginLink` `.astro` Primitives + Unit Tests

1. Create **`packages/origin/src/primitives/button/Button.astro`** (`@title OriginButton`, `@level origin`) and **`LinkButton.astro`** (`@title OriginLink`, `@level origin`):
   - Include the structured frontmatter JSDoc header (`@title`, `@level`, `@description`, `@category`, `@hydration`, `@accessibility`, `@keyboard`, `@slots`).
   - Use a TypeScript discriminated union so `iconOnly: true` **requires** `"aria-label": string` at compile time!
   - Render conditional `<script>` blocks (`{hasInvoker && <script>...}`) so plain buttons emit **zero `<script>` tags and 0 bytes of client JS**!
   - Keep **zero `<style>` blocks and zero `.css` imports** in `Origin`.
2. Export `./Button.astro` and `./LinkButton.astro` in `packages/origin/package.json` and add unit tests in `packages/origin/tests/origin.test.ts` testing `buttonAttrs()`, `linkAttrs()`, and `announce()` (`Element.ariaNotify` vs `Document.ariaNotify`).

**Verify Before Moving On:** Run `pnpm build && pnpm typecheck && pnpm check:baseline && pnpm test`.

---

## Phase 6: Level 2 — `Liftoff` First Styled Component Slice (`@lsui/liftoff`)

Now you will layer **Level 2 (`Liftoff`)** on top of `Origin`—adding visual variants, sizes, WCAG target sizing, and reduced-motion polish without duplicating a single line of `Origin`'s behavior logic!

### Part 6.1: Write Shared Token Styles (`button.css`) with Hit-Target Floors & Reduced Motion

Create **`packages/liftoff/src/components/button/button.css`** wrapped inside `@layer lsui { @layer components { ... } }`:
- Use `min-block-size: max(var(--btn-height), var(--target-min-size, 1.5rem))` (never fixed `height`, so multi-line or OS-scaled text never overflows!). `--target-min-size` is `24px` (`1.5rem`, WCAG 2.5.8 AA) on fine pointers and automatically expands to `44px` (`2.75rem`, WCAG 2.5.5) under `@media (pointer: coarse)` in `base.css`.
- Tokenize button cursor as `cursor: var(--cursor-interactive, default)` on `<button>` while keeping `cursor: pointer` on `<a href>`.
- Style `data-variant="primary" | "secondary" | "outline" | "ghost" | "danger"` and `data-size="sm" | "md" | "lg"` using semantic CSS variables exclusively.
- Wrap press scaling (`scale: 0.98`) inside `@media (prefers-reduced-motion: no-preference)` and reset `scale: none` under `:where([data-motion="reduced"], [data-motion="none"])` while keeping subtle color/background transitions intact.

---

### Part 6.2: Layer `<Button>` & `<LinkButton>` Strictly Atop `Origin`

1. Create **`packages/liftoff/src/components/button/Button.astro`** (`@title Button`, `@level liftoff`):
   - Import `OriginButton from "@lsui/origin/Button.astro"` and `"./button.css"`.
   - Accept `variant = "primary"`, `size = "md"`, and forward `data-lsui-button=""`, `data-variant={variant}`, `data-size={size}`, slots (`default`, `icon-start`, `icon-end`), and all `OriginButton` props directly to `<OriginButton>`.
2. Create **`packages/liftoff/src/components/button/LinkButton.astro`** (`@title LinkButton`, `@level liftoff`) wrapping `OriginLink` with the exact same `button.css` variants and sizes.
3. Add contract tests in `packages/liftoff/tests/button-contract.test.ts` verifying `@level liftoff`, `@lsui/origin` delegation, zero hardcoded `#hex` colors, and zero `role="button"` on links.

---

### Part 6.3: Wire Up Playground Demos & End-to-End Accessibility Tests

1. Build two pages in `apps/playground/src/pages/`:
   - `index.astro` — renders `<Button>` and `<LinkButton>` across `Nordic` Light/Dark, `Editorial` Light/Dark, nested `data-surface="hero"` / `"inverse"`, `data-density="compact"`, and themed `light-dark()` hero images.
   - `triggers.astro` — renders declarative `commandfor`/`command="show-modal"` `<dialog>` triggers, `popovertarget` popovers, focusable `aria-disabled="true"` buttons, disabled `LinkButton`s, and `<OriginButton as="span">` wired with `mount()` + `announce()`.
2. Expand `tests/e2e/playground.spec.ts` to verify zero `<script>` tags on `index.astro`, `0` WCAG 2.2 AA `axe-core` violations, `>= 24x24px` desktop targets, `>= 44x44px` coarse-pointer touch targets, and keyboard `Enter` activation on `<OriginButton as="span">`.

**Verify Before Moving On:** Run `pnpm test && pnpm test:e2e`.

---

## Phase 7: AST Single-Source-of-Truth Pipeline (`@lsui/ast`) & 5-Tab Nimbus Docs

In Phase 7, you will build the compiler inside `packages/ast` that reads your `.astro` components and `.css` themes and automatically generates your documentation pages, static CLI registry JSON, AI context files, and Figma sync spec!

### Part 7.1: Parse CSS Tokens & Convert OKLCH Colors to sRGB/Hex (`postcss` + `color.ts`)

1. Install `@astrojs/compiler-rs`, `ts-morph`, and `postcss` in `packages/ast`.
2. Create **`packages/ast/src/color.ts`** implementing pure-math `oklch(...)` → OKLab → linear sRGB → gamma-encoded sRGB `{ r, g, b, a, hex }` conversion (used for both `TOKENS.md` hex previews and Figma `RGBA` variable floats!).
3. Create **`packages/ast/src/parse-css.ts`** using PostCSS to:
   - Extract `--space-*` and `--control-*` dimensions from `base.css` and `--color-*-light` / `--color-*-dark` pairs + `--radius-*` from each theme in `packages/themes/src/themes/*`.
   - Validate component CSS (`validateComponentCss`): fail immediately if any component stylesheet forgets `@layer lsui`, uses a hardcoded `#hex` color, or uses `color-mix(in oklch)`.

---

### Part 7.2: Parse `.astro` Templates & TypeScript `Props` Unions (`@astrojs/compiler-rs` + `ts-morph`)

Create **`packages/ast/src/parse-component.ts`**:
1. Walk `packages/{origin,liftoff,landing,apogee}/src/**/*.astro` and parse each file with Astro 7's native Rust parser (`parse` from `@astrojs/compiler-rs`) in ~0.2ms.
2. Parse the frontmatter JSDoc block (`@title`, `@level`, `@description`, `@category`, `@hydration`, `@accessibility`, `@keyboard`, `@slots`) and verify that every `<slot>` in the template is documented in `@slots` (and vice versa!).
3. Enforce platform boundaries automatically:
   - Throw an error if any `origin` primitive contains `<style>` or imports `.css`.
   - Throw an error if any level imports a package above it (enforcing **`Origin ← Liftoff ← Landing`** while keeping **`Apogee`** independent).
4. Load the frontmatter TypeScript into `ts-morph` to extract every property on `export type Props` (including discriminated unions like `iconOnly: true` → `"aria-label": string`), default values from `const { variant = "primary" } = Astro.props`, SHA-256 file hashes, and deterministic Figma property classifications (`VARIANT`, `BOOLEAN`, `TEXT`, `SKIPPED_NON_VISUAL`).

---

### Part 7.3: Generate Registry JSON, `AGENTS.md`/`COMPONENTS.md`/`TOKENS.md` & `figma-spec.json`

Create **`packages/ast/src/generators.ts`** with four pure generator functions from your parsed AST Intermediate Representation (IR):
1. **`buildDocsMdxByLevel(components)`**: Emits `index.mdx` (`Overview`), `core-goals.mdx` (`Core Goals of <Level>`), and `Catalog` component pages (or `catalog.mdx` for levels whose catalog is still upcoming) across `apps/docs/src/content/{origin,liftoff,landing,apogee}/`.
2. **`buildRegistryArtifacts({ components, monorepoRoot })`**: Emits `apps/docs/public/r/index.json`, level-namespaced `/r/<level>/<slug>.json` manifests (with embedded source files and SHA-256 hashes for future 3-stage CLI upgrades), plus default `/r/<slug>.json` aliases for `Liftoff`.
3. **`buildAiContextFiles({ components, themes })`**: Emits root `AGENTS.md`, `COMPONENTS.md`, and `TOKENS.md`.
4. **`buildFigmaSpec({ components, baseTokens, themes })`**: Emits `packages/figma-sync/generated/figma-spec.json` containing 4-mode color variables (`Nordic Light/Dark`, `Editorial Light/Dark`), geometry variables, and Figma Component Set definitions for styled `Liftoff`/`Landing` components.

---

### Part 7.4: Configure 5 Top-Navbar Section Tabs, Brand Logo & Per-Level Sidebars in Nimbus Docs

1. **Register the 5 content collections** (`docs`, `origin`, `liftoff`, `landing`, `apogee`) in **`apps/docs/src/content.config.ts`** using `docsCollection({ base: "<level>" })`, and add catch-all route files at `apps/docs/src/pages/{origin,liftoff,landing,apogee}/[...slug].astro` using `getCollectionStaticPaths("<level>")` and `getCollectionPage(Astro, "<level>")`.
2. **Register all 5 top-level sections in `apps/docs/astro.config.ts`** (`Overview`, `Origin (Level 1)`, `Liftoff (Level 2)`, `Landing (Level 3)`, `Apogee (Level 4)`) so Nimbus's breadcrumbs, `/llms-full.txt`, and `nimbus-docs check` index every collection.
3. **Scope the left sidebar per active level (`apps/docs/src/lib/sidebar.ts`)**:
   > **Nimbus Gotcha:** Calling `getSidebar(slug, { collection })` alone only swaps trees for `docs-<v>` version collections! Use Nimbus's `getSidebar(currentSlug, { collection, transform })` hook so clicking **Origin** in the top navbar scopes the sidebar to an expanded **`Origin (Level 1)`** group → `Overview`, `Core Goals of Origin`, and an expanded **`Catalog`** group → `OriginButton` & `OriginLink` (and likewise for `Liftoff`, `Landing`, and `Apogee`).
4. **Render the 5 Section Tabs & Project Logo (`TheFrontmatter.svg`) in `apps/docs/src/components/Header.astro`**:
   - Put the vector path and `#EE46DD` brand fill (>= 3.2:1 contrast on both light and dark surfaces, omitting duplicate `<clipPath id>` attributes) into `apps/docs/src/components/logo.ts` so `Logo.astro`, the mobile drawer, `public/favicon.svg`, and build-time social OG cards (`src/pages/og/_card.ts`) all share one logo definition.

---

### Part 7.5: Run `pnpm sync:artifacts` & Full End-to-End Verification

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

In Phase 8, you will push your `@lsui/themes` CSS tokens and `Liftoff` `<Button>` directly from `packages/figma-sync/generated/figma-spec.json` into a live Figma Design file using Figma's Remote MCP server—proving your AST contract works end-to-end before scaling to 20+ components!

### Part 8.1: Connect Figma Remote MCP (`https://mcp.figma.com/mcp`) & Install `skills/`

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

1. Ensure `buildFigmaSpec()` (`packages/ast/src/generators.ts`) emits explicit **variable `scopes`** (`["FRAME_FILL", "SHAPE_FILL"]`, `["TEXT_FILL", "SHAPE_FILL"]`, `["STROKE_COLOR", "FRAME_FILL"]`, `["GAP"]`, `["WIDTH_HEIGHT"]`, `["CORNER_RADIUS"]`) and **`codeSyntax`** (`"var(--color-primary)"`) on every token—never leave Figma's default `ALL_SCOPES`!
2. Create `buildTokensSyncScript(spec)` in **`packages/figma-sync/src/scripts.ts`** to idempotently create or update:
   - **`Primitives`** (`Value` mode, `v.scopes = []` hidden from pickers) holding raw `{ r, g, b, a }` values in `0..1` float range.
   - **`Theme Colors`** (`Nordic Light`, `Nordic Dark`, `Editorial Light`, `Editorial Dark`) aliasing each mode to `Primitives` via `{ type: "VARIABLE_ALIAS", id: primVar.id }` and setting `v.setVariableCodeSyntax("WEB", token.codeSyntax)`.
   - **`Geometry & Spacing`** (`Nordic`, `Editorial` modes) so switching theme mode flips both colors *and* corner radii (`8px` Nordic vs. `3px` Editorial)!
   - Shared Text Styles (`Button / sm`, `Button / md`, `Button / lg`) after awaiting `figma.loadFontAsync({ family: "Inter", style: "Medium" })`.

**Verify Before Moving On:** Execute `buildTokensSyncScript(spec)` via `use_figma` and confirm `32` semantic colors, `24` dimensions, `128` hidden primitives, and `3` text styles return with `planModeLimitReached: false`.

---

### Part 8.3: Build the 30-Variant `Liftoff` `Button` Component Set & 4-Mode Theme Showcase

1. **Crucial AST Mapping Rule (`TEXT_SLOT` vs. `SLOT`)**: Inline interactive controls (`<button>`, `<a>`) use `<slot />` for their visible text label. In `@lsui/ast`, classify inline `default` slots as `"TEXT_SLOT"` so Figma receives a variable-bound `TextNode` wired to a `Label` (`TEXT`) property (`labelNode.componentPropertyReferences = { characters: labelKey }`), reserving `createSlot()` (`"SLOT"`) for container components like `Card` or `Dialog`.
2. Create `buildButtonComponentSyncScript(spec, ledger)` in **`packages/figma-sync/src/scripts.ts`**:
   - Create `16x16` vector `Icon / Plus` and `Icon / ArrowRight` dependency components first (`Tier 0` atoms).
   - Create all **30 variants** (`variant=primary|secondary|outline|ghost|danger` × `size=sm|md|lg` × `disabled=false|true`), binding every fill, stroke, corner radius, `minHeight`, padding, and gap to Figma Variables (`disabled=false|true` automatically renders a native Boolean toggle switch in Figma's Inspector!).
   - Call `addComponentProperty(...)` (`Label`, `Show Icon Start`, `Icon Start`, `Show Icon End`, `Icon End`) on each `ComponentNode` **before** `figma.combineAsVariants(createdVariants, page)`, then position the 30 variants in a `5 × 6` grid and call `buttonSet.resizeWithoutConstraints(...)`.
   - Build a **`Button — Multi-Theme Showcase`** frame next to the Component Set with 4 cards calling `card.setExplicitVariableModeForCollection(...)` for **Nordic Light**, **Nordic Dark**, **Editorial Light**, and **Editorial Dark** (measure widest child and set `showcase.counterAxisSizingMode = "FIXED"` *before* setting `card.layoutSizingHorizontal = "FILL"` to prevent clipping!).

**Verify Before Moving On:** Run `pnpm test` (`packages/figma-sync/tests/figma-sync.test.ts`), execute `buildButtonComponentSyncScript` via `use_figma`, and inspect the returned `1x` showcase screenshot to confirm crisp colors, icons, and corner-radius shifts across all 4 theme modes!

---

## Upcoming Phases (9–13): Living Roadmap

*Each phase below will be expanded into full hands-on step-by-step Parts with verified commands and code as it is implemented and tested.*

### Phase 9: Expanding Level 1 `Origin` — Focus Controllers & Unstyled Primitives (`@lsui/origin`)
- **Part 9.1**: Build `createRovingFocus()` & `createTypeahead()` headless keyboard controllers.
- **Part 9.2**: Build `createFocusTrap()`, `createDismissableLayer()`, and `createSelection()` controllers + programmatic reduced-motion helper.
- **Part 9.3**: Build unstyled `OriginDialog` (`<dialog>` + Invoker Commands) and `OriginPopover` (Popover API + CSS Anchor Positioning).
- **Part 9.4**: Build unstyled `OriginTabs`, `OriginSelect`, and `OriginInput` primitives + `BASELINE.md` & `Origin` docs updates.

### Phase 10: Expanding Level 2 `Liftoff` — Core UI, Astro + EmDash Content & Dogfooding Docs (`@lsui/liftoff`)
- **Part 10.1**: Build styled Core UI components (`Input`, `Card`, `Badge`, `Dialog`, `Popover`, `Tabs`, `Select`) layered atop `@lsui/origin`.
- **Part 10.2**: Build Astro + EmDash Content & Publishing components (`Prose`, `PortableText`, `Blocks`, `TableOfContents`, `Byline`, `PostCard`, `Pagination`).
- **Part 10.3**: Build Documentation UI components (`Callout`, `CodeGroup`, `DocsSidebar`, `PrevNext`).
- **Part 10.4**: Dogfood `Liftoff` Docs components into `apps/docs/src/` to remove Nimbus's starter Tailwind UI completely (100% Tailwind-free monorepo).

### Phase 11: Level 3 `Landing` — Astro + EmDash Page Blocks & Templates (`@lsui/landing`)
- **Part 11.1**: Build marketing & editorial blocks (`Hero`, `Features`, `Pricing`, `CTA`, `FAQ`, `Split`) layered strictly atop `@lsui/liftoff`.
- **Part 11.2**: Build `ArticleGrid` & CMS `Blocks` dispatcher supporting both `astro:content` and EmDash schemas.
- **Part 11.3**: Build a complete starter page template demonstrating section-level `data-theme`, `data-surface`, and `data-density` composition.

### Phase 12: Level 4 `Apogee` — Independent Interactive Experiences (`@lsui/apogee`)
- **Part 12.1**: Build `<Tour />` (Guided Website Tours using CSS Anchor Positioning, top-layer Popover spotlighting, keyboard step navigation, and `ariaNotify()` step announcements).
- **Part 12.2**: Build an accessible Pointer + Keyboard Multi-Column Kanban / Transfer Board powered by `@lsui/origin` roving focus & `announce()`.
- **Part 12.3**: Build a keyboard-driven Spotlight / Command Center compatible with Astro View Transitions.

### Phase 13: Level-Aware CLI, 3-Stage Upgrades, AI Skill, MCP & Figma Librarian
- **Part 13.1**: Build `@lsui/cli` (`lsui init`, `lsui add` across `origin/*`, default `liftoff/*`, `landing/*`, `apogee/*`, and `lsui theme install`) writing SHA-256 hashes into `lsui.json`.
- **Part 13.2**: Build 3-stage `npx @lsui/upgrade` + `@lsui/codemods` (lockstep package bumps + hash-checked 3-way component sync + AST codemods & `.lsui/UPGRADE.md`).
- **Part 13.3**: Package `@lsui/skill` (distributable AI Skill) and `@lsui/mcp` (multi-level component/token inspection MCP server).
- **Part 13.4**: Finalize the release-gated `@lsui/figma-sync` Librarian workflow with version-history checkpoints across the full catalog.
