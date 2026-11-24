import { readFileSync } from "node:fs";
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
    const fakeLedger: SyncedTokensLedger = {
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
      dimensionModes: {
        Nordic: "2:0",
        Editorial: "2:1",
      },
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
      textStyleIds: {
        sm: "S:1",
        md: "S:2",
        lg: "S:3",
      },
      planModeLimitReached: false,
    };

    const script = buildButtonComponentSyncScript(spec, fakeLedger);
    expect(script).toContain("combineAsVariants");
    expect(script).toContain("setExplicitVariableModeForCollection");
    expect(script).toContain("Button — Multi-Theme Showcase");
    expect(script).toContain("Show Icon Start");
    expect(script).toContain("Show Icon End");
  });
});
