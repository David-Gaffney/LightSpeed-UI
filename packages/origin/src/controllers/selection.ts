/**
 * Level 1 (Origin) — headless selection state for composite widgets.
 *
 * Arrow-key movement belongs to `createRovingFocus()` (Part 9.1). This
 * controller only owns selection state and ARIA state attributes; host markup
 * must already supply `role="listbox"` / `option` or `menu` / `menuitem*"`.
 */

import { getNavigableItems, isNavigableItem } from "./roving-focus.ts";

const DEFAULT_ITEM_SELECTOR = [
  '[role="option"]',
  '[role="menuitemradio"]',
  '[role="menuitemcheckbox"]',
].join(",");

export type SelectionMode = "single" | "multiple";

export interface SelectionOptions {
  mode?: SelectionMode;
  itemSelector?: string;
  onChange?: (selected: HTMLElement[]) => void;
}

export interface SelectionController {
  readonly selected: HTMLElement[];
  refresh(): void;
  destroy(): void;
}

function stateAttribute(item: Element): "aria-selected" | "aria-checked" {
  return item.getAttribute("role") === "option" ? "aria-selected" : "aria-checked";
}

export function createSelection(
  container: HTMLElement,
  options: SelectionOptions = {},
): SelectionController {
  const mode = options.mode ?? "single";
  const itemSelector = options.itemSelector ?? DEFAULT_ITEM_SELECTOR;
  const originals = new Map<HTMLElement, string | null>();
  let items = getNavigableItems(container, itemSelector);

  const originalMulti = container.getAttribute("aria-multiselectable");
  if (mode === "multiple") container.setAttribute("aria-multiselectable", "true");
  else container.removeAttribute("aria-multiselectable");

  function remember(item: HTMLElement): void {
    if (!originals.has(item)) {
      originals.set(item, item.getAttribute(stateAttribute(item)));
    }
  }

  function selected(): HTMLElement[] {
    return items.filter((item) => item.getAttribute(stateAttribute(item)) === "true");
  }

  function apply(item: HTMLElement, value: boolean): void {
    remember(item);
    item.setAttribute(stateAttribute(item), String(value));
  }

  function clear(item: HTMLElement): void {
    for (const other of items) {
      if (other === item) continue;
      if (other.getAttribute(stateAttribute(other)) === "true") apply(other, false);
    }
  }

  function select(item: HTMLElement, toggle: boolean): void {
    if (!isNavigableItem(item)) return;
    const already = item.getAttribute(stateAttribute(item)) === "true";
    if (mode === "multiple" && toggle) {
      apply(item, !already);
    } else {
      clear(item);
      apply(item, true);
    }
    options.onChange?.(selected());
  }

  function onPointer(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLElement>(itemSelector);
    if (!item || !container.contains(item)) return;
    select(item, event.ctrlKey || event.metaKey);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") {
      return;
    }
    const target = event.composedPath()[0];
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLElement>(itemSelector);
    if (!item || !container.contains(item)) return;
    event.preventDefault();
    // Space toggles in multi-select; Enter always selects exactly one.
    select(item, mode === "multiple" && event.key !== "Enter");
  }

  function refresh(): void {
    items = getNavigableItems(container, itemSelector);
    for (const item of items) remember(item);
  }

  function destroy(): void {
    container.removeEventListener("click", onPointer);
    container.removeEventListener("keydown", onKeyDown);
    for (const [item, value] of originals) {
      const attribute = stateAttribute(item);
      if (value === null) item.removeAttribute(attribute);
      else item.setAttribute(attribute, value);
    }
    originals.clear();
    if (originalMulti === null) container.removeAttribute("aria-multiselectable");
    else container.setAttribute("aria-multiselectable", originalMulti);
  }

  for (const item of items) remember(item);
  container.addEventListener("click", onPointer);
  container.addEventListener("keydown", onKeyDown);

  return {
    get selected() {
      return selected();
    },
    refresh,
    destroy,
  };
}
