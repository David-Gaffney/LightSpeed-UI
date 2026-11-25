import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../../", import.meta.url).pathname;

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("@lsui/origin — unstyled overlay contracts (Part 9.3)", () => {
  it("keeps OriginDialog semantics native and CSS-free", () => {
    const dialog = source("../src/primitives/dialog/Dialog.astro");
    const body = dialog.slice(dialog.indexOf("---\n", 4) + 4);
    expect(dialog).toContain("@title OriginDialog");
    expect(dialog).toContain("@level origin");
    expect(dialog).toContain("<dialog");
    expect(dialog).toContain('closedby={closedby}');
    expect(body).not.toMatch(/role="dialog"|aria-modal/);
    expect(dialog).not.toContain("<style");
    expect(dialog).not.toMatch(/import\s+["'][^"']*\.css/);
  });

  it("keeps OriginPopover declarative and CSS-free", () => {
    const popover = source("../src/primitives/popover/Popover.astro");
    expect(popover).toContain("@title OriginPopover");
    expect(popover).toContain("@level origin");
    expect(popover).toContain("popover={popover}");
    expect(popover).toContain("data-lsui-popover=\"\"");
    expect(popover).toContain("ensureDeclarativeTriggers");
    expect(popover).not.toContain("<style");
    expect(popover).not.toMatch(/import\s+["'][^"']*\.css/);
  });


  it("keeps 9.4 form and tabs primitives native and CSS-free", () => {
    for (const path of [
      "../src/primitives/tabs/Tabs.astro",
      "../src/primitives/select/Select.astro",
      "../src/primitives/input/Input.astro",
    ]) {
      const code = source(path);
      const body = code.slice(code.indexOf("---\n", 4) + 4);
      expect(code).toContain("@level origin");
      expect(body).not.toContain("<style");
      expect(body).not.toMatch(/import\s+["'][^"']*\.css/);
    }
    const tabs = source("../src/primitives/tabs/Tabs.astro");
    expect(tabs).toContain('focusgroup');
    expect(tabs).toContain('role="tablist"');
    const select = source("../src/primitives/select/Select.astro");
    expect(select).toContain("<select");
    expect(select).toContain("<label for=");
    const input = source("../src/primitives/input/Input.astro");
    expect(input).toContain("<input");
    expect(input).toContain("<label for=");
    expect(input).toContain("aria-describedby=");
  });

  it("registers the new primitives in the generated registry", () => {
    const registry = JSON.parse(
      readFileSync(
        `${root}apps/docs/public/r/index.json`,
        "utf8",
      ),
    ) as { items: Array<{ name: string }> };
    const names = registry.items.map((item) => item.name);
    expect(names).toContain("origin/origin-dialog");
    expect(names).toContain("origin/origin-popover");
    expect(names).toContain("origin/origin-tabs");
    expect(names).toContain("origin/origin-select");
    expect(names).toContain("origin/origin-input");
  });
});
