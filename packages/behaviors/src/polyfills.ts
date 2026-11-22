/**
 * Conditional feature-detected polyfill loaders for Baseline Newly Available APIs.
 * Every polyfill loaded here is tracked in root `POLYFILL.md` (oldest -> newest).
 */

let popoverPromise: Promise<unknown> | null = null;
let invokersPromise: Promise<unknown> | null = null;

/**
 * Conditionally loads `@oddbird/popover-polyfill` only when the native Popover API
 * (`HTMLElement.prototype.popover`, Baseline Newly Available 2025-01-27) is absent.
 */
export function ensurePopoverPolyfill(): Promise<void> {
  if (typeof window === "undefined" || typeof HTMLElement === "undefined") {
    return Promise.resolve();
  }
  if (Object.hasOwn(HTMLElement.prototype, "popover")) {
    return Promise.resolve();
  }
  popoverPromise ??= import("@oddbird/popover-polyfill");
  return popoverPromise.then(() => undefined);
}

/**
 * Conditionally loads `invokers-polyfill` only when the native Invoker Commands API
 * (`HTMLButtonElement.prototype.commandForElement`, Baseline Newly Available 2025-12-12) is absent.
 */
export function ensureInvokerCommandsPolyfill(): Promise<void> {
  if (
    typeof window === "undefined" ||
    typeof HTMLButtonElement === "undefined"
  ) {
    return Promise.resolve();
  }
  if ("commandForElement" in HTMLButtonElement.prototype) {
    return Promise.resolve();
  }
  invokersPromise ??= import("invokers-polyfill");
  return invokersPromise.then(() => undefined);
}

/**
 * Ensures declarative button trigger APIs (`popovertarget` and `commandfor`/`command`)
 * are supported in the current browser without downloading polyfill chunks when native.
 */
export async function ensureDeclarativeTriggers(options?: {
  popover?: boolean;
  invoker?: boolean;
}): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (options?.popover !== false) {
    tasks.push(ensurePopoverPolyfill());
  }
  if (options?.invoker !== false) {
    tasks.push(ensureInvokerCommandsPolyfill());
  }
  await Promise.all(tasks);
}
