import type { FigmaSpec } from "@lsui/ast";

export interface SyncedTokensLedger {
  collections: {
    primitivesId: string;
    colorsId: string;
    dimensionsId: string;
  };
  colorModes: Record<string, string>;
  dimensionModes: Record<string, string>;
  variablesByCssToken: Record<string, string>;
  textStyleIds: Record<"sm" | "md" | "lg", string>;
  planModeLimitReached: boolean;
}

/**
 * Generates an idempotent Figma Plugin API script (`use_figma`) that creates or updates:
 * 1. `Primitives` collection (`Value` mode, `scopes = []` hidden from pickers)
 * 2. `Theme Colors` semantic collection (`Nordic Light`, `Nordic Dark`, `Editorial Light`, `Editorial Dark`)
 *    aliased via `VARIABLE_ALIAS` to `Primitives`, with explicit scopes and `WEB` `var(--...)` code syntax
 * 3. `Geometry & Spacing` collection (`Nordic`, `Editorial` modes) with `GAP`, `WIDTH_HEIGHT`, and `CORNER_RADIUS` scopes
 * 4. Shared `Button / sm`, `Button / md`, and `Button / lg` Text Styles
 */
export function buildTokensSyncScript(spec: FigmaSpec): string {
  const orderedColorModes = [
    "Nordic Light",
    "Nordic Dark",
    "Editorial Light",
    "Editorial Dark",
  ].filter((m) => spec.variableCollections.colors.modes.includes(m));

  const orderedDimensionModes = ["Nordic", "Editorial"].filter((m) =>
    spec.variableCollections.dimensions.modes.includes(m),
  );

  const payload = {
    colorModes: orderedColorModes,
    colors: spec.variableCollections.colors.variables,
    dimensionModes: orderedDimensionModes,
    dimensions: spec.variableCollections.dimensions.variables,
  };

  const compactSpecLiteral = `{
  colorModes: ${JSON.stringify(orderedColorModes)},
  dimensionModes: ${JSON.stringify(orderedDimensionModes)},
  colors: [
${payload.colors.map((c) => `    ${JSON.stringify(c)}`).join(",\n")}
  ],
  dimensions: [
${payload.dimensions.map((d) => `    ${JSON.stringify(d)}`).join(",\n")}
  ]
}`;

  return `
const SPEC = ${compactSpecLiteral};

await Promise.all([
  figma.loadFontAsync({ family: "Inter", style: "Medium" }),
  figma.loadFontAsync({ family: "Inter", style: "Regular" }),
]);

const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
const existingVariables = await figma.variables.getLocalVariablesAsync();

function ensureCollection(name, desiredModes) {
  let coll = existingCollections.find((c) => c.name === name);
  if (!coll) {
    coll = figma.variables.createVariableCollection(name);
  }
  let planModeLimitReached = false;
  const modeIds = {};

  if (desiredModes.length > 0 && coll.modes[0]) {
    coll.renameMode(coll.modes[0].modeId, desiredModes[0]);
    modeIds[desiredModes[0]] = coll.modes[0].modeId;
  }

  for (let i = 1; i < desiredModes.length; i++) {
    const modeName = desiredModes[i];
    const found = coll.modes.find((m) => m.name === modeName);
    if (found) {
      modeIds[modeName] = found.modeId;
    } else {
      try {
        modeIds[modeName] = coll.addMode(modeName);
      } catch (err) {
        planModeLimitReached = true;
      }
    }
  }

  return { coll, modeIds, planModeLimitReached };
}

function ensureVar(name, coll, resolvedType) {
  const existing = existingVariables.find(
    (v) => v.name === name && v.variableCollectionId === coll.id,
  );
  if (existing) return existing;
  const created = figma.variables.createVariable(name, coll, resolvedType);
  existingVariables.push(created);
  return created;
}

const primSetup = ensureCollection("Primitives", ["Value"]);
const primModeId = primSetup.modeIds["Value"];

const colorSetup = ensureCollection("Theme Colors", SPEC.colorModes);
const dimSetup = ensureCollection("Geometry & Spacing", SPEC.dimensionModes);

const variablesByCssToken = {};
let primitiveCount = 0;

for (const colorToken of SPEC.colors) {
  const semVar = ensureVar(colorToken.name, colorSetup.coll, "COLOR");
  semVar.scopes = colorToken.scopes;
  semVar.setVariableCodeSyntax("WEB", colorToken.codeSyntax);

  for (const modeName of SPEC.colorModes) {
    const rgba = colorToken.valuesByMode[modeName];
    if (!rgba) continue;
    const modeSlug = modeName.toLowerCase().replace(/\\s+/g, "/");
    const primName = modeSlug + "/" + colorToken.name;
    const primVar = ensureVar(primName, primSetup.coll, "COLOR");
    primVar.setValueForMode(primModeId, {
      r: rgba.r,
      g: rgba.g,
      b: rgba.b,
      a: rgba.a,
    });
    primVar.scopes = [];
    primitiveCount += 1;

    const targetModeId = colorSetup.modeIds[modeName];
    if (targetModeId) {
      semVar.setValueForMode(targetModeId, {
        type: "VARIABLE_ALIAS",
        id: primVar.id,
      });
    }
  }

  variablesByCssToken[colorToken.cssToken] = semVar.id;
}

for (const dimToken of SPEC.dimensions) {
  const dimVar = ensureVar(dimToken.name, dimSetup.coll, "FLOAT");
  dimVar.scopes = dimToken.scopes;
  dimVar.setVariableCodeSyntax("WEB", dimToken.codeSyntax);

  for (const modeName of SPEC.dimensionModes) {
    const targetModeId = dimSetup.modeIds[modeName];
    const val = dimToken.valuesByMode[modeName];
    if (targetModeId && typeof val === "number") {
      dimVar.setValueForMode(targetModeId, val);
    }
  }

  variablesByCssToken[dimToken.cssToken] = dimVar.id;
}

const localTextStyles = await figma.getLocalTextStylesAsync();
const buttonTextSpecs = [
  { key: "sm", name: "Button / sm", fontSize: 12, lineHeight: 16 },
  { key: "md", name: "Button / md", fontSize: 14, lineHeight: 20 },
  { key: "lg", name: "Button / lg", fontSize: 16, lineHeight: 24 },
];
const textStyleIds = {};

for (const ts of buttonTextSpecs) {
  let style = localTextStyles.find((s) => s.name === ts.name);
  if (!style) {
    style = figma.createTextStyle();
    style.name = ts.name;
  }
  style.fontName = { family: "Inter", style: "Medium" };
  style.fontSize = ts.fontSize;
  style.lineHeight = { unit: "PIXELS", value: ts.lineHeight };
  textStyleIds[ts.key] = style.id;
}

return {
  collections: {
    primitivesId: primSetup.coll.id,
    colorsId: colorSetup.coll.id,
    dimensionsId: dimSetup.coll.id,
  },
  colorModes: colorSetup.modeIds,
  dimensionModes: dimSetup.modeIds,
  variablesByCssToken,
  textStyleIds,
  counts: {
    primitives: primitiveCount,
    semanticColors: SPEC.colors.length,
    dimensions: SPEC.dimensions.length,
    textStyles: Object.keys(textStyleIds).length,
  },
  planModeLimitReached:
    colorSetup.planModeLimitReached || dimSetup.planModeLimitReached,
};
`.trim();
}

