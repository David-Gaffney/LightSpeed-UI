/**
 * Canonical `.astro` component authoring contract types consumed by `@lsui/ast`,
 * `apps/docs`, `@lsui/mcp`, and `@lsui/figma-sync`.
 */

export const HYDRATION_MODES = ["none", "optional", "required"] as const;
export type HydrationMode = (typeof HYDRATION_MODES)[number];

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

export type BuiltInInvokerCommand =
  | "show-modal"
  | "close"
  | "request-close"
  | "toggle-popover"
  | "show-popover"
  | "hide-popover";

/** Custom invoker commands must start with `--` per HTML Invoker Commands spec. */
export type InvokerCommand = BuiltInInvokerCommand | `--${string}`;

export interface ComponentContractMeta {
  title: string;
  description: string;
  category: string;
  hydration: HydrationMode;
  accessibility: string[];
  keyboard: string[];
  slots: Array<{ name: string; description: string }>;
}
