import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validatePolyfillLedger } from "../scripts/check-polyfills.ts";
import { PACKAGE_NAME as CORE_NAME } from "../packages/core/src/index.ts";

const tempDirs: string[] = [];

function createTempFixture(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "lsui-polyfill-test-"));
  tempDirs.push(dir);
  mkdirSync(path.join(dir, "packages/behaviors/src"), { recursive: true });
  writeFileSync(
    path.join(dir, "packages/behaviors/package.json"),
    JSON.stringify({ name: "@lsui/behaviors", dependencies: {} }),
  );
  writeFileSync(path.join(dir, "packages/behaviors/src/popover.ts"), "export {};\n");
  writeFileSync(path.join(dir, "packages/behaviors/src/dialog.ts"), "export {};\n");
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("workspace & POLYFILL.md governance", () => {
  it("resolves workspace packages cleanly", () => {
    expect(CORE_NAME).toBe("@lsui/core");
  });

  it("accepts a chronologically ordered POLYFILL.md (oldest -> newest)", () => {
    const rootDir = createTempFixture();
    const markdown = `
| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2024-04 | Popover API | https://webstatus.dev/features/popover | \`@oddbird/popover-polyfill\` | \`packages/behaviors/src/popover.ts\` |
| 2026-01 | Invoker Commands | https://webstatus.dev/features/invoker-commands | \`invokers-polyfill\` | \`packages/behaviors/src/dialog.ts\` |
`;
    const result = validatePolyfillLedger({ rootDir, markdown });
    expect(result.ok).toBe(true);
    expect(result.entries).toHaveLength(2);
  });

  it("rejects out-of-order dates when a newer feature is placed above an older feature", () => {
    const rootDir = createTempFixture();
    const markdown = `
| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2026-01 | Invoker Commands | https://webstatus.dev/features/invoker-commands | \`invokers-polyfill\` | \`packages/behaviors/src/dialog.ts\` |
| 2024-04 | Popover API | https://webstatus.dev/features/popover | \`@oddbird/popover-polyfill\` | \`packages/behaviors/src/popover.ts\` |
`;
    const result = validatePolyfillLedger({ rootDir, markdown });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("Out-of-order Baseline date"))).toBe(true);
  });

  it("rejects missing or invalid webstatus.dev links and non-existent Used In paths", () => {
    const rootDir = createTempFixture();
    const markdown = `
| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2025-05 | CSS Anchor Positioning | https://example.com/anchor | \`@oddbird/css-anchor-positioning\` | \`packages/behaviors/src/missing.ts\` |
`;
    const result = validatePolyfillLedger({ rootDir, markdown });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("Invalid WebStatus URL"))).toBe(true);
    expect(result.errors.some((e) => e.includes("does not exist"))).toBe(true);
  });

  it("rejects unlisted polyfill dependencies or imports in packages/*", () => {
    const rootDir = createTempFixture();
    writeFileSync(
      path.join(rootDir, "packages/behaviors/package.json"),
      JSON.stringify({
        name: "@lsui/behaviors",
        dependencies: { "invokers-polyfill": "^0.5.0" },
      }),
    );
    writeFileSync(
      path.join(rootDir, "packages/behaviors/src/dialog.ts"),
      'import "invokers-polyfill";\n',
    );
    const markdown = `
| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
`;
    const result = validatePolyfillLedger({ rootDir, markdown });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('Polyfill dependency "invokers-polyfill"')),
    ).toBe(true);
    expect(
      result.errors.some((e) => e.includes('Imports polyfill "invokers-polyfill"')),
    ).toBe(true);
  });
});
