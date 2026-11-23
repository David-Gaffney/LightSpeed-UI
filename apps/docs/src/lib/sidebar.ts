import { getSidebar } from "@cloudflare/nimbus-docs/runtime";
import type { SidebarGroupItem, SidebarItem } from "@cloudflare/nimbus-docs/types";

const COLLECTION_GROUP_LABELS: Record<string, string> = {
  docs: "Overview",
  origin: "Origin (Level 1)",
  liftoff: "Liftoff (Level 2)",
  landing: "Landing (Level 3)",
  apogee: "Apogee (Level 4)",
};

/**
 * Builds the scoped sidebar tree for the active top-header navigation tab
 * (`Overview`, `Origin`, `Liftoff`, `Landing`, or `Apogee`).
 *
 * For each platform level (`origin`, `liftoff`, `landing`, `apogee`), keeps the
 * outer `<Level> (Level N)` group expanded at the top of the rail (`Overview` first
 * via `indexHref`), followed by `Core Goals of <Level>`, followed by an expanded
 * `Catalog` section containing that level's primitives, components, blocks, or experiences.
 */
export async function getLevelSidebar(
  currentSlug: string,
  collection: string,
): Promise<SidebarItem[]> {
  const targetLabel = COLLECTION_GROUP_LABELS[collection] ?? "Overview";

  return getSidebar(currentSlug, {
    collection,
    transform: ({ tree }) => {
      const matched = tree.find(
        (item): item is SidebarGroupItem =>
          item.type === "group" && item.label === targetLabel,
      );
      if (!matched) return tree;

      if (collection === "docs") {
        return [{ ...matched, collapsed: false }];
      }

      const coreGoalsSlug = `/${collection}/core-goals`;
      const coreGoalsItems: SidebarItem[] = [];
      const catalogItems: SidebarItem[] = [];

      for (const child of matched.children) {
        if (
          child.type === "link" &&
          child.href.replace(/\/$/, "") === coreGoalsSlug
        ) {
          coreGoalsItems.push(child);
        } else {
          catalogItems.push(child);
        }
      }

      const structuredChildren: SidebarItem[] = [...coreGoalsItems];
      if (catalogItems.length > 0) {
        structuredChildren.push({
          type: "group",
          label: "Catalog",
          order: 2,
          collapsed: false,
          children: catalogItems,
        });
      }

      return [
        {
          ...matched,
          collapsed: false,
          children: structuredChildren,
        },
      ];
    },
  });
}
