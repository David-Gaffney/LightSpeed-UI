# LightSpeedUI (`lsui`) — Implementation Plan

A phased engineering plan to build **LightSpeedUI** as a **four-level Astro UI Platform** (`Origin` · `Liftoff` · `Landing` · `Apogee`) while enforcing strict architectural and review gates.

---

## Execution & Review Protocol (Mandatory)

1. **Design Plan Before Any Component / Block / Feature**: **Before beginning implementation on any new primitive (`Origin`), component (`Liftoff`), block/template (`Landing`), or experience (`Apogee`), always present its concrete design plan first** (semantics, props, slots, keyboard/screen-reader behavior, `modern-web-guidance` guidance, tokens/variants, and Baseline/polyfill impact) and **wait for user direction and approval**.
2. **Stop After Every Part**: Execution **must stop at the end of every numbered Part** (`Phase X, Part Y`) to show what was built, present verification output, and wait for review before proceeding.
3. **Continuous `FINDINGS.md` & `GUIDE.md` Updates**: Log every architectural decision, tool quirk, browser/AST edge case, and solution in `FINDINGS.md` as we go, and expand [`GUIDE.md`](./GUIDE.md) with verified step-by-step build instructions after completing each numbered Part. [`GUIDE.md`](./GUIDE.md) is the **authoritative source of truth for detailed part status**; this plan only tracks phase-level gates.

---

## Current Agent Handoff Snapshot

> **Detailed status, checkboxes, and per-part verification live in [`GUIDE.md`](./GUIDE.md) § Status & Source of Truth** (13 phases / 48 parts). This section is a high-level summary only; if the two disagree, `GUIDE.md` wins.

