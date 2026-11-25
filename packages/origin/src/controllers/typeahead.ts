/**
 * Level 1 (Origin) — headless typeahead for composite widgets.
 *
 * `focusgroup` deliberately has no typeahead, so this controller is useful in
 * both the native and fallback paths. It listens only for printable character
 * keys; roving-focus keeps Arrow/Home/End. `Space` is never intercepted.
 */

import {
  FOCUSABLE_SELECTOR,
  getNavigableItems,
} from "./roving-focus.ts";

const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable=true]";
const RESET_KEYS = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "Escape",
  "Tab",
]);

function normalizeLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

function defaultGetLabel(element: HTMLElement): string {
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return normalizeLabel(ariaLabel);

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" ");
    if (text.trim()) return normalizeLabel(text);
  }

  const text = element.textContent ?? "";
  if (text.trim()) return normalizeLabel(text);
  return normalizeLabel(element.getAttribute("title") ?? "");
}

export interface TypeaheadOptions {
  /** Selector for candidate items. Defaults to `FOCUSABLE_SELECTOR`. */
  itemSelector?: string;
  /** How to read an item's searchable label. Defaults to accessible-name order. */
  getLabel?: (element: HTMLElement) => string;
  /** Buffer inactivity reset, in milliseconds. Defaults to `500`. */
  bufferTimeout?: number;
  /** Wrap from the last item to the first. Defaults to `true`. */
  wrap?: boolean;
  onMatch?: (element: HTMLElement, index: number) => void;
  onNoMatch?: (buffer: string) => void;
}

export interface TypeaheadController {
  /** Current accumulated buffer (mainly for tests/debugging). */
  readonly buffer: string;
  /** Clear the buffer immediately. */
  reset(): void;
  /** Remove listeners and timers. */
  destroy(): void;
}

export function createTypeahead(
  container: HTMLElement,
  options: TypeaheadOptions = {},
): TypeaheadController {
  const itemSelector = options.itemSelector ?? FOCUSABLE_SELECTOR;
  const getLabel = options.getLabel ?? defaultGetLabel;
  const bufferTimeout = options.bufferTimeout ?? 500;
  const wrap = options.wrap ?? true;

  let buffer = "";
  let lastInput = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const controller: TypeaheadController = {
    get buffer() {
      return buffer;
    },
    reset,
    destroy,
  };

  function clearTimer(): void {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  function reset(): void {
    buffer = "";
    lastInput = 0;
    clearTimer();
  }

  function scheduleReset(): void {
    clearTimer();
    timer = setTimeout(reset, bufferTimeout);
  }

  function findMatch(char: string): HTMLElement | undefined {
    const items = getNavigableItems(container, itemSelector);
    if (items.length === 0) return undefined;

    const repeated = buffer.length === 1 && buffer === char;
    const active = container.ownerDocument.activeElement;
    const currentIndex = active instanceof HTMLElement ? items.indexOf(active) : -1;
    const start = currentIndex === -1 ? 0 : currentIndex + (repeated ? 1 : 0);
    const count = wrap ? items.length : items.length - Math.max(start, 0);

    for (let step = 0; step < count; step++) {
      let index = start + step;
      if (wrap) index %= items.length;
      if (index < 0 || index >= items.length) continue;
      const label = getLabel(items[index]!);
      if (label.startsWith(buffer)) {
        options.onMatch?.(items[index]!, index);
        return items[index];
      }
    }
    return undefined;
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }
    const target = event.composedPath()[0];
    if (!(target instanceof Element) || target.closest(EDITABLE_SELECTOR)) return;

    if (RESET_KEYS.has(event.key) || event.key === " ") {
      reset(); // Space is never intercepted; it still activates native buttons.
      return;
    }
    if (event.key.length !== 1) return;

    const now = Date.now();
    if (now - lastInput > bufferTimeout) buffer = "";
    const char = event.key.toLocaleLowerCase();
    if (buffer.length === 1 && buffer === char) {
      // Repeated single character cycles through matches.
    } else {
      buffer += char;
    }
    lastInput = now;
    scheduleReset();

    const match = findMatch(char);
    if (!match) {
      buffer = "";
      options.onNoMatch?.(char);
      return;
    }
    event.preventDefault();
    match.focus();
    match.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !container.contains(next)) reset();
  }

  container.addEventListener("keydown", onKeyDown);
  container.addEventListener("focusout", onFocusOut);

  function destroy(): void {
    container.removeEventListener("keydown", onKeyDown);
    container.removeEventListener("focusout", onFocusOut);
    reset();
  }

  return controller;
}
