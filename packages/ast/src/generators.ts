import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  BaseTokensIR,
  ComponentIR,
  FigmaComponentSpec,
  FigmaSpec,
  PlatformLevel,
  RegistryItem,
  ThemeIR,
} from "./types.ts";

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
2. **Stop After Every Numbered Part**: Always stop at the end of each numbered Part in [\`PLAN.md\`](./PLAN.md), mark its checkbox \`[x]\`, show verification results, and wait for user review before continuing.
3. **Continuous \`FINDINGS.md\` & \`BASELINE.md\` Logging**:
   - Log every architectural decision, ecosystem bug, tool quirk, and fix in [\`FINDINGS.md\`](./FINDINGS.md).
   - Invoke the \`modern-web-guidance\` skill **first** for all HTML/CSS/JS tasks (and include the \`### Modern Web Guidance\` disclosure section when it shapes changes).
   - Record every *Baseline Newly Available* feature, CSS fallback, and conditional polyfill in [\`BASELINE.md\`](./BASELINE.md) (sorted oldest -> newest, verified via \`pnpm check:baseline\`).
4. **Pure Astro & Semantic CSS Tokens Only**: Never introduce Tailwind utilities, CSS Modules, or hardcoded hex colors in \`@lsui/*\`. Keep \`--color-*\` custom properties unregistered (for live \`light-dark()\` subtree inheritance), never set \`font-size\` on \`:root\`/\`html\` (for OS \`<meta name="text-scale" content="scale">\`), and always use \`color-mix(in oklab, ...)\` (never \`in oklch\`).
5. **Action vs. Navigation Split**: Use \`Button\` / \`OriginButton\` strictly for in-page actions and \`LinkButton\` / \`OriginLink\` strictly for URL navigation (never \`role="button"\` on \`<a>\`).

## Technical Stack & Verification Gotchas

- **TypeScript 7.1 + \`.astro\` Type-Checking**: Uses \`typescript@7.1.0-beta\` + \`@astrojs/ts-content-mapper\` (with \`patches/@astrojs__ts-content-mapper@0.2.0.patch\` skipping third-party \`node_modules\` \`.astro\` diagnostics). Run \`pnpm typecheck\` and \`pnpm typecheck:apps\`—never add \`@astrojs/check\` or TypeScript 5/6.
- **Artifact Sync & Nimbus Docs Lint Order**: After editing \`.astro\` or \`.css\` files, run \`pnpm sync:artifacts\`, then \`pnpm --filter @lsui/docs run build\` *before* \`pnpm --filter @lsui/docs run lint:docs\` (Nimbus resolves internal links against the built route manifest).
- **Astro 7 Agent Backgrounding**: Always keep \`--ignore-lock\` on \`astro preview\` in \`playwright.config.ts\` so Astro 7 does not auto-daemonize preview servers under agent env vars.
- **Read First**: See [\`PLAN.md\`](./PLAN.md) for the Current Agent Handoff Snapshot, [\`ARCHITECTURE.md\`](./ARCHITECTURE.md) for system design, and [\`FINDINGS.md\`](./FINDINGS.md) (\`F-001\`..\`F-034\`+) for solved edge cases.

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
  { title: string; description: string; body: string }
> = {
  origin: {
    title: "Origin (Level 1)",
    description:
      "Unstyled accessible .astro primitives, headless behaviors, keyboard interaction, and ariaNotify() screen reader announcements.",
    body: `**Origin (\`@lsui/origin\`)** is Level 1—the Astro-native behavioral and semantic foundation of LightSpeedUI (comparable in role to **UI SDK** and **Base UI**).

## Core Goals of Origin

- **Unstyled Accessible Primitives**: Semantic \`.astro\` components (\`OriginButton\`, \`OriginLink\`, and upcoming overlays/disclosures) with **zero visual CSS** so teams can bring any styling system or build \`Liftoff\` themes on top.
- **Screen Reader Announcements via \`ariaNotify()\`**: \`announce(message, { target, priority })\` uses **Baseline 2026 \`Element.ariaNotify()\` / \`Document.ariaNotify()\`** first—inheriting element \`lang\` and working inside modal \`<dialog>\` top layers without \`inert\` background live-region bugs—with an automatic lazy \`aria-live\` fallback for older browsers.
- **Keyboard, Focus & Disabled Ergonomics**: View-Transition-safe \`mount(selector, setup)\`, focusable \`aria-disabled="true"\` guards, and conditional Baseline polyfill loaders (\`Popover\`, \`Invoker commands\`).
- **Rendering Flexibility**: Pure attribute builders (\`buttonAttrs()\`, \`linkAttrs()\`) plus safe \`as\` tag overrides that forbid invalid semantics like \`<a role="button">\`.`,
  },
  liftoff: {
    title: "Liftoff (Level 2)",
    description:
      "Copy-paste themed .astro components built strictly atop Origin primitives and semantic CSS tokens.",
    body: `**Liftoff (\`@lsui/liftoff\` + \`@lsui/themes\`)** is Level 2—where theming, semantic design tokens, and copy-paste styled \`.astro\` components are introduced on top of [Origin](/origin/) (comparable in role to **shadcn/ui**, tailored natively for Astro).

## Core Goals of Liftoff

- **Strict Layering on Origin (\`Origin <- Liftoff\`)**: Every \`Liftoff\` component delegates HTML semantics, ARIA states, keyboard handling, and polyfills to \`@lsui/origin\`, adding only \`variant\`/\`size\` props and \`@layer lsui\` token styles.
- **Token-Driven Design Systems (\`@lsui/themes\`)**: Ships complete visual systems (**Nordic** and **Editorial**, with \`DESIGN.md\` and \`TOKENS.md\`) built on live \`light-dark()\` color & image tokens—zero Tailwind, zero CSS Modules.
- **Ambient DOM Context**: Containers set \`data-theme\`, \`data-surface\`, \`data-density\`, \`data-contrast\`, \`data-motion\`, and \`data-layout\` so nested components adapt automatically via CSS without prop-drilling.`,
  },
  landing: {
    title: "Landing (Level 3)",
    description:
      "Composed Astro + EmDash CMS page blocks, marketing/publishing/docs sections, and full-page templates built atop Liftoff.",
    body: `**Landing (\`@lsui/landing\`)** is Level 3—composed real-world page sections, CMS blocks, and full-page templates built strictly on top of [Liftoff](/liftoff/) (comparable in role to **shadcnblocks**, built natively for standalone Astro and **EmDash CMS**).

## Core Goals of Landing

- **Strict One-Way Layering (\`Origin <- Liftoff <- Landing\`)**: Page blocks compose \`Liftoff\` components and respond automatically to section-level \`data-theme\`, \`data-surface="hero" | "muted" | "inverse"\`, and \`data-density\` attributes.
- **Astro + EmDash CMS Ready**: Uses EmDash publishing & marketing conventions (\`Hero\`, \`Features\`, \`Pricing\`, \`CTA\`, \`FAQ\`, \`Split\`, \`PostCard\` grids, \`DocsLayout\`) while accepting plain \`astro:content\` data or props.`,
  },
  apogee: {
    title: "Apogee (Level 4)",
    description:
      "Independent higher-order interactive experiences and site enhancements beyond standard component and block libraries.",
    body: `**Apogee (\`@lsui/apogee\`)** is Level 4—an independent tier for richer, self-contained interactive capabilities and site enhancements that go beyond standard UI primitives, styled components, or static page blocks.

## Core Goals of Apogee

- **Independent & Opt-In**: Unlike the strict \`Origin <- Liftoff <- Landing\` chain, \`Apogee\` packages standalone higher-order features that any Astro site can drop in on demand (powered by \`@lsui/origin\` behaviors like \`mount()\` and \`announce()\`).
- **Planned Flagship Capabilities**:
  - **Guided Website Tours (\`<Tour />\`)**: Multi-step anchored walkthroughs using CSS Anchor Positioning, Popover top-layer spotlighting, keyboard step navigation, and \`ariaNotify()\` step announcements.
  - **Sortable & Multi-Column Kanban Boards**: Pointer + keyboard drag-and-transfer boards with \`ariaNotify()\` pickup/move/drop announcements.
  - **Command & Spotlight Centers**: Site-wide keyboard palettes and reading companions.`,
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

Components and experiences in **${meta.title}** follow a design-first review gate before implementation. See \`PLAN.md\` for the roadmap.`;

    files[`apps/docs/src/content/${level}/index.mdx`] = `---
title: ${meta.title}
description: ${meta.description}
sidebar:
  order: 0
  label: Overview
---

${meta.body}

${catalogSection}
`;

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

      files[`apps/docs/src/content/${level}/${comp.slug}.mdx`] = `---
title: ${comp.name}
description: ${comp.description}
sidebar:
  order: ${idx + 1}
---

${buildComponentDemoBlock(comp)}

## Installation

\`\`\`bash
npx lsui add ${cliSlug}
\`\`\`

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
