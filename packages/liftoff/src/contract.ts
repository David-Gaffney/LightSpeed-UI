export const BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "danger",
] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const CONTROL_SIZES = ["sm", "md", "lg"] as const;
export type ControlSize = (typeof CONTROL_SIZES)[number];
