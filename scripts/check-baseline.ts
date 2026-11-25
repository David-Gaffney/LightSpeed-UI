import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface BaselineRow {
  line: number;
  yearHeader?: number | undefined;
  baselineDate: string;
  feature: string;
  webstatusUrl: string;
  mechanism: string;
  usedIn: string[];
}

export interface ParsedBaseline {
  newlyAvailable: BaselineRow[];
  yearHeaders: Array<{ line: number; year: number }>;
  cssFallbacks: BaselineRow[];
  activePolyfills: BaselineRow[];
  parseErrors: string[];
}

export interface ValidationResult {
  ok: boolean;
  newlyAvailable: BaselineRow[];
  cssFallbacks: BaselineRow[];
  activePolyfills: BaselineRow[];
  errors: string[];
}

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;
const WEBSTATUS_RE = /^https:\/\/webstatus\.dev\/features\/[a-z0-9-]+(?:\/)?$/;
/**
 * Polyfills are usually detectably named, but a few common shims are not.
 * Register those explicitly here; anything with "polyfill" in its name/path
 * is detected automatically. Genuinely opaque vendor names must still be
 * recorded in BASELINE.md by hand (the ledger is the source of truth).
 */
const KNOWN_POLYFILL_PACKAGES = new Set([
  "@webcomponents/custom-elements",
  "whatwg-fetch",
  "core-js",
  "intersection-observer",
]);

function isPolyfillSpecifier(specifier: string): boolean {
  const bare = specifier.replace(/^node:/, "");
  const segments = bare.split("/");
  const packageName = bare.startsWith("@")
    ? segments.slice(0, 2).join("/")
    : (segments[0] ?? "");
  return /polyfill/i.test(bare) || KNOWN_POLYFILL_PACKAGES.has(packageName);
}

