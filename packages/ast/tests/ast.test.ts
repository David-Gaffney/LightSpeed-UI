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
      "liftoff/button",
      "liftoff/link-button",
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

  it("converts OKLCH tokens accurately to sRGB RGBA floats and hex", () => {
    const white = parseCssColorToRgba("oklch(1 0 0)");
    expect(white.hex).toBe("#ffffff");
    expect(white.r).toBeCloseTo(1, 3);
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
