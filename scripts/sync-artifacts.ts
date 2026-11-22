import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildAiContextFiles,
  buildDocsMdxPages,
  buildFigmaSpec,
  buildRegistryArtifacts,
  parseCoreComponents,
  parseThemesPackage,
} from "../packages/ast/src/index.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

const corePkgDir = path.join(rootDir, "packages/core");
const themesPkgDir = path.join(rootDir, "packages/themes");

const components = parseCoreComponents({ corePkgDir, monorepoRoot: rootDir });
const { base: baseTokens, themes } = parseThemesPackage(themesPkgDir);

const figmaSpec = buildFigmaSpec({ components, baseTokens, themes });
const registry = buildRegistryArtifacts({ components, monorepoRoot: rootDir });
const aiDocs = buildAiContextFiles({ components, themes });
const docsMdx = buildDocsMdxPages(components);

const outputs = new Map<string, string>();

// 1. Live Nimbus Docs MDX pages (`apps/docs/src/content/docs/...`)
outputs.set("apps/docs/src/content/docs/components/index.mdx", docsMdx.indexMdx);
for (const [slug, mdx] of Object.entries(docsMdx.pages)) {
  outputs.set(`apps/docs/src/content/docs/components/${slug}.mdx`, mdx);
}

// 2. Static Registry JSON endpoints (`apps/docs/public/r/...`)
outputs.set(
  "apps/docs/public/r/index.json",
  `${JSON.stringify(registry.indexJson, null, 2)}\n`,
);
for (const [slug, item] of Object.entries(registry.items)) {
  outputs.set(
    `apps/docs/public/r/${slug}.json`,
    `${JSON.stringify(item, null, 2)}\n`,
  );
}

// 3. Root AI Context files (`AGENTS.md`, `COMPONENTS.md`, `TOKENS.md`)
outputs.set("AGENTS.md", aiDocs.agentsMd);
outputs.set("COMPONENTS.md", aiDocs.componentsMd);
outputs.set("TOKENS.md", aiDocs.tokensMd);

// 4. Validated Figma Component & Variable Spec JSON (`packages/figma-sync/generated/figma-spec.json`)
outputs.set(
  "packages/figma-sync/generated/figma-spec.json",
  `${JSON.stringify(figmaSpec, null, 2)}\n`,
);

const drifted: string[] = [];

for (const [relPath, expectedContent] of outputs.entries()) {
  const absPath = path.join(rootDir, relPath);
  const currentContent = existsSync(absPath)
    ? readFileSync(absPath, "utf-8")
    : null;

  if (currentContent !== expectedContent) {
    if (checkOnly) {
      drifted.push(relPath);
    } else {
      mkdirSync(path.dirname(absPath), { recursive: true });
      writeFileSync(absPath, expectedContent, "utf-8");
    }
  }
}

if (checkOnly) {
  if (drifted.length > 0) {
    console.error(
      "Generated artifacts are out of sync with .astro / .css source (run `pnpm sync:artifacts`):",
    );
    for (const file of drifted) {
      console.error(`  - ${file}`);
    }
    process.exit(1);
  }
  console.log(
    `✓ All ${outputs.size} AST-generated artifacts are in sync (${components.length} components, ${themes.length} themes).`,
  );
} else {
  console.log(
    `✓ Generated ${outputs.size} artifacts from AST (${components.length} components, ${themes.length} themes).`,
  );
}
