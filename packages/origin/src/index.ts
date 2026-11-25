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
  createRovingFocus,
  FOCUSABLE_SELECTOR,
  getNavigableItems,
  isNativeFocusGroupSupported,
  isNavigableItem,
  type RovingFocusController,
  type RovingFocusOptions,
} from "./controllers/roving-focus.ts";
export {
  createTypeahead,
  type TypeaheadController,
  type TypeaheadOptions,
} from "./controllers/typeahead.ts";
export {
  createFocusTrap,
  type FocusTrapController,
  type FocusTrapOptions,
} from "./controllers/focus-trap.ts";
export {
  createDismissableLayer,
  isOutside,
  type DismissableLayerController,
  type DismissableLayerOptions,
  type DismissReason,
} from "./controllers/dismissable-layer.ts";
export {
  createSelection,
  type SelectionController,
  type SelectionOptions,
  type SelectionMode,
} from "./controllers/selection.ts";
export {
  afterMotion,
  motionDuration,
  prefersReducedMotion,
} from "./controllers/reduced-motion.ts";
export {
  ensureDeclarativeTriggers,
  ensureInvokerCommandsPolyfill,
  ensurePopoverPolyfill,
} from "./polyfills.ts";
