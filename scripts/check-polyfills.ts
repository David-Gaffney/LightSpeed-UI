import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface PolyfillEntry {
  line: number;
  baselineDate: string;
  feature: string;
  webstatusUrl: string;
  polyfill: string;
  usedIn: string[];
}

export interface ValidationResult {
  ok: boolean;
  entries: PolyfillEntry[];
  errors: string[];
}

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;
const WEBSTATUS_RE = /^https:\/\/webstatus\.dev\/features\/[a-z0-9-]+(?:\/)?$/;
const POLYFILL_PKG_RE = /(?:^|\/)[\w-]*polyfill[\w-]*$/i;
const IMPORT_RE =
  /(?:import\s+(?:[^"']*from\s+)?|import\s*\(\s*)["']([^"']*polyfill[^"']*)["']/gi;

function extractUrl(cell: string): string {
  const mdMatch = /\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/.exec(cell);
  if (mdMatch?.[1]) return mdMatch[1].trim();
  return cell.replace(/`/g, "").trim();
}

function extractPaths(cell: string): string[] {
  return cell
    .split(",")
    .map((part) => part.replace(/`/g, "").trim())
    .filter((part) => part.length > 0);
}

export function parsePolyfillMarkdown(markdown: string): {
  entries: PolyfillEntry[];
  parseErrors: string[];
} {
  const lines = markdown.split(/\r?\n/);
  const entries: PolyfillEntry[] = [];
  const parseErrors: string[] = [];

  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? "";
    const trimmed = rawLine.trim();
    const lineNum = i + 1;

    if (
      trimmed.startsWith("|") &&
      trimmed.includes("Baseline Newly Available") &&
      trimmed.includes("WebStatus Link")
    ) {
      inTable = true;
      continue;
    }

    if (!inTable) continue;

    if (!trimmed.startsWith("|")) {
      if (trimmed.length === 0) continue;
      break;
    }

    const cells = trimmed
      .slice(1, trimmed.endsWith("|") ? -1 : undefined)
      .split("|")
      .map((c) => c.trim());

    // Skip markdown alignment divider row (| :--- | ... |)
    if (cells.every((c) => /^:?-{3,}:?$/.test(c))) {
      continue;
    }

    if (cells.length !== 5) {
      parseErrors.push(
        `POLYFILL.md:${lineNum}: Expected 5 columns, found ${cells.length}.`,
      );
      continue;
    }

    const [dateCell = "", featureCell = "", linkCell = "", polyfillCell = "", usedInCell = ""] =
      cells;

    entries.push({
      line: lineNum,
      baselineDate: dateCell.replace(/`/g, "").trim(),
      feature: featureCell.trim(),
      webstatusUrl: extractUrl(linkCell),
      polyfill: polyfillCell.replace(/`/g, "").trim(),
      usedIn: extractPaths(usedInCell),
    });
  }

  if (!inTable) {
    parseErrors.push(
      "POLYFILL.md: Missing required '| Baseline Newly Available | Feature | WebStatus Link | Polyfill | Used In |' table header.",
    );
  }

  return { entries, parseErrors };
}

function walkFiles(dir: string, extensions: Set<string>, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) {
      continue;
    }
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkFiles(full, extensions, out);
    } else if (extensions.has(path.extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

export function validatePolyfillLedger(options: {
  rootDir: string;
  markdown?: string;
}): ValidationResult {
  const { rootDir } = options;
  const polyfillPath = path.join(rootDir, "POLYFILL.md");
  const errors: string[] = [];

  if (options.markdown === undefined && !existsSync(polyfillPath)) {
    return {
      ok: false,
      entries: [],
      errors: ["POLYFILL.md does not exist at workspace root."],
    };
  }

  const content = options.markdown ?? readFileSync(polyfillPath, "utf-8");
  const { entries, parseErrors } = parsePolyfillMarkdown(content);
  errors.push(...parseErrors);

  let previousDate: string | null = null;
  let previousLine = 0;

  for (const entry of entries) {
    if (!DATE_RE.test(entry.baselineDate)) {
      errors.push(
        `POLYFILL.md:${entry.line}: Invalid Baseline date "${entry.baselineDate}". Expected YYYY-MM or YYYY-MM-DD.`,
      );
    } else {
      // Normalize YYYY-MM to YYYY-MM-00 only for comparable ordering when mixed with YYYY-MM-DD
      const normalized =
        entry.baselineDate.length === 7 ? `${entry.baselineDate}-01` : entry.baselineDate;
      if (previousDate !== null && normalized < previousDate) {
        errors.push(
          `POLYFILL.md:${entry.line}: Out-of-order Baseline date "${entry.baselineDate}" appears after newer date on line ${previousLine}. Sort oldest at the top descending to newest at the bottom.`,
        );
      }
      previousDate = normalized;
      previousLine = entry.line;
    }

    if (!entry.feature) {
      errors.push(`POLYFILL.md:${entry.line}: Feature name must not be empty.`);
    }

    if (!WEBSTATUS_RE.test(entry.webstatusUrl)) {
      errors.push(
        `POLYFILL.md:${entry.line}: Invalid WebStatus URL "${entry.webstatusUrl}". Expected https://webstatus.dev/features/<feature-id>.`,
      );
    }

    if (!entry.polyfill) {
      errors.push(`POLYFILL.md:${entry.line}: Polyfill description/package must not be empty.`);
    }

    if (entry.usedIn.length === 0) {
      errors.push(
        `POLYFILL.md:${entry.line}: 'Used In' must list at least one repo-relative file path.`,
      );
    } else {
      for (const relPath of entry.usedIn) {
        const resolved = path.join(rootDir, relPath);
        if (!existsSync(resolved)) {
          errors.push(
            `POLYFILL.md:${entry.line}: Listed 'Used In' file "${relPath}" does not exist.`,
          );
        }
      }
    }
  }

  // Scan packages/* for unlisted polyfill dependencies or imports
  const packagesDir = path.join(rootDir, "packages");
  if (existsSync(packagesDir)) {
    const documentedText = entries.map((e) => e.polyfill.toLowerCase()).join(" ");
    const documentedFiles = new Set(entries.flatMap((e) => e.usedIn));

    for (const pkgFolder of readdirSync(packagesDir)) {
      const pkgJsonPath = path.join(packagesDir, pkgFolder, "package.json");
      if (existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
          name?: string;
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
          optionalDependencies?: Record<string, string>;
        };
        const allDeps = {
          ...pkgJson.dependencies,
          ...pkgJson.devDependencies,
          ...pkgJson.optionalDependencies,
        };
        for (const depName of Object.keys(allDeps)) {
          if (
            POLYFILL_PKG_RE.test(depName) &&
            !documentedText.includes(depName.toLowerCase())
          ) {
            errors.push(
              `packages/${pkgFolder}/package.json: Polyfill dependency "${depName}" is not recorded in POLYFILL.md.`,
            );
          }
        }
      }

      const srcFiles = walkFiles(
        path.join(packagesDir, pkgFolder, "src"),
        new Set([".ts", ".js", ".mjs", ".astro"]),
      );
      for (const file of srcFiles) {
        const relFile = path.relative(rootDir, file).split(path.sep).join("/");
        const source = readFileSync(file, "utf-8");
        IMPORT_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = IMPORT_RE.exec(source)) !== null) {
          const specifier = match[1] ?? "";
          if (!documentedFiles.has(relFile)) {
            errors.push(
              `${relFile}: Imports polyfill "${specifier}" without listing "${relFile}" in POLYFILL.md.`,
            );
          }
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    entries,
    errors,
  };
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = validatePolyfillLedger({ rootDir });
  if (!result.ok) {
    console.error("POLYFILL.md check failed:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
  console.log(
    `✓ POLYFILL.md check passed (${result.entries.length} active polyfill(s) tracked).`,
  );
}
