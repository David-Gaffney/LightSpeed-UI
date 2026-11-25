import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = new URL("../src/components/core/", import.meta.url);

describe("@lsui/liftoff — core UI wrapper contracts (Part 10.1)", () => {
  for (const name of ["Card", "Badge", "Input", "Select", "Dialog", "Popover", "Tabs"]) {
    it(`${name} delegates and uses only semantic tokens`, () => {
      const code = readFileSync(new URL(`${name}.astro`, dir), "utf8");
      expect(code).toContain("@level liftoff");
      expect(code).toContain('import "./core.css"');
      expect(code).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(code).not.toMatch(/class:\s*["'][^"']*\s(flex|grid|p-|m-)/);
      if (["Input", "Select", "Dialog", "Popover", "Tabs"].includes(name)) {
        expect(code).toMatch(/import \w+ from "@lsui\/origin\//);
      }
    });
  }

  it("scopes styles to @layer lsui and keeps anchor positioning progressive", () => {
    const css = readFileSync(new URL("core.css", dir), "utf8");
    expect(css).toContain("@layer lsui");
    expect(css).toContain("@supports (position-area: block-end)");
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
