import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  REQUIRED_SEMANTIC_COLOR_TOKENS,
  REQUIRED_SEMANTIC_IMAGE_TOKENS,
  THEME_NAMES,
  THEMES,
} from "../src/index.ts";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(pkgRoot, "src");

function extractCustomPropertyNames(css: string): Set<string> {
  const names = new Set<string>();
  const re = /(--[a-z0-9-]+)\s*:/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    if (m[1]) names.add(m[1]);
  }
  return names;
}

describe("@lsui/themes token contract & modern-web-guidance invariants", () => {
  const baseCss = readFileSync(path.join(srcRoot, "base.css"), "utf-8");

  it("wraps all base rules inside @layer lsui with ordered sub-layers", () => {
    expect(baseCss).toContain("@layer lsui");
    expect(baseCss).toContain("@layer reset, tokens, context, base, components;");
  });


  it("inverse surfaces remap surface, ring and border tokens so non-text contrast survives inversion", () => {
    const inverse = /\s*\[data-surface="inverse"\]\s*\{([^}]*)\}/.exec(baseCss)?.[1] ?? "";
    expect(inverse).toContain("--color-surface: var(--color-surface-inverse)");
    expect(inverse).toContain("--color-ring: var(--color-text-inverse)");
    expect(inverse).toContain(
      "--color-border: color-mix(in oklab, var(--color-text-inverse) 45%",
    );
    expect(inverse).toContain(
      "--color-border-strong: color-mix(in oklab, var(--color-text-inverse) 62%",
    );
  });

  it("never sets root/html font-size, registers @property <color> tokens, or mixes in oklch", () => {
    const allCssFiles = [
      path.join(srcRoot, "base.css"),
      ...THEME_NAMES.map((t) => path.join(srcRoot, "themes", t, "theme.css")),
    ];

    for (const file of allCssFiles) {
      const css = readFileSync(file, "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");
      // Preserve OS <meta name="text-scale" content="scale">
      expect(css).not.toMatch(/(?::root|html)\s*\{[^}]*font-size\s*:/s);
      // Keep light-dark() expressions live across nested color-scheme subtrees
      expect(css).not.toMatch(/@property\s+--color-/);
      // Avoid Chromium low-chroma pink tint bug (use `in oklab` instead)
      expect(css).not.toMatch(/color-mix\(\s*in\s+oklch\b/i);
      // Never use `type("")` in image-set() light/dark switches (browsers drop all options)
      expect(css).not.toMatch(/type\(\s*["']\s*["']\s*\)/);
    }
  });

  it("wires light-dark() CSS image values with zero-JS image-set() fallback", () => {
    expect(baseCss).toContain("https://webstatus.dev/features/light-dark-image");
    expect(baseCss).toContain("[data-lsui-themed-image]");
    expect(baseCss).toContain('@supports (background-image: light-dark(url("a"), url("b")))');
    expect(baseCss.replace(/\/\*[\s\S]*?\*\//g, "")).toContain('type("image/do-not-use")');
  });

  it("defines identical required semantic + light/dark pair tokens across Nordic and Editorial", () => {
    for (const themeName of THEME_NAMES) {
      const cssPath = path.join(srcRoot, "themes", themeName, "theme.css");
      expect(existsSync(cssPath)).toBe(true);
      const props = extractCustomPropertyNames(readFileSync(cssPath, "utf-8"));

      for (const token of [
        ...REQUIRED_SEMANTIC_COLOR_TOKENS,
        ...REQUIRED_SEMANTIC_IMAGE_TOKENS,
      ]) {
        expect(props.has(token), `${themeName} missing ${token}`).toBe(true);
        expect(
          props.has(`${token}-light`),
          `${themeName} missing ${token}-light`,
        ).toBe(true);
        expect(
          props.has(`${token}-dark`),
          `${themeName} missing ${token}-dark`,
        ).toBe(true);
      }
    }
  });

  it("ships DESIGN.md and TOKENS.md for every preset theme", () => {
    for (const themeName of THEME_NAMES) {
      const meta = THEMES[themeName];
      const designPath = path.join(srcRoot, meta.designDocPath);
      const tokensPath = path.join(srcRoot, meta.tokensDocPath);

      expect(existsSync(designPath), `${meta.designDocPath} missing`).toBe(true);
      expect(existsSync(tokensPath), `${meta.tokensDocPath} missing`).toBe(true);
      expect(readFileSync(designPath, "utf-8").length).toBeGreaterThan(200);
      expect(readFileSync(tokensPath, "utf-8").length).toBeGreaterThan(200);
    }
  });
});
