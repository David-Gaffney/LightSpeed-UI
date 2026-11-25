/**
 * Level 1 (Origin) — Screen Reader Announcer (`announce`)
 *
 * Uses Baseline 2026 `Element.ariaNotify()` / `Document.ariaNotify()`
 * (`https://webstatus.dev/features/arianotify`, Newly Available 2026-09-14)
 * as the primary zero-DOM mechanism, avoiding hidden live-region race conditions
 * and `inert` modal background silencing. Automatically falls back to a shared
 * visually-hidden `aria-live` region in older browsers.
 */

export type AnnouncePriority = "polite" | "assertive";

export interface AnnounceOptions {
  /** Priority mapped to `ariaNotify` (`"normal"` | `"high"`) or `aria-live` (`"polite"` | `"assertive"`). */
  priority?: AnnouncePriority | undefined;
  /**
   * Optional context element (e.g. a Kanban card, Combobox input, or Button inside a `<dialog>`).
   * Calling `target.ariaNotify()` inherits the nearest `lang` attribute for voice selection
   * and works cleanly inside top-layer `<dialog>` / `[popover]` elements.
   */
  target?: Element | null | undefined;
  /** Document override for iframe contexts. */
  doc?: Document | undefined;
}

type AriaNotifyFn = (
  announcement: string,
  options?: { priority?: "normal" | "high" },
) => void;

const IGNORED_ELEMENT_TAGS = new Set(["HTML", "BODY"]);
// Keyed by the host element, not the Document: a region placed inside a modal
// dialog is discarded with it, and a later announcement creates a fresh one on
// the body instead of writing into inert DOM.
const fallbackRegions = new WeakMap<
  Element,
  Record<AnnouncePriority, HTMLElement>
>();

/**
 * A live region must live inside the active top-layer context. A modal dialog
 * makes everything outside it inert, so a body-level region would be silenced
 * in exactly the flows that need announcements.
 */
function findFallbackHost(doc: Document): Element | null {
  const openDialog = doc.querySelector("dialog[open]");
  if (openDialog) return openDialog;
  try {
    const openPopover = doc.querySelector(
      '[popover]:is(:popover-open, .\\:popover-open)',
    );
    if (openPopover) return openPopover;
  } catch {
    // Browsers without :popover-open simply keep the body host.
  }
  return doc.body ?? doc.documentElement ?? null;
}

function getOrCreateFallbackRegion(
  host: Element,
  priority: AnnouncePriority,
): HTMLElement {
  let pair = fallbackRegions.get(host);
  if (!pair) {
    const doc = host.ownerDocument;
    const createRegion = (p: AnnouncePriority): HTMLElement => {
      const el = doc.createElement("div");
      el.setAttribute("role", p === "assertive" ? "alert" : "status");
      el.setAttribute("aria-live", p);
      el.setAttribute("aria-atomic", "true");
      el.setAttribute("data-lsui-announcer", p);
      Object.assign(el.style, {
        position: "absolute",
        clipPath: "inset(50%)",
        overflow: "hidden",
        width: "1px",
        height: "1px",
        margin: "-1px",
        padding: "0",
        border: "0",
        whiteSpace: "nowrap",
      });
      host.appendChild(el);
      return el;
    };
    pair = {
      polite: createRegion("polite"),
      assertive: createRegion("assertive"),
    };
    fallbackRegions.set(host, pair);
  }
  return pair[priority];
}

export function supportsAriaNotify(doc?: Document): boolean {
  const d = doc ?? (typeof document !== "undefined" ? document : undefined);
  if (!d) return false;
  return typeof (d as unknown as { ariaNotify?: unknown }).ariaNotify === "function";
}

export function announce(message: string, options?: AnnounceOptions): void {
  const trimmed = message.trim();
  if (!trimmed) return;

  const target = options?.target ?? undefined;
  const doc =
    options?.doc ??
    target?.ownerDocument ??
    (typeof document !== "undefined" ? document : undefined);
  if (!doc) return;

  const priority = options?.priority ?? "polite";
  const notifyPriority = priority === "assertive" ? "high" : "normal";

  // 1. Prefer `Element.ariaNotify()` on semantic target elements (inherits nearest `lang`)
  if (
    target &&
    // A detached target cannot notify; treat a missing flag (test doubles) as connected.
    target.isConnected !== false &&
    !IGNORED_ELEMENT_TAGS.has(target.tagName.toUpperCase()) &&
    typeof (target as unknown as { ariaNotify?: unknown }).ariaNotify === "function"
  ) {
    (target as unknown as { ariaNotify: AriaNotifyFn }).ariaNotify(trimmed, {
      priority: notifyPriority,
    });
    return;
  }

  // 2. Next prefer `Document.ariaNotify()`
  if (typeof (doc as unknown as { ariaNotify?: unknown }).ariaNotify === "function") {
    (doc as unknown as { ariaNotify: AriaNotifyFn }).ariaNotify(trimmed, {
      priority: notifyPriority,
    });
    return;
  }

  // 3. Fallback for pre-Baseline-2026 browsers: visually-hidden `aria-live`
  // region inside the active top-layer context (never inert body content).
  const host = findFallbackHost(doc);
  if (!host) return;
  const region = getOrCreateFallbackRegion(host, priority);
  region.textContent = "";
  const view = doc.defaultView;
  const schedule = (cb: () => void): void => {
    if (view && typeof view.requestAnimationFrame === "function") {
      view.requestAnimationFrame(cb);
    } else {
      setTimeout(cb, 0);
    }
  };
  schedule(() => {
    region.textContent = trimmed;
  });
}
