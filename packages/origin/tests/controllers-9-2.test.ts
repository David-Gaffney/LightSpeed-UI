// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDismissableLayer,
  isOutside,
} from "../src/controllers/dismissable-layer.ts";
import { createFocusTrap } from "../src/controllers/focus-trap.ts";
import {
  afterMotion,
  motionDuration,
  prefersReducedMotion,
} from "../src/controllers/reduced-motion.ts";
import { createSelection } from "../src/controllers/selection.ts";

function layer(markup: string, role = "group"): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("role", role);
  el.innerHTML = markup;
  document.body.appendChild(el);
  return el;
}

function tab(element: Element, shift = false): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey: shift,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  delete (HTMLDialogElement.prototype as unknown as Record<string, unknown>).closedBy;
});

describe("@lsui/origin — createFocusTrap", () => {
  it("cycles Tab and restores the previous focus", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();

    const container = layer("<button>A</button><button>B</button>");
    const [a, b] = [...container.querySelectorAll("button")] as HTMLElement[];
    const trap = createFocusTrap(container);
    expect(document.activeElement).toBe(a);

    // A plain Tab from the first item is left to the browser.
    expect(tab(a!).defaultPrevented).toBe(false);
    b!.focus(); // simulate the browser's native move
    expect(tab(b!).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(a);
    expect(tab(a!, true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(b);

    trap.destroy();
    expect(document.activeElement).toBe(outside);
  });

  it("does nothing for a native modal dialog", () => {
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    document.body.appendChild(dialog);
    if ("matches" in dialog) {
      vi.spyOn(dialog, "matches").mockReturnValue(true);
    }
    const trap = createFocusTrap(dialog);
    expect(trap.active).toBe(false);
    trap.destroy();
  });
});

describe("@lsui/origin — createDismissableLayer", () => {
  it("dismisses on Escape and on press+release outside", () => {
    const container = layer("<button>Inside</button>");
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => ({ left: 10, top: 10, right: 100, bottom: 100 }),
      configurable: true,
    });
    const reasons: string[] = [];
    const controller = createDismissableLayer(container, {
      onDismiss: (reason) => reasons.push(reason),
    });

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(reasons).toEqual(["escape"]);

    const pointer = (type: string, x: number, y: number): void => {
      const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
      document.dispatchEvent(event);
    };
    pointer("pointerdown", 5, 5);
    pointer("pointerup", 5, 5);
    expect(reasons).toEqual(["escape", "outside"]);

    controller.destroy();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(reasons).toHaveLength(2);
  });

  it("does not close when only the release is outside", () => {
    const container = layer("<button>Inside</button>");
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => ({ left: 10, top: 10, right: 100, bottom: 100 }),
      configurable: true,
    });
    const reasons: string[] = [];
    const controller = createDismissableLayer(container, {
      onDismiss: (reason) => reasons.push(reason),
    });

    expect(isOutside(container, new MouseEvent("pointerdown", { clientX: 50, clientY: 50 }))).toBe(false);
    document.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 50, clientY: 50 }));
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 5, clientY: 5 }));
    expect(reasons).toEqual([]);
    controller.destroy();
  });

  it("defers to native dialog closedBy", () => {
    Object.defineProperty(HTMLDialogElement.prototype, "closedBy", {
      value: "any",
      configurable: true,
    });
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    document.body.appendChild(dialog);
    const onDismiss = vi.fn();
    const controller = createDismissableLayer(dialog, { onDismiss });
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(onDismiss).not.toHaveBeenCalled();
    controller.destroy();
  });
});

describe("@lsui/origin — createSelection", () => {
  it("selects one item and toggles in multiple mode", () => {
    const container = layer(
      '<div role="option" id="a">A</div><div role="option" id="b">B</div>',
      "listbox",
    );
    const [a, b] = [...container.querySelectorAll("[role=option]")] as HTMLElement[];
    const controller = createSelection(container);

    a!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(a!.getAttribute("aria-selected")).toBe("true");
    b!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(a!.getAttribute("aria-selected")).toBe("false");
    expect(b!.getAttribute("aria-selected")).toBe("true");
    controller.destroy();

    const multi = layer(
      '<div role="option" id="c">C</div><div role="option" id="d">D</div>',
      "listbox",
    );
    const [c, d] = [...multi.querySelectorAll("[role=option]")] as HTMLElement[];
    const multiController = createSelection(multi, { mode: "multiple" });
    expect(multi.getAttribute("aria-multiselectable")).toBe("true");

    c!.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
    d!.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
    expect(c!.getAttribute("aria-selected")).toBe("true");
    expect(d!.getAttribute("aria-selected")).toBe("true");
    multiController.destroy();
    expect(multi.hasAttribute("aria-multiselectable")).toBe(false);
  });
});

describe("@lsui/origin — reduced motion helper", () => {
  it("honours media query and data-motion overrides", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const container = layer("<div></div>");
    expect(prefersReducedMotion(container)).toBe(false);
    expect(motionDuration(container, 200)).toBe(200);

    container.setAttribute("data-motion", "reduced");
    expect(prefersReducedMotion(container)).toBe(true);
    expect(motionDuration(container, 200)).toBe(0);

    container.setAttribute("data-motion", "none");
    expect(prefersReducedMotion(container)).toBe(true);
  });

  it("continues immediately when there is no animation", () => {
    const container = layer("<div></div>");
    const done = vi.fn();
    afterMotion(container, done);
    expect(done).toHaveBeenCalledOnce();
  });
});
