export const PACKAGE_NAME = "@lsui/ast";

export { parseCssColorToRgba } from "./color.ts";
export {
  buildAiContextFiles,
  buildDocsMdxPages,
  buildFigmaSpec,
  buildRegistryArtifacts,
} from "./generators.ts";
export { parseCoreComponents } from "./parse-component.ts";
export { parseThemesPackage, validateComponentCss } from "./parse-css.ts";
export type {
  BaseTokensIR,
  ComponentIR,
  DimensionTokenIR,
  FigmaComponentSpec,
  FigmaPropKind,
  FigmaSpec,
  HydrationMode,
  PropIR,
  RegistryItem,
  RgbaColor,
  SlotIR,
  SourceFileRef,
  ThemeColorPair,
  ThemeIR,
} from "./types.ts";
