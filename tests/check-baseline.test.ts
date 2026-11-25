import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateBaselineLedger } from "../scripts/check-baseline.ts";
import { PACKAGE_NAME as LIFTOFF_NAME } from "../packages/liftoff/src/index.ts";
import { PACKAGE_NAME as ORIGIN_NAME } from "../packages/origin/src/index.ts";

const tempDirs: string[] = [];

function createTempFixture(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "lsui-baseline-test-"));
  tempDirs.push(dir);
  mkdirSync(path.join(dir, "packages/behaviors/src"), { recursive: true });
  mkdirSync(path.join(dir, "packages/themes/src"), { recursive: true });
  mkdirSync(path.join(dir, "apps/demo/src"), { recursive: true });
  writeFileSync(
    path.join(dir, "apps/demo/package.json"),
    JSON.stringify({ name: "@lsui/demo", dependencies: {} }),
  );
  writeFileSync(path.join(dir, "apps/demo/src/main.ts"), "export {};\n");
  writeFileSync(
    path.join(dir, "packages/behaviors/package.json"),
    JSON.stringify({ name: "@lsui/behaviors", dependencies: {} }),
  );
  writeFileSync(path.join(dir, "packages/behaviors/src/popover.ts"), "export {};\n");
  writeFileSync(path.join(dir, "packages/behaviors/src/dialog.ts"), "export {};\n");
  writeFileSync(path.join(dir, "packages/themes/src/base.css"), "/* css */\n");
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("workspace & BASELINE.md 3-section governance", () => {
  it("resolves workspace packages cleanly", () => {
    expect(ORIGIN_NAME).toBe("@lsui/origin");
    expect(LIFTOFF_NAME).toBe("@lsui/liftoff");
  });

  it("accepts a valid 3-section BASELINE.md ordered by Baseline Year and date (oldest -> newest)", () => {
    const rootDir = createTempFixture();
    const markdown = `
## 1. Baseline Newly Available Features Used

### Baseline 2024

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2024-12-11 | scrollbar-width | https://webstatus.dev/features/scrollbar-width | CSS fallback | \`packages/themes/src/base.css\` |

### Baseline 2025

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2025-01-27 | Popover | https://webstatus.dev/features/popover | Active polyfill | \`packages/behaviors/src/popover.ts\` |
| 2025-12-12 | Invoker commands | https://webstatus.dev/features/invoker-commands | Active polyfill | \`packages/behaviors/src/dialog.ts\` |

### Baseline 2026

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2026-09-14 | light-dark() image values | https://webstatus.dev/features/light-dark-image | CSS fallback | \`packages/themes/src/base.css\` |

## 2. CSS-Only Fallbacks

| Baseline Newly Available | Feature | WebStatus Link | CSS Fallback Mechanism | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2024-12-11 | scrollbar-width | https://webstatus.dev/features/scrollbar-width | ::-webkit-scrollbar | \`packages/themes/src/base.css\` |
| 2026-09-14 | light-dark() image values | https://webstatus.dev/features/light-dark-image | image-set() | \`packages/themes/src/base.css\` |

## 3. Active Polyfills

| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2025-01-27 | Popover | https://webstatus.dev/features/popover | \`@oddbird/popover-polyfill\` | \`packages/behaviors/src/popover.ts\` |
| 2025-12-12 | Invoker commands | https://webstatus.dev/features/invoker-commands | \`invokers-polyfill\` | \`packages/behaviors/src/dialog.ts\` |
`;
    const result = validateBaselineLedger({ rootDir, markdown });
    expect(result.ok).toBe(true);
    expect(result.newlyAvailable).toHaveLength(4);
    expect(result.cssFallbacks).toHaveLength(2);
    expect(result.activePolyfills).toHaveLength(2);
  });

  it("rejects out-of-order Baseline Year headers or date mismatches under a year header", () => {
    const rootDir = createTempFixture();
    const markdown = `
## 1. Baseline Newly Available Features Used

### Baseline 2026

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2026-09-14 | light-dark() image values | https://webstatus.dev/features/light-dark-image | CSS fallback | \`packages/themes/src/base.css\` |

### Baseline 2025

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2024-12-11 | Wrong Year Row | https://webstatus.dev/features/popover | Polyfill | \`packages/behaviors/src/popover.ts\` |

## 2. CSS-Only Fallbacks

| Baseline Newly Available | Feature | WebStatus Link | CSS Fallback Mechanism | Used In |
| :--- | :--- | :--- | :--- | :--- |

## 3. Active Polyfills

| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
`;
    const result = validateBaselineLedger({ rootDir, markdown });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("Year heading 'Baseline 2025'")),
    ).toBe(true);
    expect(
      result.errors.some((e) => e.includes("does not match heading 'Baseline 2025'")),
    ).toBe(true);
    expect(
      result.errors.some((e) => e.includes("Out-of-order Baseline date")),
    ).toBe(true);
    expect(
      result.errors.some((e) => e.includes("ascending to newest at the bottom")),
    ).toBe(true);
  });

  it("rejects Section 2/3 entries missing from Section 1, invalid URLs, or missing files", () => {
    const rootDir = createTempFixture();
    const markdown = `
## 1. Baseline Newly Available Features Used

### Baseline 2025

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2025-01-27 | Popover | https://example.com/popover | Polyfill | \`packages/behaviors/src/missing.ts\` |

## 2. CSS-Only Fallbacks

| Baseline Newly Available | Feature | WebStatus Link | CSS Fallback Mechanism | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2026-09-14 | Unlisted in Sec 1 | https://webstatus.dev/features/light-dark-image | image-set() | \`packages/themes/src/base.css\` |

## 3. Active Polyfills

| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
`;
    const result = validateBaselineLedger({ rootDir, markdown });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("Invalid WebStatus URL"))).toBe(true);
    expect(result.errors.some((e) => e.includes("does not exist"))).toBe(true);
    expect(result.errors.some((e) => e.includes("must also be listed in Section 1"))).toBe(
      true,
    );
  });

  it("rejects unlisted polyfill dependencies or imports in packages/*", () => {
    const rootDir = createTempFixture();
    writeFileSync(
      path.join(rootDir, "packages/behaviors/package.json"),
      JSON.stringify({
        name: "@lsui/behaviors",
        dependencies: { "invokers-polyfill": "^1.0.4" },
      }),
    );
    writeFileSync(
      path.join(rootDir, "packages/behaviors/src/dialog.ts"),
      'import "invokers-polyfill";\n',
    );
    const markdown = `
## 1. Baseline Newly Available Features Used

### Baseline 2026

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2026-09-14 | light-dark() image values | https://webstatus.dev/features/light-dark-image | CSS fallback | \`packages/themes/src/base.css\` |

## 2. CSS-Only Fallbacks

| Baseline Newly Available | Feature | WebStatus Link | CSS Fallback Mechanism | Used In |
| :--- | :--- | :--- | :--- | :--- |

## 3. Active Polyfills

| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
`;
    const result = validateBaselineLedger({ rootDir, markdown });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('Polyfill dependency "invokers-polyfill"')),
    ).toBe(true);
    expect(
      result.errors.some((e) => e.includes('Imports polyfill "invokers-polyfill"')),
    ).toBe(true);
  });

  it("reverse-scans apps/* too, including require() and non-'polyfill'-named shims", () => {
    const rootDir = createTempFixture();
    writeFileSync(
      path.join(rootDir, "apps/demo/package.json"),
      JSON.stringify({
        name: "@lsui/demo",
        dependencies: { "whatwg-fetch": "^3.6.20" },
      }),
    );
    writeFileSync(
      path.join(rootDir, "apps/demo/src/main.ts"),
      'const polyfill = require("invokers-polyfill");\nimport "whatwg-fetch";\nexport { polyfill };\n',
    );
    const markdown = `
## 1. Baseline Newly Available Features Used

### Baseline 2025

| Baseline Newly Available | Feature | WebStatus Link | Compatibility Strategy | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2025-01-27 | Popover | https://webstatus.dev/features/popover | CSS fallback | \`packages/themes/src/base.css\` |

## 2. CSS-Only Fallbacks

| Baseline Newly Available | Feature | WebStatus Link | CSS Fallback Mechanism | Used In |
| :--- | :--- | :--- | :--- | :--- |
| 2025-01-27 | Popover | https://webstatus.dev/features/popover | CSS fallback | \`packages/themes/src/base.css\` |

## 3. Active Polyfills

| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |
| :--- | :--- | :--- | :--- | :--- |
`;
    const result = validateBaselineLedger({ rootDir, markdown });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('apps/demo/package.json: Polyfill dependency "whatwg-fetch"'),
      ),
    ).toBe(true);
    expect(
      result.errors.some((e) =>
        e.includes('apps/demo/src/main.ts: Imports polyfill "invokers-polyfill"'),
      ),
    ).toBe(true);
    expect(
      result.errors.some((e) =>
        e.includes('apps/demo/src/main.ts: Imports polyfill "whatwg-fetch"'),
      ),
    ).toBe(true);
  });
});
