import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  BaseTokensIR,
  ComponentIR,
  FigmaComponentSpec,
  FigmaSpec,
  FigmaVariableScope,
  PlatformLevel,
  RegistryItem,
  ThemeIR,
} from "./types.ts";

/**
 * Flip to `true` only when `@lsui/cli` is published (GUIDE.md Phase 13.1 /
 * PLAN.md Phase 5, Part 1). Until then generated docs must not advertise
 * `npx lsui add` commands that do not exist. This stays the single source of
 * truth for install instructions in every generated component page.
 */
const CLI_INSTALL_AVAILABLE = false;

function inferColorScopes(cssToken: string): FigmaVariableScope[] {
  if (cssToken.startsWith("--color-text") || cssToken.startsWith("--color-on-")) {
    return ["TEXT_FILL", "SHAPE_FILL"];
  }
  if (cssToken.startsWith("--color-border") || cssToken === "--color-ring") {
    return ["STROKE_COLOR", "FRAME_FILL"];
  }
  if (
    cssToken === "--color-info" ||
    cssToken === "--color-success" ||
    cssToken === "--color-warning" ||
    cssToken === "--color-danger"
  ) {
    return ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
  }
  return ["FRAME_FILL", "SHAPE_FILL"];
}

function inferDimensionScopes(cssToken: string): FigmaVariableScope[] {
  if (cssToken.startsWith("--radius-")) return ["CORNER_RADIUS"];
  if (cssToken.startsWith("--control-height-") || cssToken === "--target-min-size") {
    return ["WIDTH_HEIGHT"];
  }
  return ["GAP"];
}

function escapeMdCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function stripQuotes(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/^["']|["']$/g, "");
}

/**
 * Generates the validated Figma Variable & Component Spec JSON consumed by `@lsui/figma-sync`.
 * Only styled visual tiers (`liftoff` and `landing`) produce Figma Component Sets; `origin` is unstyled.
 */
export function buildFigmaSpec(options: {
  components: ComponentIR[];
  baseTokens: BaseTokensIR;
  themes: ThemeIR[];
}): FigmaSpec {
  const { components, baseTokens, themes } = options;

  const colorModes: string[] = [];
  for (const theme of themes) {
    colorModes.push(`${theme.label} Light`, `${theme.label} Dark`);
  }

  const firstTheme = themes[0];
  const colorVariables = (firstTheme?.colors ?? []).map((colorItem) => {
    const valuesByMode: Record<string, typeof colorItem.lightRgba> = {};
    for (const theme of themes) {
      const match = theme.colors.find((c) => c.token === colorItem.token);
      if (!match) {
        throw new Error(
          `Theme "${theme.id}" is missing color token "${colorItem.token}" required for Figma Variable mode parity.`,
        );
      }
      valuesByMode[`${theme.label} Light`] = match.lightRgba;
      valuesByMode[`${theme.label} Dark`] = match.darkRgba;
    }
    return {
      name: colorItem.token.replace(/^--color-/, "color/").replace(/-/g, "/"),
      cssToken: colorItem.token,
      codeSyntax: `var(${colorItem.token})`,
      scopes: inferColorScopes(colorItem.token),
      valuesByMode,
    };
  });

  const dimensionModes = themes.map((t) => t.label);
  const dimensionVariables: FigmaSpec["variableCollections"]["dimensions"]["variables"] =
    [];

  for (const dim of [...baseTokens.spacing, ...baseTokens.controlSizes]) {
    if (dim.pxValue === undefined) continue;
    const valuesByMode: Record<string, number> = {};
    for (const mode of dimensionModes) {
      valuesByMode[mode] = dim.pxValue;
    }
    dimensionVariables.push({
      name: dim.token.replace(/^--/, "").replace(/-/g, "/"),
      cssToken: dim.token,
      codeSyntax: `var(${dim.token})`,
      scopes: inferDimensionScopes(dim.token),
      valuesByMode,
    });
  }

  for (const radius of firstTheme?.radii ?? []) {
    if (radius.pxValue === undefined) continue;
    const valuesByMode: Record<string, number> = {};
    for (const theme of themes) {
      const match = theme.radii.find((r) => r.token === radius.token);
      if (match?.pxValue !== undefined) {
        valuesByMode[theme.label] = match.pxValue;
      }
    }
    dimensionVariables.push({
      name: radius.token.replace(/^--/, "").replace(/-/g, "/"),
      cssToken: radius.token,
      codeSyntax: `var(${radius.token})`,
      scopes: inferDimensionScopes(radius.token),
      valuesByMode,
    });
  }

  const visualComponents = components.filter(
    (c) => c.level === "liftoff" || c.level === "landing",
  );

  const figmaComponents: FigmaComponentSpec[] = visualComponents.map((comp) => {
    const variantAxes = comp.props
      .filter((p) => p.figmaKind === "VARIANT" && p.literalValues)
      .map((p) => ({
        name: p.name,
        values: p.literalValues!,
        defaultValue: stripQuotes(p.defaultValue),
      }));

    const booleanProperties = comp.props
      .filter((p) => p.figmaKind === "BOOLEAN")
      .map((p) => ({
        name: p.name,
        defaultValue: p.defaultValue === "true",
      }));

    const textProperties = comp.props
      .filter((p) => p.figmaKind === "TEXT")
      .map((p) => ({
        name: p.name,
        defaultValue: stripQuotes(p.defaultValue) ?? comp.name,
      }));

    const slots = comp.slots.map((s) => ({
      name: s.name,
      figmaType: s.figmaKind,
      description: s.description,
    }));

    const skippedProps = comp.props
      .filter((p) => p.figmaKind === "SKIPPED_NON_VISUAL")
      .map((p) => ({
        name: p.name,
        reason: p.figmaReason ?? "Non-visual HTML/routing attribute",
      }));

    return {
      name: comp.name,
      slug: comp.slug,
      level: comp.level,
      description: comp.description,
      rootTag: comp.rootTag,
      variantAxes,
      booleanProperties,
      textProperties,
      slots,
      skippedProps,
    };
  });

  return {
    schemaVersion: 1,
    variableCollections: {
      colors: {
        name: "Theme Colors",
        modes: colorModes,
        variables: colorVariables,
      },
      dimensions: {
        name: "Geometry & Spacing",
        modes: dimensionModes,
        variables: dimensionVariables,
      },
    },
    components: figmaComponents,
  };
}

/**
 * Generates level-namespaced static registry JSON manifests (`/r/<level>/<slug>.json` + `/r/<slug>.json` default alias for Liftoff).
 */
export function buildRegistryArtifacts(options: {
  components: ComponentIR[];
  monorepoRoot: string;
}): {
  indexJson: Record<string, unknown>;
  itemsByPath: Record<string, RegistryItem>;
} {
  const { components, monorepoRoot } = options;
  const itemsByPath: Record<string, RegistryItem> = {};

  for (const comp of components) {
    const item: RegistryItem = {
      $schema: "https://lightspeedui.dev/schema/registry-item.json",
      name: `${comp.level}/${comp.slug}`,
      title: comp.name,
      level: comp.level,
      type: comp.level === "landing" ? "registry:block" : "registry:ui",
      description: comp.description,
      category: comp.category,
      hydration: comp.hydration,
      dependencies: comp.dependencies,
      files: comp.files.map((f) => ({
        path: f.path,
        target: `src/components/${comp.level}/${comp.slug}/${f.fileName}`,
        sha256: f.sha256,
        content: readFileSync(path.join(monorepoRoot, f.path), "utf-8"),
      })),
    };

    itemsByPath[`${comp.level}/${comp.slug}.json`] = item;
    if (comp.level === "liftoff") {
      itemsByPath[`${comp.slug}.json`] = item;
    }
  }

  const indexJson = {
    $schema: "https://lightspeedui.dev/schema/registry.json",
    name: "lightspeed-ui",
    homepage: "https://lightspeedui.dev",
    levels: ["origin", "liftoff", "landing", "apogee"],
    items: components.map((c) => ({
      name: `${c.level}/${c.slug}`,
      slug: c.slug,
      title: c.name,
      level: c.level,
      type: c.level === "landing" ? "registry:block" : "registry:ui",
      category: c.category,
      hydration: c.hydration,
      description: c.description,
      dependencies: c.dependencies,
      registryUrl: `/r/${c.level}/${c.slug}.json`,
    })),
  };

  return { indexJson, itemsByPath };
}

/**
 * Generates root AI context files (`AGENTS.md`, `COMPONENTS.md`, `TOKENS.md`) organized by the 4 platform levels.
 */
export function buildAiContextFiles(options: {
  components: ComponentIR[];
  themes: ThemeIR[];
}): {
  agentsMd: string;
  componentsMd: string;
  tokensMd: string;
} {
  const { components, themes } = options;

  const byLevel = (lvl: PlatformLevel) =>
    components
      .filter((c) => c.level === lvl)
      .map(
        (c) =>
          `- **\`<${c.name} />\`** (\`${c.importSpecifier}\`, hydration: \`${c.hydration}\`): ${c.description}`,
      )
      .join("\n") || "- *(Planned — design proposal required before implementation)*";

  const themeList = themes
    .map(
      (t) =>
        `- **\`${t.id}\`** (\`@lsui/themes/${t.id}.css\`): Fonts \`${t.fonts["--font-heading"] ?? "inherit"}\`, medium radius \`${t.radii.find((r) => r.token === "--radius-md")?.rawValue ?? "0.5rem"}\`.`,
    )
    .join("\n");

  const agentsMd = `# LightSpeedUI (\`lsui\`) — AI Agent Guide (\`AGENTS.md\`)

> Auto-generated from platform ASTs via \`pnpm sync:artifacts\`. Do not hand-edit.

## Four-Level Astro Platform Architecture

1. **Level 1 — \`Origin\` (\`@lsui/origin\`)**: Unstyled accessible \`.astro\` primitives + headless TypeScript behaviors (\`announce()\` via \`Element.ariaNotify()\`/\`Document.ariaNotify()\`, \`mount()\`, keyboard navigation, \`aria-disabled\` focus guards, \`buttonAttrs()\`). Zero visual CSS.
2. **Level 2 — \`Liftoff\` (\`@lsui/liftoff\` + \`@lsui/themes\`)**: Copy-paste themed \`.astro\` components layered strictly atop \`Origin\`, styled inside \`@layer lsui\` with semantic CSS tokens and ambient \`data-*\` contexts.
3. **Level 3 — \`Landing\` (\`@lsui/landing\`)**: Astro + EmDash CMS page blocks, composed sections, and full-page templates layered strictly atop \`Liftoff\` (\`Origin <- Liftoff <- Landing\`).
4. **Level 4 — \`Apogee\` (\`@lsui/apogee\`)**: Independent higher-order interactive experiences and site enhancements (Guided Website Tours, Kanban / Transfer Boards, Spotlight Centers).

## Mandatory Engineering & Workflow Rules

1. **Propose Plan Before Any Component / Block / Feature (NEVER SKIP)**: Before writing code for any new primitive (\`Origin\`), component (\`Liftoff\`), block/template (\`Landing\`), or experience (\`Apogee\`), present its concrete design plan first (HTML semantics, props, slots, keyboard/screen-reader behavior, \`modern-web-guidance\` checks, tokens/variants, and Baseline/polyfill impact) and **wait for user direction and approval**.
2. **Stop After Every Numbered Part**: Always stop at the end of each numbered Part in [\`GUIDE.md\`](./GUIDE.md) (authoritative 48-part checklist), mark its checkbox \`[x]\`, show verification results, and wait for user review before continuing. [\`PLAN.md\`](./PLAN.md) holds only high-level phase gates.
3. **Continuous \`FINDINGS.md\`, \`BASELINE.md\` & \`GUIDE.md\` Logging**:
   - Log every architectural decision, ecosystem bug, tool quirk, and fix in [\`FINDINGS.md\`](./FINDINGS.md).
   - Keep [\`GUIDE.md\`](./GUIDE.md) updated with verified, beginner-friendly step-by-step instructions and current checkbox status whenever a new Part is completed; [\`PLAN.md\`](./PLAN.md) tracks phase-level gates only.
   - Invoke the \`modern-web-guidance\` skill **first** for all HTML/CSS/JS tasks (and include the \`### Modern Web Guidance\` disclosure section when it shapes changes).
   - Record every *Baseline Newly Available* feature, CSS fallback, and conditional polyfill in [\`BASELINE.md\`](./BASELINE.md) (sorted oldest -> newest, verified via \`pnpm check:baseline\`).
4. **Pure Astro & Semantic CSS Tokens Only**: Never introduce Tailwind utilities, CSS Modules, or hardcoded hex colors in \`@lsui/*\`. Keep \`--color-*\` custom properties unregistered (for live \`light-dark()\` subtree inheritance), never set \`font-size\` on \`:root\`/\`html\` (for OS \`<meta name="text-scale" content="scale">\`), and always use \`color-mix(in oklab, ...)\` (never \`in oklch\`).
5. **Action vs. Navigation Split**: Use \`Button\` / \`OriginButton\` strictly for in-page actions and \`LinkButton\` / \`OriginLink\` strictly for URL navigation (never \`role="button"\` on \`<a>\`).

## Technical Stack & Verification Gotchas

- **TypeScript 7.1 + \`.astro\` Type-Checking**: Uses \`typescript@7.1.0-beta\` + \`@astrojs/ts-content-mapper\` (with \`patches/@astrojs__ts-content-mapper@0.2.0.patch\` skipping third-party \`node_modules\` \`.astro\` diagnostics). Run \`pnpm typecheck\` and \`pnpm typecheck:apps\`—never add \`@astrojs/check\` or TypeScript 5/6.
- **Artifact Sync & Nimbus Docs Lint Order**: After editing \`.astro\` or \`.css\` files, run \`pnpm sync:artifacts\`, then \`pnpm --filter @lsui/docs run build\` *before* \`pnpm --filter @lsui/docs run lint:docs\` (Nimbus resolves internal links against the built route manifest).
- **Astro 7 Agent Backgrounding**: Always keep \`--ignore-lock\` on \`astro preview\` in \`playwright.config.ts\` so Astro 7 does not auto-daemonize preview servers under agent env vars.
- **Read First**: See [\`GUIDE.md\`](./GUIDE.md) for current status and the authoritative part-by-part checklist, [\`PLAN.md\`](./PLAN.md) for high-level gates, [\`ARCHITECTURE.md\`](./ARCHITECTURE.md) for system design, [\`ACCESSIBILITY.md\`](./ACCESSIBILITY.md) for accessibility commitments & guardrails, [\`FIGMA.md\`](./FIGMA.md) for Figma Remote MCP sync rules, and [\`FINDINGS.md\`](./FINDINGS.md) (\`F-001\`..\`F-039\`+) for solved edge cases.

## Installed Themes
${themeList}

## Components by Level

### Level 1: Origin (\`@lsui/origin\`)
${byLevel("origin")}

### Level 2: Liftoff (\`@lsui/liftoff\`)
${byLevel("liftoff")}

### Level 3: Landing (\`@lsui/landing\`)
${byLevel("landing")}

### Level 4: Apogee (\`@lsui/apogee\`)
${byLevel("apogee")}

See [\`COMPONENTS.md\`](./COMPONENTS.md) for full prop/slot signatures and [\`TOKENS.md\`](./TOKENS.md) for semantic token tables.
`;

  const componentsSections = components
    .map((comp) => {
      const propRows = comp.props
        .filter((p) => !p.forbidden)
        .map((p) => {
          const req = p.required
            ? "Yes"
            : p.conditionalRequirement
              ? p.conditionalRequirement
              : "No";
          return `| \`${p.name}\` | \`${escapeMdCell(p.typeText)}\` | ${p.defaultValue ? `\`${escapeMdCell(p.defaultValue)}\`` : "—"} | ${escapeMdCell(req)} | ${escapeMdCell(p.description)} |`;
        })
        .join("\n");

      const slotRows = comp.slots
        .map(
          (s) =>
            `| \`${s.name}\` | \`${s.figmaKind}\` | ${escapeMdCell(s.description)} |`,
        )
        .join("\n");

      return `## \`${comp.name}\` — Level: \`${comp.level}\` (\`${comp.importSpecifier}\`)

${comp.description}

- **Level**: \`${comp.level}\`
- **Category**: ${comp.category}
- **Root Element**: \`<${comp.rootTag}>\`
- **Hydration**: \`${comp.hydration}\`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
${propRows}

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
${slotRows}
`;
    })
    .join("\n---\n\n");

  const componentsMd = `# LightSpeedUI Component Reference (\`COMPONENTS.md\`)

> Auto-generated from \`.astro\` ASTs via \`pnpm sync:artifacts\`. Do not hand-edit.

${componentsSections}`;

  const colorTokenRows = (themes[0]?.colors ?? [])
    .map((c) => {
      const ed = themes
        .find((t) => t.id === "editorial")
        ?.colors.find((x) => x.token === c.token);
      return `| \`${c.token}\` | \`${c.lightRgba.hex}\` / \`${c.darkRgba.hex}\` | \`${ed?.lightRgba.hex ?? "—"}\` / \`${ed?.darkRgba.hex ?? "—"}\` |`;
    })
    .join("\n");

  const tokensMd = `# LightSpeedUI Semantic Token Reference (\`TOKENS.md\`)

> Auto-generated from \`@lsui/themes\` CSS ASTs via \`pnpm sync:artifacts\`. Do not hand-edit.

## Semantic Color Tokens (Resolved sRGB Hex: Light / Dark)

| CSS Token | Nordic (Light / Dark) | Editorial (Light / Dark) |
| :--- | :--- | :--- |
${colorTokenRows}
`;

  return { agentsMd, componentsMd, tokensMd };
}

function buildComponentDemoBlock(comp: ComponentIR): string {
  if (comp.level === "origin" && comp.name === "OriginButton") {
    return `import OriginButton from "@lsui/origin/Button.astro";

<ComponentPreview title="Origin — Unstyled Native <button> & Tag Flexibility" hydration="${comp.hydration}">
  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;">
    <OriginButton>Unstyled Native Button</OriginButton>
    <OriginButton as="span" style="padding: 0.25rem 0.5rem; border: 1px dashed currentColor;">
      Simulated Span (Enter/Space Accessible)
    </OriginButton>
    <OriginButton aria-disabled="true">Focusable aria-disabled</OriginButton>
  </div>
</ComponentPreview>`;
  }

  if (comp.level === "origin" && comp.name === "OriginLink") {
    return `import OriginLink from "@lsui/origin/LinkButton.astro";

<ComponentPreview title="Origin — Unstyled Semantic <a> & Accessible Disabled Link" hydration="${comp.hydration}">
  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 1rem;">
    <OriginLink href="/liftoff/button/">Active Semantic Link</OriginLink>
    <OriginLink disabled>Disabled Link (role="link" aria-disabled="true")</OriginLink>
  </div>
</ComponentPreview>`;
  }

  if (comp.level === "liftoff" && comp.name === "Button") {
    return `import Button from "@lsui/liftoff/Button.astro";

<ComponentPreview title="Nordic Light — Liftoff Button Variants" theme="nordic light" hydration="${comp.hydration}">
  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
    <Button disabled variant="secondary">Disabled</Button>
  </div>
</ComponentPreview>

<ComponentPreview title="Editorial Dark — Sizes & Icon-Only" theme="editorial dark" hydration="${comp.hydration}">
  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;">
    <Button size="sm" variant="primary">Small</Button>
    <Button size="md" variant="primary">Medium</Button>
    <Button size="lg" variant="primary">Large</Button>
    <Button size="md" variant="outline" iconOnly aria-label="Add item">+</Button>
  </div>
</ComponentPreview>`;
  }

  if (comp.level === "liftoff" && comp.name === "LinkButton") {
    return `import LinkButton from "@lsui/liftoff/LinkButton.astro";

<ComponentPreview title="Nordic Light — Liftoff LinkButton Variants" theme="nordic light" hydration="${comp.hydration}">
  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;">
    <LinkButton href="/liftoff/button/" variant="primary">Button Docs</LinkButton>
    <LinkButton href="/liftoff/button/" variant="secondary">Secondary Link</LinkButton>
    <LinkButton href="/liftoff/button/" variant="outline">Outline Link</LinkButton>
    <LinkButton href="/liftoff/button/" variant="ghost">Ghost Link</LinkButton>
    <LinkButton disabled variant="outline">Disabled Link</LinkButton>
  </div>
</ComponentPreview>`;
  }

  return `import ${comp.name} from "${comp.importSpecifier}";

<ComponentPreview title="${comp.name} Preview" theme="nordic light" hydration="${comp.hydration}">
  <${comp.name}>${comp.name}</${comp.name}>
</ComponentPreview>`;
}

const LEVEL_OVERVIEWS: Record<
  PlatformLevel,
  {
    shortName: string;
    title: string;
    description: string;
    overviewBody: string;
    coreGoalsTitle: string;
    coreGoalsDescription: string;
    coreGoalsBody: string;
    upcomingCatalogBody: string;
  }
> = {
  origin: {
    shortName: "Origin",
    title: "Origin (Level 1)",
    description:
      "Unstyled accessible .astro primitives, headless behaviors, keyboard interaction, and ariaNotify() screen reader announcements.",
    overviewBody: `**Origin (\`@lsui/origin\`)** is Level 1—the Astro-native behavioral and semantic foundation of LightSpeedUI (comparable in role to **UI SDK** and **Base UI**).

It provides unstyled accessible \`.astro\` primitives, headless interaction controllers, and Baseline 2026 \`ariaNotify()\` screen-reader announcements with **zero visual CSS**, serving both standalone bespoke CSS architectures and [Liftoff](/liftoff/) above it.

Read **[Core Goals of Origin](/origin/core-goals/)** for the architectural breakdown of how Origin handles semantics, \`ariaNotify()\`, focusable \`aria-disabled\`, and rendering flexibility.`,
    coreGoalsTitle: "Core Goals of Origin",
    coreGoalsDescription:
      "Why Origin separates unstyled Astro semantics, headless behaviors, and ariaNotify() announcements from visual styling.",
    coreGoalsBody: `**Origin (\`@lsui/origin\`)** establishes the non-visual behavioral and accessibility baseline for the entire LightSpeedUI platform.

## Unstyled Accessible Primitives

Semantic \`.astro\` primitives (\`OriginButton\`, \`OriginLink\`, and upcoming overlays/disclosures) ship with **zero visual CSS** (\`@lsui/ast\` fails the build if an \`Origin\` primitive imports or embeds a \`<style>\` block). Teams with an existing CSS design system can adopt \`Origin\` directly without overriding framework styles.

## Screen Reader Announcements via \`ariaNotify()\`

\`announce(message, { target, priority })\` uses **Baseline 2026 \`Element.ariaNotify()\` / \`Document.ariaNotify()\`** ([webstatus.dev/features/arianotify](https://webstatus.dev/features/arianotify)) as its primary mechanism:

- Emits imperative assistive-technology notifications with **zero hidden live-region DOM nodes** and **zero pre-mount timing races**.
- Works reliably inside top-layer modal \`<dialog>\` and \`[popover]\` elements where background \`document.body\` \`aria-live\` regions become \`inert\` and silenced.
- Calling \`target.ariaNotify()\` on the active element automatically inherits the nearest ancestor \`lang\` attribute for accurate screen-reader voice selection, falling back lazily to a shared \`aria-live\` region in older browsers.

## Keyboard, Focus & \`aria-disabled\` Ergonomics

- **View-Transition-Safe \`mount(selector, setup)\`**: Attaches headless behaviors to plain semantic HTML elements without Custom Element wrapper nodes and cleans up cleanly across Astro \`<ClientRouter />\` swaps.
- **Focusable \`aria-disabled\` Guards**: Preserves keyboard tab reachability on \`aria-disabled="true"\` controls (such as toolbar actions) while blocking pointer and \`Enter\`/\`Space\` activation.
- **Conditional Baseline Polyfills**: Dynamically loads \`@oddbird/popover-polyfill\` or \`invokers-polyfill\` only when declarative trigger attributes are used in browsers lacking native support.

## Rendering Flexibility

Pure attribute builders (\`buttonAttrs()\`, \`linkAttrs()\`) and safe \`as\` tag overrides (\`"button" | "span" | "div"\` with \`Enter\`/\`Space\` delegation) support custom markup constraints while forbidding invalid combinations like \`<a role="button">\`.`,
    upcomingCatalogBody: `Primitives in **Origin (Level 1)** follow a mandatory design-plan review gate before implementation. See \`GUIDE.md\` Phase 9 (Parts 9.1–9.4) for upcoming controllers and overlay/disclosure primitives.`,
  },
  liftoff: {
    shortName: "Liftoff",
    title: "Liftoff (Level 2)",
    description:
      "Copy-paste themed .astro components built strictly atop Origin primitives and semantic CSS tokens.",
    overviewBody: `**Liftoff (\`@lsui/liftoff\` + \`@lsui/themes\`)** is Level 2—where theming, semantic design tokens, and copy-paste styled \`.astro\` components are layered strictly on top of [Origin](/origin/) (comparable in role to **shadcn/ui**, built natively for Astro).

Read **[Core Goals of Liftoff](/liftoff/core-goals/)** for how Liftoff pairs open-code \`.astro\` ownership with \`@layer lsui\` semantic tokens and ambient \`data-*\` DOM contexts.`,
    coreGoalsTitle: "Core Goals of Liftoff",
    coreGoalsDescription:
      "How Liftoff layers semantic CSS token theming, ambient DOM contexts, and open-code ownership onto Origin primitives.",
    coreGoalsBody: `**Liftoff (\`@lsui/liftoff\` + \`@lsui/themes\`)** turns [Origin](/origin/)'s unstyled accessible primitives into ready-to-own, token-themed Astro components.

## Strict Layering on Origin (\`Origin <- Liftoff\`)

Every \`Liftoff\` component delegates HTML semantics, ARIA states, keyboard handling, and conditional polyfills to \`@lsui/origin\`, adding only visual \`variant\` / \`size\` props, WCAG 2.5.8 / 2.5.5 minimum target sizing, and \`@layer lsui.components\` token styles.

## Token-Driven Design Systems (\`@lsui/themes\`)

Ships complete visual systems (**Nordic** and **Editorial**, each accompanied by \`DESIGN.md\` and \`TOKENS.md\`) built on live CSS \`light-dark()\` color and \`<image>\` tokens—with **zero Tailwind** and **zero CSS Modules**.

## Ambient DOM Context (\`data-*\` Attributes)

Parent containers set \`data-theme\` (including combined \`data-theme="editorial dark"\`), \`data-surface\`, \`data-density\`, \`data-contrast\`, \`data-motion\`, and \`data-layout\` so nested components adapt automatically through CSS inheritance without prop-drilling.

## Astro + EmDash Coverage

Spans Core UI controls, Content/Publishing primitives (\`Prose\`, \`PortableText\`, \`Byline\`, \`PostCard\`, \`Pagination\`), and Documentation UI (\`Callout\`, \`CodeGroup\`, \`DocsSidebar\`, \`PrevNext\`).`,
    upcomingCatalogBody: `Components in **Liftoff (Level 2)** follow a mandatory design-plan review gate before implementation. See \`GUIDE.md\` Phase 10 (Parts 10.1–10.4) for the Core UI, Publishing, and Documentation component batches.`,
  },
  landing: {
    shortName: "Landing",
    title: "Landing (Level 3)",
    description:
      "Composed Astro + EmDash CMS page blocks, marketing/publishing/docs sections, and full-page templates built atop Liftoff.",
    overviewBody: `**Landing (\`@lsui/landing\`)** is Level 3—composed real-world page sections, CMS blocks, and full-page templates built strictly on top of [Liftoff](/liftoff/) (comparable in role to **shadcnblocks**, built natively for standalone Astro and **EmDash CMS**).

Read **[Core Goals of Landing](/landing/core-goals/)** for how Landing composes Liftoff components across marketing, editorial, and documentation layouts.`,
    coreGoalsTitle: "Core Goals of Landing",
    coreGoalsDescription:
      "How Landing composes Liftoff components into standalone Astro and EmDash CMS sections, blocks, and page templates.",
    coreGoalsBody: `**Landing (\`@lsui/landing\`)** assembles [Liftoff](/liftoff/) components into production-ready sections, CMS blocks, and full-page templates.

## Strict One-Way Layering (\`Origin <- Liftoff <- Landing\`)

\`Landing\` imports exclusively from \`@lsui/liftoff\` (and foundational tokens/icons), never reversing the dependency arrow and never bypassing \`Origin\`/\`Liftoff\` accessibility contracts.

## Standalone Astro + EmDash CMS Ready

Adopts EmDash CMS block and publishing conventions (\`Hero\`, \`Features\`, \`Pricing\`, \`CTA\`, \`FAQ\`, \`Split\`, \`Logos\`, \`Contact\`, \`ArticleGrid\`) while accepting plain \`astro:content\` collections and typed Astro props seamlessly.

## Section-Level Surface & Density Composition

Blocks declare section-level \`data-theme\`, \`data-surface="hero" | "muted" | "inverse"\`, and \`data-density\` attributes so every nested \`Liftoff\` button, card, and typographic element adapts automatically.`,
    upcomingCatalogBody: `Blocks and page templates in **Landing (Level 3)** follow a mandatory design-plan review gate before implementation.

## Planned Phase 4 Catalog

- **Marketing & Editorial Blocks**: \`Hero\`, \`Features\`, \`Pricing\`, \`CTA\`, \`FAQ\`, \`Split\`, and \`ArticleGrid\` (compatible with both \`astro:content\` and EmDash CMS \`Blocks\` schemas).
- **Starter Page Templates**: Full-page marketing and publishing layouts built atop \`@lsui/liftoff\`.`,
  },
  apogee: {
    shortName: "Apogee",
    title: "Apogee (Level 4)",
    description:
      "Independent higher-order interactive experiences and site enhancements beyond standard component and block libraries.",
    overviewBody: `**Apogee (\`@lsui/apogee\`)** is Level 4—an independent tier for richer, self-contained interactive capabilities and site enhancements that go beyond standard UI primitives, styled components, or static page blocks.

Read **[Core Goals of Apogee](/apogee/core-goals/)** for how Apogee stays modular and opt-in across any Astro site.`,
    coreGoalsTitle: "Core Goals of Apogee",
    coreGoalsDescription:
      "How Apogee delivers standalone higher-order interactive experiences like Guided Website Tours, Kanban boards, and Spotlight centers.",
    coreGoalsBody: `**Apogee (\`@lsui/apogee\`)** packages complex, opt-in interactive experiences that sit alongside—rather than inside—standard UI component and block catalogs.

## Independent & Opt-In Architecture

Unlike the strict \`Origin <- Liftoff <- Landing\` chain, \`Apogee\` remains decoupled from \`Landing\` so any Astro application or content site can drop in a standalone interactive experience powered by \`@lsui/origin\` primitives (\`mount()\`, \`announce()\`, focus management).

## Guided Website Tours (\`<Tour />\`)

Multi-step interactive product and documentation walkthroughs built on CSS Anchor Positioning, top-layer Popover spotlighting, full keyboard step navigation, and \`ariaNotify()\` step announcements.

## Sortable & Multi-Column Kanban Boards

Accessible pointer + keyboard drag-and-transfer boards composing roving focus, spatial keyboard movement, and \`ariaNotify()\` pickup/move/drop screen-reader announcements.

## Command & Spotlight Centers

Site-wide keyboard command palettes and interactive reading companions designed for Astro View Transitions.`,
    upcomingCatalogBody: `Interactive experiences in **Apogee (Level 4)** follow a mandatory design-plan review gate before implementation.

## Planned Phase 4 Flagships

- **\`<Tour />\` (Guided Website Tours)**: CSS-anchored multi-step walkthroughs with top-layer spotlighting and \`ariaNotify()\` step announcements.
- **Kanban & Transfer Board**: Accessible pointer and keyboard multi-column card transfer board powered by \`@lsui/origin\` \`announce()\`.
- **Spotlight / Command Center**: Keyboard-driven site search and action launcher.`,
  },
};

/**
 * Generates MDX files for all 4 dedicated Nimbus level collections (`origin`, `liftoff`, `landing`, `apogee`).
 */
export function buildDocsMdxByLevel(components: ComponentIR[]): Record<string, string> {
  const files: Record<string, string> = {};

  for (const level of ["origin", "liftoff", "landing", "apogee"] as const) {
    const meta = LEVEL_OVERVIEWS[level];
    const levelComps = components.filter((c) => c.level === level);

    const catalogSection =
      levelComps.length > 0
        ? `## Catalog

| Name | Category | Element | Hydration | Summary |
| :--- | :--- | :--- | :--- | :--- |
${levelComps
  .map(
    (c) =>
      `| [\`${c.name}\`](/${level}/${c.slug}/) | ${c.category} | \`<${c.rootTag}>\` | \`${c.hydration}\` | ${escapeMdCell(c.description)} |`,
  )
  .join("\n")}`
        : `## Upcoming Catalog

Components and experiences in **${meta.title}** follow a design-first review gate before implementation. See [Upcoming Catalog](/${level}/catalog/) for planned items.`;

    files[`apps/docs/src/content/${level}/index.mdx`] = `---
title: ${meta.title}
description: ${meta.description}
sidebar:
  order: 0
  label: Overview
---

${meta.overviewBody}

${catalogSection}
`;

    files[`apps/docs/src/content/${level}/core-goals.mdx`] = `---
title: ${meta.coreGoalsTitle}
description: ${meta.coreGoalsDescription}
sidebar:
  order: 1
  label: ${meta.coreGoalsTitle}
---

${meta.coreGoalsBody}
`;

    if (levelComps.length === 0) {
      files[`apps/docs/src/content/${level}/catalog.mdx`] = `---
title: Upcoming Catalog
description: Planned ${meta.shortName} catalog items and design-first implementation roadmap.
sidebar:
  order: 2
  label: Upcoming Catalog
---

${meta.upcomingCatalogBody}
`;
    }

    for (const [idx, comp] of levelComps.entries()) {
      const propRows = comp.props
        .filter((p) => !p.forbidden)
        .map((p) => {
          const req = p.required
            ? "Yes"
            : p.conditionalRequirement
              ? p.conditionalRequirement
              : "No";
          return `| \`${p.name}\` | \`${escapeMdCell(p.typeText)}\` | ${p.defaultValue ? `\`${escapeMdCell(p.defaultValue)}\`` : "—"} | ${escapeMdCell(req)} | ${escapeMdCell(p.description)} |`;
        })
        .join("\n");

      const slotRows = comp.slots
        .map((s) => `| \`${s.name}\` | ${escapeMdCell(s.description)} |`)
        .join("\n");

      const a11yBullets = comp.accessibility.map((a) => `- ${a}`).join("\n");
      const keyboardBullets = comp.keyboard.map((k) => `- ${k}`).join("\n");
      const cliSlug = level === "liftoff" ? comp.slug : `${level}/${comp.slug}`;
      const installSection = CLI_INSTALL_AVAILABLE
        ? `## Installation

\`\`\`bash
npx lsui add ${cliSlug}
\`\`\``
        : `## Installation

> **Planned:** \`@lsui/cli\` is not published yet (see \`GUIDE.md\` Phase 13.1 / \`PLAN.md\` Phase 5, Part 1). Until then, copy the component source from \`${comp.importSpecifier}\` or read its registry manifest at \`/r/${level}/${comp.slug}.json\`.`;

      files[`apps/docs/src/content/${level}/${comp.slug}.mdx`] = `---
title: ${comp.name}
description: ${comp.description}
sidebar:
  order: ${idx + 2}
---

${buildComponentDemoBlock(comp)}

${installSection}

## Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
${propRows}

## Slots

| Slot | Description |
| :--- | :--- |
${slotRows}

## Accessibility & Keyboard

### Semantic & WCAG Contract

${a11yBullets}

### Keyboard Interactions

${keyboardBullets}
`;
    }
  }

  return files;
}
