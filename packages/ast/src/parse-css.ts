import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { parseCssColorToRgba } from "./color.ts";
import type { BaseTokensIR, DimensionTokenIR, ThemeColorPair, ThemeIR } from "./types.ts";

function parseRemOrPx(raw: string): number | undefined {
  const trimmed = raw.trim();
  const remMatch = /^([0-9.]+)rem$/i.exec(trimmed);
  if (remMatch?.[1]) return Math.round(parseFloat(remMatch[1]) * 16 * 100) / 100;
  const pxMatch = /^([0-9.]+)px$/i.exec(trimmed);
  if (pxMatch?.[1]) return parseFloat(pxMatch[1]);
  return undefined;
}

/**
 * Validates component CSS against LightSpeedUI's token-only & modern-web-guidance invariants.
 */
export function validateComponentCss(filePath: string, cssSource: string): void {
  const root = postcss.parse(cssSource, { from: filePath });

  let hasLsuiLayer = false;
  root.walkAtRules((atRule) => {
    if (atRule.name === "layer" && atRule.params.includes("lsui")) {
      hasLsuiLayer = true;
    }
    if (atRule.name === "property" && atRule.params.startsWith("--color-")) {
      throw new Error(
        `${filePath}:${atRule.source?.start?.line ?? 1}: Do not @property-register design token "${atRule.params}" (breaks live light-dark() subtree inheritance).`,
      );
    }
  });

  if (!hasLsuiLayer) {
    throw new Error(
      `${filePath}: Component styles must be wrapped inside '@layer lsui'.`,
    );
  }

  root.walkDecls((decl) => {
    if (/#[0-9a-f]{3,8}\b/i.test(decl.value)) {
      throw new Error(
        `${filePath}:${decl.source?.start?.line ?? 1}: Hardcoded hex color "${decl.value}" in "${decl.prop}". Use semantic CSS custom properties instead.`,
      );
    }
    if (/color-mix\(\s*in\s+oklch\b/i.test(decl.value)) {
      throw new Error(
        `${filePath}:${decl.source?.start?.line ?? 1}: Use 'color-mix(in oklab, ...)' instead of 'in oklch' to avoid Chromium's low-chroma hue bug.`,
      );
    }
  });
}

function collectCustomProperties(cssSource: string, filePath: string): Map<string, string> {
  const root = postcss.parse(cssSource, { from: filePath });
  const map = new Map<string, string>();
  root.walkDecls((decl) => {
    if (decl.prop.startsWith("--") && !map.has(decl.prop)) {
      map.set(decl.prop, decl.value.trim());
    }
  });
  return map;
}

/**
 * Parses `packages/themes` base tokens and all preset themes (`Nordic`, `Editorial`) via PostCSS.
 */
export function parseThemesPackage(themesPkgDir: string): {
  base: BaseTokensIR;
  themes: ThemeIR[];
} {
  const srcDir = path.join(themesPkgDir, "src");
  const baseCssPath = path.join(srcDir, "base.css");
  const baseProps = collectCustomProperties(
    readFileSync(baseCssPath, "utf-8"),
    baseCssPath,
  );

  const spacing: DimensionTokenIR[] = [];
  const controlSizes: DimensionTokenIR[] = [];

  for (const [token, rawValue] of baseProps.entries()) {
    if (/^--space-\d+$/.test(token)) {
      spacing.push({ token, rawValue, pxValue: parseRemOrPx(rawValue) });
    } else if (
      token.startsWith("--control-height-") ||
      token.startsWith("--control-pad-inline-") ||
      token === "--target-min-size"
    ) {
      controlSizes.push({ token, rawValue, pxValue: parseRemOrPx(rawValue) });
    }
  }

  const themesDir = path.join(srcDir, "themes");
  const themeFolders = readdirSync(themesDir).sort();
  const themes: ThemeIR[] = [];

  for (const id of themeFolders) {
    const themeDir = path.join(themesDir, id);
    const cssPath = path.join(themeDir, "theme.css");
    if (!existsSync(cssPath)) continue;

    const cssSource = readFileSync(cssPath, "utf-8");
    validateComponentCss(cssPath, cssSource);
    const props = collectCustomProperties(cssSource, cssPath);

    const colors: ThemeColorPair[] = [];
    const radii: DimensionTokenIR[] = [];
    const fonts: Record<string, string> = {};

    for (const [token, rawValue] of props.entries()) {
      if (token.startsWith("--radius-")) {
        radii.push({ token, rawValue, pxValue: parseRemOrPx(rawValue) });
      } else if (token.startsWith("--font-")) {
        fonts[token] = rawValue;
      } else if (
        token.startsWith("--color-") &&
        !token.endsWith("-light") &&
        !token.endsWith("-dark")
      ) {
        const lightRaw = props.get(`${token}-light`);
        const darkRaw = props.get(`${token}-dark`);
        if (!lightRaw || !darkRaw) {
          throw new Error(
            `${cssPath}: Semantic color token "${token}" must define both "${token}-light" and "${token}-dark" pairs for Figma Variable modes.`,
          );
        }
        colors.push({
          token,
          lightRaw,
          darkRaw,
          lightRgba: parseCssColorToRgba(lightRaw),
          darkRgba: parseCssColorToRgba(darkRaw),
        });
      }
    }

    const designPath = path.join(themeDir, "DESIGN.md");
    const tokensPath = path.join(themeDir, "TOKENS.md");
    const designMarkdown = existsSync(designPath)
      ? readFileSync(designPath, "utf-8")
      : "";
    const tokensMarkdown = existsSync(tokensPath)
      ? readFileSync(tokensPath, "utf-8")
      : "";

    const label = id.charAt(0).toUpperCase() + id.slice(1);
    themes.push({
      id,
      label,
      designMarkdown,
      tokensMarkdown,
      colors,
      radii,
      fonts,
    });
  }

  return { base: { spacing, controlSizes }, themes };
}
