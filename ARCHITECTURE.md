# LightSpeedUI (`lsui`) — Concept & Four-Level Platform Architecture

An **Astro-native UI Platform** built on **Web Platform Baseline 2026** for standalone Astro and **EmDash CMS** projects.

Rather than flattening everything into one undifferentiated component bag, LightSpeedUI separates concerns across **four distinct platform levels**—from unstyled accessible primitives and headless behaviors up to themed copy-paste components, CMS page blocks, and independent rich experiences.

---

## The Four Platform Levels

Levels 1–3 enforce a **strict one-way dependency chain** (**`Origin ← Liftoff ← Landing`**)—each level adds one clear responsibility on top of the previous level, and lower levels never import from higher levels. Level 4 (**`Apogee`**) sits alongside as an **independent** tier for complex, opt-in interactive experiences.

```text
Level 3: Landing (@lsui/landing)  ──▶  Astro + EmDash blocks, sections & page templates
   ▲  adds page composition & CMS schemas on top of
Level 2: Liftoff (@lsui/liftoff)  ──▶  Copy-paste styled .astro components + @lsui/themes tokens
   ▲  adds theming, semantic tokens & variants on top of
Level 1: Origin  (@lsui/origin)   ──▶  Unstyled .astro primitives + headless behaviors + ariaNotify()


Level 4: Apogee  (@lsui/apogee)   ──▶  Independent higher-order experiences (Website Tours, Kanban, Spotlight)
                                       (consumes @lsui/origin behaviors without coupling to Landing)
```

