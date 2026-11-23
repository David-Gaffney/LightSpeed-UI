/**
 * Conditional feature-detected polyfill loaders for Baseline Newly Available APIs.
 * Every polyfill loaded here is tracked in root `BASELINE.md` Section 3 (oldest -> newest).
 */

let popoverPromise: Promise<unknown> | null = null;
let invokersPromise: Promise<unknown> | null = null;

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
