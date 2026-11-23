export const PLATFORM_LEVELS = [
  "origin",
  "liftoff",
  "landing",
  "apogee",
] as const;
export type PlatformLevel = (typeof PLATFORM_LEVELS)[number];

export const HYDRATION_MODES = ["none", "optional", "required"] as const;
export type HydrationMode = (typeof HYDRATION_MODES)[number];

export type BuiltInInvokerCommand =
  | "show-modal"
  | "close"
  | "request-close"
  | "toggle-popover"
  | "show-popover"
  | "hide-popover";

/** Custom invoker commands must start with `--` per HTML Invoker Commands spec. */
export type InvokerCommand = BuiltInInvokerCommand | `--${string}`;
