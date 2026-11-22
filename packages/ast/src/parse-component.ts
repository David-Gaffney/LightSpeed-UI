import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parse as parseAstro } from "@astrojs/compiler-rs";
import { Node, Project, SyntaxKind, type Type } from "ts-morph";
import { validateComponentCss } from "./parse-css.ts";
import type {
  ComponentIR,
  FigmaPropKind,
  HydrationMode,
  PropIR,
  SlotIR,
  SourceFileRef,
} from "./types.ts";

const NON_VISUAL_PROPS: Record<string, string> = {
  href: "Navigation destination attribute (no visual Figma axis)",
  target: "Browser navigation target",
  rel: "Link relationship metadata",
  download: "Download navigation hint",
  type: "Form submission behavior ('button' | 'submit' | 'reset')",
  render: "Astro conditional rendering helper",
  class: "Consumer CSS class escape hatch",
  id: "DOM element identifier",
  style: "Inline CSS custom property escape hatch",
  commandfor: "HTML Invoker Commands target ID",
  command: "HTML Invoker Commands action name",
  popovertarget: "HTML Popover target ID",
  popovertargetaction: "HTML Popover trigger action",
  "aria-label": "Screen-reader accessible name",
  "aria-disabled": "Focusable disabled ARIA state",
};

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

