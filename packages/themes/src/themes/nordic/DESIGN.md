# Theme: Nordic (`@lsui/themes/nordic.css`)

## Design Voice
- **Personality**: Calm, spacious, technical, trustworthy.
- **Best For**: Developer portals, technical documentation, SaaS marketing sites, and engineering blogs.

## Visual Rules (For Humans & AI Agents)
- **Color Palette**: Cool slate neutrals (`hue ~248–252`) paired with a crisp arctic fjord blue primary action color (`--color-primary`). Avoid warm yellow/brown neutrals inside Nordic layouts.
- **Typography**: Clean technical neo-grotesque sans-serif (`IBM Plex Sans` / `Inter`) for both headings and body text, paired with `IBM Plex Mono` for code.
- **Geometry & Radii**: Balanced medium rounding (`--radius-md: 0.5rem` on buttons/inputs, `--radius-lg: 0.75rem` on cards/dialogs). Never mix sharp `0px` corners with pill corners unless building a semantic `Badge` (`--radius-full`).
- **Elevation**: Prefer subtle 1px borders (`--color-border`) for static content cards, reserving soft diffused shadows (`--shadow-md`, `--shadow-lg`) for interactive popovers, menus, and dialogs.
- **Spacing & Density**: Defaults to `comfortable` density with generous breathing room around prose and headings. Use `data-density="compact"` on sidebars, tables, and utility toolbars rather than hardcoding smaller padding.
- **Ambient Context Usage**:
  - Use `<section data-surface="muted">` to separate alternating landing-page blocks without heavy borders.
  - Use `<section data-theme="dark">` for dark feature callouts or code showcases; all semantic tokens automatically re-resolve via `light-dark()`.
