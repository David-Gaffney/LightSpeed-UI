# Theme: Editorial (`@lsui/themes/editorial.css`)

## Design Voice
- **Personality**: Warm, literary, authoritative, print-inspired.
- **Best For**: Publications, EmDash CMS blogs, essays, brand storytelling, knowledge bases, and media sites.

## Visual Rules (For Humans & AI Agents)
- **Color Palette**: Warm archival ivory paper (`hue ~82–85`) and deep warm charcoal ink (`hue ~60–65`) accented with terracotta vermilion (`--color-primary`, `hue ~34–42`). Avoid cold blue-grey backgrounds.
- **Typography**: Contrasts transitional/old-style serif headings (`--font-heading`: `Charter` / `Iowan Old Style` / `Georgia`) against crisp humanist sans-serif UI and body copy (`--font-body`). Always apply `var(--font-heading)` to article titles, hero headlines, and pull-quotes.
- **Geometry & Radii**: Tight, tailored print corners (`--radius-md: 0.1875rem`, `--radius-lg: 0.25rem`). Avoid bubbly large radii on cards or buttons.
- **Elevation**: Emphasize hairlines and crisp rules (`1px solid var(--color-border)`) over heavy drop shadows.
- **Ambient Context Usage**:
  - Pair `<article data-layout="prose" data-density="spacious">` for long-form EmDash `PortableText` articles.
  - Use `<section data-surface="inverse">` or `<section data-theme="dark">` for dramatic editorial feature headers and newsletter sign-up bands.
