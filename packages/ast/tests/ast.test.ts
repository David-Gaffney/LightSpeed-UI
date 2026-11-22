import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildFigmaSpec,
  parseCoreComponents,
  parseCssColorToRgba,
  parseThemesPackage,
  validateComponentCss,
} from "../src/index.ts";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = path.resolve(pkgRoot, "../..");
const corePkgDir = path.join(monorepoRoot, "packages/core");
const themesPkgDir = path.join(monorepoRoot, "packages/themes");

describe("@lsui/ast single-source-of-truth extraction & validation", () => {
  it("parses Button.astro and LinkButton.astro into rich ComponentIRs", () => {
    const components = parseCoreComponents({ corePkgDir, monorepoRoot });
    expect(components.map((c) => c.slug)).toEqual(["button", "link-button"]);

    const button = components.find((c) => c.slug === "button")!;
    expect(button.name).toBe("Button");
    expect(button.rootTag).toBe("button");
    expect(button.hydration).toBe("optional");
    expect(button.dependencies).toContain("@lsui/behaviors");

    const variantProp = button.props.find((p) => p.name === "variant")!;
    expect(variantProp.figmaKind).toBe("VARIANT");
    expect(variantProp.literalValues).toEqual([
      "primary",
      "secondary",
      "outline",
      "ghost",
      "danger",
    ]);
    expect(variantProp.defaultValue).toBe('"primary"');

    const ariaLabelProp = button.props.find((p) => p.name === "aria-label")!;
    expect(ariaLabelProp.conditionalRequirement).toContain("iconOnly is true");

    const hrefProp = button.props.find((p) => p.name === "href")!;
    expect(hrefProp.forbidden).toBe(true);

    expect(button.slots.map((s) => s.name)).toEqual([
      "icon-start",
      "default",
      "icon-end",
    ]);
    expect(
      button.slots.find((s) => s.name === "icon-start")?.figmaKind,
    ).toBe("INSTANCE_SWAP");
    expect(button.slots.find((s) => s.name === "default")?.figmaKind).toBe(
      "SLOT",
    );
  });

  it("extracts Nordic & Editorial theme tokens and builds deterministic FigmaSpec JSON", () => {
    const components = parseCoreComponents({ corePkgDir, monorepoRoot });
    const { base: baseTokens, themes } = parseThemesPackage(themesPkgDir);

    expect(themes.map((t) => t.id)).toEqual(["editorial", "nordic"]);

    const figmaSpec = buildFigmaSpec({ components, baseTokens, themes });
    expect(figmaSpec.variableCollections.colors.modes).toEqual([
      "Editorial Light",
      "Editorial Dark",
      "Nordic Light",
      "Nordic Dark",
    ]);
    expect(figmaSpec.variableCollections.colors.variables.length).toBeGreaterThanOrEqual(
      29,
    );

    const buttonSpec = figmaSpec.components.find((c) => c.slug === "button")!;
    expect(buttonSpec.variantAxes.map((a) => a.name)).toEqual([
      "variant",
      "size",
    ]);
    expect(buttonSpec.booleanProperties.map((b) => b.name)).toEqual([
      "disabled",
      "iconOnly",
    ]);
    expect(buttonSpec.slots).toHaveLength(3);
  });

  it("converts OKLCH tokens accurately to sRGB RGBA floats and hex", () => {
    const white = parseCssColorToRgba("oklch(1 0 0)");
    expect(white.hex).toBe("#ffffff");
    expect(white.r).toBeCloseTo(1, 3);

    const blue = parseCssColorToRgba("oklch(0.445 0.145 252)");
    expect(blue.hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(blue.b).toBeGreaterThan(blue.r);
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
