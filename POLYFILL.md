# LightSpeedUI Polyfill Ledger (`POLYFILL.md`)

All HTML, CSS, and client-side TypeScript in LightSpeedUI target **Web Platform Baseline 2026** and are audited with the `modern-web-guidance` skill.

Whenever a conditional polyfill is added to bridge browser compatibility for a feature that is not yet *Baseline Widely Available*, it **must** be recorded in the **Active Polyfills** table below.

## Ordering & Retirement Rules (Enforced by `pnpm check:polyfills`)

1. **Oldest → Newest**: Rows **must** be sorted chronologically from the **oldest *Baseline Newly Available* date (`YYYY-MM` or `YYYY-MM-DD`) at the top** descending to the **newest at the bottom**. Because features graduate to *Baseline Widely Available* 30 months after cross-browser support, rows at the top of the table are always the next candidates for removal. (Run `pnpm check:polyfills -- --online` anytime to check live `api.webstatus.dev` status for graduated entries!)
2. **WebStatus Link**: Every row must link directly to its `https://webstatus.dev/features/<feature-id>` page.
3. **Exact Usage Paths**: The `Used In` column must list every repo-relative file path (`packages/...`) that imports or triggers the polyfill, and all listed files must exist on disk.
4. **No Unlisted Polyfills**: Installing or importing any `*polyfill*` package in `packages/*` without a matching entry here fails `pnpm check:polyfills`.

## Active Polyfills

| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2025-01-27 | Popover | https://webstatus.dev/features/popover | `@oddbird/popover-polyfill` (conditional: `!Object.hasOwn(HTMLElement.prototype, "popover")`) | `packages/behaviors/src/polyfills.ts`, `packages/core/src/components/button/Button.astro` |
| 2025-12-12 | Invoker commands | https://webstatus.dev/features/invoker-commands | `invokers-polyfill` (conditional: `!("commandForElement" in HTMLButtonElement.prototype)`) | `packages/behaviors/src/polyfills.ts`, `packages/core/src/components/button/Button.astro` |

## CSS-Only Fallbacks (No JS Polyfill Available)

Features below are *Baseline Newly Available* CSS capabilities where no JavaScript polyfill exists; compatibility is handled via zero-JS CSS fallbacks that can also be removed once they graduate to *Widely Available*:

- **`2026-09-14` — `light-dark()` image values** (<https://webstatus.dev/features/light-dark-image>): Uses pure-CSS `image-set()` MIME-switch fallback (`--lsui-img-light` / `--lsui-img-dark`) in `packages/themes/src/base.css`, `packages/themes/src/themes/nordic/theme.css`, and `packages/themes/src/themes/editorial/theme.css`.
