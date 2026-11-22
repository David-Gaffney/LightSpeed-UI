# LightSpeedUI (`lsui`)

An **Astro-native UI platform** built on **Web Platform Baseline 2026** for standalone Astro and **EmDash CMS** projects—combining open-code `.astro` components, composable headless `@lsui/behaviors` primitives, semantic CSS tokens (`@layer lsui`, zero Tailwind), automated Code-to-Figma sync, and 3-stage AST upgrades.

## Project Documentation

- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — Core principles, design inspirations, styling/context model, Figma sync, and CLI architecture.
- **[`PLAN.md`](./PLAN.md)** — Phased implementation roadmap and milestone checklist.
- **[`FINDINGS.md`](./FINDINGS.md)** — Engineering decisions, ecosystem edge cases, and solutions discovered during development.
- **[`BASELINE.md`](./BASELINE.md)** — Chronological ledger of *Baseline Newly Available* features, CSS-only fallbacks, and conditional polyfills.

## Workspace Commands

```sh
pnpm install                  # Install workspace dependencies
pnpm build                    # Build all @lsui/* packages
pnpm typecheck                # Type-check packages & root scripts (TS 7.1 + @astrojs/ts-content-mapper)
pnpm typecheck:apps           # Type-check playground & docs Astro apps
pnpm check:baseline           # Validate BASELINE.md ordering, links & polyfill usage
pnpm check:baseline -- --online # Query live api.webstatus.dev for graduated Baseline features
pnpm test                     # Run Vitest unit tests
pnpm test:e2e                 # Run Playwright + axe-core WCAG 2.2 AA E2E tests
```
