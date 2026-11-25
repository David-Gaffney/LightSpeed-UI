/**
 * Level 1 (Origin) — headless roving-focus fallback.
 *
 * `focusgroup` is the native, preferred mechanism (Limited Availability:
 * Chrome/Edge 150 only). Keep `focusgroup="toolbar wrap"` in the markup; this
 * controller installs a roving-tabindex fallback ONLY when the browser does
 * not support `focusgroup`. Never install a second roving system alongside it.
 */

export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[contenteditable=true]",
  '[tabindex]:not([tabindex="-1"])',
  "audio[controls]",
  "video[controls]",
  "summary",
].join(",");

const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable=true]";

/** Skip disabled and invisible items; `checkVisibility()` is used when available. */
export function isNavigableItem(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.closest("[inert], [hidden]")) return false;
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-disabled") === "true") return false;
  if (typeof element.checkVisibility === "function") {
    return element.checkVisibility();
  }
  return true;
}

export function getNavigableItems(
  container: ParentNode,
  itemSelector: string,
): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(itemSelector)).filter(
    isNavigableItem,
  );
}

export function isNativeFocusGroupSupported(): boolean {
  return (
    typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype
  );
}

export interface RovingFocusOptions {
  /** Selector for items. Defaults to the exported `FOCUSABLE_SELECTOR`. */
  itemSelector?: string;
  /** `"horizontal"` (default) uses Left/Right; `"vertical"` uses Up/Down. */
  orientation?: "horizontal" | "vertical";
  /** Wrap at the ends. Defaults to `true` (matches `focusgroup="toolbar wrap"`). */
  wrap?: boolean;
  /** Index of the initial tab stop. Defaults to `0`. */
  initialIndex?: number;
  /** Called whenever the active item changes. */
  onFocusChange?: (item: HTMLElement, index: number) => void;
}

export interface RovingFocusController {
  /** Current item list; replaced in place by `refresh()`. */
  items: HTMLElement[];
  /** Index of the current tab stop. */
  activeIndex: number;
  /** Focus an item by index and update the tab stop. */
  focusIndex(index: number): void;
  /** Re-query the item list after DOM changes. */
  refresh(): void;
  /** Remove listeners and restore original `tabindex` attributes. */
  destroy(): void;
}

export function createRovingFocus(
  container: HTMLElement,
  options: RovingFocusOptions = {},
): RovingFocusController {
  const itemSelector = options.itemSelector ?? FOCUSABLE_SELECTOR;
  const wrap = options.wrap ?? true;

  let items = getNavigableItems(container, itemSelector);
  let activeIndex = Math.min(Math.max(options.initialIndex ?? 0, 0), Math.max(items.length - 1, 0));

  const controller: RovingFocusController = {
    get items() {
      return items;
    },
    set items(value) {
      items = value;
    },
    get activeIndex() {
      return activeIndex;
    },
    set activeIndex(value) {
      activeIndex = value;
    },
    focusIndex,
    refresh,
    destroy,
  };

  if (isNativeFocusGroupSupported()) {
    // Native focusgroup owns the tab stop and arrow keys. Do not mutate tabindex.
    return {
      get items() {
        return items;
      },
      set items(value) {
        items = value;
      },
      get activeIndex() {
        return activeIndex;
      },
      set activeIndex(value) {
        activeIndex = value;
      },
      focusIndex(index) {
        const item = items[index];
        if (!item) return;
        activeIndex = index;
        item.focus();
        item.scrollIntoView({ block: "nearest", inline: "nearest" });
        options.onFocusChange?.(item, index);
      },
      refresh() {
        items = getNavigableItems(container, itemSelector);
        activeIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));
      },
      destroy() {},
    };
  }

  const originalTabIndex = new Map<HTMLElement, string | null>();

  function remember(element: HTMLElement): void {
    if (!originalTabIndex.has(element)) {
      originalTabIndex.set(element, element.getAttribute("tabindex"));
    }
  }

  function restore(element: HTMLElement): void {
    const original = originalTabIndex.get(element);
    if (original === undefined) return;
    if (original === null) element.removeAttribute("tabindex");
    else element.setAttribute("tabindex", original);
    originalTabIndex.delete(element);
  }

  function syncIndices(): void {
    items.forEach((item, index) => {
      remember(item);
      item.tabIndex = index === activeIndex ? 0 : -1;
    });
  }

  function setActive(index: number): void {
    if (index < 0 || index >= items.length) return;
    activeIndex = index;
    syncIndices();
    options.onFocusChange?.(items[index]!, index);
  }

  function focusIndex(index: number): void {
    if (index < 0 || index >= items.length) return;
    setActive(index);
    items[index]!.focus();
    items[index]!.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function refresh(): void {
    const nextItems = getNavigableItems(container, itemSelector);
    for (const oldItem of [...originalTabIndex.keys()]) {
      if (!nextItems.includes(oldItem)) restore(oldItem);
    }
    items = nextItems;
    activeIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));
    syncIndices();
  }

  function onFocusIn(event: FocusEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const index = items.indexOf(target);
    if (index !== -1 && index !== activeIndex) setActive(index);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const target = event.composedPath()[0];
    if (!(target instanceof Element) || target.closest(EDITABLE_SELECTOR)) return;

    const vertical = container.getAttribute("aria-orientation") === "vertical";
    const rtl = getComputedStyle(container).direction === "rtl";
    const steps: Record<string, number> = vertical
      ? { ArrowDown: 1, ArrowUp: -1 }
      : { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 };
    const step = steps[event.key];

    let next: number | undefined;
    if (step !== undefined) {
      next = activeIndex + step;
      if (next < 0 || next >= items.length) {
        if (!wrap) return; // let the browser scroll natively at the boundary
        next = (next + items.length) % items.length;
      }
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = items.length - 1;
    }

    if (next === undefined || next < 0 || next >= items.length) return;
    event.preventDefault();
    focusIndex(next);
  }

  function destroy(): void {
    container.removeEventListener("focusin", onFocusIn);
    container.removeEventListener("keydown", onKeyDown);
    for (const item of [...originalTabIndex.keys()]) restore(item);
  }

  syncIndices();
  container.addEventListener("focusin", onFocusIn);
  container.addEventListener("keydown", onKeyDown);
  return controller;
}