/** import "x", import { a } from "x", import("x"), require("x"), export ... from "x". */
const IMPORT_RE =
  /(?:import\s+(?:[^"';\n]*?\bfrom\s+)?|import\s*\(\s*|require\s*\(\s*|export\s+(?:[^"';\n]*?\bfrom\s+)?)["']([^"']+)["']/gi;

type SectionId = "none" | "newly" | "css-fallbacks" | "polyfills";

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

export function parseBaselineMarkdown(markdown: string): ParsedBaseline {
  const lines = markdown.split(/\r?\n/);
  const newlyAvailable: BaselineRow[] = [];
  const yearHeaders: Array<{ line: number; year: number }> = [];
  const cssFallbacks: BaselineRow[] = [];
  const activePolyfills: BaselineRow[] = [];
  const parseErrors: string[] = [];

  let currentSection: SectionId = "none";
  let currentYear: number | undefined;
  const seenSections = new Set<SectionId>();

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? "";
    const trimmed = rawLine.trim();
    const lineNum = i + 1;

    if (trimmed.startsWith("## ")) {
      currentYear = undefined;
      if (/^##\s+1\.\s+Baseline Newly Available/i.test(trimmed)) {
        currentSection = "newly";
        seenSections.add("newly");
      } else if (/^##\s+2\.\s+CSS-Only Fallbacks/i.test(trimmed)) {
        currentSection = "css-fallbacks";
        seenSections.add("css-fallbacks");
      } else if (/^##\s+3\.\s+Active Polyfills/i.test(trimmed)) {
        currentSection = "polyfills";
        seenSections.add("polyfills");
      } else {
        currentSection = "none";
      }
      continue;
    }

    if (currentSection === "newly" && trimmed.startsWith("### ")) {
      const yearMatch = /^###\s+Baseline\s+(\d{4})\s*$/.exec(trimmed);
      if (!yearMatch?.[1]) {
        parseErrors.push(
          `BASELINE.md:${lineNum}: Expected '### Baseline <YYYY>' heading in Section 1, found "${trimmed}".`,
        );
        currentYear = undefined;
      } else {
        currentYear = Number(yearMatch[1]);
        yearHeaders.push({ line: lineNum, year: currentYear });
      }
      continue;
    }

    if (currentSection === "none" || !trimmed.startsWith("|")) {
      continue;
    }

    const cells = trimmed
      .slice(1, trimmed.endsWith("|") ? -1 : undefined)
      .split("|")
      .map((c) => c.trim());

    // Skip table header and markdown alignment divider rows
    if (
      cells[0] === "Baseline Newly Available" ||
      cells.every((c) => /^:?-{3,}:?$/.test(c))
    ) {
      continue;
    }

    if (cells.length !== 5) {
      parseErrors.push(
        `BASELINE.md:${lineNum}: Expected 5 table columns, found ${cells.length}.`,
      );
      continue;
    }

    const [
      dateCell = "",
      featureCell = "",
      linkCell = "",
      mechCell = "",
      usedInCell = "",
    ] = cells;

    if (currentSection === "newly" && currentYear === undefined) {
      parseErrors.push(
        `BASELINE.md:${lineNum}: Row "${featureCell}" in Section 1 must appear under a '### Baseline <YYYY>' heading.`,
      );
    }

    const row: BaselineRow = {
      line: lineNum,
      yearHeader: currentYear,
      baselineDate: dateCell.replace(/`/g, "").trim(),
      feature: featureCell.trim(),
      webstatusUrl: extractUrl(linkCell),
      mechanism: mechCell.replace(/`/g, "").trim(),
      usedIn: extractPaths(usedInCell),
    };

    if (currentSection === "newly") {
      newlyAvailable.push(row);
    } else if (currentSection === "css-fallbacks") {
      cssFallbacks.push(row);
    } else if (currentSection === "polyfills") {
      activePolyfills.push(row);
    }
  }

  for (const required of ["newly", "css-fallbacks", "polyfills"] as const) {
    if (!seenSections.has(required)) {
      parseErrors.push(
        `BASELINE.md: Missing required section '${required}' (expected Sections 1, 2, and 3).`,
      );
    }
  }

  return {
    newlyAvailable,
    yearHeaders,
    cssFallbacks,
    activePolyfills,
    parseErrors,
  };
}

function walkFiles(
  dir: string,
  extensions: Set<string>,
  out: string[] = [],
): string[] {
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

function validateRows(
  rows: BaselineRow[],
  sectionLabel: string,
  rootDir: string,
  errors: string[],
  enforceYearHeaderMatch = false,
): void {
  let previousDate: string | null = null;
  let previousLine = 0;

  for (const entry of rows) {
    if (!DATE_RE.test(entry.baselineDate)) {
      errors.push(
        `BASELINE.md:${entry.line} (${sectionLabel}): Invalid Baseline date "${entry.baselineDate}". Expected YYYY-MM or YYYY-MM-DD.`,
      );
    } else {
      const normalized =
        entry.baselineDate.length === 7
          ? `${entry.baselineDate}-01`
          : entry.baselineDate;
      const rowYear = Number(entry.baselineDate.slice(0, 4));

      if (
        enforceYearHeaderMatch &&
        entry.yearHeader !== undefined &&
        rowYear !== entry.yearHeader
      ) {
        errors.push(
          `BASELINE.md:${entry.line} (${sectionLabel}): Row date "${entry.baselineDate}" does not match heading 'Baseline ${entry.yearHeader}'.`,
        );
      }

      if (previousDate !== null && normalized < previousDate) {
        errors.push(
          `BASELINE.md:${entry.line} (${sectionLabel}): Out-of-order Baseline date "${entry.baselineDate}" appears after newer date on line ${previousLine}. Sort oldest at the top, ascending to newest at the bottom.`,
        );
      }
      previousDate = normalized;
      previousLine = entry.line;
    }

    if (!entry.feature) {
      errors.push(
        `BASELINE.md:${entry.line} (${sectionLabel}): Feature name must not be empty.`,
      );
    }

    if (!WEBSTATUS_RE.test(entry.webstatusUrl)) {
      errors.push(
        `BASELINE.md:${entry.line} (${sectionLabel}): Invalid WebStatus URL "${entry.webstatusUrl}". Expected https://webstatus.dev/features/<feature-id>.`,
      );
    }

    if (!entry.mechanism) {
      errors.push(
        `BASELINE.md:${entry.line} (${sectionLabel}): Strategy/Fallback/Polyfill column must not be empty.`,
      );
    }

    if (entry.usedIn.length === 0) {
      errors.push(
        `BASELINE.md:${entry.line} (${sectionLabel}): 'Used In' must list at least one repo-relative file path.`,
      );
    } else {
      for (const relPath of entry.usedIn) {
        const resolved = path.join(rootDir, relPath);
        if (!existsSync(resolved)) {
          errors.push(
            `BASELINE.md:${entry.line} (${sectionLabel}): Listed 'Used In' file "${relPath}" does not exist.`,
          );
        }
      }
    }
  }
}

export function validateBaselineLedger(options: {
  rootDir: string;
  markdown?: string;
}): ValidationResult {
  const { rootDir } = options;
  const baselinePath = path.join(rootDir, "BASELINE.md");
  const errors: string[] = [];

  if (options.markdown === undefined && !existsSync(baselinePath)) {
    return {
      ok: false,
      newlyAvailable: [],
      cssFallbacks: [],
      activePolyfills: [],
      errors: ["BASELINE.md does not exist at workspace root."],
    };
  }

  const content = options.markdown ?? readFileSync(baselinePath, "utf-8");
  const parsed = parseBaselineMarkdown(content);
  errors.push(...parsed.parseErrors);

  // Verify `### Baseline YYYY` headers in Section 1 are ordered oldest -> newest
  let prevYear = -1;
  let prevYearLine = 0;
  for (const h of parsed.yearHeaders) {
    if (h.year <= prevYear) {
      errors.push(
        `BASELINE.md:${h.line}: Year heading 'Baseline ${h.year}' must appear before newer/duplicate heading on line ${prevYearLine} (oldest year at the top).`,
      );
    }
    prevYear = h.year;
    prevYearLine = h.line;
  }

  validateRows(parsed.newlyAvailable, "Section 1", rootDir, errors, true);
  validateRows(parsed.cssFallbacks, "Section 2", rootDir, errors, false);
  validateRows(parsed.activePolyfills, "Section 3", rootDir, errors, false);

  // Every feature in Section 2 (CSS Fallbacks) and Section 3 (Active Polyfills) must also appear in Section 1
  const section1Urls = new Set(parsed.newlyAvailable.map((r) => r.webstatusUrl));
  for (const row of parsed.cssFallbacks) {
    if (row.webstatusUrl && !section1Urls.has(row.webstatusUrl)) {
      errors.push(
        `BASELINE.md:${row.line} (Section 2): CSS fallback "${row.feature}" (${row.webstatusUrl}) must also be listed in Section 1 (Newly Available Features Used).`,
      );
    }
  }
  for (const row of parsed.activePolyfills) {
    if (row.webstatusUrl && !section1Urls.has(row.webstatusUrl)) {
      errors.push(
        `BASELINE.md:${row.line} (Section 3): Active polyfill "${row.feature}" (${row.webstatusUrl}) must also be listed in Section 1 (Newly Available Features Used).`,
      );
    }
  }

  // Reverse-scan the whole workspace (root, packages/*, apps/*, scripts/*)
  // for unlisted polyfill dependencies or import/require specifiers.
  const documentedText = parsed.activePolyfills
    .map((e) => e.mechanism.toLowerCase())
    .join(" ");
  const documentedFiles = new Set(
    parsed.activePolyfills.flatMap((e) => e.usedIn),
  );

  const checkPackageJson = (pkgJsonPath: string, relDir: string): void => {
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
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
        isPolyfillSpecifier(depName) &&
        !documentedText.includes(depName.toLowerCase())
      ) {
        const relJson = relDir === "." ? "package.json" : `${relDir}/package.json`;
        errors.push(
          `${relJson}: Polyfill dependency "${depName}" is not recorded in Section 3 of BASELINE.md.`,
        );
      }
    }
  };

  const rootPkgJson = path.join(rootDir, "package.json");
  if (existsSync(rootPkgJson)) checkPackageJson(rootPkgJson, ".");

  for (const rootName of ["packages", "apps", "scripts"] as const) {
    const rootPath = path.join(rootDir, rootName);
    if (!existsSync(rootPath)) continue;
    for (const folder of readdirSync(rootPath)) {
      const folderPath = path.join(rootPath, folder);
      if (!statSync(folderPath).isDirectory()) continue;

      const pkgJsonPath = path.join(folderPath, "package.json");
      if (existsSync(pkgJsonPath)) {
        checkPackageJson(pkgJsonPath, `${rootName}/${folder}`);
      }

      const srcFiles = walkFiles(
        path.join(folderPath, "src"),
        new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".astro"]),
      );
      for (const file of srcFiles) {
        const relFile = path.relative(rootDir, file).split(path.sep).join("/");
        const source = readFileSync(file, "utf-8");
        IMPORT_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = IMPORT_RE.exec(source)) !== null) {
          const specifier = match[1] ?? "";
          if (isPolyfillSpecifier(specifier) && !documentedFiles.has(relFile)) {
            errors.push(
              `${relFile}: Imports polyfill "${specifier}" without listing "${relFile}" in Section 3 of BASELINE.md.`,
            );
          }
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    newlyAvailable: parsed.newlyAvailable,
    cssFallbacks: parsed.cssFallbacks,
    activePolyfills: parsed.activePolyfills,
    errors,
  };
}

async function checkOnlineGraduation(rows: BaselineRow[]): Promise<void> {
  const seen = new Set<string>();
  for (const entry of rows) {
    if (seen.has(entry.webstatusUrl)) continue;
    seen.add(entry.webstatusUrl);
    const slug = entry.webstatusUrl.replace(/\/$/, "").split("/").pop();
    if (!slug) continue;
    const res = await fetch(`https://api.webstatus.dev/v1/features/${slug}`);
    if (!res.ok) continue;
    const data = (await res.json()) as {
      baseline?: { status?: string; low_date?: string; high_date?: string };
    };
    const status = data.baseline?.status ?? "unknown";
    if (status === "widely") {
      console.log(
        `🎉 READY TO GRADUATE: "${entry.feature}" (${entry.webstatusUrl}) became Baseline Widely Available on ${data.baseline?.high_date}!`,
      );
    } else {
      console.log(
        `  • ${entry.baselineDate} — ${entry.feature}: status="${status}" (${entry.webstatusUrl})`,
      );
    }
  }
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const rootDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const result = validateBaselineLedger({ rootDir });
  if (!result.ok) {
    console.error("BASELINE.md check failed:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
  console.log(
    `✓ BASELINE.md check passed (${result.newlyAvailable.length} Newly Available features, ${result.cssFallbacks.length} CSS fallbacks, ${result.activePolyfills.length} active polyfills).`,
  );
  if (process.argv.includes("--online")) {
    await checkOnlineGraduation(result.newlyAvailable);
  }
}
