# Accessibility

Accessibility is a foundational priority for **LightSpeedUI (`lsui`)**. Because UI primitives and design systems shape every site and application built with them, an accessibility barrier in our code can multiply across dozens of downstream Astro and EmDash CMS projects. We want everyone—including people with disabilities and people using assistive technologies—to be able to use interfaces built with LightSpeedUI, read our documentation, and contribute to the project.

This statement covers the LightSpeedUI component packages (`@lsui/origin`, `@lsui/liftoff`, `@lsui/themes`, `@lsui/landing`, `@lsui/apogee`), our documentation site (`apps/docs`), and our generated Figma design-system assets. It explains our accessibility goals, expectations for human contributors and AI coding agents, supported environments, known limitations, and how to report barriers.

## Priorities

- **Accessibility target:** We design and test toward [Web Content Accessibility Guidelines (WCAG) 2.2 Level AA](https://www.w3.org/TR/WCAG22/) (and selected AAA ergonomics such as 44×44px touch targets). Naming this target guides our engineering decisions; it is **not** a claim of formal, third-party verified conformance.
- **Native HTML semantics first (`@lsui/origin`):** Actions use real `<button type="button">` elements and navigation uses real `<a href>` links—never `<a role="button">` overrides that break screen-reader link lists or browser context menus. Icon-only controls require an accessible label (`aria-label`) enforced at compile time by TypeScript.
- **Keyboard support:** Every interactive primitive and component must be reachable and operable with a keyboard alone (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`, and arrow keys where appropriate), with high-contrast `:focus-visible` outlines and no unintended focus traps. Controls that must remain discoverable while unavailable support focusable `aria-disabled="true"`.
- **Screen reader & dynamic announcement support:** Components maintain a logical reading order, clear programmatic names/states, and language-aware dynamic notifications via Web Platform Baseline 2026 [`ariaNotify()`](https://webstatus.dev/features/arianotify) (`@lsui/origin`'s `announce()`), with an automatic `aria-live` fallback for older browsers so announcements are not silenced inside modal `<dialog>` top layers.
- **Touch targets, text scaling & readability:** Interactive controls maintain at least a `24×24px` target size on fine pointers and automatically expand to at least `44×44px` on coarse touch pointers (`@media (pointer: coarse)`). Themes leave `:root` `font-size` unset so operating-system text scaling (`<meta name="text-scale" content="scale">`) and 200% browser zoom reflow content without clipping.
- **Respecting user visual & motion preferences:** Themes and components adapt to light/dark color schemes (`prefers-color-scheme` and subtree `data-theme`), reduced motion (`prefers-reduced-motion` and `data-motion`), and increased contrast (`prefers-contrast: more` and `data-contrast="more"`), never relying on color alone to convey meaning.

## Contributor expectations

Whether you are contributing by hand or using an AI coding agent, please follow these guardrails on every pull request:

- **Design before coding**
  - Before implementing any new `Origin` primitive, `Liftoff` component, `Landing` block/template, or `Apogee` experience, document its HTML element semantics, ARIA states, keyboard map, focus behavior, and screen-reader announcements in the design proposal (and in the `.astro` frontmatter `@accessibility` and `@keyboard` JSDoc contract so our AST pipeline publishes them automatically).
  - Consult the `modern-web-guidance` best-practices tool first for HTML, CSS, and client-side DOM patterns, and record any *Baseline Newly Available* feature, CSS fallback, or conditional polyfill in [`BASELINE.md`](./BASELINE.md).
- **Automated & interactive testing**
  - Run `pnpm test:e2e` (Playwright + [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) scanning `wcag2a`, `wcag2aa`, and `wcag22aa` across both `Nordic` and `Editorial` light/dark themes) and resolve any flagged violations.
  - Perform a keyboard-only walkthrough on every interactive change:
    - Logical `Tab` / `Shift+Tab` order reaching all interactive controls.
    - Clear `:focus-visible` indicator with sufficient contrast in both light and dark modes.
    - Expected `Enter`, `Space`, `Escape`, and arrow-key behavior, including clean focus restoration when overlays close.
  - Spot-check screen reader announcements (`VoiceOver`, `NVDA`, or `JAWS`) when adding or changing interactive states, custom roles, or `announce()` notifications.
  - Verify flexible sizing (`min-block-size` rather than fixed `height`) so labels do not clip or overlap at 200% text zoom.
- **Documentation and content**
  - Use a logical heading hierarchy without skipping levels (`h1` → `h2` → `h3`).
  - Use real semantic lists (`<ul>`, `<ol>`) and tables with column/row headers.
  - Write unique, descriptive link text (avoid "click here" or "read more").
  - Provide meaningful alternative text for informative images (see the [W3C Alt Decision Tree](https://www.w3.org/WAI/tutorials/images/decision-tree/)) and mark purely decorative icons with `aria-hidden="true"`.

## Reporting accessibility issues

If you run into an accessibility barrier in any LightSpeedUI package, playground demo, or documentation page, please let us know—we treat accessibility reports as valuable expertise, not complaints.

1. **Open an issue** using the [Accessibility issue form](https://github.com/David-Gaffney/LightSpeed-UI/issues/new?template=accessibility.yml) (or open a [blank GitHub issue](https://github.com/David-Gaffney/LightSpeed-UI/issues/new) with the `accessibility` label if the form itself is inconvenient).
2. Share whichever details are easiest for you to include (partial reports are welcome):
   - What you were trying to do and what happened instead.
   - Which component, package, or documentation URL was affected.
   - Steps to reproduce the barrier (for example, keyboard keys pressed or interaction flow).
   - Your operating system, browser, and assistive technology (with versions, if handy).
   - **Optional:** A code snippet, screenshot, or screen recording—never required.

You **never** need to disclose a disability, diagnosis, or personal medical information to report an accessibility issue or request a fix.

### Severity

Maintainers will assign or confirm severity during triage (you do not need to determine this yourself):

- **Critical:** Prevents completing a core task or blocks keyboard/assistive-technology access to a component or page with no workaround (for example, a keyboard trap or an unlabelled interactive control with no way to supply a name).
- **Serious:** Causes major difficulty using a component or reading documentation, though a workaround exists.
- **Moderate:** Creates friction, confusing announcements, or inconsistent focus/contrast behavior, but tasks remain completable.
- **Minor:** Small polish or ergonomics issue with minimal impact on task completion.

### How we respond

- We will acknowledge your report respectfully and constructively.
- We will never ask you to prove or disclose a disability.
- Where possible, we will share an immediate workaround (such as a prop, slot, or CSS token override) while a permanent fix is developed.
- Because downstream projects copy `.astro` markup via our CLI while importing headless behaviors from `@lsui/origin`, we prioritize fixing behavioral/ARIA bugs in `@lsui/origin` and shipping the planned `npx @lsui/upgrade` updates (`GUIDE.md` Phase 13.2) so consumers can pick up accessibility fixes cleanly.
- We will post updates on the issue if timelines or dependencies change, and welcome your confirmation before closing a resolved report.

### Resolution expectations

After triage, we aim for the following target resolution windows (measured from when the issue is opened):

- **Critical:** Within 14–30 days.
- **Serious:** Within 60 days.
- **Moderate:** Within 90 days.
- **Minor:** Within 90 days (or bundled into the next scheduled phase release).

If a fix requires broader architectural work that takes longer than these targets, we will explain why on the issue, document the barrier under [Known limitations](#known-limitations) with any workaround, and share an updated timeline.

## Ownership and maintenance

Accessibility for LightSpeedUI is maintained by **David Gaffney (`@David-Gaffney`)** and the LightSpeedUI maintainers.

### Responsibilities

- Triaging `accessibility`-labeled issues and keeping reporters informed.
- Enforcing accessibility checks in automated tests (`vitest`, `playwright` + `axe-core`, and `@lsui/ast` contract checks).
- Reviewing `ACCESSIBILITY.md` and [`BASELINE.md`](./BASELINE.md) at the end of each roadmap phase in [`PLAN.md`](./PLAN.md) so documented capabilities and limitations stay accurate.

## Supported environments

LightSpeedUI targets **Web Platform Baseline 2026** with progressive enhancement and conditional polyfills tracked in [`BASELINE.md`](./BASELINE.md):

- **Desktop browsers:** Latest two releases of Chrome, Edge, Firefox, and Safari.
- **Mobile browsers:** Latest two releases of Safari on iOS/iPadOS and Chrome on Android.
- **Input methods:** Mouse/trackpad, keyboard-only navigation, touch screens (`pointer: coarse` 44×44px target sizing), and OS zoom / text scaling.
- **Assistive technologies (targeted):** VoiceOver (macOS and iOS), NVDA (Windows), JAWS (Windows), and TalkBack (Android).

**Verification note:** Automated WCAG 2.2 AA `axe-core` scans, computed contrast/target-size assertions, and keyboard activation E2E tests currently run in Chromium via Playwright on every test run (`pnpm test:e2e`). Computed-style assertions additionally check that `[data-surface="inverse"]` focus rings and borders clear 3:1 and that focusable `aria-disabled` labels clear 4:1 in both Nordic and Editorial light/dark modes. Formal manual testing across every browser + screen-reader matrix above has not yet been completed (see below).

## Known limitations

LightSpeedUI is currently in early active development: [`GUIDE.md`](./GUIDE.md) Phases 1–8 (30/48 Parts) are complete and Phases 9–13 are planned (the high-level `PLAN.md` calls these Phase 0–1 complete and Phase 2–5 upcoming). Current known limitations include:

- **Manual screen-reader matrix testing is still in progress:** While `@lsui/origin` (`OriginButton`, `OriginLink`, `announce()`) and `@lsui/liftoff` (`Button`, `LinkButton`) pass automated `@axe-core/playwright` WCAG 2.2 AA scans and Playwright keyboard tests, the library has not yet undergone a comprehensive manual audit across NVDA, JAWS, VoiceOver, and TalkBack.
- **Documentation site chrome (`apps/docs`):** Live `<ComponentPreview>` sandboxes isolate and render LightSpeedUI's own accessible CSS and primitives, but the surrounding documentation layout currently uses `@cloudflare/nimbus-docs` starter UI. Replacing that starter chrome with LightSpeedUI's own pure-CSS documentation components (`DocsSidebar`, `PrevNext`, `Callout`, `CodeGroup`) is tracked in [`GUIDE.md`](./GUIDE.md) (Phase 10, Part 4; high-level `PLAN.md` Phase 3, Part 3).
- **Figma design-system library limitations:** Components and Multi-Theme Showcases generated via [`FIGMA.md`](./FIGMA.md) (`@lsui/figma-sync`) communicate variant states and theme modes visually on the Figma canvas, which does not convey HTML landmarks, keyboard maps, or `ariaNotify()` behavior on its own. Collaborators using the Figma file should pair visual specs with the generated [`COMPONENTS.md`](./COMPONENTS.md) and per-component documentation pages, which list every prop, ARIA rule, and keyboard interaction in text.

If you encounter a barrier not listed here, please [open an accessibility issue](https://github.com/David-Gaffney/LightSpeed-UI/issues/new?template=accessibility.yml).

## Feedback

Accessibility is an ongoing engineering practice, not a one-time checklist. If you have suggestions for improving this `ACCESSIBILITY.md` statement, our automated `axe-core` test coverage, or our `@lsui/origin` primitives, please open an issue or pull request on [GitHub](https://github.com/David-Gaffney/LightSpeed-UI).
