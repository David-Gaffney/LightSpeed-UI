export type HydrationMode = "none" | "optional" | "required";

export type FigmaPropKind =
  | "VARIANT"
  | "BOOLEAN"
  | "TEXT"
  | "INSTANCE_SWAP"
  | "SKIPPED_NON_VISUAL";

export interface PropIR {
  name: string;
  typeText: string;
  required: boolean;
  conditionalRequirement?: string | undefined;
  forbidden?: boolean | undefined;
  defaultValue?: string | undefined;
  description: string;
  literalValues?: string[] | undefined;
  figmaKind: FigmaPropKind;
  figmaReason?: string | undefined;
}

export interface SlotIR {
  name: string;
  description: string;
  figmaKind: "SLOT" | "INSTANCE_SWAP";
}

export interface SourceFileRef {
  path: string;
  fileName: string;
  sha256: string;
}

export interface ComponentIR {
  slug: string;
  name: string;
  description: string;
  category: string;
  hydration: HydrationMode;
  rootTag: string;
  sourcePath: string;
  files: SourceFileRef[];
  dependencies: string[];
  props: PropIR[];
  slots: SlotIR[];
  accessibility: string[];
  keyboard: string[];
  conditionalScriptCount: number;
}

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
}

export interface ThemeColorPair {
  token: string;
  lightRaw: string;
  darkRaw: string;
  lightRgba: RgbaColor;
  darkRgba: RgbaColor;
}

export interface DimensionTokenIR {
  token: string;
  rawValue: string;
  pxValue?: number | undefined;
}

export interface ThemeIR {
  id: string;
  label: string;
  designMarkdown: string;
  tokensMarkdown: string;
  colors: ThemeColorPair[];
  radii: DimensionTokenIR[];
  fonts: Record<string, string>;
}

export interface BaseTokensIR {
  spacing: DimensionTokenIR[];
  controlSizes: DimensionTokenIR[];
}

export interface FigmaComponentSpec {
  name: string;
  slug: string;
  description: string;
  rootTag: string;
  variantAxes: Array<{
    name: string;
    values: string[];
    defaultValue?: string | undefined;
  }>;
  booleanProperties: Array<{
    name: string;
    defaultValue: boolean;
  }>;
  textProperties: Array<{
    name: string;
    defaultValue: string;
  }>;
  slots: Array<{
    name: string;
    figmaType: "SLOT" | "INSTANCE_SWAP";
    description: string;
  }>;
  skippedProps: Array<{
    name: string;
    reason: string;
  }>;
}

export interface FigmaSpec {
  schemaVersion: 1;
  variableCollections: {
    colors: {
      name: "Theme Colors";
      modes: string[];
      variables: Array<{
        name: string;
        cssToken: string;
        valuesByMode: Record<string, RgbaColor>;
      }>;
    };
    dimensions: {
      name: "Geometry & Spacing";
      modes: string[];
      variables: Array<{
        name: string;
        cssToken: string;
        valuesByMode: Record<string, number>;
      }>;
    };
  };
  components: FigmaComponentSpec[];
}

export interface RegistryItem {
  $schema: string;
  name: string;
  title: string;
  type: "registry:ui";
  description: string;
  category: string;
  hydration: HydrationMode;
  dependencies: string[];
  files: Array<{
    path: string;
    target: string;
    sha256: string;
    content: string;
  }>;
}
