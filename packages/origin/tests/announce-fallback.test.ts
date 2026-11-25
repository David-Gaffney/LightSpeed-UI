// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { announce } from "../src/announce.ts";

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function forceFallback(): void {
  delete (Element.prototype as unknown as Record<string, unknown>).ariaNotify;
  delete (Document.prototype as unknown as Record<string, unknown>).ariaNotify;
}

describe("@lsui/origin — announce() forced aria-live fallback", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("places the live region inside an open dialog, never on inert body content", async () => {
    forceFallback();
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    const target = document.createElement("button");
    dialog.appendChild(target);
    document.body.appendChild(dialog);

    announce("Card moved to Doing", { target, priority: "assertive" });
    await flush();

    const region = dialog.querySelector('[data-lsui-announcer="assertive"]');
    expect(region?.textContent).toBe("Card moved to Doing");
    expect(
      Array.from(document.body.children).some((el) =>
        el.hasAttribute("data-lsui-announcer"),
      ),
    ).toBe(false);
  });

  it("uses the document's requestAnimationFrame and falls back to body otherwise", async () => {
    forceFallback();
    const view = document.defaultView;
    const raf = view ? vi.spyOn(view, "requestAnimationFrame") : null;

    announce("Saved");
    await flush();

    const region = document.body.querySelector('[data-lsui-announcer="polite"]');
    expect(region?.textContent).toBe("Saved");
    if (raf) {
      expect(raf).toHaveBeenCalled();
      raf.mockRestore();
    }
  });

  it("does not call ariaNotify on a detached target", () => {
    const notify = vi.fn();
    const detached = document.createElement("button");
    Object.defineProperty(detached, "ariaNotify", {
      value: notify,
      configurable: true,
    });

    announce("ignored", { target: detached });
    expect(notify).not.toHaveBeenCalled();
  });
});
