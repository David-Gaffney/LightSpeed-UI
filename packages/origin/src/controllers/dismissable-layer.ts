/**
 * Level 1 (Origin) — light dismiss for custom layers.
 *
 * Native <dialog>.showModal() and [popover] already handle Escape and light
 * dismiss, so this controller only installs handlers where the platform does
 * not (or where `closedby` is missing, per modern-web-guidance).
 */

export type DismissReason = "escape" | "outside";

export interface DismissableLayerOptions {
  /** Element that should receive focus after dismissal. */
  trigger?: Element | null;
  dismissOnEscape?: boolean;
  dismissOnOutsidePointer?: boolean;
  isOpen?: () => boolean;
  onDismiss?: (reason: DismissReason) => void;
}

export interface DismissableLayerController {
  destroy(): void;
}

function isNativeModal(element: HTMLElement): boolean {
  if (typeof HTMLDialogElement === "undefined") return false;
  if (!(element instanceof HTMLDialogElement) || !element.open) return false;
  try {
    return element.matches(":modal");
  } catch {
    return element.hasAttribute("open");
  }
}

function hasNativeClosedBy(): boolean {
  return (
    typeof HTMLDialogElement !== "undefined" &&
    "closedBy" in HTMLDialogElement.prototype
  );
}

/** Geometry check, never `event.target`: dialog padding/backdrop gaps count as inside. */
export function isOutside(element: Element, event: MouseEvent): boolean {
  const rect = element.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

export function createDismissableLayer(
  container: HTMLElement,
  options: DismissableLayerOptions = {},
): DismissableLayerController {
  const doc = container.ownerDocument;
  const isDialog = typeof HTMLDialogElement !== "undefined" &&
    container instanceof HTMLDialogElement;
  const hasPopover = container.hasAttribute("popover");

  // Native paths: Escape (and click-outside with `closedby="any"`) are handled
  // by the platform; do not double-handle them.
  if (isNativeModal(container) || hasPopover || (isDialog && hasNativeClosedBy())) {
    return { destroy() {} };
  }

  let pressedOutside = false;

  function open(): boolean {
    return options.isOpen?.() ?? true;
  }

  function dismiss(reason: DismissReason): void {
    pressedOutside = false;
    options.onDismiss?.(reason);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (
      options.dismissOnEscape === false ||
      event.key !== "Escape" ||
      event.defaultPrevented ||
      !open()
    ) {
      return;
    }
    dismiss("escape");
  }

  function onPointerDown(event: PointerEvent): void {
    if (options.dismissOnOutsidePointer === false || !open()) return;
    pressedOutside = isOutside(container, event);
  }

  function onPointerUp(event: PointerEvent): void {
    if (!pressedOutside || !open()) return;
    if (isOutside(container, event)) dismiss("outside");
    else pressedOutside = false;
  }

  doc.addEventListener("keydown", onKeyDown, true);
  doc.addEventListener("pointerdown", onPointerDown, true);
  doc.addEventListener("pointerup", onPointerUp, true);

  return {
    destroy() {
      doc.removeEventListener("keydown", onKeyDown, true);
      doc.removeEventListener("pointerdown", onPointerDown, true);
      doc.removeEventListener("pointerup", onPointerUp, true);
    },
  };
}
