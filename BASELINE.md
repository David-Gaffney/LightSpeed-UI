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
| 2025-01-27 | Popover | https://webstatus.dev/features/popover | Active polyfill (`@oddbird/popover-polyfill`) | `packages/origin/src/polyfills.ts`, `packages/origin/src/primitives/button/Button.astro`, `packages/origin/src/primitives/popover/Popover.astro` |
| 2025-10-14 | View transitions | https://webstatus.dev/features/view-transitions | Progressive enhancement (snaps without animation) | `apps/docs/src/styles/globals.css` |
| 2025-12-12 | Invoker commands | https://webstatus.dev/features/invoker-commands | Active polyfill (`invokers-polyfill`) | `packages/origin/src/polyfills.ts`, `packages/origin/src/primitives/button/Button.astro`, `packages/origin/src/primitives/popover/Popover.astro` |
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
| 2025-01-27 | Popover | https://webstatus.dev/features/popover | `@oddbird/popover-polyfill` (conditional: `!Object.hasOwn(HTMLElement.prototype, "popover")`) | `packages/origin/src/polyfills.ts`, `packages/origin/src/primitives/button/Button.astro`, `packages/origin/src/primitives/popover/Popover.astro` |
| 2025-12-12 | Invoker commands | https://webstatus.dev/features/invoker-commands | `invokers-polyfill` (conditional: `!("commandForElement" in HTMLButtonElement.prototype)`) | `packages/origin/src/polyfills.ts`, `packages/origin/src/primitives/button/Button.astro`, `packages/origin/src/primitives/popover/Popover.astro` |

---

## 4. Limited-Availability Features (Not Yet Baseline)

Features used behind feature detection with an explicit fallback. These are **NOT** *Baseline Newly Available* and must not be treated as safe without the fallback. Promote a row to Section 1 when it becomes Newly Available; retire the fallback when it becomes Widely Available. This section is tracked for awareness and is intentionally ignored by `pnpm check:baseline`, which validates Sections 1–3 only.

| First Supported | Feature | Reference | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2025-03 (Chrome 134) / 2025-07 (Firefox 141); unsupported in Safari | `closedby` | `modern-web-guidance` `light-dismiss-a-dialog` | Feature detect `'closedBy' in HTMLDialogElement.prototype`; native light dismiss when supported, press+release-outside geometry fallback otherwise | `packages/origin/src/controllers/dismissable-layer.ts` |
| 2025-09 (Chrome 140 / Edge 140); unsupported in Firefox and Safari | CSS `scroll-target-group` / `:target-current` | `modern-web-guidance` `scrollspy` | Feature detect `CSS.supports('scroll-target-group: auto')`; native active-link styling when supported, `IntersectionObserver` fallback (`.target-current` class) otherwise; visual state mirrored to `aria-current` on `scrollend` | `apps/docs/src/components/ui/toc/TOC.astro`, `apps/docs/src/components/ui/toc/toc.client.ts` |
| 2026-06 (Chrome 150) / 2026-07 (Edge 150); unsupported in Firefox and Safari | `focusgroup` | `modern-web-guidance` `toolbar` (WebStatus entry to verify during implementation) | Feature detect `'focusGroup' in HTMLElement.prototype`; native when supported, `createRovingFocus()` fallback otherwise | `packages/origin/src/controllers/roving-focus.ts` |
| 2026-09 (Safari 27) / 2026-11 (Chrome 157, Edge 157); unsupported in Firefox | CSS Anchor Positioning | `modern-web-guidance` `viewport-aware-dropdowns` | `@supports (position-area: block-end)` progressive enhancement; unsupported browsers keep native centered popover placement. No polyfill package. | `packages/origin/src/primitives/popover/Popover.astro` (hook only); Liftoff (Part 10.1) owns the CSS rules |

