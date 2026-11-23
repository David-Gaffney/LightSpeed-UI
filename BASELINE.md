# LightSpeedUI Web Platform Baseline Ledger (`BASELINE.md`)

All HTML, CSS, and client-side TypeScript in LightSpeedUI target **Web Platform Baseline 2026** and are audited with the `modern-web-guidance` skill.

Because *Baseline Newly Available* features graduate to *Baseline Widely Available* **30 months** after cross-browser support, everything below is arranged **oldest → newest** from top to bottom. Features at the top of each section are always the next ones to become *Widely Available*, allowing fallbacks and polyfills to be retired cleanly in order.

> **Verification:** Run `pnpm check:baseline` (offline CI check) or `pnpm check:baseline -- --online` (queries live `https://api.webstatus.dev` status and flags any feature that has graduated to *Widely Available*).

---

## 1. Baseline Newly Available Features Used

Every *Baseline Newly Available* web platform feature currently used in the repository, grouped by **Baseline Year** (oldest year at the top, ascending chronologically within each year).

### Baseline 2024

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2024-12-11 | `scrollbar-width` | https://webstatus.dev/features/scrollbar-width | CSS fallback (`::-webkit-scrollbar`) | `apps/docs/src/styles/globals.css` |

### Baseline 2025

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2025-01-27 | Popover | https://webstatus.dev/features/popover | Active polyfill (`@oddbird/popover-polyfill`) | `packages/origin/src/polyfills.ts`, `packages/origin/src/primitives/button/Button.astro` |
| 2025-10-14 | View transitions | https://webstatus.dev/features/view-transitions | Progressive enhancement (snaps without animation) | `apps/docs/src/styles/globals.css` |
| 2025-12-12 | Invoker commands | https://webstatus.dev/features/invoker-commands | Active polyfill (`invokers-polyfill`) | `packages/origin/src/polyfills.ts`, `packages/origin/src/primitives/button/Button.astro` |
| 2025-12-12 | `scrollbar-color` | https://webstatus.dev/features/scrollbar-color | CSS fallback (`::-webkit-scrollbar`) | `apps/docs/src/styles/globals.css` |

### Baseline 2026

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2026-03-24 | `@scope` | https://webstatus.dev/features/scope | Docs preview prose isolation | `apps/docs/src/styles/prose.css` |
| 2026-09-14 | `ariaNotify()` | https://webstatus.dev/features/arianotify | JS fallback (lazy `aria-live` region in `announce()`) | `packages/origin/src/announce.ts` |
| 2026-09-14 | `light-dark()` image values | https://webstatus.dev/features/light-dark-image | CSS fallback (`image-set()` MIME switch) | `packages/themes/src/base.css`, `packages/themes/src/themes/nordic/theme.css`, `packages/themes/src/themes/editorial/theme.css` |

---

## 2. CSS-Only Fallbacks

*Baseline Newly Available* CSS features that have no JavaScript polyfill and use pure-CSS fallback blocks instead (ordered oldest → newest so fallback rules at the top can be deleted first as they reach *Widely Available*).

| Baseline Newly Available | Feature | WebStatus Link | CSS Fallback Mechanism | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2024-12-11 | `scrollbar-width` | https://webstatus.dev/features/scrollbar-width | `@supports not (scrollbar-color: auto)` + `::-webkit-scrollbar` sizing | `apps/docs/src/styles/globals.css` |
| 2025-12-12 | `scrollbar-color` | https://webstatus.dev/features/scrollbar-color | `@supports not (scrollbar-color: auto)` + `::-webkit-scrollbar-thumb` / `track` | `apps/docs/src/styles/globals.css` |
| 2026-09-14 | `light-dark()` image values | https://webstatus.dev/features/light-dark-image | `image-set()` MIME switch (`--lsui-img-light` / `--lsui-img-dark`) + `@supports not` | `packages/themes/src/base.css`, `packages/themes/src/themes/nordic/theme.css`, `packages/themes/src/themes/editorial/theme.css` |

---

## 3. Active Polyfills

Conditional JavaScript polyfills loaded only when native browser support is absent (ordered oldest → newest; installing or importing any unlisted `*polyfill*` package in `packages/*` fails `pnpm check:baseline`).

| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2025-01-27 | Popover | https://webstatus.dev/features/popover | `@oddbird/popover-polyfill` (conditional: `!Object.hasOwn(HTMLElement.prototype, "popover")`) | `packages/origin/src/polyfills.ts`, `packages/origin/src/primitives/button/Button.astro` |
| 2025-12-12 | Invoker commands | https://webstatus.dev/features/invoker-commands | `invokers-polyfill` (conditional: `!("commandForElement" in HTMLButtonElement.prototype)`) | `packages/origin/src/polyfills.ts`, `packages/origin/src/primitives/button/Button.astro` |
