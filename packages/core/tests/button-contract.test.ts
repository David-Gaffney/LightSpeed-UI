import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BUTTON_VARIANTS, CONTROL_SIZES } from "../src/index.ts";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buttonDir = path.join(pkgRoot, "src/components/button");

describe("@lsui/core Button & LinkButton authoring contract", () => {
  const buttonAstro = readFileSync(path.join(buttonDir, "Button.astro"), "utf-8");
  const linkButtonAstro = readFileSync(
    path.join(buttonDir, "LinkButton.astro"),
    "utf-8",
  );
  const buttonCss = readFileSync(path.join(buttonDir, "button.css"), "utf-8");

  it("includes required structured JSDoc frontmatter tags on Button.astro and LinkButton.astro", () => {
    for (const source of [buttonAstro, linkButtonAstro]) {
      expect(source).toContain("@title ");
      expect(source).toContain("@description ");
      expect(source).toContain("@category Actions");
      expect(source).toContain("@hydration optional");
      expect(source).toContain("@accessibility");
      expect(source).toContain("@keyboard");
      expect(source).toContain("@slots");
    }
  });

  it("keeps LinkButton free of role='button' overrides", () => {
    const codeWithoutComments = linkButtonAstro.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(codeWithoutComments).not.toContain('role="button"');
  });

  it("uses only semantic tokens inside @layer lsui.components with no hardcoded hex colors", () => {
    const cssWithoutComments = buttonCss.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(cssWithoutComments).toContain("@layer lsui");
    expect(cssWithoutComments).toContain("@layer components");
    expect(cssWithoutComments).toContain("var(--cursor-interactive, default)");
    expect(cssWithoutComments).toContain("var(--target-min-size");
    expect(cssWithoutComments).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(cssWithoutComments).not.toMatch(/color-mix\(\s*in\s+oklch\b/i);

    for (const variant of BUTTON_VARIANTS) {
      expect(cssWithoutComments).toContain(`[data-variant="${variant}"]`);
    }
    for (const size of CONTROL_SIZES) {
      expect(cssWithoutComments).toContain(`[data-size="${size}"]`);
    }
  });
});
