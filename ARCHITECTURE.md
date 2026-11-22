# LightSpeedUI (`lsui`) — Concept & Architecture

An **Astro-native UI platform**—combining open-code component ownership, composable behavior primitives, token-driven themes, content-first components (built for both Astro and **EmDash CMS**), AI-readable design docs, automated Figma sync, and codemod-powered CLI upgrades.

Most UI libraries target React CRUD dashboards and wrap components for Astro as an afterthought. **LightSpeedUI** is built specifically for how Astro is actually used: **content-heavy sites, documentation, blogs, CMS-driven publishing, marketing sites, and developer portals.**

---

## Core Principles

1. **Pure Astro & Pure CSS First**: Written natively as single-file `.astro` components using scoped `<style>` blocks inside `@layer lsui` and semantic CSS custom properties—no React/Vue/Svelte wrappers, no Tailwind dependency, and no CSS Modules.
2. **Zero-JS by Default (Baseline 2026)**: Built on **Web Platform Baseline 2026** (Invoker Commands, Popover API, CSS Anchor Positioning, `@starting-style`, Container Queries, [CSS `light-dark()` image values](https://webstatus.dev/features/light-dark-image)) and audited with the `modern-web-guidance` skill. Every component declares its client cost (`hydration: none | optional | required`), and all Newly Available features, CSS fallbacks, and conditional polyfills are tracked in `BASELINE.md` for easy retirement.
3. **Astro + EmDash Content-First**: First-class primitives for rich text, articles, documentation, and marketing sections—using EmDash CMS naming conventions where Astro has none so components work identically in standalone Astro (`astro:content` / MDX) and Astro + EmDash projects.
4. **Accessible by Default**: WCAG compliance, ARIA patterns, focus management, keyboard navigation, and screen-reader support are built in and documented per component.
5. **AI-Native (Skill + MCP + Docs)**: Ships with a dedicated **AI Skill**, a **Framework MCP Server**, and generated `AGENTS.md` / `DESIGN.md` context so coding agents use LightSpeedUI accurately without guessing.

---

## Inspirations & What We Borrow

| Reference | Core Idea Adopted |
| :--- | :--- |
| **[shadcn/ui](https://ui.shadcn.com/)** | Open-code distribution via CLI registry—installs editable source into your repo with zero vendor lock-in. |
| **[shadcnblocks](https://www.shadcnblocks.com/)** | Full composition hierarchy: primitives → composites → page blocks → complete templates. |
| **[Astryx](https://astryx.atmeta.com/)** | Strict token-only styling, API consistency reviews, [AST codemod upgrades](https://astryx.atmeta.com/blog/astryx-v0-7-0), and [automated Code-to-Figma sync](https://astryx.atmeta.com/blog/who-needs-a-figma-library). |
| **[UI SDK](https://ui-sdk.dev/)** | Composable headless behavior primitives (`createPopover`, `createSelection`, `createRovingFocus`) decoupled from markup. |
| **[Bejamas UI](https://ui.bejamas.com/)** | Pure `.astro` content focus, zero-JS defaults, docs-in-code metadata, registry compatibility, and externalized behavior packages (`@data-slot` pattern). |
| **[Lumos](https://lumosframework.com/)** | Container queries everywhere, `rem`-based scaling, standardized `render={condition}` props, and strict TypeScript unions. |
| **[RicoUI Starter](https://github.com/ricocc/ricoui-astro-starter/)** | `DESIGN.md` and `TOKENS.md` shipped per theme so humans and AI share explicit visual rules. |
| **[Accessible Astro](https://github.com/incluud/accessible-astro-components)** | Accessibility as a headline feature: keyboard maps, ARIA roles, and screen-reader notes on every component page. |
| **[LuckyMedia (`data-*` Pattern)](https://www.luckymedia.dev/blog/astro-tip-stop-hardcoding-theme-logic-into-your-cms-components-use-data-attributes-instead)** | Ambient DOM context (`data-theme`, `data-density`, `data-surface`) via CSS instead of prop-drilling through CMS content trees. |

---

## Architecture

### Hybrid Ownership: Open Markup + Versioned Behavior Engine

Copying raw interaction JS into user projects makes accessibility bugs hard to patch later. Instead, LightSpeedUI splits UI markup from interaction logic:

- **UI Layer (Copied into user repo via CLI)**: `.astro` markup, slots, and scoped `@layer lsui` styles live in `src/components/ui/`. You own and customize them freely.
- **Behavior Layer (`@lsui/behaviors`, installed as a versioned dependency)**: Composable TypeScript primitives handle complex interactivity and accessibility in one place:
  ```ts
  createPopover()
  createSelection()
  createTypeahead()
  createRovingFocus()
  createDialog()
  createTabs()
  ```
  Complex components (`<Select />`, `<Combobox />`, `<Menu />`, `<CommandPalette />`) compose these shared primitives. Fixing a focus or keyboard bug in `@lsui/behaviors` upgrades every component automatically.

### Monorepo Layout (`lsui/`)

```text
lsui/
├── BASELINE.md      # 3-section Baseline ledger (Newly Available by year, CSS Fallbacks, Active Polyfills)
├── apps/
│   ├── docs/        # Auto-generated Astro docs, previews & a11y reference
│   └── playground/  # Consumer Astro app for E2E CLI & component testing
└── packages/
    ├── ast/         # Shared AST parser (@astrojs/compiler + ts-morph + PostCSS)
    ├── behaviors/   # Headless interaction & accessibility primitives (+ polyfill hooks)
    ├── core/        # Official .astro UI, content, and docs components
    ├── blocks/      # Ready-to-use marketing, blog, and docs page sections
    ├── themes/      # Complete design systems (CSS + DESIGN.md + TOKENS.md)
    ├── icons/       # Astro-native icon set
    ├── cli/         # init, add, remove, theme, and upgrade commands
    ├── codemods/    # Versioned AST transforms for automated upgrades
    ├── mcp/         # Consumer MCP server (search/inspect components, tokens, blocks)
    ├── skill/       # Distributable AI Skill (SKILL.md + rules for coding agents)
    └── figma-sync/  # Release-gated Figma MCP "Librarian" sync runner
```

### Web Platform Baseline 2026 & `BASELINE.md` Policy

All HTML, CSS, and client behaviors target **Baseline 2026** and are tested against the **`modern-web-guidance` skill**. A root **`BASELINE.md`** ledger (enforced by `pnpm check:baseline` + live `api.webstatus.dev` checks) tracks three sections sorted **oldest → newest** so items closest to reaching *Widely Available* always sit at the top for easy retirement:
1. **Baseline Newly Available Features Used** — grouped under `Baseline 2024`, `Baseline 2025`, and `Baseline 2026` headers.
2. **CSS-Only Fallbacks** — pure-CSS compatibility blocks where no JS polyfill exists.
3. **Active Polyfills** — conditional JS polyfills loaded only when native browser support is missing.

Every entry records its *Baseline Newly Available* date, **`https://webstatus.dev` feature URL**, fallback/polyfill mechanism, and **exact files where it is used**.

---

## Styling, Tokens & Context Model

Configuration is cleanly divided into four mechanisms, each with one job:

### 1. Design Tokens (CSS Variables) — *Visual Foundation*
Components never hardcode colors, spacing, or radii. Everything derives from semantic tokens (`--color-primary`, `--color-bg`, `--radius-md`, `--space-lg`, `--font-body`) inside `@layer lsui` so consumer overrides always win cleanly without `!important`. Sizing scales smoothly via `rem`, and layout components use **CSS container queries** to adapt to their parent container rather than the viewport.

### 2. Ambient DOM Context (`data-*` Attributes) — *Environment*
Surrounding containers declare ambient context in HTML so nested components—especially CMS-rendered rich text—adapt via CSS without prop-drilling:

```astro
<section data-theme="dark" data-surface="hero" data-density="compact">
  <Heading>Release Notes</Heading>
  <PortableText value={cmsContent} />
  <Button variant="primary">Read Docs</Button>
</section>
```

Standardized context attributes across all components:
`data-theme` · `data-surface` · `data-density` · `data-layout` · `data-motion` · `data-contrast`

### 3. Component Props — *Explicit Configuration*
Component-specific behavior and variants always use typed props—never `data-*` attributes:
- **Consistent API conventions**: Shared prop names (`variant`, `size`, `render={condition}`) across the entire catalog.
- **Strict discriminated types & semantic split**: Separate `<Button>` (in-page `<button>`) and `<LinkButton>` (navigation `<a href>`, never `role="button"`), with invalid prop combinations failing at compile time:
  ```astro
  {/* TypeScript Error: iconOnly requires an explicit aria-label, and href belongs on <LinkButton> */}
  <Button iconOnly>Close</Button>
  <Button href="/pricing">Continue</Button>
  ```

### 4. Slots — *Composition*
Structural layout uses standard Astro slots (`<Card><CardHeader /><CardContent /></Card>`).

---

## Component & Block Catalog (Astro + EmDash Aligned)

Components scale across four levels—**Primitives** (`Button`) → **Composites** (`PricingCard`) → **Blocks** (`Pricing`) → **Templates** (`SaaS Pricing Page`)—aligned with **EmDash CMS** naming conventions where Astro has no built-in equivalent, while working standalone with `astro:content` or plain props:

- **Core UI**: `Button`, `Input`, `Card`, `Badge`, `Dialog`, `Popover`, `Select`, `Combobox`, `Tabs`, `Menu`, `CommandPalette`
- **Content & Publishing**: `Prose`, `PortableText`, `Blocks`, `TableOfContents`, `ReadingTime`, `Byline`, `PostCard`, `Pagination`, `RelatedPosts`, `WidgetArea`, `Comments`, `LiveSearch`
- **Documentation**: `DocsSidebar`, `PrevNext`, `APIEndpoint`, `CodeGroup`, `Callout`
- **Marketing & Page Blocks**: `Hero`, `Features`, `Pricing`, `Testimonials`, `Stats`, `FAQ`, `CTA`, `Split`, `Logos`, `Contact`, `Timeline`, `Changelog`

### Accessibility Documentation Standard
Every component ships with explicit documentation covering:
- **ARIA Pattern** (e.g., `tablist` / `tab` / `tabpanel`)
- **Keyboard Shortcuts** (e.g., `←` `→`, `Home`, `End`, `Esc`)
- **Screen Reader Behavior**
- **Known Limitations**

---

## Themes, Docs-in-Code & AI Workflow

### Complete Design Systems (Not Just Dark Mode)
Themes define an entire visual identity—colors, typography, border radius, spacing, shadows, and motion—installable via CLI (`npx lsui theme install nordic`). Example presets: `Nordic`, `Editorial`, `Corporate`, `Terminal`, `Startup`, `Docs`, `Minimal`.

Each theme ships both styles and human/AI-readable specs:
```text
themes/nordic/
├── theme.css
├── DESIGN.md    # Aesthetic voice (e.g., "Calm, spacious, technical"), typography, shadow rules
└── TOKENS.md    # Semantic token reference and usage rules
```

### Docs-in-Code (Single Source of Truth)
Instead of maintaining separate `.astro`, `.mdx`, and `.stories` files, structured metadata lives directly in the component frontmatter:

```astro
---
/**
 * @title Button
 * @category Actions
 * @hydration none
 * @accessibility keyboard, screen-reader
 */
---
```

Build tooling parses this metadata to automatically generate documentation pages, interactive previews, registry manifests, search indexes, and AI context files.

### AI Skill, Framework MCP & Project Context
AI support operates at three levels, all generated from component AST metadata:
- **AI Skill (`packages/skill`)**: Installable `SKILL.md` teaching coding agents LightSpeedUI's authoring idioms, `data-*` ambient context patterns, token rules, Astro + EmDash usage, and CLI workflows.
- **Framework MCP Server (`@lsui/mcp`)**: Exposes live tools and resources to AI assistants to search the registry, inspect exact component `Props`/slots/a11y contracts, read active theme tokens, and install or validate components without hallucinating APIs.
- **Project-Level Context Files**: Installing or updating components/themes maintains `AGENTS.md`, `DESIGN.md`, `TOKENS.md`, and `COMPONENTS.md` in the user's repo.

---

## Automated Code-to-Figma Sync

Even when teams design primarily in code, Figma remains useful as a rapid exploration sketchpad—as long as maintaining it doesn't become manual busywork that drifts out of sync. Following Astryx's [Figma Library](https://www.figma.com/community/file/1659998707120781098/astryx-library-community) ([blog](https://astryx.atmeta.com/blog/who-needs-a-figma-library), [Figma Librarian spec](https://github.com/meta/astryx/wiki/Night-Watch-Figma-Librarian)), a scheduled AI agent connected to the **Figma MCP server** builds and self-maintains the Figma library from code.

### Operating Guardrails
1. **Release-Gated ("Code is King")**: Syncs only on published stable releases—never per-commit canary churn. Figma mirrors shipped code, never the reverse. The agent parses release notes/changelogs into actionable buckets (*New Component*, *Prop/Variant Change*, *Block Example*, *Token Change*, *Deprecation*, or *No Figma Impact*).
2. **Checkpoint Before Edits**: Saves a mandatory named Figma version-history checkpoint before making changes (aborting to plan-only output if checkpointing fails) so any run is one-click revertible.
3. **Stage, Never Auto-Publish**: Executes component/token updates, preserves non-conflicting designer tweaks, answers or flags unresolved Figma comments against code, and leaves the final **Publish** step to a human reviewer.

### Astro-to-Figma Mapping
Because component metadata and TypeScript props live in `.astro` source, code maps deterministically to native Figma primitives:

| Astro / CSS Pattern | Figma Representation |
| :--- | :--- |
| Union props (`variant`, `size`) | Variant axes |
| Boolean & string props (`disabled`, `label`) | Boolean & Text component properties |
| Constrained component prop (`icon`) | Instance Swap |
| Default `<slot />` & named `<slot name="..." />` | Native Figma **Slots** (never plain frames) |
| Semantic CSS tokens (`--color-*`, `--space-*`) | Figma Variables & Styles |
| Non-visual props (`href`, `render`, `class`) | Skipped |

---

## CLI, Registries & Automated Upgrades

### Federated Registry CLI & Manifest
The CLI installs source code from official, community, CMS, or private company registries using one consistent format, recording installed versions, registries, and original file hashes in `lsui.json`:

```bash
npx lsui add button             # Official primitive
npx lsui add pricing-01         # Official page block
npx lsui add @community/chart   # Community registry
npx lsui add @company/hero      # Private team registry
```

### 3-Stage `npx @lsui/upgrade` Pipeline
Open-code libraries normally make breaking changes painful—and risk copied `.astro` markup drifting out of sync with `@lsui/behaviors`. Running `npx @lsui/upgrade` (ephemerally, like `@astrojs/upgrade`) solves this in three coordinated stages:

1. **Lockstep Package Upgrade (`@astrojs/upgrade` pattern)**: Auto-detects the package manager, supports `--dry-run` and channels (`latest`, `beta`), gates major breaking versions behind a confirmation prompt, and updates `@lsui/behaviors` and `@lsui/icons` together on a shared version number.
2. **Hash-Tracked Component Sync**: Checks installed `.astro` and theme files against `lsui.json` hashes. Unmodified files update automatically; user-customized files are never overwritten—triggering a 3-way merge or diff check instead.
3. **AST Codemods + Tailored `UPGRADE.md` (`Astryx` pattern)**: Uses the same AST pipeline that powers Docs-in-Code and Figma sync (`@astrojs/compiler` + `ts-morph` + PostCSS—never fragile regex) to rewrite unambiguous prop renames, CSS tokens (`--accent` → `--color-accent`), `data-*` context wrappers, and `AGENTS.md`.
   - **Safe fallback for ambiguity**: Never guesses when a transform is ambiguous—inserts an explicit inline `TODO` comment and writes a project-specific `.lsui/UPGRADE.md` checklist so a developer or AI agent can finish remaining edge cases:
     ```astro
     {/* TODO(lsui v1.3): Verify whether variant="primary" or variant="secondary" is intended */}
     <Button />
     ```

---

## Key Differentiators Summary

1. **Content- & publishing-native `.astro` components** aligned with **Astro + EmDash CMS** rather than React dashboards.
2. **Editable `.astro` markup + scoped `@layer lsui` CSS (zero Tailwind)** paired with a versioned UI-SDK-style behavior engine (`@lsui/behaviors`).
3. **Code as the single source of truth**—driving docs, an **AI Skill + Framework MCP**, project context (`DESIGN.md`, `TOKENS.md`, `AGENTS.md`), and **automated Code-to-Figma sync**.
4. **Baseline 2026 + 3-section `BASELINE.md` ledger** audited with `modern-web-guidance`, paired with a **3-stage `npx @lsui/upgrade`** CLI.
