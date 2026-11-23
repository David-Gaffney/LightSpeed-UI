export const PACKAGE_NAME = "@lsui/ast";

export { parseCssColorToRgba } from "./color.ts";
export {
  buildAiContextFiles,
  buildDocsMdxByLevel,
  buildFigmaSpec,
  buildRegistryArtifacts,
} from "./generators.ts";
export { parsePlatformComponents } from "./parse-component.ts";
export { parseThemesPackage, validateComponentCss } from "./parse-css.ts";
export type {
  BaseTokensIR,
  ComponentIR,
  DimensionTokenIR,
  FigmaComponentSpec,
  FigmaPropKind,
  FigmaSpec,
  HydrationMode,
  PlatformLevel,
  PropIR,
  RegistryItem,
  RgbaColor,
  SlotIR,
  SourceFileRef,
  ThemeColorPair,
  ThemeIR,
} from "./types.ts";
