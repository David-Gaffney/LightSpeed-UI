import type { RgbaColor } from "./types.ts";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function linearToSrgb(c: number): number {
  const v = clamp01(c);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function toHexByte(n: number): string {
  return Math.round(clamp01(n) * 255)
    .toString(16)
    .padStart(2, "0");
}

/**
 * Deterministically converts CSS `oklch(L C H / alpha)` or `#hex` tokens into
 * sRGB `{ r, g, b, a, hex }` floats (`0..1`) suitable for the Figma Variables API.
 */
export function parseCssColorToRgba(input: string): RgbaColor {
  const trimmed = input.trim();

  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed);
  if (hexMatch?.[1]) {
    const raw = hexMatch[1];
    const full =
      raw.length === 3
        ? `${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`
        : raw;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;
    return {
      r: round4(r),
      g: round4(g),
      b: round4(b),
      a: 1,
      hex: `#${full.toLowerCase()}`,
    };
  }

  const oklchMatch =
    /^oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)(?:deg)?(?:\s*\/\s*([0-9.]+%?))?\s*\)$/i.exec(
      trimmed,
    );
  if (!oklchMatch) {
    throw new Error(`Unsupported CSS color token literal for Figma conversion: "${input}"`);
  }

  const lRaw = oklchMatch[1]!;
  const L = lRaw.endsWith("%") ? parseFloat(lRaw) / 100 : parseFloat(lRaw);
  const C = parseFloat(oklchMatch[2]!);
  const H = (parseFloat(oklchMatch[3]!) * Math.PI) / 180;
  const aRaw = oklchMatch[4];
  const alpha = aRaw
    ? aRaw.endsWith("%")
      ? parseFloat(aRaw) / 100
      : parseFloat(aRaw)
    : 1;

  const aLab = C * Math.cos(H);
  const bLab = C * Math.sin(H);

  // Oklab -> LMS -> Linear sRGB (Björn Ottosson's reference matrices)
  const l_ = L + 0.3963377774 * aLab + 0.2158037573 * bLab;
  const m_ = L - 0.1055613458 * aLab - 0.0638541728 * bLab;
  const s_ = L - 0.0894841775 * aLab - 1.291485548 * bLab;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const r = linearToSrgb(rLin);
  const g = linearToSrgb(gLin);
  const b = linearToSrgb(bLin);

  return {
    r: round4(r),
    g: round4(g),
    b: round4(b),
    a: round4(clamp01(alpha)),
    hex: `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`,
  };
}