/**
 * Generates an idempotent Figma Plugin API script (`use_figma`) that builds:
 * 1. Reusable `Icon / Plus` & `Icon / ArrowRight` dependency components (`16x16` vectors)
 * 2. The `Liftoff` `Button` Component Set (`5 variants x 3 sizes x 2 disabled states = 30 variants`)
 *    with 100% variable-bound fills, strokes, corner radii, heights, paddings, and gaps,
 *    plus `Label` (`TEXT`), `Show Icon Start`/`Icon Start` (`BOOLEAN` + `INSTANCE_SWAP`),
 *    and `Show Icon End`/`Icon End` (`BOOLEAN` + `INSTANCE_SWAP`) properties
 * 3. A multi-mode Theme Review Showcase Frame rendering live `Button` instances across
 *    all available `Nordic` & `Editorial` Light/Dark modes via `setExplicitVariableModeForCollection`
 */
export function buildButtonComponentSyncScript(
  spec: FigmaSpec,
  ledger: SyncedTokensLedger,
): string {
  const buttonSpec = spec.components.find((c) => c.slug === "button");
  if (!buttonSpec) {
    throw new Error('FigmaSpec is missing Liftoff "button" component definition.');
  }

  return `
const LEDGER = ${JSON.stringify(ledger, null, 2)};
const BUTTON_DESCRIPTION = ${JSON.stringify(buttonSpec.description)};

let page = figma.root.children.find((p) => p.name === "Button") || figma.root.children[0];
if (page.name === "Page 1" && page.children.length === 0) {
  page.name = "Button";
}
await figma.setCurrentPageAsync(page);

await Promise.all([
  figma.loadFontAsync({ family: "Inter", style: "Regular" }),
  figma.loadFontAsync({ family: "Inter", style: "Medium" }),
  figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }),
  figma.loadFontAsync({ family: "Inter", style: "Bold" }),
]);

// Remove previous generated frames/component sets by deterministic name if re-running
for (const existingName of [
  "Dependencies / Icons",
  "Button",
  "Button — Multi-Theme Showcase",
]) {
  const old = page.children.find((n) => n.name === existingName);
  if (old) old.remove();
}

async function reqVar(cssToken) {
  const id = LEDGER.variablesByCssToken[cssToken];
  if (!id) throw new Error("Missing variable ID for " + cssToken);
  const v = await figma.variables.getVariableByIdAsync(id);
  if (!v) throw new Error("Variable not found in Figma for " + cssToken);
  return v;
}

const vColorBg = await reqVar("--color-bg");
const vColorSurface = await reqVar("--color-surface");
const vColorText = await reqVar("--color-text");
const vColorTextMuted = await reqVar("--color-text-muted");
const vColorBorder = await reqVar("--color-border");
const vColorBorderStrong = await reqVar("--color-border-strong");
const vColorPrimary = await reqVar("--color-primary");
const vColorOnPrimary = await reqVar("--color-on-primary");
const vColorSecondary = await reqVar("--color-secondary");
const vColorOnSecondary = await reqVar("--color-on-secondary");
const vColorDanger = await reqVar("--color-danger");
const vColorOnDanger = await reqVar("--color-on-danger");

const vSpace1 = await reqVar("--space-1");
const vSpace2 = await reqVar("--space-2");
const vSpace3 = await reqVar("--space-3");
const vSpace4 = await reqVar("--space-4");
const vSpace6 = await reqVar("--space-6");

const vHeightSm = await reqVar("--control-height-sm");
const vHeightMd = await reqVar("--control-height-md");
const vHeightLg = await reqVar("--control-height-lg");

const vPadSm = await reqVar("--control-pad-inline-sm");
const vPadMd = await reqVar("--control-pad-inline-md");
const vPadLg = await reqVar("--control-pad-inline-lg");

const vRadiusSm = await reqVar("--radius-sm");
const vRadiusMd = await reqVar("--radius-md");
const vRadiusLg = await reqVar("--radius-lg");

function boundSolidPaint(colorVar) {
  return figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
    "color",
    colorVar,
  );
}

// 1. Create Dependency Icon Components (16x16) outside the review showcase
const iconsContainer = figma.createAutoLayout("HORIZONTAL", {
  name: "Dependencies / Icons",
  itemSpacing: 16,
  paddingTop: 16,
  paddingBottom: 16,
  paddingLeft: 16,
  paddingRight: 16,
});
iconsContainer.x = 80;
iconsContainer.y = 80;
iconsContainer.fills = [boundSolidPaint(vColorSurface)];
iconsContainer.strokes = [boundSolidPaint(vColorBorder)];
iconsContainer.strokeWeight = 1;
iconsContainer.cornerRadius = 8;

function buildVectorIconComponent(name, svgMarkup) {
  const iconComp = figma.createComponent();
  iconComp.name = name;
  iconComp.resize(16, 16);
  iconComp.fills = [];
  const parsed = figma.createNodeFromSvg(svgMarkup);
  while (parsed.children.length > 0) {
    const child = parsed.children[0];
    iconComp.appendChild(child);
  }
  parsed.remove();
  iconsContainer.appendChild(iconComp);
  return iconComp;
}

const iconPlus = buildVectorIconComponent(
  "Icon / Plus",
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3V13M3 8H13" stroke="#11181F" stroke-width="1.5" stroke-linecap="round"/></svg>',
);

const iconArrow = buildVectorIconComponent(
  "Icon / ArrowRight",
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 8H12.5M8.5 4L12.5 8L8.5 12" stroke="#11181F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
);

// 2. Create all 30 Liftoff Button Variants (5 variants x 3 sizes x 2 disabled states)
const variantConfigs = [
  { key: "primary", bg: vColorPrimary, fg: vColorOnPrimary, border: null },
  { key: "secondary", bg: vColorSecondary, fg: vColorOnSecondary, border: vColorBorder },
  { key: "outline", bg: null, fg: vColorText, border: vColorBorderStrong },
  { key: "ghost", bg: null, fg: vColorText, border: null },
  { key: "danger", bg: vColorDanger, fg: vColorOnDanger, border: null },
];

const sizeConfigs = [
  { key: "sm", heightVar: vHeightSm, padInlineVar: vPadSm, gapVar: vSpace1, radiusVar: vRadiusSm, textStyleId: LEDGER.textStyleIds.sm, fontSize: 12 },
  { key: "md", heightVar: vHeightMd, padInlineVar: vPadMd, gapVar: vSpace2, radiusVar: vRadiusMd, textStyleId: LEDGER.textStyleIds.md, fontSize: 14 },
  { key: "lg", heightVar: vHeightLg, padInlineVar: vPadLg, gapVar: vSpace3, radiusVar: vRadiusMd, textStyleId: LEDGER.textStyleIds.lg, fontSize: 16 },
];

const disabledStates = ["false", "true"];
const createdVariants = [];

for (const vCfg of variantConfigs) {
  for (const sCfg of sizeConfigs) {
    for (const isDisabled of disabledStates) {
      const comp = figma.createComponent();
      comp.name = "variant=" + vCfg.key + ", size=" + sCfg.key + ", disabled=" + isDisabled;
      comp.layoutMode = "HORIZONTAL";
      comp.primaryAxisSizingMode = "AUTO";
      comp.counterAxisSizingMode = "AUTO";
      comp.primaryAxisAlignItems = "CENTER";
      comp.counterAxisAlignItems = "CENTER";

      comp.setBoundVariable("minHeight", sCfg.heightVar);
      comp.setBoundVariable("paddingLeft", sCfg.padInlineVar);
      comp.setBoundVariable("paddingRight", sCfg.padInlineVar);
      comp.setBoundVariable("paddingTop", vSpace1);
      comp.setBoundVariable("paddingBottom", vSpace1);
      comp.setBoundVariable("itemSpacing", sCfg.gapVar);

      comp.setBoundVariable("topLeftRadius", sCfg.radiusVar);
      comp.setBoundVariable("topRightRadius", sCfg.radiusVar);
      comp.setBoundVariable("bottomLeftRadius", sCfg.radiusVar);
      comp.setBoundVariable("bottomRightRadius", sCfg.radiusVar);

      comp.fills = vCfg.bg ? [boundSolidPaint(vCfg.bg)] : [];
      if (vCfg.border) {
        comp.strokes = [boundSolidPaint(vCfg.border)];
        comp.strokeWeight = 1;
        comp.strokeAlign = "INSIDE";
      } else {
        comp.strokes = [];
      }

      if (isDisabled === "true") {
        comp.opacity = 0.55;
      }

      // Leading icon (INSTANCE_SWAP + BOOLEAN, hidden by default)
      const showStartKey = comp.addComponentProperty("Show Icon Start", "BOOLEAN", false);
      const swapStartKey = comp.addComponentProperty("Icon Start", "INSTANCE_SWAP", iconPlus.id);
      const startInst = iconPlus.createInstance();
      startInst.name = "icon-start";
      for (const vec of startInst.findAll((n) => "strokes" in n && Array.isArray(n.strokes) && n.strokes.length > 0)) {
        vec.strokes = [boundSolidPaint(vCfg.fg)];
      }
      comp.appendChild(startInst);
      startInst.componentPropertyReferences = {
        visible: showStartKey,
        mainComponent: swapStartKey,
      };

      // Label text node (TEXT_SLOT -> linked to Label TEXT property + shared TextStyle + bound text color)
      const labelKey = comp.addComponentProperty("Label", "TEXT", "Button");
      const labelNode = figma.createText();
      labelNode.name = "label";
      labelNode.fontName = { family: "Inter", style: "Medium" };
      labelNode.fontSize = sCfg.fontSize;
      if (sCfg.textStyleId) {
        await labelNode.setTextStyleIdAsync(sCfg.textStyleId);
      }
      labelNode.characters = "Button";
      labelNode.fills = [boundSolidPaint(vCfg.fg)];
      comp.appendChild(labelNode);
      labelNode.layoutSizingHorizontal = "HUG";
      labelNode.layoutSizingVertical = "HUG";
      labelNode.componentPropertyReferences = { characters: labelKey };

      // Trailing icon (INSTANCE_SWAP + BOOLEAN, hidden by default)
      const showEndKey = comp.addComponentProperty("Show Icon End", "BOOLEAN", false);
      const swapEndKey = comp.addComponentProperty("Icon End", "INSTANCE_SWAP", iconArrow.id);
      const endInst = iconArrow.createInstance();
      endInst.name = "icon-end";
      for (const vec of endInst.findAll((n) => "strokes" in n && Array.isArray(n.strokes) && n.strokes.length > 0)) {
        vec.strokes = [boundSolidPaint(vCfg.fg)];
      }
      comp.appendChild(endInst);
      endInst.componentPropertyReferences = {
        visible: showEndKey,
        mainComponent: swapEndKey,
      };

      createdVariants.push(comp);
    }
  }
}

const buttonSet = figma.combineAsVariants(createdVariants, page);
buttonSet.name = "Button";
buttonSet.description = BUTTON_DESCRIPTION;
buttonSet.x = 80;
buttonSet.y = 180;
buttonSet.fills = [];
buttonSet.strokes = [{ type: "SOLID", color: { r: 0.6, g: 0.45, b: 0.95 }, opacity: 0.5 }];
buttonSet.strokeWeight = 1;
buttonSet.dashPattern = [6, 4];
buttonSet.cornerRadius = 12;

// Position all 30 variants cleanly in a 5-row (variant) x 6-column (size x disabled) grid
const colWidth = 156;
const rowHeight = 72;
const padGrid = 32;

for (const child of buttonSet.children) {
  if (child.type !== "COMPONENT") continue;
  const parts = Object.fromEntries(
    child.name.split(", ").map((kv) => kv.split("=")),
  );
  const rowIdx = variantConfigs.findIndex((v) => v.key === parts.variant);
  const sizeIdx = sizeConfigs.findIndex((s) => s.key === parts.size);
  const disOffset = parts.disabled === "true" ? 3 : 0;
  const colIdx = sizeIdx + disOffset;

  child.x = padGrid + colIdx * colWidth;
  child.y = padGrid + rowIdx * rowHeight;
}

let maxX = 0;
let maxY = 0;
for (const child of buttonSet.children) {
  maxX = Math.max(maxX, child.x + child.width);
  maxY = Math.max(maxY, child.y + child.height);
}
buttonSet.resizeWithoutConstraints(maxX + padGrid, maxY + padGrid);

// 3. Build Multi-Theme Review Showcase Frame next to the ComponentSet
const colorCollection = await figma.variables.getVariableCollectionByIdAsync(LEDGER.collections.colorsId);
const dimCollection = await figma.variables.getVariableCollectionByIdAsync(LEDGER.collections.dimensionsId);

const showcase = figma.createAutoLayout("VERTICAL", {
  name: "Button — Multi-Theme Showcase",
  itemSpacing: 24,
  paddingTop: 32,
  paddingBottom: 32,
  paddingLeft: 32,
  paddingRight: 32,
});
showcase.x = buttonSet.x + buttonSet.width + 80;
showcase.y = 80;
showcase.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.97, b: 0.98 } }];
showcase.cornerRadius = 16;

const headerTitle = figma.createText();
headerTitle.fontName = { family: "Inter", style: "Bold" };
headerTitle.fontSize = 22;
headerTitle.characters = "LightSpeedUI — Liftoff <Button> (Nordic & Editorial Modes)";
headerTitle.fills = [{ type: "SOLID", color: { r: 0.08, g: 0.1, b: 0.13 } }];
showcase.appendChild(headerTitle);

const themeCards = [
  { label: "Nordic Light", colorMode: "Nordic Light", dimMode: "Nordic" },
  { label: "Nordic Dark", colorMode: "Nordic Dark", dimMode: "Nordic" },
  { label: "Editorial Light", colorMode: "Editorial Light", dimMode: "Editorial" },
  { label: "Editorial Dark", colorMode: "Editorial Dark", dimMode: "Editorial" },
];

const propDefs = buttonSet.componentPropertyDefinitions;
const findPropKey = (prefix) =>
  Object.keys(propDefs).find((k) => k === prefix || k.startsWith(prefix + "#"));

const labelPropKey = findPropKey("Label");
const showStartPropKey = findPropKey("Show Icon Start");
const showEndPropKey = findPropKey("Show Icon End");

for (const tc of themeCards) {
  const colorModeId = LEDGER.colorModes[tc.colorMode];
  const dimModeId = LEDGER.dimensionModes[tc.dimMode];
  if (!colorModeId && tc.colorMode !== "Nordic Light") continue;

  const card = figma.createAutoLayout("VERTICAL", {
    name: "Theme Preview / " + tc.label,
    itemSpacing: 16,
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 24,
  });
  card.fills = [boundSolidPaint(vColorBg)];
  card.strokes = [boundSolidPaint(vColorBorder)];
  card.strokeWeight = 1;
  card.setBoundVariable("topLeftRadius", vRadiusLg);
  card.setBoundVariable("topRightRadius", vRadiusLg);
  card.setBoundVariable("bottomLeftRadius", vRadiusLg);
  card.setBoundVariable("bottomRightRadius", vRadiusLg);

  if (colorCollection && colorModeId) {
    card.setExplicitVariableModeForCollection(colorCollection, colorModeId);
  }
  if (dimCollection && dimModeId) {
    card.setExplicitVariableModeForCollection(dimCollection, dimModeId);
  }

  const cardTitle = figma.createText();
  cardTitle.fontName = { family: "Inter", style: "Semi Bold" };
  cardTitle.fontSize = 13;
  cardTitle.characters = tc.label + " (data-theme=\\"" + tc.label.toLowerCase() + "\\")";
  cardTitle.fills = [boundSolidPaint(vColorTextMuted)];
  card.appendChild(cardTitle);

  // Row 1: All 5 variants at md + disabled
  const rowVariants = figma.createAutoLayout("HORIZONTAL", {
    name: "Variants Row",
    itemSpacing: 12,
  });
  rowVariants.counterAxisAlignItems = "CENTER";
  rowVariants.fills = [];

  for (const vKey of ["primary", "secondary", "outline", "ghost", "danger"]) {
    const matchVariant = buttonSet.children.find(
      (c) => c.name === "variant=" + vKey + ", size=md, disabled=false",
    );
    if (!matchVariant || matchVariant.type !== "COMPONENT") continue;
    const inst = matchVariant.createInstance();
    if (labelPropKey) {
      inst.setProperties({
        [labelPropKey]: vKey.charAt(0).toUpperCase() + vKey.slice(1),
      });
    }
    rowVariants.appendChild(inst);
  }

  const disVariant = buttonSet.children.find(
    (c) => c.name === "variant=secondary, size=md, disabled=true",
  );
  if (disVariant && disVariant.type === "COMPONENT") {
    const disInst = disVariant.createInstance();
    if (labelPropKey) disInst.setProperties({ [labelPropKey]: "Disabled" });
    rowVariants.appendChild(disInst);
  }
  card.appendChild(rowVariants);

  // Row 2: Sizes (sm, md, lg) + Leading/Trailing Icon instances
  const rowSizes = figma.createAutoLayout("HORIZONTAL", {
    name: "Sizes & Icons Row",
    itemSpacing: 12,
  });
  rowSizes.counterAxisAlignItems = "CENTER";
  rowSizes.fills = [];

  for (const [sKey, sLabel] of [["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]) {
    const mv = buttonSet.children.find(
      (c) => c.name === "variant=primary, size=" + sKey + ", disabled=false",
    );
    if (!mv || mv.type !== "COMPONENT") continue;
    const inst = mv.createInstance();
    if (labelPropKey) inst.setProperties({ [labelPropKey]: sLabel });
    rowSizes.appendChild(inst);
  }

  const withIconsBase = buttonSet.children.find(
    (c) => c.name === "variant=outline, size=md, disabled=false",
  );
  if (withIconsBase && withIconsBase.type === "COMPONENT") {
    const iconInst = withIconsBase.createInstance();
    const updates = {};
    if (labelPropKey) updates[labelPropKey] = "Continue";
    if (showEndPropKey) updates[showEndPropKey] = true;
    iconInst.setProperties(updates);
    rowSizes.appendChild(iconInst);
  }

  const addBase = buttonSet.children.find(
    (c) => c.name === "variant=secondary, size=md, disabled=false",
  );
  if (addBase && addBase.type === "COMPONENT") {
    const addInst = addBase.createInstance();
    const updates = {};
    if (labelPropKey) updates[labelPropKey] = "New Item";
    if (showStartPropKey) updates[showStartPropKey] = true;
    addInst.setProperties(updates);
    rowSizes.appendChild(addInst);
  }

  card.appendChild(rowSizes);
  showcase.appendChild(card);
}

// Compute widest child so showcase has a clean FIXED counter-axis width before setting FILL on cards
let widestInner = headerTitle.width;
for (const child of showcase.children) {
  widestInner = Math.max(widestInner, child.width);
}
showcase.resize(Math.max(widestInner + 64, 760), showcase.height);
showcase.primaryAxisSizingMode = "AUTO";
showcase.counterAxisSizingMode = "FIXED";
for (const child of showcase.children) {
  if (child.type === "FRAME") {
    child.layoutSizingHorizontal = "FILL";
  }
}

await showcase.screenshot({ scale: 1 });

return {
  pageId: page.id,
  iconsContainerId: iconsContainer.id,
  iconIds: { plus: iconPlus.id, arrowRight: iconArrow.id },
  buttonSetId: buttonSet.id,
  variantCount: buttonSet.children.length,
  propertyDefinitions: Object.keys(buttonSet.componentPropertyDefinitions),
  showcaseFrameId: showcase.id,
  showcaseBounds: {
    x: showcase.x,
    y: showcase.y,
    width: showcase.width,
    height: showcase.height,
  },
};
`.trim();
}
