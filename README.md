# LightSpeedUI (`lsui`)

A **four-level Astro-native UI Platform** built on **Web Platform Baseline 2026** for standalone Astro and **EmDash CMS** projects:

1. **Level 1 — `Origin` (`@lsui/origin`)**: Unstyled accessible `.astro` primitives, headless behaviors, keyboard interaction, `ariaNotify()` screen reader announcements, focusable `aria-disabled`, and rendering flexibility.
2. **Level 2 — `Liftoff` (`@lsui/liftoff` + `@lsui/themes`)**: Copy-paste themed `.astro` components layered strictly atop `Origin`, styled inside `@layer lsui` with semantic CSS tokens (zero Tailwind, zero CSS Modules).
3. **Level 3 — `Landing` (`@lsui/landing`)**: Astro + EmDash CMS page blocks, composed sections, and full-page templates layered strictly atop `Liftoff` (`Origin ← Liftoff ← Landing`).
4. **Level 4 — `Apogee` (`@lsui/apogee`)**: Independent higher-order interactive experiences beyond standard UI kits (Guided Website Tours, Kanban boards, Spotlight centers).

## Quick Start — Run the Nimbus Docs Locally

Requires **Node.js `>= 26.0.0`** and **`pnpm`**:

```sh
pnpm install
pnpm build
pnpm dev          # Starts the Nimbus docs site at http://localhost:4321/
```

Then open **<http://localhost:4321/>** in your browser to browse `Overview`, `Origin`, `Liftoff`, `Landing`, and `Apogee` along with live `<ComponentPreview>` demos.

*(To run the standalone Astro consumer sandbox instead, run `pnpm dev:playground` and open <http://localhost:4322/>.)*

## Project Documentation

- **[`GUIDE.md`](./GUIDE.md)** — Beginner-friendly, step-by-step tutorial on how to rebuild the entire LightSpeedUI project from scratch (broken into 13 Phases & 48 bite-sized Parts).
- **[`FIGMA.md`](./FIGMA.md)** — Complete human + AI guide to setting up Figma Remote MCP & skills in OpenCode and syncing code tokens/components to Figma.
- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — Four-level platform model, design inspirations, styling/context rules, Figma sync, and CLI architecture.
- **[`ACCESSIBILITY.md`](./ACCESSIBILITY.md)** — Project accessibility statement, WCAG 2.2 AA target, contributor/agent guardrails, supported environments, known limitations, and barrier reporting process.
- **[`PLAN.md`](./PLAN.md)** — Phased implementation roadmap, review gates, and milestone checklist.
- **[`FINDINGS.md`](./FINDINGS.md)** — Engineering decisions, ecosystem edge cases (including `ariaNotify()` vs. `aria-live`), and solutions discovered during development.
- **[`BASELINE.md`](./BASELINE.md)** — Chronological ledger of *Baseline Newly Available* features, CSS-only fallbacks, and conditional polyfills.

## Workspace Commands

```sh
pnpm dev                        # Start Nimbus docs locally at http://localhost:4321
pnpm dev:playground             # Start Astro playground app at http://localhost:4322
pnpm sync:artifacts             # Generate docs, registry JSON, AGENTS.md & Figma spec from AST
pnpm check:artifacts            # Verify all AST-generated artifacts are in sync
pnpm build                      # Build all @lsui/* packages
pnpm typecheck                  # Type-check packages & root scripts (TS 7.1 + @astrojs/ts-content-mapper)
pnpm typecheck:apps             # Type-check playground & docs Astro apps
pnpm check:baseline             # Validate BASELINE.md ordering, links & polyfill usage
pnpm check:baseline -- --online # Query live api.webstatus.dev for graduated Baseline features
pnpm test                       # Run Vitest unit tests
pnpm test:e2e                   # Run Playwright + axe-core WCAG 2.2 AA E2E tests
```
