# LightSpeedUI (`lsui`) — Code-to-Figma Sync Guide (`FIGMA.md`)

A complete guide—written for **both human developers/designers and AI coding agents**—on how to set up Figma's Remote MCP server and official skills in **OpenCode**, how LightSpeedUI's AST translates `.astro` components and `.css` tokens into Figma specs, and how to generate native Figma Variables, Component Sets, Variants, and Multi-Theme Showcases without manual drift.

- **Live Design System File**: <https://www.figma.com/design/cKBop8W8EjLtVKFhSM3XHq/LightSpeedUI---Design-System?node-id=0-1>
- **AST Spec Output**: [`packages/figma-sync/generated/figma-spec.json`](./packages/figma-sync/generated/figma-spec.json) (auto-generated via `pnpm sync:artifacts`)
- **Sync Script Builders**: [`packages/figma-sync/src/scripts.ts`](./packages/figma-sync/src/scripts.ts) (`@lsui/figma-sync`)

---

## 1. How Code-to-Figma Sync Works in LightSpeedUI

In LightSpeedUI, **code is always the single source of truth**:

```text
@lsui/themes (CSS tokens)  +  @lsui/liftoff & @lsui/landing (.astro components)
                                     │
                                     ▼  pnpm sync:artifacts (@lsui/ast)
              packages/figma-sync/generated/figma-spec.json
                                     │
                                     ▼  @lsui/figma-sync + Figma Remote MCP (use_figma)
     Figma Variables (Primitives + Modes)  +  Figma Component Sets & Showcases
```

- **Level 1 (`Origin` — `@lsui/origin`)** is intentionally excluded from Figma Component Sets because its primitives are 100% unstyled behavioral/semantic building blocks.
- **Level 2 (`Liftoff` — `@lsui/liftoff`) & Level 3 (`Landing` — `@lsui/landing`)** are styled visual tiers whose `Props`, `<slot />`s, and `@lsui/themes` tokens map deterministically into Figma Variables and Component Sets.
- **Stage-Only Guardrail**: Automated sync stages updates on the Figma canvas—a human always reviews the visual diff and clicks **Publish** in Figma manually.

---

## 2. Setting Up Figma Remote MCP & Skills in OpenCode

