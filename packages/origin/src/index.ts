export const PACKAGE_NAME = "@lsui/origin";
export const PLATFORM_LEVEL = "origin" as const;

export {
  announce,
  supportsAriaNotify,
  type AnnounceOptions,
  type AnnouncePriority,
} from "./announce.ts";
export {
  ensureAriaDisabledGuard,
  ensureSimulatedButtonKeys,
} from "./aria-disabled.ts";
export {
  buttonAttrs,
  linkAttrs,
  type ButtonAttrsOptions,
  type LinkAttrsOptions,
} from "./attrs/button-attrs.ts";
export {
  HYDRATION_MODES,
  PLATFORM_LEVELS,
  type BuiltInInvokerCommand,
  type HydrationMode,
  type InvokerCommand,
  type PlatformLevel,
} from "./contract.ts";
export { mount, type CleanupFn, type MountSetup } from "./mount.ts";
export {
  ensureDeclarativeTriggers,
  ensureInvokerCommandsPolyfill,
  ensurePopoverPolyfill,
} from "./polyfills.ts";
