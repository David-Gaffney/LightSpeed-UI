/**
 * MDX globals registry — components available inside MDX without `import`.
 * Wired via `<Content components={components} />` in `[...slug].astro`.
 * Add new components here as you build (or install) them.
 */

import { Aside } from "./components/ui/aside";
import Callout from "@lsui/liftoff/Callout.astro";
import CodeGroup from "@lsui/liftoff/CodeGroup.astro";
import ComponentPreview from "./components/ComponentPreview.astro";
import Render from "./components/Render.astro";
import { Card } from "./components/ui/card";
import { CardGrid } from "./components/ui/card-grid";
import { PackageManagers } from "./components/ui/package-managers";
import { Step, Steps } from "./components/ui/steps";
import { Tabs, TabItem } from "./components/ui/tabs";

export const components = {
  Aside,
  Callout,
  Card,
  CardGrid,
  CodeGroup,
  ComponentPreview,
  PackageManagers,
  Render,
  Step,
  Steps,
  TabItem,
  Tabs,
};
