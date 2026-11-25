import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { FigmaSpec } from "@lsui/ast";
import {
  buildButtonComponentSyncScript,
  buildTokensSyncScript,
  type SyncedTokensLedger,
} from "../src/index.ts";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specPath = path.join(pkgRoot, "generated/figma-spec.json");

function fakeLedger(spec: FigmaSpec): SyncedTokensLedger {
  return {
    collections: {
      primitivesId: "VariableCollectionId:1:1",
      colorsId: "VariableCollectionId:1:2",
      dimensionsId: "VariableCollectionId:1:3",
    },
    colorModes: {
      "Nordic Light": "1:0",
      "Nordic Dark": "1:1",
      "Editorial Light": "1:2",
      "Editorial Dark": "1:3",
    },
    dimensionModes: { Nordic: "2:0", Editorial: "2:1" },
    variablesByCssToken: Object.fromEntries([
      ...spec.variableCollections.colors.variables.map((v, i) => [
        v.cssToken,
        `VariableID:10:${i}`,
      ]),
      ...spec.variableCollections.dimensions.variables.map((v, i) => [
        v.cssToken,
        `VariableID:20:${i}`,
      ]),
    ]),
    textStyleIds: { sm: "S:1", md: "S:2", lg: "S:3" },
    planModeLimitReached: false,
  };
}

describe("@lsui/figma-sync script builders", () => {
  it("generates idempotent token + primitive + text-style sync script from figma-spec.json", () => {
    const spec = JSON.parse(readFileSync(specPath, "utf-8")) as FigmaSpec;
    const script = buildTokensSyncScript(spec);

    expect(script).toContain('ensureCollection("Primitives", ["Value"])');
    expect(script).toContain('ensureCollection("Theme Colors"');
    expect(script).toContain('ensureCollection("Geometry & Spacing"');
    expect(script).toContain("VARIABLE_ALIAS");
    expect(script).toContain('setVariableCodeSyntax("WEB"');
    expect(script).not.toContain("figma.notify");
    expect(script).not.toContain("figma.closePlugin");
  });

  it("generates Liftoff Button ComponentSet + Multi-Theme Showcase sync script", () => {
    const spec = JSON.parse(readFileSync(specPath, "utf-8")) as FigmaSpec;
    const ledger = fakeLedger(spec);

    const script = buildButtonComponentSyncScript(spec, ledger);
    expect(script).toContain("combineAsVariants");
    expect(script).toContain("setExplicitVariableModeForCollection");
    expect(script).toContain("Button — Multi-Theme Showcase");
    expect(script).toContain("Show Icon Start");
    expect(script).toContain("Show Icon End");
  });

  it("derives every canvas color from semantic tokens instead of literals", () => {
    const spec = JSON.parse(readFileSync(specPath, "utf-8")) as FigmaSpec;
    const script = buildButtonComponentSyncScript(spec, fakeLedger(spec));

    expect(script).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(script).not.toContain("stroke=\"#11181F\"");
    expect(script).toContain('const vColorText = await reqVar("--color-text")');
    expect(script).toContain("vec.strokes = [boundSolidPaint(vColorText)]");
    expect(script).toContain(
      "showcase.fills = [boundSolidPaint(vColorSurfaceMuted)]",
    );
    expect(script).toContain("headerTitle.fills = [boundSolidPaint(vColorText)]");
    expect(script).toContain("const themeCards = THEME_CARDS;");
  });

  it("derives variant axes and the multi-page split plan from component IR", () => {
    const spec = JSON.parse(readFileSync(specPath, "utf-8")) as FigmaSpec;
    const button = spec.components.find((c) => c.slug === "button")!;
    button.variantAxes.find((a) => a.name === "variant")!.values.push("success");
    const script = buildButtonComponentSyncScript(spec, fakeLedger(spec));

    expect(script).toContain('"key":"success"');
    expect(script).toContain('"totalVariants":36');
    expect(script).toContain('"Button / success"');
    expect(script).toContain(
      "VARIANT_PLAN.totalVariants > VARIANT_PLAN.maxVariantsPerSet",
    );
  });

  it("emits syntactically valid JavaScript for use_figma", () => {
    const spec = JSON.parse(readFileSync(specPath, "utf-8")) as FigmaSpec;
    const script = buildButtonComponentSyncScript(spec, fakeLedger(spec));
    const dir = mkdtempSync(path.join(tmpdir(), "lsui-figma-"));
    try {
      const file = path.join(dir, "script.mjs");
      writeFileSync(file, `(async () => {\n${script}\n})();\n`);
      execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
