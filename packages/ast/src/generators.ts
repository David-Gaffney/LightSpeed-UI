import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  BaseTokensIR,
  ComponentIR,
  FigmaComponentSpec,
  FigmaSpec,
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

  // Shared base spacing & control heights (identical across theme modes unless overridden)
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

  // Theme-specific radii (e.g. Nordic 8px vs Editorial 3px)
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

  const figmaComponents: FigmaComponentSpec[] = components.map((comp) => {
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
 * Generates static open-code registry JSON manifests (`index.json` + `<slug>.json`).
 */
export function buildRegistryArtifacts(options: {
  components: ComponentIR[];
  monorepoRoot: string;
}): {
  indexJson: Record<string, unknown>;
  items: Record<string, RegistryItem>;
} {
  const { components, monorepoRoot } = options;
  const items: Record<string, RegistryItem> = {};

  for (const comp of components) {
    items[comp.slug] = {
      $schema: "https://lightspeedui.dev/schema/registry-item.json",
      name: comp.slug,
      title: comp.name,
      type: "registry:ui",
      description: comp.description,
      category: comp.category,
      hydration: comp.hydration,
      dependencies: comp.dependencies,
      files: comp.files.map((f) => ({
        path: f.path,
        target: `src/components/ui/${comp.slug}/${f.fileName}`,
        sha256: f.sha256,
        content: readFileSync(path.join(monorepoRoot, f.path), "utf-8"),
      })),
    };
  }

  const indexJson = {
    $schema: "https://lightspeedui.dev/schema/registry.json",
    name: "lightspeed-ui",
    homepage: "https://lightspeedui.dev",
    items: components.map((c) => ({
      name: c.slug,
      title: c.name,
      type: "registry:ui",
      category: c.category,
      hydration: c.hydration,
      description: c.description,
      dependencies: c.dependencies,
      registryUrl: `/r/${c.slug}.json`,
    })),
  };

  return { indexJson, items };
}

/**
 * Generates root AI context files (`AGENTS.md`, `COMPONENTS.md`, `TOKENS.md`) from AST IR.
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

  const componentList = components
    .map(
      (c) =>
        `- **\`<${c.name} />\`** (\`@lsui/core/${c.name}.astro\`, hydration: \`${c.hydration}\`): ${c.description}`,
    )
    .join("\n");

  const themeList = themes
    .map(
      (t) =>
        `- **\`${t.id}\`** (\`@lsui/themes/${t.id}.css\`): Fonts \`${t.fonts["--font-heading"] ?? "inherit"}\`, medium radius \`${t.radii.find((r) => r.token === "--radius-md")?.rawValue ?? "0.5rem"}\`.`,
    )
    .join("\n");

  const agentsMd = `# LightSpeedUI (\`lsui\`) — AI Agent Guide (\`AGENTS.md\`)

> Auto-generated from component & theme ASTs via \`pnpm sync:artifacts\`. Do not hand-edit.

## Core Rules for Coding Agents

1. **Pure Astro & Semantic CSS Tokens Only**: Author components as single-file \`.astro\` templates styled inside \`@layer lsui\` using semantic CSS custom properties (\`--color-*\`, \`--space-*\`, \`--radius-*\`). Never introduce Tailwind utilities, CSS Modules, or hardcoded hex colors.
2. **Action vs. Navigation Split**: Use \`<Button>\` strictly for in-page actions (\`<button>\`) and \`<LinkButton href="...">\` strictly for URL navigation (\`<a>\`). Never place \`role="button"\` on an \`<a>\` element or pass \`href\` to \`<Button>\`.
3. **Ambient DOM Context Over Prop-Drilling**: Set \`data-theme\` (\`"light"\`, \`"dark"\`, \`"nordic"\`, \`"editorial"\`, or combined \`"editorial dark"\`), \`data-surface\` (\`"canvas"\`, \`"card"\`, \`"muted"\`, \`"hero"\`, \`"inverse"\`), \`data-density\` (\`"compact"\`, \`"comfortable"\`, \`"spacious"\`), and \`data-layout\` on container elements rather than prop-drilling theme state.
4. **Baseline 2026 Governance**: Consult \`modern-web-guidance\` before writing HTML/CSS/JS, and record any *Baseline Newly Available* feature, CSS fallback, or conditional polyfill in \`BASELINE.md\` (\`pnpm check:baseline\`).

## Installed Themes
${themeList}

## Available Components
${componentList}

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

      return `## \`${comp.name}\` (\`@lsui/core/${comp.name}.astro\`)

${comp.description}

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
      const ed = themes.find((t) => t.id === "editorial")?.colors.find((x) => x.token === c.token);
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
  if (comp.name === "Button") {
    return `import Button from "@lsui/core/Button.astro";

<ComponentPreview title="Nordic Light — Variants" theme="nordic light" hydration="${comp.hydration}">
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

  if (comp.name === "LinkButton") {
    return `import LinkButton from "@lsui/core/LinkButton.astro";

<ComponentPreview title="Nordic Light — LinkButton Variants" theme="nordic light" hydration="${comp.hydration}">
  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;">
    <LinkButton href="/components/button/" variant="primary">Button Docs</LinkButton>
    <LinkButton href="/components/button/" variant="secondary">Secondary Link</LinkButton>
    <LinkButton href="/components/button/" variant="outline">Outline Link</LinkButton>
    <LinkButton href="/components/button/" variant="ghost">Ghost Link</LinkButton>
    <LinkButton disabled variant="outline">Disabled Link</LinkButton>
  </div>
</ComponentPreview>`;
  }

  return `import ${comp.name} from "@lsui/core/${comp.name}.astro";

<ComponentPreview title="${comp.name} Preview" theme="nordic light" hydration="${comp.hydration}">
  <${comp.name}>${comp.name}</${comp.name}>
</ComponentPreview>`;
}

/**
 * Generates Nimbus MDX documentation pages (`components.mdx` + `components/<slug>.mdx`) from `ComponentIR[]`.
 */
export function buildDocsMdxPages(components: ComponentIR[]): {
  indexMdx: string;
  pages: Record<string, string>;
} {
  const pages: Record<string, string> = {};

  for (const [idx, comp] of components.entries()) {
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

    pages[comp.slug] = `---
title: ${comp.name}
description: ${comp.description}
sidebar:
  order: ${idx + 1}
---

${buildComponentDemoBlock(comp)}

## Installation

\`\`\`bash
npx lsui add ${comp.slug}
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

  const catalogRows = components
    .map(
      (c) =>
        `| [\`${c.name}\`](/components/${c.slug}/) | ${c.category} | \`<${c.rootTag}>\` | \`${c.hydration}\` | ${escapeMdCell(c.description)} |`,
    )
    .join("\n");

  const indexMdx = `---
title: Components
description: Auto-generated LightSpeedUI component catalog extracted directly from .astro source ASTs.
sidebar:
  order: 1
---

Every component page below—including its live isolated previews, prop signatures, slot contracts, and accessibility documentation—is generated automatically from its canonical \`.astro\` source file in \`@lsui/core\`.

## Catalog

| Component | Category | Element | Hydration | Summary |
| :--- | :--- | :--- | :--- | :--- |
${catalogRows}
`;

  return { indexMdx, pages };
}
