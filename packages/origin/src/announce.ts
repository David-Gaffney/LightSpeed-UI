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
const fallbackRegions = new WeakMap<
  Document,
  Record<AnnouncePriority, HTMLElement>
>();

function getOrCreateFallbackRegion(
  doc: Document,
  priority: AnnouncePriority,
): HTMLElement {
  let pair = fallbackRegions.get(doc);
  if (!pair) {
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
      doc.body.appendChild(el);
      return el;
    };
    pair = {
      polite: createRegion("polite"),
      assertive: createRegion("assertive"),
    };
    fallbackRegions.set(doc, pair);
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

  // 3. Fallback for pre-Baseline-2026 browsers: shared visually-hidden `aria-live` region
  const region = getOrCreateFallbackRegion(doc, priority);
  region.textContent = "";
  const schedule =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (cb: () => void) => setTimeout(cb, 0);
  schedule(() => {
    region.textContent = trimmed;
  });
}
