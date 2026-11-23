/**
 * Level 1 (Origin) — Idempotent, View-Transition-Safe Behavior Mounter (`mount`)
 *
 * Attaches headless controllers to plain semantic HTML elements matching `selector`
 * without introducing Custom Element wrapper nodes in the DOM. Automatically mounts
 * on initial load and after Astro `<ClientRouter />` swaps, running cleanup callbacks
 * before page swaps.
 */

export type CleanupFn = () => void;
export type MountSetup<T extends Element = HTMLElement> = (
  element: T,
) => CleanupFn | void;

interface RegistryEntry {
  selector: string;
  setup: MountSetup<Element>;
  mounted: WeakMap<Element, CleanupFn | null>;
  elements: Set<Element>;
}

const registry: RegistryEntry[] = [];
let lifecycleBound = false;

function runEntry(entry: RegistryEntry, root: ParentNode = document): void {
  const matches = root.querySelectorAll(entry.selector);
  for (const el of matches) {
    if (entry.mounted.has(el)) continue;
    const cleanup = entry.setup(el) ?? null;
    entry.mounted.set(el, cleanup);
    entry.elements.add(el);
  }
}

function cleanupDisconnectedOrAll(forceAll: boolean): void {
  for (const entry of registry) {
    for (const el of entry.elements) {
      if (forceAll || !el.isConnected) {
        const cleanup = entry.mounted.get(el);
        cleanup?.();
        entry.mounted.delete(el);
        entry.elements.delete(el);
      }
    }
  }
}

function ensureLifecycleListeners(): void {
  if (typeof document === "undefined" || lifecycleBound) return;
  lifecycleBound = true;

  document.addEventListener("astro:before-swap", () => {
    cleanupDisconnectedOrAll(true);
  });

  document.addEventListener("astro:page-load", () => {
    cleanupDisconnectedOrAll(false);
    for (const entry of registry) {
      runEntry(entry);
    }
  });
}

export function mount<T extends Element = HTMLElement>(
  selector: string,
  setup: MountSetup<T>,
): CleanupFn {
  if (typeof document === "undefined") {
    return () => {};
  }

  ensureLifecycleListeners();

  const entry: RegistryEntry = {
    selector,
    setup: setup as MountSetup<Element>,
    mounted: new WeakMap(),
    elements: new Set(),
  };
  registry.push(entry);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => runEntry(entry), {
      once: true,
    });
  } else {
    runEntry(entry);
  }

  return () => {
    for (const el of entry.elements) {
      const cleanup = entry.mounted.get(el);
      cleanup?.();
      entry.mounted.delete(el);
    }
    entry.elements.clear();
    const idx = registry.indexOf(entry);
    if (idx !== -1) registry.splice(idx, 1);
  };
}