### Why Remote MCP Is Required (Remote vs. Local Desktop MCP)
Figma offers two MCP servers, and choosing the right one matters:
- **Remote MCP (`https://mcp.figma.com/mcp` — REQUIRED)**: Hosted directly by Figma. Supports **Write to Canvas (`use_figma`)**, creating/updating Variable Collections, Modes, Component Sets, Variants, Slots, Text Styles, and Code Connect—without needing the Figma desktop app running. **OpenCode is officially supported** in [Figma's MCP client catalog](https://developers.figma.com/docs/figma-mcp-server/).
- **Desktop MCP (`http://127.0.0.1:3845/mcp` — Read-Only)**: Runs inside the local Figma desktop app and is **read-only** (no `use_figma` write tool). Do **not** use the Desktop MCP when generating Figma libraries from code.

### Step 1: Add the Figma Remote MCP Server to OpenCode
Run this command in your terminal to register Figma's Remote MCP server globally in OpenCode V2 (`~/.config/opencode/opencode.json`):

```sh
opencode mcp add figma --global --url https://mcp.figma.com/mcp
```

*(OpenCode watches configuration files and hot-reloads automatically—no restart required.)*

### Step 2: Install Official Figma Agent Skills (`skills/` vs. `skills-figquery/`)
Figma maintains official MCP skills in <https://github.com/figma/mcp-server-guide>, which contains **two** skill folders. Make sure you install the right one:

| Folder in `figma/mcp-server-guide` | Use in OpenCode? | Why |
| :--- | :--- | :--- |
| **[`skills/`](https://github.com/figma/mcp-server-guide/tree/main/skills)** | **YES (Install this)** | Targets the standard **Figma Plugin API** (`figma.createAutoLayout()`, `figma.variables.createVariableCollection()`, `figma.combineAsVariants()`, `node.query()`, etc.) executed by `use_figma` in OpenCode, Claude Code, and VS Code. |
| **[`skills-figquery/`](https://github.com/figma/mcp-server-guide/tree/main/skills-figquery)** | **NO (Cursor-only)** | Built exclusively for Cursor's `.cursor-plugin` FigQuery sandbox, which injects a proprietary `$fig` global and disables `figma.create*`. Installing `skills-figquery/` in OpenCode causes `ReferenceError: $fig is not defined` failures! |

Install all 17 skills from `skills/` (keeping each skill's sibling `references/` folder intact) into OpenCode's global skills directory:

```sh
mkdir -p ~/.config/opencode/skills && \
git clone --depth 1 https://github.com/figma/mcp-server-guide.git /tmp/figma-mcp-guide && \
cp -R /tmp/figma-mcp-guide/skills/* ~/.config/opencode/skills/ && \
rm -rf /tmp/figma-mcp-guide
```

Run `/reload` inside OpenCode if you have an active session open so `figma-use`, `figma-generate-library`, `figma-generate-design`, and `figma-code-connect` appear immediately.

### Step 3: Sign In via Browser OAuth (No API Key Needed)
You do **not** need a Figma Personal Access Token or API key:
1. Inside OpenCode, type **`/mcps`**, select **`figma`**, and start sign-in. *(Never run `opencode mcp auth` inside a non-interactive background shell, as its OAuth link can be hidden.)*
2. Your browser will open Figma's OAuth screen—click **Allow access**.
   - **Plan & Seat Note**: Writing to a Figma file requires **Edit** access. Writing outside personal Drafts—and creating up to **4 Variable Modes** (`Nordic Light`, `Nordic Dark`, `Editorial Light`, `Editorial Dark`)—requires a **Professional, Education, Organization, or Enterprise** Figma plan (Starter plans are capped at 1 Variable Mode).

### Step 4: Create a Target Figma Design File
`use_figma` writes to a specific **Figma Design file (`fileKey`)**, not a folder/project URL:
1. Inside your Figma project folder (e.g., `LightSpeed-UI`), create a blank **Design file** (such as `LightSpeedUI — Design System`).
2. Copy the file URL from your browser (`https://www.figma.com/design/:fileKey/:fileName?node-id=0-1`) and provide it in your prompt.

---

## 3. Deterministic AST-to-Figma Translation Rules

`@lsui/ast` (`pnpm sync:artifacts`) compiles CSS tokens and `.astro` components into [`packages/figma-sync/generated/figma-spec.json`](./packages/figma-sync/generated/figma-spec.json) using these exact rules:

### A. Design Tokens → `Primitives` + Multi-Mode Variable Collections
1. **Unregistered `light-dark()` Pairs → Mode Values**: In `@lsui/themes`, every color token defines explicit `--color-*-light` and `--color-*-dark` OKLCH values alongside `--color-*: light-dark(...)`. `@lsui/ast` converts OKLCH → OKLab → linear sRGB → gamma-encoded sRGB `{ r, g, b, a, hex }` in `0..1` float range with zero browser runtime needed.
2. **Two-Tier Alias Architecture**:
   - **`Primitives` Collection (`1` mode: `Value`)**: Holds raw `{ r, g, b, a }` color floats with `v.scopes = []` so raw palette values stay hidden from property pickers.
   - **`Theme Colors` Collection (`4` modes: `Nordic Light`, `Nordic Dark`, `Editorial Light`, `Editorial Dark`)**: Aliases every mode to its corresponding `Primitives` variable via `{ type: "VARIABLE_ALIAS", id: primVar.id }`.
   - **`Geometry & Spacing` Collection (`2` modes: `Nordic`, `Editorial`)**: Holds pixel `FLOAT` values for `--space-*`, `--control-height-*`, `--control-pad-inline-*`, `--target-min-size`, and `--radius-*`—so switching a frame from `Nordic` to `Editorial` flips **both color palette and corner radii** (`8px` → `3px`) simultaneously!
3. **Explicit Variable `scopes` & `WEB` Code Syntax (Never `ALL_SCOPES`)**:
   - Surface/background fills → `["FRAME_FILL", "SHAPE_FILL"]`
   - Foreground/label colors (`--color-text*`, `--color-on-*`) → `["TEXT_FILL", "SHAPE_FILL"]`
   - Borders & focus rings (`--color-border*`, `--color-ring`) → `["STROKE_COLOR", "FRAME_FILL"]`
   - Spacing & inline padding (`--space-*`, `--control-pad-*`) → `["GAP"]`
   - Control heights & target minimums (`--control-height-*`, `--target-min-size`) → `["WIDTH_HEIGHT"]`
   - Radii (`--radius-*`) → `["CORNER_RADIUS"]`
   - Every variable sets `v.setVariableCodeSyntax("WEB", "var(--token-name)")` directly from its CSS custom property.

### B. `.astro` `Props` & `<slot />`s → Figma Component Sets
| Astro Source Construct | Classification in `figma-spec.json` | Generated Figma Construct |
| :--- | :--- | :--- |
| String literal union (`variant?: "primary" \| "secondary" \| ...`) | `VARIANT` | Variant axis (`variant=primary, size=md, ...`) |
| Visual state boolean (`disabled?: boolean`) | `BOOLEAN` / Boolean Variant Axis | Variant axis `disabled=false \| true` (Figma automatically renders `"false"`/`"true"` variant axes as a **native Boolean toggle switch** in the Inspector while allowing `opacity = 0.55`!) |
| `<slot />` (`default`) on inline interactive tags (`button`, `a`, `span`, `label`) | `TEXT_SLOT` | Variable-bound `TextNode` linked to a `Label` (`TEXT`) Component Property + shared `TextStyle` (`Button / sm\|md\|lg`) |
| `<slot />` (`default`, `header`, `footer`) on layout containers (`div`, `section`, `dialog`, `article`) | `SLOT` | Native Figma `SlotNode` (`component.createSlot()`) drop-zone for arbitrary child content |
| `<slot name="icon-start" />` / `<slot name="icon-end" />` | `INSTANCE_SWAP` | `BOOLEAN` visibility property (`Show Icon Start`) + `INSTANCE_SWAP` property (`Icon Start`) bound to a `16×16` vector `Icon` atom component |
| HTML/routing attributes (`href`, `type`, `as`, `render`, `commandfor`, `popovertarget`, `aria-*`) | `SKIPPED_NON_VISUAL` | Omitted from Figma properties (avoids variant combinatorial explosion) |

---

## 4. Step-by-Step Execution Playbook (For AI Agents & Humans)

Whenever syncing tokens or components to Figma via the Remote MCP server, follow this exact sequence:

### Step 1: Sync AST Artifacts First
From `./lsui`, ensure `packages/figma-sync/generated/figma-spec.json` matches the latest `.astro` and `.css` source:
```sh
pnpm sync:artifacts && pnpm test
```

### Step 2: Load Mandatory Skills Before Any `use_figma` Call
AI agents **must** load both skills via the `skill` tool before calling `use_figma`, and pass `skillNames: "figma-use,figma-generate-library"` on every `use_figma` call:
1. `figma-use` — Plugin API syntax, font loading, `0..1` colors, auto-layout sizing, and error recovery rules.
2. `figma-generate-library` — Foundations-first ordering, variable scopes/aliasing, 30-variant cap, state ledger persistence, and visual validation rules.

### Step 3: Start a File Session & Run Read-Only Discovery
Inside Code Mode (`execute`), run discovery **sequentially** using the `fileKey` from the `https://www.figma.com/design/:fileKey/...` URL:
1. Call `tools.figma.create_session({ fileKey, description })` and reuse the returned `sessionId` UUID on **every** subsequent Figma tool call.
2. Call `tools.figma.get_libraries({ sessionId, fileKey })` followed by `tools.figma.search_design_system({ sessionId, fileKey, queries })`.
3. Call `tools.figma.use_figma` with a **read-only** inspection script to check existing pages, variable collections, components, and available font styles (`await figma.listAvailableFontsAsync()`).

### Step 4: Sync Foundations (`Primitives`, `Theme Colors`, `Geometry & Spacing`, Text Styles)
1. Generate the idempotent foundations script using `buildTokensSyncScript(spec)` from `@lsui/figma-sync`.
2. Execute it via a single `tools.figma.use_figma` call.
3. Persist the returned `{ collections, colorModes, dimensionModes, variablesByCssToken, textStyleIds }` JSON to a state ledger file on disk (e.g., `design-system-state-<runId>.json`) so exact Figma IDs—never guessed names—feed subsequent component calls.

### Step 5: Sync Dependency Atoms, Component Set & Multi-Theme Showcase
1. Generate the idempotent component script using `buildButtonComponentSyncScript(spec, tokenLedger)` (or the target component's builder in `@lsui/figma-sync`). Variant/size axes come from `spec.components[].variantAxes`, and every canvas color is resolved from semantic tokens via the ledger—no literal hex/RGB values. A `VARIANT_PLAN` guard reports a named page-split plan if a component exceeds Figma's 30-variant cap.
2. Execute it sequentially via `tools.figma.use_figma` (**never** run two mutating `use_figma` calls in parallel):
   - Creates `Tier 0` dependency atoms (e.g., `16×16` vector `Icon` components) in a separate `Dependencies` frame first.
   - Builds all component variants with 100% variable-bound fills, strokes, radii, heights, paddings, and gaps, attaching `addComponentProperty(...)` **before** `figma.combineAsVariants(...)`.
   - Positions every variant into a non-overlapping `row × column` grid and resizes the `ComponentSetNode` with `resizeWithoutConstraints(...)`.
   - Builds a **Multi-Theme Review Showcase** frame beside the `ComponentSetNode` using `card.setExplicitVariableModeForCollection(...)`, with cards derived from `spec.variableCollections.colors.modes` (currently Nordic/Editorial Light/Dark), ending with `await showcase.screenshot({ scale: 1 })`.
3. Inspect the returned `1x` screenshot at normal scale to verify zero text clipping, crisp icon contrast across light/dark modes, and accurate corner-radius shifts between `Nordic` and `Editorial`.

---

## 5. Critical Figma Plugin API Gotchas (Quick Reference)

Keep these hard-won rules in mind whenever writing or extending `@lsui/figma-sync` scripts:

1. **Plain Top-Level JS + Explicit `return`**: `use_figma` wraps scripts in an async function automatically. Never wrap in `(async () => { ... })()`, never call `figma.closePlugin()`, never call `figma.notify()` (throws `"not implemented"`), and remember `console.log()` is invisible—always `return` structured JSON containing all created/mutated IDs.
2. **Never Parallelize `use_figma` Writes**: Execute mutating `use_figma` calls strictly one at a time.
3. **Page Context Resets Every Call**: Every `use_figma` call starts on Page 1. Switch pages with `await figma.setCurrentPageAsync(page)` (at most once per call; assigning `figma.currentPage = page` throws).
4. **Load Fonts Before Any Text or Style Write**: Always `await figma.loadFontAsync({ family: "Inter", style: "Medium" })` before setting `characters`, `fontName`, `fontSize`, or TextStyles. Note that in Figma, Inter uses `"Semi Bold"` and `"Extra Bold"` (with a space), not `"SemiBold"`.
5. **Color Shapes Differ Between Paints and Variables**:
   - Paint `SOLID` colors take `{ r, g, b }` in `0..1` floats (**no `a` key**—put alpha on `paint.opacity`).
   - `COLOR` variable values take `{ r, g, b, a }` in `0..1` floats.
   - `figma.variables.setBoundVariableForPaint(basePaint, "color", colorVar)` returns a **new immutable paint object**—always capture and reassign `node.fills = [boundPaint]`.
6. **Add Component Properties *Before* `combineAsVariants`**: Call `comp.addComponentProperty(...)` on each individual variant `ComponentNode` before `figma.combineAsVariants(variants, page)`, capture the returned `prop#id` string key, and wire `childNode.componentPropertyReferences`. Afterward, position every variant in `x`/`y` (they stack at `(0, 0)` by default!) and call `componentSet.resizeWithoutConstraints(...)`.
7. **Lock Parent Counter-Axis Before Setting `FILL` on Auto-Layout Children**: Inside a `VERTICAL` showcase frame, measure the widest child first, `resize(...)` the parent frame, and set `showcase.counterAxisSizingMode = "FIXED"` *before* setting `childCard.layoutSizingHorizontal = "FILL"`—otherwise cards can clamp to a narrower header text width and clip horizontal button rows.
8. **Variant Matrix Cap (`<= 30`)**: Keep `Variant × Size × State <= 30` per Component Set (use `INSTANCE_SWAP` for icons rather than icon variants; if a future component exceeds 30 combinations, split by primary style or extract building-block sub-components).
