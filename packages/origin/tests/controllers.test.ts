// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { mount } from "../src/mount.ts";
import {
  createRovingFocus,
  FOCUSABLE_SELECTOR,
  getNavigableItems,
  isNativeFocusGroupSupported,
} from "../src/controllers/roving-focus.ts";
import { createTypeahead } from "../src/controllers/typeahead.ts";

function bar(markup: string): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("role", "toolbar");
  el.innerHTML = markup;
  document.body.appendChild(el);
  return el;
}

function key(element: Element, value: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key: value,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.replaceChildren();
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).focusGroup;
});

describe("@lsui/origin — focusable selector", () => {
  it("matches native interactive elements and excludes negative tabindex", () => {
    expect(FOCUSABLE_SELECTOR).toContain("button:not([disabled])");
    const container = bar(
      '<button id="a">A</button><div id="b" tabindex="-1">B</div>',
    );
    const items = getNavigableItems(container, FOCUSABLE_SELECTOR);
    expect(items.map((item) => item.id)).toEqual(["a"]);
  });
});

describe("@lsui/origin — createRovingFocus", () => {
  it("does nothing when native focusgroup is supported", () => {
    Object.defineProperty(HTMLElement.prototype, "focusGroup", {
      value: "",
      configurable: true,
    });
    expect(isNativeFocusGroupSupported()).toBe(true);
    const container = bar("<button>A</button><button>B</button>");
    const controller = createRovingFocus(container);
    const items = [...container.querySelectorAll("button")];
    expect(items.map((item) => item.getAttribute("tabindex"))).toEqual([
      null,
      null,
    ]);
    controller.focusIndex(1);
    expect(document.activeElement).toBe(items[1]);
    controller.destroy();
  });

  it("manages one tab stop and wraps with Arrow/Home/End", () => {
    const container = bar("<button>A</button><button>B</button><button>C</button>");
    const items = [...container.querySelectorAll("button")];
    const controller = createRovingFocus(container);

    expect(items.map((item) => item.tabIndex)).toEqual([0, -1, -1]);
    key(items[0]!, "ArrowRight");
    expect(document.activeElement).toBe(items[1]);
    expect(items.map((item) => item.tabIndex)).toEqual([-1, 0, -1]);

    key(items[1]!, "ArrowLeft");
    expect(document.activeElement).toBe(items[0]);
    key(items[0]!, "ArrowLeft");
    expect(document.activeElement).toBe(items[2]); // wrap

    key(items[2]!, "Home");
    expect(document.activeElement).toBe(items[0]);
    key(items[0]!, "End");
    expect(document.activeElement).toBe(items[2]);
    controller.destroy();
  });

  it("reverses horizontal arrows in RTL and uses vertical arrows when vertical", () => {
    const rtl = bar("<button>A</button><button>B</button><button>C</button>");
    rtl.style.direction = "rtl";
    const rtlItems = [...rtl.querySelectorAll("button")];
    const rtlController = createRovingFocus(rtl);
    key(rtlItems[0]!, "ArrowRight");
    expect(document.activeElement).toBe(rtlItems[2]);
    rtlController.destroy();

    const vertical = bar("<button>A</button><button>B</button><button>C</button>");
    vertical.setAttribute("aria-orientation", "vertical");
    const verticalItems = [...vertical.querySelectorAll("button")];
    const verticalController = createRovingFocus(vertical);
    key(verticalItems[0]!, "ArrowDown");
    expect(document.activeElement).toBe(verticalItems[1]);
    const ignored = key(verticalItems[1]!, "ArrowRight");
    expect(ignored.defaultPrevented).toBe(false);
    verticalController.destroy();
  });

  it("moves the tab stop on focusin and restores original tabindex on destroy", () => {
    const container = bar(
      '<button id="a">A</button><button id="b" tabindex="5">B</button>',
    );
    const [a, b] = [...container.querySelectorAll("button")] as HTMLElement[];
    const controller = createRovingFocus(container);

    b!.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(a!.tabIndex).toBe(-1);
    expect(b!.tabIndex).toBe(0);
    expect(controller.activeIndex).toBe(1);

    controller.destroy();
    expect(a!.hasAttribute("tabindex")).toBe(false);
    expect(b!.getAttribute("tabindex")).toBe("5");
  });

  it("works when composed through mount() and cleans up on unmount", () => {
    const container = bar("<button>A</button><button>B</button>");
    container.setAttribute("data-roving-test", "");
    const unmount = mount<HTMLElement>("[data-roving-test]", (element) => {
      const roving = createRovingFocus(element);
      const typeahead = createTypeahead(element);
      return () => {
        typeahead.destroy();
        roving.destroy();
      };
    });

    const items = [...container.querySelectorAll("button")];
    expect(items.map((item) => item.tabIndex)).toEqual([0, -1]);
    key(items[0]!, "ArrowRight");
    expect(document.activeElement).toBe(items[1]);

    unmount();
    expect(items.map((item) => item.hasAttribute("tabindex"))).toEqual([
      false,
      false,
    ]);
  });
});

describe("@lsui/origin — createTypeahead", () => {
  it("matches labels, cycles repeated characters and ignores Space", () => {
    const container = bar(
      "<button>Apple</button><button>Apricot</button><button>Banana</button>",
    );
    const items = [...container.querySelectorAll("button")];
    items[0]!.focus();
    const controller = createTypeahead(container, { bufferTimeout: 5000 });

    key(items[0]!, "b");
    expect(document.activeElement).toBe(items[2]);

    controller.reset();
    key(items[2]!, "a");
    key(items[2]!, "p");
    expect(document.activeElement).toBe(items[0]);

    key(items[0]!, "a");
    key(items[0]!, "a");
    expect(document.activeElement).toBe(items[1]);

    controller.reset();
    const space = key(items[2]!, " ");
    expect(space.defaultPrevented).toBe(false);
    expect(controller.buffer).toBe("");
    controller.destroy();
  });

  it("skips disabled items and stops listening after destroy", () => {
    const container = bar(
      '<button>Alpha</button><button disabled>Alpine</button><button>Beta</button>',
    );
    const items = [...container.querySelectorAll("button")];
    const controller = createTypeahead(container, { bufferTimeout: 5000 });
    items[0]!.focus();
    key(items[0]!, "a");
    expect(document.activeElement).toBe(items[0]);
    expect(controller.buffer).toBe("a");

    controller.destroy();
    key(items[0]!, "b");
    expect(controller.buffer).toBe("");
    expect(document.activeElement).toBe(items[0]);
  });
});