function toKebabSlug(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

interface ParsedFrontmatterDoc {
  title: string;
  description: string;
  category: string;
  hydration: HydrationMode;
  accessibility: string[];
  keyboard: string[];
  slots: Map<string, string>;
}

function parseContractJsDoc(frontmatterCode: string, filePath: string): ParsedFrontmatterDoc {
  const match = /\/\*\*([\s\S]*?)\*\//.exec(frontmatterCode);
  if (!match?.[1]) {
    throw new Error(
      `${filePath}: Missing structured /** ... */ JSDoc contract comment at top of frontmatter.`,
    );
  }

  const lines = match[1]
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\*\s?/, "").trim());

  let title = "";
  let description = "";
  let category = "";
  let hydration = "";
  const accessibility: string[] = [];
  const keyboard: string[] = [];
  const slots = new Map<string, string>();

  let activeList: "none" | "accessibility" | "keyboard" | "slots" = "none";

  for (const line of lines) {
    if (!line) continue;

    if (line.startsWith("@title ")) {
      title = line.slice("@title ".length).trim();
      activeList = "none";
    } else if (line.startsWith("@description ")) {
      description = line.slice("@description ".length).trim();
      activeList = "none";
    } else if (line.startsWith("@category ")) {
      category = line.slice("@category ".length).trim();
      activeList = "none";
    } else if (line.startsWith("@hydration ")) {
      hydration = line.slice("@hydration ".length).trim();
      activeList = "none";
    } else if (line.startsWith("@accessibility")) {
      activeList = "accessibility";
    } else if (line.startsWith("@keyboard")) {
      activeList = "keyboard";
    } else if (line.startsWith("@slots")) {
      activeList = "slots";
    } else if (line.startsWith("@")) {
      activeList = "none";
    } else if (line.startsWith("- ")) {
      const item = line.slice(2).trim();
      if (activeList === "accessibility") {
        accessibility.push(item);
      } else if (activeList === "keyboard") {
        keyboard.push(item);
      } else if (activeList === "slots") {
        const slotMatch = /^`([^`]+)`:\s*(.+)$/.exec(item);
        if (!slotMatch?.[1] || !slotMatch[2]) {
          throw new Error(
            `${filePath}: Invalid @slots bullet "${line}". Expected "- \`<slot-name>\`: <description>".`,
          );
        }
        slots.set(slotMatch[1], slotMatch[2]);
      }
    }
  }

  if (!title || !description || !category) {
    throw new Error(
      `${filePath}: JSDoc contract must define @title, @description, and @category.`,
    );
  }
  if (hydration !== "none" && hydration !== "optional" && hydration !== "required") {
    throw new Error(
      `${filePath}: Invalid @hydration "${hydration}". Expected 'none' | 'optional' | 'required'.`,
    );
  }

  return {
    title,
    description,
    category,
    hydration,
    accessibility,
    keyboard,
    slots,
  };
}

interface TemplateSummary {
  rootTag: string;
  slotNames: string[];
  scriptCount: number;
  inlineStyles: string[];
}

function inspectTemplateAst(bodyNodes: unknown[], source: string): TemplateSummary {
  let rootTag = "";
  const slotSet = new Set<string>();
  let scriptCount = 0;
  const inlineStyles: string[] = [];

  function visit(node: unknown): void {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }

    const rec = node as Record<string, unknown>;
    if (rec.type === "JSXElement") {
      const opening = rec.openingElement as Record<string, unknown> | undefined;
      const nameObj = opening?.name as Record<string, unknown> | undefined;
      const tagName = typeof nameObj?.name === "string" ? nameObj.name : "";

      if (tagName === "script") {
        scriptCount += 1;
        return;
      }
      if (tagName === "style") {
        const start = typeof rec.start === "number" ? rec.start : 0;
        const end = typeof rec.end === "number" ? rec.end : 0;
        const rawStyleElement = source.slice(start, end);
        const inner = rawStyleElement
          .replace(/^<style[^>]*>/i, "")
          .replace(/<\/style>$/i, "");
        inlineStyles.push(inner);
        return;
      }
      if (tagName === "slot") {
        let slotName = "default";
        const attrs = Array.isArray(opening?.attributes) ? opening.attributes : [];
        for (const attr of attrs) {
          const a = attr as Record<string, unknown>;
          const attrName = (a.name as Record<string, unknown> | undefined)?.name;
          const attrVal = a.value as Record<string, unknown> | undefined;
          if (attrName === "name" && typeof attrVal?.value === "string") {
            slotName = attrVal.value;
          }
        }
        slotSet.add(slotName);
        return;
      }
      if (!rootTag && tagName && /^[a-z]/.test(tagName)) {
        rootTag = tagName;
      }
    }

    for (const val of Object.values(rec)) {
      if (val && typeof val === "object") {
        visit(val);
      }
    }
  }

  visit(bodyNodes);
  return {
    rootTag: rootTag || "div",
    slotNames: [...slotSet],
    scriptCount,
    inlineStyles,
  };
}

function classifyPropForFigma(
  propName: string,
  propType: Type,
  forbidden: boolean,
): {
  figmaKind: FigmaPropKind;
  literalValues?: string[] | undefined;
  figmaReason?: string | undefined;
} {
  if (forbidden) {
    return {
      figmaKind: "SKIPPED_NON_VISUAL",
      figmaReason: "Forbidden prop (compile-time guard)",
    };
  }

  const nonVisualReason = NON_VISUAL_PROPS[propName];
  if (nonVisualReason) {
    return {
      figmaKind: "SKIPPED_NON_VISUAL",
      figmaReason: nonVisualReason,
    };
  }

  const nonNullType = propType.getNonNullableType();
  if (nonNullType.isBoolean() || nonNullType.getText() === "boolean") {
    return { figmaKind: "BOOLEAN" };
  }

  if (nonNullType.isUnion()) {
    const unionParts = nonNullType
      .getUnionTypes()
      .filter((t) => !t.isUndefined());
    if (unionParts.length > 0 && unionParts.every((t) => t.isBooleanLiteral())) {
      return { figmaKind: "BOOLEAN" };
    }
    if (unionParts.length > 0 && unionParts.every((t) => t.isStringLiteral())) {
      return {
        figmaKind: "VARIANT",
        literalValues: unionParts.map((t) => t.getLiteralValue() as string),
      };
    }
  }

  if (nonNullType.isString() || nonNullType.isStringLiteral()) {
    return { figmaKind: "TEXT" };
  }

  throw new Error(
    `Prop "${propName}" with type "${nonNullType.getText()}" cannot be deterministically mapped to a Figma property. Classify it explicitly or refine the prop type.`,
  );
}

function extractPropsFromFrontmatter(
  project: Project,
  astroFilePath: string,
  frontmatterCode: string,
): { props: PropIR[]; styleImports: string[]; behaviorDeps: string[] } {
  const virtualFilePath = path.join(
    path.dirname(astroFilePath),
    `__ast_${path.basename(astroFilePath)}.ts`,
  );
  // Provide minimal Astro global so `Astro.props` resolves cleanly in isolation
  const sourceFile = project.createSourceFile(
    virtualFilePath,
    `declare const Astro: { props: Props };\n${frontmatterCode}`,
    { overwrite: true },
  );

  try {
    const styleImports: string[] = [];
    const behaviorDeps = new Set<string>();

    for (const imp of sourceFile.getImportDeclarations()) {
      const spec = imp.getModuleSpecifierValue();
      if (spec.endsWith(".css")) {
        styleImports.push(spec);
      } else if (spec.startsWith("@lsui/behaviors")) {
        behaviorDeps.add("@lsui/behaviors");
      }
    }

    // Extract default values from `const { variant = "primary", ... } = Astro.props`
    const defaults = new Map<string, string>();
    for (const varDecl of sourceFile.getVariableDeclarations()) {
      const initText = varDecl.getInitializer()?.getText().trim();
      if (initText !== "Astro.props") continue;
      const nameNode = varDecl.getNameNode();
      if (Node.isObjectBindingPattern(nameNode)) {
        for (const elem of nameNode.getElements()) {
          const propName =
            elem.getPropertyNameNode()?.getText().replace(/^["']|["']$/g, "") ??
            elem.getName();
          const defVal = elem.getInitializer()?.getText().trim();
          if (defVal !== undefined) {
            defaults.set(propName, defVal);
          }
        }
      }
    }

    // Collect property signatures explicitly authored in this component's frontmatter
    // (avoiding 250+ inherited DOM HTMLAttributes)
    interface AuthoredPropMeta {
      name: string;
      descriptions: string[];
      optionalInAllBranches: boolean;
      branchCount: number;
      requiredBranches: string[];
      types: Type[];
    }

    const authored = new Map<string, AuthoredPropMeta>();

    const recordPropSig = (
      sig: import("ts-morph").PropertySignature,
      branchContext?: string,
    ) => {
      const rawName = sig.getName();
      const name = rawName.replace(/^["']|["']$/g, "");
      const jsDocs = sig
        .getJsDocs()
        .map((d) => d.getCommentText()?.trim() ?? "")
        .filter(Boolean);
      const isOpt = sig.hasQuestionToken();
      const propType = sig.getType();

      const existing = authored.get(name) ?? {
        name,
        descriptions: [],
        optionalInAllBranches: true,
        branchCount: 0,
        requiredBranches: [],
        types: [],
      };
      existing.branchCount += 1;
      if (!isOpt) {
        existing.optionalInAllBranches = false;
        if (branchContext) existing.requiredBranches.push(branchContext);
      }
      for (const doc of jsDocs) {
        if (!existing.descriptions.includes(doc)) {
          existing.descriptions.push(doc);
        }
      }
      existing.types.push(propType);
      authored.set(name, existing);
    };

    for (const iface of sourceFile.getInterfaces()) {
      for (const prop of iface.getProperties()) {
        recordPropSig(prop);
      }
    }

    for (const alias of sourceFile.getTypeAliases()) {
      for (const typeLit of alias.getDescendantsOfKind(SyntaxKind.TypeLiteral)) {
        // Check if this TypeLiteral is a discriminated branch (e.g. `{ iconOnly: true; "aria-label": string }`)
        const propsInLiteral = typeLit.getProperties();
        let discriminator: string | undefined;
        for (const p of propsInLiteral) {
          const pTypeText = p.getTypeNode()?.getText().trim();
          if (pTypeText === "true" && !p.hasQuestionToken()) {
            discriminator = `${p.getName().replace(/^["']|["']$/g, "")} is true`;
          }
        }
        for (const p of propsInLiteral) {
          recordPropSig(p, discriminator);
        }
      }
    }

    // Resolve final `Props` type to inspect combined property types accurately
    const propsSymbol =
      sourceFile.getTypeAlias("Props")?.getType() ??
      sourceFile.getInterface("Props")?.getType();

    if (!propsSymbol) {
      throw new Error(`${astroFilePath}: Component must export an interface or type named 'Props'.`);
    }

    const props: PropIR[] = [];

    for (const [name, meta] of authored.entries()) {
      const mergedPropSymbol = propsSymbol.getProperty(name);
      const resolvedType = mergedPropSymbol
        ? project.getTypeChecker().getTypeOfSymbolAtLocation(mergedPropSymbol, sourceFile)
        : meta.types[0]!;

      const rawTypeText = resolvedType
        .getNonNullableType()
        .getText(sourceFile)
        .replace(/import\([^)]+\)\./g, "");
      const forbidden = resolvedType.getNonNullableType().isNever();

      const figma = classifyPropForFigma(name, resolvedType, forbidden);

      const isStrictlyRequired =
        !meta.optionalInAllBranches && meta.requiredBranches.length === 0 && meta.branchCount === 1;
      const conditionalRequirement =
        !isStrictlyRequired && !meta.optionalInAllBranches
          ? meta.requiredBranches.length > 0
            ? `Required when ${meta.requiredBranches.join(" or ")}`
            : "Conditionally required by discriminated union"
          : undefined;

      // Format clean union text when literalValues exist
      const displayType = forbidden
        ? "never"
        : figma.literalValues
          ? figma.literalValues.map((v) => `"${v}"`).join(" | ")
          : rawTypeText || "boolean";

      props.push({
        name,
        typeText: displayType,
        required: isStrictlyRequired,
        conditionalRequirement,
        forbidden: forbidden || undefined,
        defaultValue: defaults.get(name),
        description: meta.descriptions[0] ?? NON_VISUAL_PROPS[name] ?? "",
        literalValues: figma.literalValues,
        figmaKind: figma.figmaKind,
        figmaReason: figma.figmaReason,
      });
    }

    return {
      props,
      styleImports,
      behaviorDeps: [...behaviorDeps],
    };
  } finally {
    sourceFile.deleteImmediatelySync();
  }
}

function findAstroFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      findAstroFiles(full, out);
    } else if (entry.endsWith(".astro")) {
      out.push(full);
    }
  }
  return out.sort();
}

/**
 * Parses all `.astro` components inside a package (`packages/core`) into `ComponentIR[]`.
 */
export function parseCoreComponents(options: {
  corePkgDir: string;
  monorepoRoot: string;
}): ComponentIR[] {
  const { corePkgDir, monorepoRoot } = options;
  const componentsDir = path.join(corePkgDir, "src/components");
  const astroFiles = findAstroFiles(componentsDir);

  const project = new Project({
    tsConfigFilePath: path.join(corePkgDir, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  const results: ComponentIR[] = [];

  for (const astroPath of astroFiles) {
    const rawSource = readFileSync(astroPath, "utf-8");
    const parsed = parseAstro(rawSource);

    const errors = parsed.diagnostics.filter((d) => d.severity === "error");
    if (errors.length > 0) {
      throw new Error(
        `${astroPath}: Astro compiler parse error: ${errors.map((e) => e.text).join("; ")}`,
      );
    }

    const fm = parsed.ast.frontmatter as
      | { start?: number; end?: number }
      | null
      | undefined;
    if (!fm || typeof fm.start !== "number" || typeof fm.end !== "number") {
      throw new Error(`${astroPath}: Missing frontmatter block.`);
    }

    const frontmatterCode = rawSource
      .slice(fm.start, fm.end)
      .replace(/^---/, "")
      .replace(/---$/, "");

    const doc = parseContractJsDoc(frontmatterCode, astroPath);
    const template = inspectTemplateAst(
      Array.isArray(parsed.ast.body) ? parsed.ast.body : [],
      rawSource,
    );

    // Validate inline <style> blocks if present
    for (const inlineCss of template.inlineStyles) {
      validateComponentCss(astroPath, inlineCss);
    }

    // Validate 1:1 match between template <slot>s and @slots JSDoc
    for (const slotName of template.slotNames) {
      if (!doc.slots.has(slotName)) {
        throw new Error(
          `${astroPath}: Template renders <slot${slotName === "default" ? "" : ` name="${slotName}"`} /> without a matching '- \`${slotName}\`: ...' entry in @slots JSDoc.`,
        );
      }
    }
    for (const docSlot of doc.slots.keys()) {
      if (!template.slotNames.includes(docSlot)) {
        throw new Error(
          `${astroPath}: @slots JSDoc documents '${docSlot}', which does not exist in template markup.`,
        );
      }
    }

    const { props, styleImports, behaviorDeps } = extractPropsFromFrontmatter(
      project,
      astroPath,
      frontmatterCode,
    );

    // Also scan template <script> blocks for `@lsui/behaviors` imports
    const dependencies = new Set<string>(behaviorDeps);
    if (rawSource.includes("@lsui/behaviors")) {
      dependencies.add("@lsui/behaviors");
    }

    const files: SourceFileRef[] = [
      {
        path: path.relative(monorepoRoot, astroPath).split(path.sep).join("/"),
        fileName: path.basename(astroPath),
        sha256: sha256(rawSource),
      },
    ];

    for (const cssRel of styleImports) {
      const cssAbs = path.resolve(path.dirname(astroPath), cssRel);
      const cssContent = readFileSync(cssAbs, "utf-8");
      validateComponentCss(cssAbs, cssContent);
      files.push({
        path: path.relative(monorepoRoot, cssAbs).split(path.sep).join("/"),
        fileName: path.basename(cssAbs),
        sha256: sha256(cssContent),
      });
    }

    const slots: SlotIR[] = template.slotNames.map((name) => ({
      name,
      description: doc.slots.get(name) ?? "",
      figmaKind: name.startsWith("icon") ? "INSTANCE_SWAP" : "SLOT",
    }));

    results.push({
      slug: toKebabSlug(doc.title),
      name: doc.title,
      description: doc.description,
      category: doc.category,
      hydration: doc.hydration,
      rootTag: template.rootTag,
      sourcePath: path.relative(monorepoRoot, astroPath).split(path.sep).join("/"),
      files,
      dependencies: [...dependencies].sort(),
      props,
      slots,
      accessibility: doc.accessibility,
      keyboard: doc.keyboard,
      conditionalScriptCount: template.scriptCount,
    });
  }

  return results;
}