- **Repository Root**: `./lsui` (`https://github.com/David-Gaffney/LightSpeed-UI`)
- **Completed**: `GUIDE.md` Phases 1–10 (38/48 parts) = this plan's Phase 0–3 — monorepo/tooling, both apps, tests + `BASELINE.md`, `@lsui/themes`, 4-level split, `Origin`/`Liftoff` button slice, AST pipeline (27 synced artifacts), the live Figma PoC (`cKBop8W8EjLtVKFhSM3XHq`), Origin controllers/primitives, the full Liftoff catalog, and the token-driven docs chrome with zero Tailwind utilities in `apps/docs/src/`.
- **Next Milestone Up**: **`GUIDE.md` Phase 11, Part 1** (this plan's Phase 4, Part 1) — Level 3 `Landing` marketing & editorial blocks.
  - **MANDATORY GATE FIRST**: Present a concrete design plan for each block (`Hero`, `Features`, `Pricing`, `CTA`, `FAQ`, `Split`) — landmarks, heading hierarchy, token usage, `Liftoff` composition, `modern-web-guidance` checks and Baseline impact — and **wait for user direction and approval before writing any code**.
- **Full Verification Command**:
  ```sh
  pnpm sync:artifacts && pnpm check:artifacts && pnpm build && pnpm typecheck && pnpm typecheck:apps && pnpm --filter @lsui/docs run build && pnpm --filter @lsui/docs run lint:docs && pnpm check:baseline && pnpm test && pnpm test:e2e
  ```

---

## Locked Platform Levels & Architectural Decisions

1. **Level 1 — `Origin` (`@lsui/origin`)**: Unstyled accessible `.astro` primitives (`OriginButton`, `OriginLink`, etc.) + headless TypeScript behaviors (`mount()`, `announce()` using Baseline 2026 `Element.ariaNotify()` / `Document.ariaNotify()` with lazy `aria-live` fallback, keyboard handlers, `aria-disabled` focus guards, conditional polyfills, and `buttonAttrs()` / `linkAttrs()` rendering-flexibility helpers). Zero visual CSS.
2. **Level 2 — `Liftoff` (`@lsui/liftoff` + `@lsui/themes`)**: Copy-paste styled `.astro` components (`Button`, `LinkButton`, Core UI, Content/Publishing, Docs) layered strictly atop `Origin`, introducing `@layer lsui` semantic CSS tokens (`Nordic`, `Editorial`), tokenized `--cursor-interactive`, and ambient `data-*` contexts (**no Tailwind**, **no CSS Modules**).
3. **Level 3 — `Landing` (`@lsui/landing`)**: Astro + EmDash CMS page blocks, composed sections, and full-page templates layered strictly atop `Liftoff` (`Origin ← Liftoff ← Landing` strict one-way dependency rule).
4. **Level 4 — `Apogee` (`@lsui/apogee`)**: Independent higher-order interactive experiences beyond standard UI kits (e.g., Guided Website Tours `<Tour />`, Kanban / Sortable Transfer Boards, Spotlight / Command Centers), consuming `@lsui/origin` behaviors without coupling to `Landing`.
5. **Nimbus Docs Section Tabs (`apps/docs`)**: Five dedicated top-header section tabs (**`Overview` · `Origin` · `Liftoff` · `Landing` · `Apogee`**) with scoped per-level sidebars, CSS-isolated `<ComponentPreview>` demos, and Phase 3 dogfooding to eliminate starter Tailwind UI from `apps/docs`.

---

## Non-Negotiable Invariants

1. **Code is the Single Source of Truth**: `.astro` files and CSS token files generate Nimbus docs across all 4 levels, registry manifests, AI Skill, MCP data, `AGENTS.md`, upgrade codemods, and Figma specs—never maintained by hand in parallel.
2. **Deterministic Code-to-Figma Generation**: Styled `Liftoff`/`Landing` TypeScript `Props`, `<slot />`s, and `@lsui/themes` tokens stay strictly parseable for automated Figma MCP sync.
3. **Strict Level Layering**: `Origin ← Liftoff ← Landing` enforced by `@lsui/ast` (lower levels never import higher levels, and `Origin` primitives never carry visual CSS); `Apogee` stays modular and independent.
4. **Baseline 2026, `modern-web-guidance` Audits & 3-Section `BASELINE.md` Ledger**: Consult `modern-web-guidance` before every HTML/CSS/JS task and maintain `BASELINE.md` (Section 1: Newly Available by Baseline Year; Section 2: CSS-Only Fallbacks; Section 3: Active Polyfills — all sorted oldest → newest and verified by `pnpm check:baseline`).
5. **CI Enforces the Full Verification Command**: `.github/workflows/verify.yml` runs the complete command from `GUIDE.md` on every PR and push to `main`; a local run is not a substitute, and the **Full verification** check must be required in branch protection.

---

## Phased Roadmap (Stop After Every Part; Propose Before Every Component/Block)

> Phase-level gates only. The expanded, checkbox-driven 48-part checklist and current status are in [`GUIDE.md`](./GUIDE.md); each phase below points to its detailed Parts there.

### Phase 0: `./lsui` Repo & Tooling Bootstrap
> Detailed steps: [`GUIDE.md`](./GUIDE.md) Phases 1–3 (11 parts).
- [x] **Part 1 — Monorepo, TypeScript & Fixed Changesets** (`GUIDE.md` 1.1–1.4): Initialized `./lsui` (Node `>=26.0.0`, pure ESM, `typescript@7.1.0-beta` + `@astrojs/ts-content-mapper`), package graph, and fixed lockstep Changesets.
- [x] **Part 2 — Scaffold `apps/playground` & `apps/docs` (Nimbus)** (`GUIDE.md` 2.1–2.4): Set up consumer `apps/playground` and Nimbus `apps/docs` with CSS-isolated `<ComponentPreview>` (`@layer base` `revert-layer` + `@scope`) and 5-tab top header (`Overview`, `Origin`, `Liftoff`, `Landing`, `Apogee`).
- [x] **Part 3 — Test Harness & `BASELINE.md` Governance** (`GUIDE.md` 3.1–3.3): Configured Vitest, Playwright + `@axe-core/playwright` WCAG 2.2 AA E2E tests, and 3-section `BASELINE.md` + `pnpm check:baseline` (`--online` `api.webstatus.dev` graduation checker).

---

### Phase 1: Four-Level Foundation, Tokens, `Button` Slice, AST Engine & Figma PoC
> Detailed steps: [`GUIDE.md`](./GUIDE.md) Phases 4–8 (19 parts).
- [x] **Part 1 — Token & Ambient Context CSS Foundation (`@lsui/themes`)** (`GUIDE.md` 4.1–4.4): Built `@layer lsui` reset/tokens/context/base, `light-dark()` color & `<image>` tokens, 6 ambient `data-*` contexts, and `Nordic` & `Editorial` themes (`DESIGN.md` + `TOKENS.md`).
- [x] **Part 2 — `Origin` Foundation + Layered `Button` & `LinkButton` (`@lsui/origin` & `@lsui/liftoff`)** (`GUIDE.md` 5.1–5.4 + 6.1–6.3): Built `Origin` `announce()` (`Element.ariaNotify()` / `Document.ariaNotify()` + `aria-live` fallback), `mount()`, `buttonAttrs()`/`linkAttrs()`, unstyled `OriginButton` & `OriginLink`, and layered `Liftoff` `Button` & `LinkButton` on top.
- [x] **Part 3 — Multi-Level AST Extractor (`@lsui/ast`) & 4-Level `apps/docs` Wiring** (`GUIDE.md` 7.1–7.5): Built `@lsui/ast` (`@astrojs/compiler-rs` + `ts-morph` + PostCSS) enforcing `Origin ← Liftoff ← Landing` boundaries and auto-generating `Origin`/`Liftoff`/`Landing`/`Apogee` docs, level-namespaced registry JSON, `AGENTS.md`/`COMPONENTS.md`/`TOKENS.md`, and `figma-spec.json`.
- [x] **Part 4 — Live 1-Component Figma MCP Proof-of-Concept (`@lsui/figma-sync`)** (`GUIDE.md` 8.1–8.3): Connected to Figma Remote MCP (`https://mcp.figma.com/mcp` `use_figma`), pushed `Primitives` + 4-mode `Theme Colors` (`Nordic`/`Editorial` Light/Dark) + 2-mode `Geometry & Spacing` variables and the 30-variant `Liftoff` `Button` Component Set + Multi-Theme Showcase, and refined `@lsui/ast` (`TEXT_SLOT` vs `SLOT`, explicit variable `scopes` & `var(--...)` `WEB` code syntax).

---

### Phase 2: Level 1 — `Origin` Behavior & Primitive Expansion (`@lsui/origin`)
> Detailed steps: [`GUIDE.md`](./GUIDE.md) Phase 9 (Parts 9.1–9.4).
*(Present design plan for each primitive/controller and get approval before coding)*

- [x] **Part 1 — Focus, Keyboard & Selection Controllers** (`GUIDE.md` 9.1–9.2): Propose and build `createRovingFocus()`, `createFocusTrap()`, `createDismissableLayer()`, `createSelection()`, and `createTypeahead()` in `@lsui/origin` with unit + browser focus tests.
- [x] **Part 2 — Unstyled Overlay, Disclosure & Form Primitives** (`GUIDE.md` 9.3–9.4): Propose and build unstyled `OriginDialog` (`<dialog>` + Invoker Commands), `OriginPopover` (Popover API + Anchor Positioning), `OriginTabs`, `OriginSelect`, and `OriginInput` primitives in `@lsui/origin`, updating `BASELINE.md` and `Origin` docs.

---

### Phase 3: Level 2 — `Liftoff` Styled Component Catalog (`@lsui/liftoff`)
> Detailed steps: [`GUIDE.md`](./GUIDE.md) Phase 10 (Parts 10.1–10.4).
*(Present design plan for each component batch and get approval before coding)*

- [x] **Part 1 — Core UI Components** (`GUIDE.md` 10.1): Propose and build themed `Input`, `Card`, `Badge`, `Dialog`, `Popover`, `Tabs`, and `Select` in `@lsui/liftoff` layered atop `@lsui/origin`.
- [x] **Part 2 — Content & Publishing Components (Astro + EmDash)** (`GUIDE.md` 10.2): Propose and build `Prose`, `PortableText`, `Blocks`, `TableOfContents`, `Byline`, `PostCard`, and `Pagination` verified against both `astro:content` and EmDash data shapes.
- [x] **Part 3 — Documentation Components & `apps/docs` Tailwind Removal** (`GUIDE.md` 10.3–10.4): Propose and build `Callout`, `CodeGroup`, `DocsSidebar`, and `PrevNext` in `@lsui/liftoff`, then dogfood them into `apps/docs/src/` to remove Nimbus's starter Tailwind UI completely.

---

### Phase 4: Level 3 (`Landing`) & Level 4 (`Apogee`) Initial Flagships
> Detailed steps: [`GUIDE.md`](./GUIDE.md) Phases 11–12 (Parts 11.1–12.3).
*(Present design plan for every block, template, and Apogee experience before coding)*

- [ ] **Part 1 — Level 3 `Landing` Blocks & Template (`@lsui/landing`)** (`GUIDE.md` 11.1–11.3): Propose and build Astro + EmDash marketing & publishing blocks (`Hero`, `Features`, `Pricing`, `CTA`, `FAQ`, `ArticleGrid`) + 1 starter page template layered strictly atop `@lsui/liftoff`.
- [ ] **Part 2 — Level 4 `Apogee` Flagship Experiences (`@lsui/apogee`)** (`GUIDE.md` 12.1–12.3): Propose and build initial independent `Apogee` capabilities—starting with Guided Website Tour (`<Tour />` using Anchor Positioning + Popover + `ariaNotify()`) and an accessible Pointer/Keyboard Kanban Transfer Board (`createTransfer` + `ariaNotify()`).

---

### Phase 5: Level-Aware CLI, 3-Stage Upgrades, AI Skill, MCP & Figma Librarian
> Detailed steps: [`GUIDE.md`](./GUIDE.md) Phase 13 (Parts 13.1–13.4).
- [ ] **Part 1 — Level-Aware CLI (`@lsui/cli`)** (`GUIDE.md` 13.1): Build `lsui init`, `lsui add` (`origin/*`, `liftoff/*` default, `landing/*`, `apogee/*`), and `lsui theme install`, recording SHA-256 hashes in `lsui.json` and updating consumer `AGENTS.md`.
- [ ] **Part 2 — 3-Stage `@lsui/upgrade` & Codemods (`@lsui/codemods`)** (`GUIDE.md` 13.2): Implement Stage 1 (lockstep `@lsui/*` package bumps + `--dry-run`), Stage 2 (hash-checked component sync + 3-way merge/diff), and Stage 3 (AST transforms + `TODO`s + `.lsui/UPGRADE.md`).
- [ ] **Part 3 — AI Skill (`@lsui/skill`), Framework MCP (`@lsui/mcp`) & Full Figma Librarian (`@lsui/figma-sync`)** (`GUIDE.md` 13.3–13.4): Ship the installable AI Skill, multi-level MCP server, and release-gated Figma Librarian with version-history checkpoints.