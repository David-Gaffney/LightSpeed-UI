import { describe, expect, it, vi } from "vitest";
import { announce, buttonAttrs, linkAttrs } from "../src/index.ts";

describe("@lsui/origin — Level 1 behaviors, ariaNotify() & attribute helpers", () => {
  it("builds safe buttonAttrs() for native <button> and simulated non-anchor tags", () => {
    const nativeAttrs = buttonAttrs();
    expect(nativeAttrs.type).toBe("button");
    expect(nativeAttrs.role).toBeUndefined();

    const spanAttrs = buttonAttrs({ as: "span", ariaDisabled: true });
    expect(spanAttrs.role).toBe("button");
    expect(spanAttrs.tabindex).toBe(0);
    expect(spanAttrs["aria-disabled"]).toBe("true");
    expect(spanAttrs["data-lsui-simulated-button"]).toBe("");
  });

  it("builds accessible linkAttrs() omitting href when disabled without adding role='button'", () => {
    const active = linkAttrs({ href: "/docs" });
    expect(active.href).toBe("/docs");
    expect(active.role).toBeUndefined();

    const disabled = linkAttrs({ href: "/docs", disabled: true });
    expect(disabled.href).toBeUndefined();
    expect(disabled.role).toBe("link");
    expect(disabled["aria-disabled"]).toBe("true");
  });

  it("prefers Element.ariaNotify() when available on target and maps priority to normal/high", () => {
    const elAriaNotify = vi.fn();
    const docAriaNotify = vi.fn();
    const fakeDoc = { ariaNotify: docAriaNotify } as unknown as Document;
    const fakeEl = {
      tagName: "BUTTON",
      ownerDocument: fakeDoc,
      ariaNotify: elAriaNotify,
    } as unknown as Element;

    announce("Card moved to Doing", {
      target: fakeEl,
      priority: "assertive",
    });

    expect(elAriaNotify).toHaveBeenCalledWith("Card moved to Doing", {
      priority: "high",
    });
    expect(docAriaNotify).not.toHaveBeenCalled();
  });

  it("skips Element.ariaNotify() on <body>/<html> and uses Document.ariaNotify()", () => {
    const bodyAriaNotify = vi.fn();
    const docAriaNotify = vi.fn();
    const fakeDoc = { ariaNotify: docAriaNotify } as unknown as Document;
    const fakeBody = {
      tagName: "BODY",
      ownerDocument: fakeDoc,
      ariaNotify: bodyAriaNotify,
    } as unknown as Element;

    announce("Copied to clipboard", { target: fakeBody, priority: "polite" });

    expect(bodyAriaNotify).not.toHaveBeenCalled();
    expect(docAriaNotify).toHaveBeenCalledWith("Copied to clipboard", {
      priority: "normal",
    });
  });
});
