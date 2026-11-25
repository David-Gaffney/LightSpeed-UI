/**
 * Shared button styling — the single source of truth for both <Button>
 * (a real button) and <LinkButton> (an anchor styled as a button), so the
 * two stay visually identical.
 *
 * Token-mapped to Nimbus. Import `buttonVariants()` to compose the trigger
 * classes for a button-shaped element; `buttonIconSize` sizes a leading/
 * trailing icon for a given size.
 */
import { variants } from "@/lib/variants";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "secondary-destructive"
  | "outline";
export type ButtonSize = "xs" | "sm" | "base" | "lg";
export type ButtonShape = "base" | "square" | "circle";

// `rounded-lg` is the default radius for every button; `circle` overrides
// it to `rounded-full` (see `buttonVariants`), `square` keeps it.
export const buttonBase = "nob-btn";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "nob-btn-primary",
  secondary: "nob-btn-secondary",
  ghost: "nob-btn-ghost",
  destructive: "nob-btn-destructive",
  "secondary-destructive": "nob-btn-secondary-destructive",
  outline: "nob-btn-outline",
};

// Rectangular sizing (shape="base"). Radius comes from `buttonBase`.
export const buttonSizeText: Record<ButtonSize, string> = {
  xs: "nob-btn-size-xs",
  sm: "nob-btn-size-sm",
  base: "nob-btn-size-base",
  lg: "nob-btn-size-lg",
};

// Square/circle sizing (icon-only): equal dimensions, no padding.
export const buttonSizeCompact: Record<ButtonSize, string> = {
  xs: "nob-btn-compact-xs",
  sm: "nob-btn-compact-sm",
  base: "nob-btn-compact-base",
  lg: "nob-btn-compact-lg",
};

export const buttonIconSize: Record<ButtonSize, string> = {
  xs: "nob-icon-xs",
  sm: "nob-icon-xs",
  base: "nob-icon-sm",
  lg: "nob-icon-lg",
};

export interface ButtonVariantsOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
}

const button = variants({
  base: buttonBase,
  variants: {
    variant: buttonVariantClasses,
    size: buttonSizeText,
    // Square and circle are icon-only: equal sides, no padding. Their size
    // comes from `compound` below.
    shape: { base: "", square: "nob-btn-square", circle: "nob-btn-circle" },
  },
  defaults: { variant: "secondary", size: "base", shape: "base" },
  compound: (["square", "circle"] as const).flatMap((shape) =>
    (Object.keys(buttonSizeCompact) as ButtonSize[]).map((size) => ({
      shape,
      size,
      class: buttonSizeCompact[size],
    })),
  ),
});

/** Compose the base + variant + size/shape classes for a button-shaped element. */
export function buttonVariants(options: ButtonVariantsOptions = {}): string {
  return button(options);
}
