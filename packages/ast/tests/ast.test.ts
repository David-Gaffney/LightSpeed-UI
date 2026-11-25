import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildFigmaSpec,
  parseCssColorToRgba,
  parsePlatformComponents,
  parseThemesPackage,
  validateComponentCss,
} from "../src/index.ts";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = path.resolve(pkgRoot, "../..");
const themesPkgDir = path.join(monorepoRoot, "packages/themes");

describe("@lsui/ast multi-level extraction & one-way boundary validation", () => {
  it("parses Origin primitives and Liftoff components across levels", () => {
    const components = parsePlatformComponents({ monorepoRoot });
    expect(components.map((c) => `${c.level}/${c.slug}`)).toEqual([
      "origin/origin-button",
      "origin/origin-link",
      "origin/origin-dialog",
      "origin/origin-input",
      "origin/origin-popover",
      "origin/origin-select",
      "origin/origin-tabs",
      "liftoff/button",
      "liftoff/link-button",
      "liftoff/blocks",
      "liftoff/byline",
      "liftoff/pagination",
      "liftoff/portable-text",
      "liftoff/post-card",
      "liftoff/prose",
      "liftoff/table-of-contents",
      "liftoff/badge",
      "liftoff/card",
      "liftoff/dialog",
      "liftoff/input",
      "liftoff/popover",
      "liftoff/select",
      "liftoff/tabs",
      "liftoff/callout",
      "liftoff/code-group",
      "liftoff/docs-sidebar",
      "liftoff/prev-next",
    ]);

    const originBtn = components.find((c) => c.slug === "origin-button")!;
    expect(originBtn.level).toBe("origin");
    expect(originBtn.dependencies).toEqual([]);

    const liftoffBtn = components.find(
      (c) => c.level === "liftoff" && c.slug === "button",
    )!;
    expect(liftoffBtn.dependencies).toContain("@lsui/origin");
    expect(liftoffBtn.rootTag).toBe("button");

    const variantProp = liftoffBtn.props.find((p) => p.name === "variant")!;
    expect(variantProp.figmaKind).toBe("VARIANT");
    expect(variantProp.literalValues).toEqual([
      "primary",
      "secondary",
      "outline",
      "ghost",
      "danger",
    ]);
  });

  it("emits Figma Component Sets only for styled visual tiers (Liftoff/Landing), never unstyled Origin", () => {
    const components = parsePlatformComponents({ monorepoRoot });
    const { base: baseTokens, themes } = parseThemesPackage(themesPkgDir);

    const figmaSpec = buildFigmaSpec({ components, baseTokens, themes });
    expect(figmaSpec.components.map((c) => `${c.level}/${c.slug}`)).toEqual([
      "liftoff/button",
      "liftoff/link-button",
      "liftoff/blocks",
      "liftoff/byline",
      "liftoff/pagination",
      "liftoff/portable-text",
      "liftoff/post-card",
      "liftoff/prose",
      "liftoff/table-of-contents",
      "liftoff/badge",
      "liftoff/card",
      "liftoff/dialog",
      "liftoff/input",
      "liftoff/popover",
      "liftoff/select",
      "liftoff/tabs",
      "liftoff/callout",
      "liftoff/code-group",
      "liftoff/docs-sidebar",
      "liftoff/prev-next",
    ]);

    const primaryVar = figmaSpec.variableCollections.colors.variables.find(
      (v) => v.cssToken === "--color-primary",
    )!;
    expect(primaryVar.codeSyntax).toBe("var(--color-primary)");
    expect(primaryVar.scopes).toEqual(["FRAME_FILL", "SHAPE_FILL"]);

    const buttonSpec = figmaSpec.components.find((c) => c.slug === "button")!;
    expect(
      buttonSpec.slots.find((s) => s.name === "default")?.figmaType,
    ).toBe("TEXT_SLOT");
    expect(
      buttonSpec.slots.find((s) => s.name === "icon-start")?.figmaType,
    ).toBe("INSTANCE_SWAP");
  });


  it("generated component docs do not promise an unpublished CLI", () => {
    const docs = [
      "apps/docs/src/content/origin/origin-button.mdx",
      "apps/docs/src/content/origin/origin-link.mdx",
      "apps/docs/src/content/origin/origin-dialog.mdx",
      "apps/docs/src/content/origin/origin-popover.mdx",
      "apps/docs/src/content/origin/origin-tabs.mdx",
      "apps/docs/src/content/origin/origin-select.mdx",
      "apps/docs/src/content/origin/origin-input.mdx",
      "apps/docs/src/content/liftoff/button.mdx",
      "apps/docs/src/content/liftoff/link-button.mdx",
    ];
    for (const rel of docs) {
      const mdx = readFileSync(path.join(monorepoRoot, rel), "utf-8");
      expect(mdx, rel).not.toContain("npx lsui add");
      expect(mdx, rel).toContain("**Planned:** `@lsui/cli` is not published yet");
      expect(mdx, rel).toMatch(/\/r\/(origin|liftoff)\/[a-z-]+\.json/);
    }
  });

  it("converts OKLCH tokens accurately to sRGB RGBA floats and hex", () => {
    const white = parseCssColorToRgba("oklch(1 0 0)");
    expect(white.hex).toBe("#ffffff");
    expect(white.r).toBeCloseTo(1, 3);
  });


  it("matches browser-rendered sRGB for every real theme OKLCH token", () => {
    const fixture = JSON.parse(
      readFileSync(
        path.join(pkgRoot, "tests/fixtures/oklch-parity.json"),
        "utf-8",
      ),
    ) as { entries: Array<[string, string]>; tolerancePerChannel: number };

    for (const [input, browserHex] of fixture.entries) {
      const actual = parseCssColorToRgba(input).hex;
      const maxChannelDelta = Math.max(
        ...[1, 3, 5].map((offset) =>
          Math.abs(
            parseInt(actual.slice(offset, offset + 2), 16) -
              parseInt(browserHex.slice(offset, offset + 2), 16),
          ),
        ),
      );
      expect(maxChannelDelta, `${input}: ${actual} vs ${browserHex}`).toBeLessThanOrEqual(
        fixture.tolerancePerChannel,
      );
    }
  });

  it("rejects hardcoded hex colors, unlayered styles, and oklch color-mix in component CSS", () => {
    expect(() =>
      validateComponentCss("Bad.css", ".btn { color: var(--color-text); }"),
    ).toThrow("wrapped inside '@layer lsui'");

    expect(() =>
      validateComponentCss(
        "BadHex.css",
        "@layer lsui { .btn { background: #ff0055; } }",
      ),
    ).toThrow("Hardcoded hex color");

    expect(() =>
      validateComponentCss(
        "BadMix.css",
        "@layer lsui { .btn { background: color-mix(in oklch, var(--color-text) 10%, transparent); } }",
      ),
    ).toThrow("color-mix(in oklab");
  });
});
