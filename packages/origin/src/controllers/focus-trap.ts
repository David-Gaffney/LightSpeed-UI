/**
 * Level 1 (Origin) — opt-in keyboard focus containment for custom layers.
 *
 * Native modal <dialog>.showModal() already contains focus, makes the page
 * inert and restores focus. This controller MUST NOT be applied to one:
 * modern-web-guidance says "DON'T add ... a focus trap ... to a native modal".
 */

import {
  FOCUSABLE_SELECTOR,
  getNavigableItems,
} from "./roving-focus.ts";

function isNativeModal(element: HTMLElement): boolean {
  if (typeof HTMLDialogElement === "undefined") return false;
  if (!(element instanceof HTMLDialogElement) || !element.open) return false;
  try {
    return element.matches(":modal");
  } catch {
    return element.hasAttribute("open");
  }
}

export interface FocusTrapOptions {
  /** Element (or selector) to focus on activation. Defaults to the first item. */
  initialFocus?: HTMLElement | string;
  /** Element to restore focus to; defaults to the element focused on activation. */
  returnFocus?: Element | null;
  /** Disable containment dynamically. Defaults to `true`. */
  enabled?: boolean | (() => boolean);
  /** Escape hook; the dismissable layer owns dismissal. */
  onEscape?: (event: KeyboardEvent) => void;
}

export interface FocusTrapController {
  readonly active: boolean;
  activate(): void;
  deactivate(): void;
  destroy(): void;
}

export function createFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {},
): FocusTrapController {
  const noop: FocusTrapController = {
    active: false,
    activate() {},
    deactivate() {},
    destroy() {},
  };
  if (isNativeModal(container)) return noop;

  let installed = false;
  let previouslyFocused: Element | null = null;

  function isEnabled(): boolean {
    return typeof options.enabled === "function"
      ? options.enabled()
      : (options.enabled ?? true);
  }

  function items(): HTMLElement[] {
    return getNavigableItems(container, FOCUSABLE_SELECTOR);
  }

  function focusInitial(): void {
    const candidate =
      typeof options.initialFocus === "string"
        ? container.querySelector<HTMLElement>(options.initialFocus)
        : (options.initialFocus ?? items()[0]);
    (candidate ?? items()[0])?.focus();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!isEnabled()) return;
    if (event.key === "Escape") {
      options.onEscape?.(event);
      return;
    }
    if (event.key !== "Tab" || event.defaultPrevented) return;

    const candidates = items();
    if (candidates.length === 0) return;
    const first = candidates[0]!;
    const last = candidates[candidates.length - 1]!;
    const active = container.ownerDocument.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (!candidates.includes(active as HTMLElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  function onFocusIn(event: FocusEvent): void {
    if (!isEnabled()) return;
    const target = event.target;
    if (
      target instanceof Node &&
      target !== container &&
      !container.contains(target) &&
      target !== container.ownerDocument.body
    ) {
      focusInitial();
    }
  }

  function activate(): void {
    if (installed) return;
    installed = true;
    previouslyFocused = options.returnFocus ?? container.ownerDocument.activeElement;
    container.addEventListener("keydown", onKeyDown);
    container.ownerDocument.addEventListener("focusin", onFocusIn, true);
    focusInitial();
  }

  function deactivate(): void {
    if (!installed) return;
    installed = false;
    container.removeEventListener("keydown", onKeyDown);
    container.ownerDocument.removeEventListener("focusin", onFocusIn, true);
    const target = options.returnFocus ?? previouslyFocused;
    if (target?.isConnected && "focus" in target) {
      (target as HTMLElement).focus();
    }
  }

  if (isEnabled()) activate();

  return {
    get active() {
      return installed;
    },
    activate,
    deactivate,
    destroy() {
      deactivate();
      previouslyFocused = null;
    },
  };
}
