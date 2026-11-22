# LightSpeedUI (`lsui`) — Implementation Plan

A phased engineering plan to build **LightSpeedUI** inside `./lsui` while enforcing four non-negotiable architectural invariants from day one.

---

## Execution & Review Protocol (Mandatory)

1. **Stop After Every Part**: Execution **must stop at the end of every numbered Part** (e.g., after *Phase 0, Part 1*; *Phase 0, Part 2*; *Phase 1, Part 1*, etc.) to present what was built, show verification output, and wait for review/direction before proceeding.
2. **Continuous `FINDINGS.md` Log**: Every architectural decision, tool quirk, browser/AST edge case, and how we solved it must be logged in `FINDINGS.md` as we go, serving as a practical engineering playbook for anyone building a similar system.

---

## Locked Architectural Decisions

- **Name, Scope & Repo**: **LightSpeedUI**, CLI `lsui`, npm scope `@lsui/*`, initialized in `./lsui` (Node `>=26.0.0`, pure ESM `"type": "module"`, `typescript@7.1.0-beta` + `@astrojs/ts-content-mapper`).
- **Component Styling**: Pure `.astro` scoped `<style>` blocks inside `@layer lsui` driven by semantic CSS variables—**no Tailwind** and **no CSS Modules**.
- **CMS & Naming Conventions**: Follow Astro conventions where standard, and **EmDash CMS** naming conventions (`PortableText`, `Blocks`, `Byline`, `PostCard`, `Pagination`, `WidgetArea`, `Hero`, `Features`, `Pricing`, `Testimonials`, `Stats`, `FAQ`, `CTA`, `Split`, `Logos`, `Contact`) wherever Astro has none. Every component works in **both standalone Astro (`astro:content` / MDX / plain props) and Astro + EmDash**.
- **Client Behavior Wiring**: Plain semantic HTML + `data-*` markers wired via a View-Transition-safe `mount()` helper from `@lsui/behaviors` (no Custom Element wrapper tags).
- **Early Auto-Docs (`apps/docs` on Nimbus)**: Stand up `apps/docs` using **[Nimbus](https://nimbus-docs.com/)** (`@cloudflare/nimbus-docs`) for owned `.astro` layouts, `/llms.txt`, `/<slug>/index.md` Markdown routes, and `nimbus-docs check` linting:
  - **Phase 0–2**: Isolate live `<ComponentPreview>` demos from Nimbus's initial Tailwind CSS reset so LightSpeedUI components are tested in a pure CSS environment.
  - **Phase 3 Dogfooding**: Replace Nimbus's scaffolded Tailwind UI components in `apps/docs/src/` with LightSpeedUI's own pure-CSS `DocsSidebar`, `PrevNext`, `TableOfContents`, `Callout`, `CodeGroup`, and `Prose`—eliminating Tailwind from `apps/docs` while keeping Nimbus's routing/search/`llms.txt` plumbing.
- **Early Figma Proof-of-Concept**: Test live **Code → Figma MCP** generation in **Phase 1** on `Button.astro` to uncover AST/token/slot mapping issues immediately, then build the full release-gated Librarian in Phase 5.

---

## Non-Negotiable Invariants

1. **Code is the Single Source of Truth**: `.astro` component files and CSS token files are canonical. Documentation, registry manifests, AI Skill, MCP data, `AGENTS.md`, upgrade codemods, and Figma components are all generated from source—never maintained by hand in parallel.
2. **Deterministic Code-to-Figma Generation**: Component TypeScript `Props`, Astro `<slot />`s, and semantic CSS tokens must stay strictly parseable so an automated Figma MCP runner builds and updates Figma components and variables without guesswork.
3. **Composable UI-SDK-Style Behaviors**: Interactive logic (`createPopover`, `createSelection`, `createRovingFocus`, `createDialog`, `createTabs`) lives in a headless, versioned TypeScript package (`@lsui/behaviors`) decoupled from editable `.astro` markup.
4. **Baseline 2026, `modern-web-guidance` Audits & Strict 3-Section `BASELINE.md` Ledger**:
   - All HTML, CSS, and JS target **Web Platform Baseline 2026** and are consulted/audited with the **`modern-web-guidance` skill** *before* implementation.
   - Root **`BASELINE.md`** (verified by `pnpm check:baseline` and `pnpm check:baseline -- --online`) maintains three sections arranged **oldest *Baseline Newly Available* date at the top → newest at the bottom** so features graduating to *Widely Available* sit at the top for easy retirement:
     1. **Baseline Newly Available Features Used** (grouped under ascending `Baseline 2024`, `Baseline 2025`, `Baseline 2026` headers).
     2. **CSS-Only Fallbacks** (zero-JS CSS fallback rules where no JS polyfill exists).
     3. **Active Polyfills** (conditional JS polyfills; unlisted `*polyfill*` packages/imports fail CI).
   - Every entry lists its *Baseline Newly Available* date, direct `https://webstatus.dev/features/<id>` link, compatibility mechanism, and exact repo file paths.

---

## Target Workspace Structure (`./lsui`)

```text
lsui/
├── BASELINE.md        # 3-section Baseline ledger (Newly Available by year, CSS Fallbacks, Active Polyfills)
├── apps/
│   ├── docs/          # Early Nimbus + Astro docs site auto-driven by packages/ast
│   └── playground/    # Clean consumer Astro (+ EmDash test) app for E2E verification
├── packages/
│   ├── ast/           # Shared parser (@astrojs/compiler + ts-morph + PostCSS)
│   ├── behaviors/     # Headless UI-SDK-style interaction & a11y primitives (@lsui/behaviors)
│   ├── core/          # Canonical .astro components (UI, Content, Docs)
│   ├── blocks/        # Page sections (Hero, Pricing, Features, Split, CTA, FAQ, etc.)
│   ├── themes/        # Token stylesheets + DESIGN.md + TOKENS.md presets (@lsui/themes)
│   ├── icons/         # Astro-native icon set (@lsui/icons)
│   ├── cli/           # lsui init, add, theme, and 3-stage @lsui/upgrade commands
│   ├── codemods/      # Versioned AST transforms & .lsui/UPGRADE.md generator
│   ├── mcp/           # Consumer Framework MCP server (@lsui/mcp)
│   ├── skill/         # Distributable AI Skill (SKILL.md + Astro/EmDash rules)
│   └── figma-sync/    # Figma MCP PoC (Phase 1) + release-gated Librarian (Phase 5)
└── pnpm-workspace.yaml
```

---

## Phased Roadmap (Stop After Every Part)

### Phase 0: `./lsui` Repo & Tooling Bootstrap
**Goal:** Initialize `./lsui` git repo, monorepo workspace, apps, test harness, and governance checks before writing UI code.

- [x] **Part 1 — Monorepo, TypeScript & Fixed Changesets**: Initialize `./lsui` (`git init`, `.gitignore`, `pnpm-workspace.yaml`, strict `tsconfig.base.json` with `typescript@7.1.0-beta` + `@astrojs/ts-content-mapper`), create the `@lsui/*` package skeletons, and configure Changesets as a **fixed lockstep version group**.
- [x] **Part 2 — Scaffold `apps/playground` & `apps/docs` (Nimbus)**: Set up a clean Astro consumer app in `apps/playground` and scaffold `apps/docs` with `@cloudflare/create-nimbus-docs`, adding a CSS-isolated `<ComponentPreview>` wrapper so Nimbus's starter Tailwind styles never bleed into LightSpeedUI demos.
- [x] **Part 3 — Test Harness & `BASELINE.md` Governance**: Configure **Vitest** (unit tests), **Playwright + `@axe-core/playwright`** (E2E + WCAG checks against `apps/playground`), and create `lsui/BASELINE.md` with an automated validator script (`pnpm check:baseline`) verifying ascending Baseline year/date order and `https://webstatus.dev` links.

---

### Phase 1: Authoring Contract, Tokens, AST Engine, Live Docs & `Button` Figma PoC
**Goal:** Prove the entire single-source-of-truth loop—including live docs and live Figma MCP generation—on `Button.astro` and 2 themes before scaling components.

- [x] **Part 1 — Token & Ambient Context CSS Foundation (`@lsui/themes`)**: Consult `modern-web-guidance`, build the `@layer lsui` base reset, semantic token contract (`--color-*`, `--space-*`, `--radius-*`, `--font-*`, plus [CSS `light-dark()` `<image>` tokens](https://webstatus.dev/features/light-dark-image) with zero-JS `image-set()` fallback), `rem` fluid scaling, container-query conventions, ambient DOM context rules (`data-theme`, `data-surface`, `data-density`, `data-contrast`, `data-motion`, `data-layout`), and **2 starter themes** (`Nordic` and `Editorial`) with `DESIGN.md` and `TOKENS.md`.
- [x] **Part 2 — Canonical `.astro` Contract, `Button.astro` & `LinkButton.astro` (`@lsui/core`)**: Define the JSDoc frontmatter contract (`@title`, `@category`, `@hydration`, `@accessibility`), separate `<Button>` vs. `<LinkButton>` semantics (`--cursor-interactive`, `>= 24px`/`44px` hit targets, Baseline 2026 `commandfor`/`popovertarget` triggers + conditional polyfills in `BASELINE.md`), and verify with Playwright/a11y tests in `apps/playground`.
- [x] **Part 3 — Shared AST Extractor (`@lsui/ast`) & Live `apps/docs` Wiring**: Parse `Button.astro` and `LinkButton.astro` (`@astrojs/compiler-rs` + `ts-morph`) and `theme.css` (PostCSS) into a unified Component IR that automatically generates live pages in `apps/docs`, registry JSON, `AGENTS.md` / `COMPONENTS.md` / `TOKENS.md`, and validated Figma Component Spec JSON.
- [ ] **Part 4 — Live 1-Component Figma MCP Proof-of-Concept (`@lsui/figma-sync`)**: Connect to Figma MCP to push `Nordic`/`Editorial` tokens → Figma Variables and `Button.astro` → Figma Component Set (variants, booleans, text, icon swap, native slots), refining the `.astro` authoring contract for any live edge cases found.

---

### Phase 2: Headless Behavior Engine (`@lsui/behaviors`)
**Goal:** Build composable client-side interaction primitives on Baseline 2026 APIs with polyfill fallbacks, accessibility, and Astro View Transitions support.

- [ ] **Part 1 — Lifecycle & Focus Primitives**: Build `mount()` (View-Transition-safe setup/cleanup), `createRovingFocus()`, `createFocusTrap()`, `createDismissableLayer()`, and `createTypeahead()` with unit + browser focus tests.
- [ ] **Part 2 — Overlay & Selection Controllers + Polyfill Wiring**: Build `createDialog()` (native `<dialog>` + Invoker Commands `command`/`commandfor`), `createPopover()` (Popover API + CSS Anchor Positioning), `createTabs()`, and `createSelection()`, wiring any conditional polyfills into `BASELINE.md` and verifying with `modern-web-guidance` + Playwright `axe-core` suites.

---

### Phase 3: Astro + EmDash Vertical Slice (`@lsui/core` & `@lsui/blocks`)
**Goal:** Prove all 4 domains end-to-end across standalone Astro (`astro:content`) and Astro + EmDash CMS, and dogfood LightSpeedUI into `apps/docs`.

- [ ] **Part 1 — Core Static & Interactive UI**: Build `Input`, `Card`, `Badge`, `Dialog`, `Popover`, `Tabs`, and `Select` (composed from `Popover` + `Selection` + `Typeahead` + `RovingFocus`), auto-updating `apps/docs`.
- [ ] **Part 2 — Content & Publishing Components (Astro + EmDash)**: Build `Prose`, `PortableText`, `Blocks`, `TableOfContents`, `Byline`, `PostCard`, and `Pagination`, verified against both `astro:content` entries and EmDash data shapes (`{ id, src, alt }` images, Portable Text, bylines).
- [ ] **Part 3 — Documentation Components & `apps/docs` Tailwind Removal**: Build `Callout`, `CodeGroup`, `DocsSidebar`, and `PrevNext`, then swap them into `apps/docs/src/` to replace Nimbus's starter Tailwind UI so the entire monorepo is 100% Tailwind-free.
- [ ] **Part 4 — Marketing Page Blocks (`@lsui/blocks`)**: Build `Hero`, `Features`, `Pricing`, `CTA`, and `FAQ` blocks responding to ambient `data-theme` / `data-surface` / `data-density` containers.

---

### Phase 4: CLI, Registry & 3-Stage Upgrade Engine
**Goal:** Deliver open-code installation (`npx lsui`) and safe, automated upgrades (`npx @lsui/upgrade`).

- [ ] **Part 1 — `lsui init`, `add`, and `theme install` (`@lsui/cli`)**: Install components/blocks/themes from official or `@scope/name` registries into consumer projects, write SHA-256 hashes to `lsui.json`, and generate consumer `AGENTS.md` / `COMPONENTS.md`.
- [ ] **Part 2 — 3-Stage `@lsui/upgrade` & AST Codemods (`@lsui/codemods`)**: Implement Stage 1 (lockstep `@lsui/*` dependency bumps + `--dry-run`), Stage 2 (hash-checked component sync + 3-way merge/diff for customized files), and Stage 3 (AST transforms + inline `TODO`s + repo-filtered `.lsui/UPGRADE.md`), tested E2E on `apps/playground`.

---

### Phase 5: AI Skill, Framework MCP & Full Release-Gated Figma Librarian
**Goal:** Ship the AI agent ecosystem and promote the Phase 1 Figma PoC into the full release-gated Figma Librarian.

- [ ] **Part 1 — Distributable AI Skill (`@lsui/skill`)**: Generate and validate `SKILL.md` + Astro/EmDash component and theming guides (`npx lsui skill install`).
- [ ] **Part 2 — Consumer Framework MCP Server (`@lsui/mcp`)**: Expose registry search, exact `Props`/slot/a11y/hydration inspection, active theme token lookup, and component validation over MCP.
- [ ] **Part 3 — Full Release-Gated Figma Librarian (`@lsui/figma-sync`)**: Expand the Phase 1 PoC to sync the full catalog on stable releases only, enforcing mandatory Figma version-history checkpoints before edits, preserving non-conflicting designer tweaks, and staging changes for manual Publish.