### Level 1 — `Origin` (`@lsui/origin`)
*Comparable role (Astro-native): **UI SDK + Base UI***
- **Goal**: Unstyled accessible `.astro` primitives and headless TypeScript behaviors with **zero visual CSS opinion**.
- **Responsibilities**:
  - Semantic HTML defaults (`<button type="button">`, genuine `<a href>` without `role="button"` overrides).
  - Headless interaction controllers (`mount()`, roving focus, focus traps, selection, typeahead, drag/transfer).
  - **Screen reader announcements via `announce()`**: Uses **Baseline 2026 `Element.ariaNotify()` / `Document.ariaNotify()`** (<https://webstatus.dev/features/arianotify>) first—avoiding hidden live-region timing races and `inert` `<dialog>` silencing—with an automatic lazy `aria-live` fallback for older browsers.
  - Keyboard interaction, focusable `aria-disabled="true"` guards, conditional Baseline polyfills (`Popover`, `Invoker commands`), and rendering flexibility (`as` tag overrides + pure `buttonAttrs()` / `linkAttrs()` helpers).

### Level 2 — `Liftoff` (`@lsui/liftoff` + `@lsui/themes`)
*Comparable role (Astro-native): **shadcn/ui***
- **Goal**: Copy-paste themed, styled `.astro` components layered strictly atop `Origin` for building sites and apps quickly.
- **Responsibilities**:
  - Wraps `Origin` primitives with `@layer lsui` scoped styles, `variant` / `size` props, and WCAG 2.5.8 / 2.5.5 hit-target floors (`>= 24px` desktop, `>= 44px` touch).
  - Complete token-driven design systems (`Nordic`, `Editorial`, etc., each with `theme.css`, `DESIGN.md`, and `TOKENS.md`) using live `light-dark()` color & `<image>` tokens—**no Tailwind** and **no CSS Modules**.
  - Ambient DOM context reactivity (`data-theme`, `data-surface`, `data-density`, `data-contrast`, `data-motion`, `data-layout`) so nested subtrees adapt without prop-drilling.
  - Covers Core UI, Content/Publishing (`Prose`, `PortableText`, `Byline`, `PostCard`, `Pagination`), and Documentation (`Callout`, `CodeGroup`, `DocsSidebar`, `PrevNext`).

### Level 3 — `Landing` (`@lsui/landing`)
*Comparable role (Astro-native): **shadcnblocks***
- **Goal**: Ready-to-drop page sections, CMS blocks, and complete page templates layered strictly atop `Liftoff`.
- **Responsibilities**:
  - Marketing, blog, and documentation page sections (`Hero`, `Features`, `Pricing`, `Testimonials`, `Stats`, `FAQ`, `CTA`, `Split`, `Logos`, `Contact`) aligned with **EmDash CMS** block conventions while working identically in standalone Astro (`astro:content`).
  - Full-page layouts and starter templates.

### Level 4 — `Apogee` (`@lsui/apogee`)
*Independent higher-order capabilities beyond standard UI kits*
- **Goal**: Self-contained, opt-in interactive experiences and site enhancements that don't belong in primitive/component/block tiers.
- **Examples**:
  - **Guided Website Tours (`<Tour />`)** — multi-step CSS-anchored walkthroughs with top-layer spotlighting, keyboard navigation, and `ariaNotify()` step announcements.
  - **Kanban & Sortable Transfer Boards** — pointer + keyboard multi-column boards with `ariaNotify()` pickup/move/drop announcements.
  - **Spotlight / Command Centers & Reading Companions**.

---

## Core Principles

1. **Pure Astro & Pure CSS First**: Single-file `.astro` templates styled inside `@layer lsui` with semantic CSS custom properties—never React/Vue/Svelte wrappers in disguise, no Tailwind dependency, and no CSS Modules.
2. **Zero-JS by Default (Baseline 2026)**: Built on **Web Platform Baseline 2026** (Invoker Commands, Popover API, CSS Anchor Positioning, `@starting-style`, Container Queries, `ariaNotify()`, [CSS `light-dark()` image values](https://webstatus.dev/features/light-dark-image)) and audited with `modern-web-guidance`. Every component declares `hydration: none | optional | required`, and all Newly Available features, CSS fallbacks, and conditional polyfills are tracked in `BASELINE.md`.
3. **Astro + EmDash Content-First**: Uses EmDash CMS naming conventions where Astro has none so components and blocks work seamlessly in both standalone Astro and Astro + EmDash projects.
4. **Code as the Single Source of Truth**: `.astro` files and CSS token files drive Nimbus docs (with dedicated header tabs per level), registry JSON, `AGENTS.md`, AI Skill, Framework MCP, upgrade codemods, and automated Code-to-Figma sync.

---

## Inspirations & What We Borrow

| Reference | Core Idea Adopted |
| :--- | :--- |
| **[UI SDK](https://ui-sdk.dev/) & Base UI** | Inspires **Level 1 (`Origin`)**: composable headless behaviors, keyboard/focus engines, screen reader announcements, and unstyled semantic primitives. |
| **[shadcn/ui](https://ui.shadcn.com/)** | Inspires **Level 2 (`Liftoff`)**: open-code CLI distribution installing editable source into your repo with zero vendor lock-in. |
| **[shadcnblocks](https://www.shadcnblocks.com/)** | Inspires **Level 3 (`Landing`)**: real-world page sections, CMS blocks, and complete page templates. |
| **[Astryx](https://astryx.atmeta.com/)** | Strict token-only styling, API consistency, [AST codemod upgrades](https://astryx.atmeta.com/blog/astryx-v0-7-0), and [automated Code-to-Figma sync](https://astryx.atmeta.com/blog/who-needs-a-figma-library). |
| **[Bejamas UI](https://ui.bejamas.com/)** | Pure `.astro` content focus, zero-JS defaults, docs-in-code metadata, and externalized behavior packages. |
| **[Lumos](https://lumosframework.com/)** | Container queries everywhere, `rem`-based scaling, standardized `render={condition}` props, and strict TypeScript unions. |
| **[RicoUI Starter](https://github.com/ricocc/ricoui-astro-starter/)** | `DESIGN.md` and `TOKENS.md` shipped per theme so humans and AI share explicit visual rules. |
| **[Accessible Astro](https://github.com/incluud/accessible-astro-components)** | Accessibility as a headline feature: keyboard maps, ARIA roles, and screen-reader notes on every component page. |
| **[LuckyMedia (`data-*` Pattern)](https://www.luckymedia.dev/blog/astro-tip-stop-hardcoding-theme-logic-into-your-cms-components-use-data-attributes-instead)** | Ambient DOM context (`data-theme`, `data-density`, `data-surface`) via CSS instead of prop-drilling through CMS content trees. |

---

## Monorepo Layout (`lsui/`)

```text
lsui/
├── BASELINE.md      # 3-section Baseline ledger (Newly Available by year, CSS Fallbacks, Active Polyfills)
├── apps/
│   ├── docs/        # Nimbus + Astro docs with 5 section tabs: Overview, Origin, Liftoff, Landing, Apogee
│   └── playground/  # Consumer Astro app for E2E CLI & component testing
└── packages/
    ├── origin/      # Level 1: Unstyled .astro primitives + headless behaviors + ariaNotify()
    ├── liftoff/     # Level 2: Themed copy-paste .astro components layered atop @lsui/origin
    ├── landing/     # Level 3: Astro + EmDash page blocks & templates layered atop @lsui/liftoff
    ├── apogee/      # Level 4: Independent rich experiences (Tours, Kanban, Spotlight)
    ├── themes/      # Semantic CSS token systems + DESIGN.md + TOKENS.md (Nordic, Editorial)
    ├── icons/       # Astro-native icon set
    ├── ast/         # Shared AST parser (@astrojs/compiler-rs + ts-morph + PostCSS)
    ├── cli/         # lsui init, add, theme, and 3-stage upgrade commands
    ├── codemods/    # Versioned AST transforms & .lsui/UPGRADE.md generator
    ├── mcp/         # Consumer MCP server (search/inspect components, tokens, blocks across levels)
    ├── skill/       # Distributable AI Skill (SKILL.md + Astro/EmDash rules)
    └── figma-sync/  # Release-gated Figma MCP "Librarian" sync runner
```

---

## Styling, Tokens & Context Model (`Liftoff` & `Landing`)

1. **Design Tokens (CSS Variables)**: Everything derives from semantic tokens (`--color-primary`, `--color-bg`, `--radius-md`, `--space-lg`, `--font-body`) inside `@layer lsui`, scaling via `rem` and CSS container queries (`cqi`).
2. **Ambient DOM Context (`data-*` Attributes)**: Containers declare `data-theme` (including combined `data-theme="editorial dark"`), `data-surface`, `data-density`, `data-layout`, `data-motion`, and `data-contrast` so nested CMS/UI content adapts via CSS without prop-drilling.
3. **Component Props**: Component-specific configuration uses strictly typed props (`variant`, `size`, `render={condition}`), separating `<Button>` (`<button>`) from `<LinkButton>` (`<a href>`, never `role="button"`).
4. **Slots**: Structural composition uses standard Astro slots (`default`, `icon-start`, `icon-end`).

---

## Automated Code-to-Figma Sync, CLI & AI Ecosystem

- **Figma Librarian (`@lsui/figma-sync`)**: Release-gated runner over Figma's Remote MCP (`https://mcp.figma.com/mcp` `use_figma`) syncing `@lsui/themes` tokens → Figma Variables and `Liftoff`/`Landing` styled components → Figma Component Sets (with mandatory version-history checkpoints and human Publish gating).
- **Level-Aware CLI (`@lsui/cli`) — planned in `GUIDE.md` Phase 13.1, not implemented yet**:
  ```bash
  npx lsui add origin/origin-button   # Level 1 unstyled primitive
  npx lsui add button                 # Level 2 Liftoff component (default)
  npx lsui add landing/hero           # Level 3 Landing block
  npx lsui add apogee/tour            # Level 4 Apogee experience
  ```
- **3-Stage `npx @lsui/upgrade` (planned in `GUIDE.md` Phase 13.2, not implemented yet)**: Lockstep `@lsui/*` dependency bumps + `lsui.json` SHA-256 hash-checked component sync + AST codemods & `.lsui/UPGRADE.md`.
- **AI Skill (`@lsui/skill`) + Framework MCP (`@lsui/mcp`) + Root `AGENTS.md`**: Generated directly from `@lsui/ast` so coding agents understand all 4 levels without guessing.
