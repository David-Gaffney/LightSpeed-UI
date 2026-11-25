# LightSpeedUI Component Reference (`COMPONENTS.md`)

> Auto-generated from `.astro` ASTs via `pnpm sync:artifacts`. Do not hand-edit.

## `OriginButton` — Level: `origin` (`@lsui/origin/Button.astro`)

Unstyled accessible action primitive providing safe `<button>` defaults (`type="button"`), optional non-anchor tag rendering (`as`), keyboard activation, focusable `aria-disabled`, and declarative Invoker/Popover triggers.

- **Level**: `origin`
- **Category**: Primitives
- **Root Element**: `<button>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `as` | `"button" \| "span" \| "div"` | `"button"` | No | Safe element tag override (`"button"` default; `"a"` is forbidden—use `OriginLink` instead). |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | No | Native button behavior (`"button"` by default so forms never submit accidentally). |
| `disabled` | `boolean` | `false` | No | Disables the control and removes it from tab order. |
| `render` | `boolean` | `true` | No | Conditionally renders the primitive when `true`. |
| `commandfor` | `string` | — | No | Target element ID for the HTML Invoker Commands API. |
| `command` | `InvokerCommand` | — | No | Built-in or `--custom` command dispatched to `commandfor`. |
| `popovertarget` | `string` | — | No | Target element ID for the HTML Popover API. |
| `popovertargetaction` | `"toggle" \| "show" \| "hide"` | — | No | Popover action performed when clicked. |
| `iconOnly` | `boolean` | `false` | Required when iconOnly is true |  |
| `aria-label` | `string` | — | Required when iconOnly is true | Screen-reader accessible name |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `icon-start` | `INSTANCE_SWAP` | Optional leading icon content. |
| `default` | `TEXT_SLOT` | Button label content. |
| `icon-end` | `INSTANCE_SWAP` | Optional trailing icon content. |

---

## `OriginLink` — Level: `origin` (`@lsui/origin/LinkButton.astro`)

Unstyled accessible navigation primitive rendering a genuine `<a>` element without ever overriding link semantics with `role="button"`.

- **Level**: `origin`
- **Category**: Primitives
- **Root Element**: `<a>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `render` | `boolean` | `true` | No | Conditionally renders the primitive when `true`. |
| `href` | `string \| URL` | — | Conditionally required by discriminated union | Destination URL navigated to on activation. |
| `disabled` | `boolean` | `false` | Required when disabled is true | Active link state (`false` by default). |
| `iconOnly` | `boolean` | `false` | Required when iconOnly is true |  |
| `aria-label` | `string` | — | Required when iconOnly is true | Screen-reader accessible name |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `icon-start` | `INSTANCE_SWAP` | Optional leading icon content. |
| `default` | `TEXT_SLOT` | Link label content. |
| `icon-end` | `INSTANCE_SWAP` | Optional trailing icon content. |

---

## `OriginDialog` — Level: `origin` (`@lsui/origin/Dialog.astro`)

Unstyled native modal dialog primitive using Invoker Commands; the browser owns focus containment, inert page, Escape dismissal and focus restoration.

- **Level**: `origin`
- **Category**: Primitives
- **Root Element**: `<dialog>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | — | Yes | DOM element identifier |
| `labelledBy` | `string` | — | No |  |
| `describedBy` | `string` | — | No |  |
| `closedby` | `"any" \| "closerequest" \| "none"` | `"closerequest"` | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Dialog body. |
| `actions` | `SLOT` | Footer controls; use `type="button" command="close"` so buttons stay safe inside a form. |

---

## `OriginInput` — Level: `origin` (`@lsui/origin/Input.astro`)

Unstyled native text input with a bound label, persistent hint and native constraint attributes.

- **Level**: `origin`
- **Category**: Primitives
- **Root Element**: `<div>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | — | Yes | DOM element identifier |
| `label` | `string` | — | Yes |  |
| `type` | `"number" \| "hidden" \| "color" \| "button" \| "checkbox" \| "date" \| "datetime-local" \| "email" \| "file" \| "image" \| "month" \| "password" \| "radio" \| "range" \| "reset" \| "search" \| "submit" \| "tel" \| "text" \| "time" \| "url" \| "week"` | `"text"` | No | Form submission behavior ('button' \| 'submit' \| 'reset') |
| `name` | `string` | — | No |  |
| `hint` | `string` | — | No |  |
| `describedBy` | `string` | — | No |  |
| `required` | `boolean` | `false` | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |


---

## `OriginPopover` — Level: `origin` (`@lsui/origin/Popover.astro`)

Unstyled native Popover API surface with declarative triggers, conditional polyfill loading and optional focus return to the trigger.

- **Level**: `origin`
- **Category**: Primitives
- **Root Element**: `<div>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | — | Yes | DOM element identifier |
| `popover` | `"auto" \| "manual"` | `"auto"` | No |  |
| `trigger` | `string` | — | No | Id of the invoker; enables conditional polyfill loading and focus return. |
| `anchorName` | `string` | — | No | Documented hook for Liftoff/Landing anchor-positioning rules; no CSS ships in Origin. |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Popover content. |

---

## `OriginSelect` — Level: `origin` (`@lsui/origin/Select.astro`)

Unstyled native select with a bound label and optional persistent hint; no custom listbox role invention.

- **Level**: `origin`
- **Category**: Primitives
- **Root Element**: `<div>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | — | Yes | DOM element identifier |
| `label` | `string` | — | Yes |  |
| `name` | `string` | — | No |  |
| `hint` | `string` | — | No | Persistent helper text; rendered after the control and linked via aria-describedby. |
| `describedBy` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Native `<option>` elements. |

---

## `OriginTabs` — Level: `origin` (`@lsui/origin/Tabs.astro`)

Unstyled headless tabs using native focusgroup with a roving-focus fallback; tabs and panels are supplied via named slots.

- **Level**: `origin`
- **Category**: Primitives
- **Root Element**: `<div>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `label` | `string` | — | Yes |  |
| `activation` | `"automatic" \| "manual"` | `"automatic"` | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `tabs` | `SLOT` | `role="tab"` buttons. |
| `panels` | `SLOT` | `role="tabpanel"` regions. |

---

## `Button` — Level: `liftoff` (`@lsui/liftoff/Button.astro`)

Themed, copy-paste action button built atop OriginButton. Adds semantic token variants, sizes, hover/press/focus states, and WCAG 2.5.8 / 2.5.5 minimum target sizing. For URL navigation, use LinkButton instead.

- **Level**: `liftoff`
- **Category**: Actions
- **Root Element**: `<button>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `variant` | `"primary" \| "secondary" \| "outline" \| "ghost" \| "danger"` | `"primary"` | No | Visual style token variant. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | No | Control height and padding scale. |
| `as` | `"button" \| "span" \| "div"` | — | No | Safe element tag override (`"button"` default; `"a"` is forbidden—use `LinkButton` instead). |
| `type` | `"button" \| "submit" \| "reset"` | — | No | Native button behavior (`"button"` by default so forms never submit accidentally). |
| `disabled` | `boolean` | — | No | Disables the button and removes it from tab order. Use `aria-disabled="true"` when focus must remain reachable. |
| `render` | `boolean` | — | No | Conditionally renders the component when `true` (omits markup when `false`). |
| `commandfor` | `string` | — | No | Target element ID for the HTML Invoker Commands API (`https://webstatus.dev/features/invoker-commands`). |
| `command` | `InvokerCommand` | — | No | Built-in or `--custom` command dispatched to `commandfor`. |
| `popovertarget` | `string` | — | No | Target element ID for the HTML Popover API (`https://webstatus.dev/features/popover`). |
| `popovertargetaction` | `"toggle" \| "show" \| "hide"` | — | No | Popover action performed when clicked. |
| `iconOnly` | `boolean` | `false` | Required when iconOnly is true |  |
| `aria-label` | `string` | — | Required when iconOnly is true | Screen-reader accessible name |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `icon-start` | `INSTANCE_SWAP` | Optional leading decorative icon (`aria-hidden="true"` on SVGs). |
| `default` | `TEXT_SLOT` | Visible button label text. |
| `icon-end` | `INSTANCE_SWAP` | Optional trailing decorative icon (`aria-hidden="true"` on SVGs). |

---

## `LinkButton` — Level: `liftoff` (`@lsui/liftoff/LinkButton.astro`)

Themed navigation link built atop OriginLink. Applies Button visual variants and sizes to a genuine `<a>` element without ever overriding link semantics with `role="button"`.

- **Level**: `liftoff`
- **Category**: Actions
- **Root Element**: `<a>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `variant` | `"primary" \| "secondary" \| "outline" \| "ghost" \| "danger"` | `"primary"` | No | Visual style token variant matching Button. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | No | Control height and padding scale. |
| `render` | `boolean` | — | No | Conditionally renders the component when `true` (omits markup when `false`). |
| `href` | `string \| URL` | — | Conditionally required by discriminated union | Destination URL navigated to on activation. |
| `disabled` | `boolean` | `false` | Required when disabled is true | Active link state (`false` by default). |
| `iconOnly` | `boolean` | `false` | Required when iconOnly is true |  |
| `aria-label` | `string` | — | Required when iconOnly is true | Screen-reader accessible name |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `icon-start` | `INSTANCE_SWAP` | Optional leading decorative icon (`aria-hidden="true"` on SVGs). |
| `default` | `TEXT_SLOT` | Visible link label text. |
| `icon-end` | `INSTANCE_SWAP` | Optional trailing decorative icon (`aria-hidden="true"` on SVGs). |

---

## `Blocks` — Level: `liftoff` (`@lsui/liftoff/Blocks.astro`)

Themed section wrapper for CMS block sequences.

- **Level**: `liftoff`
- **Category**: Content
- **Root Element**: `<section>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `class` | `string` | — | No | Consumer CSS class escape hatch |
| `id` | `string` | — | No | DOM element identifier |
| `label` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Rendered blocks. |

---

## `Byline` — Level: `liftoff` (`@lsui/liftoff/Byline.astro`)

Themed author/date metadata row.

- **Level**: `liftoff`
- **Category**: Content
- **Root Element**: `<p>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `author` | `string` | — | Yes |  |
| `date` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Optional extra metadata. |

---

## `Pagination` — Level: `liftoff` (`@lsui/liftoff/Pagination.astro`)

Themed previous/next navigation with real links.

- **Level**: `liftoff`
- **Category**: Content
- **Root Element**: `<nav>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `previousHref` | `string` | — | No |  |
| `previousLabel` | `string` | — | No |  |
| `nextHref` | `string` | — | No |  |
| `nextLabel` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |


---

## `PortableText` — Level: `liftoff` (`@lsui/liftoff/PortableText.astro`)

Themed container for normalized portable-text blocks supplied through the default slot.

- **Level**: `liftoff`
- **Category**: Content
- **Root Element**: `<div>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `class` | `string` | — | No | Consumer CSS class escape hatch |
| `id` | `string` | — | No | DOM element identifier |
| `label` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Rendered portable-text blocks. |

---

## `PostCard` — Level: `liftoff` (`@lsui/liftoff/PostCard.astro`)

Themed article teaser card with a real navigation link.

- **Level**: `liftoff`
- **Category**: Content
- **Root Element**: `<article>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | — | Yes |  |
| `href` | `string` | — | Yes | Navigation destination attribute (no visual Figma axis) |
| `date` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Optional summary content. |

---

## `Prose` — Level: `liftoff` (`@lsui/liftoff/Prose.astro`)

Themed long-form article container with semantic heading rhythm.

- **Level**: `liftoff`
- **Category**: Content
- **Root Element**: `<article>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `class` | `string` | — | No | Consumer CSS class escape hatch |
| `id` | `string` | — | No | DOM element identifier |
| `label` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Rendered prose content. |

---

## `TableOfContents` — Level: `liftoff` (`@lsui/liftoff/TableOfContents.astro`)

Themed table-of-contents navigation built from consumer-supplied anchor links.

- **Level**: `liftoff`
- **Category**: Content
- **Root Element**: `<nav>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `class` | `string` | — | No | Consumer CSS class escape hatch |
| `id` | `string` | — | No | DOM element identifier |
| `label` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Nested `<ul>` / `<li>` / `<a>` outline. |

---

## `Badge` — Level: `liftoff` (`@lsui/liftoff/Badge.astro`)

Themed inline status badge styled entirely with semantic tokens.

- **Level**: `liftoff`
- **Category**: Status
- **Root Element**: `<span>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |


### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `TEXT_SLOT` | Badge label. |

---

## `Card` — Level: `liftoff` (`@lsui/liftoff/Card.astro`)

Themed surface container styled entirely with semantic tokens.

- **Level**: `liftoff`
- **Category**: Layout
- **Root Element**: `<section>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |


### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Card content. |

---

## `Dialog` — Level: `liftoff` (`@lsui/liftoff/Dialog.astro`)

Themed native modal dialog built atop OriginDialog.

- **Level**: `liftoff`
- **Category**: Overlays
- **Root Element**: `<div>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |


### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Dialog body. |
| `actions` | `SLOT` | Footer controls. |

---

## `Input` — Level: `liftoff` (`@lsui/liftoff/Input.astro`)

Themed text input built atop OriginInput with semantic token styling.

- **Level**: `liftoff`
- **Category**: Forms
- **Root Element**: `<div>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |


### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |


---

## `Popover` — Level: `liftoff` (`@lsui/liftoff/Popover.astro`)

Themed native popover built atop OriginPopover.

- **Level**: `liftoff`
- **Category**: Overlays
- **Root Element**: `<div>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |


### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Popover content. |

---

## `Select` — Level: `liftoff` (`@lsui/liftoff/Select.astro`)

Themed native select built atop OriginSelect with semantic token styling.

- **Level**: `liftoff`
- **Category**: Forms
- **Root Element**: `<div>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |


### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Native `<option>` elements. |

---

## `Tabs` — Level: `liftoff` (`@lsui/liftoff/Tabs.astro`)

Themed headless tabs built atop OriginTabs using native focusgroup where supported.

- **Level**: `liftoff`
- **Category**: Navigation
- **Root Element**: `<div>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |


### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `tabs` | `SLOT` | `role="tab"` buttons. |
| `panels` | `SLOT` | `role="tabpanel"` regions. |

---

## `Callout` — Level: `liftoff` (`@lsui/liftoff/Callout.astro`)

Themed documentation callout with a semantic label and non-color type marker.

- **Level**: `liftoff`
- **Category**: Documentation
- **Root Element**: `<aside>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `"note" \| "warning" \| "tip"` | — | No | Form submission behavior ('button' \| 'submit' \| 'reset') |
| `title` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Callout body. |

---

## `CodeGroup` — Level: `liftoff` (`@lsui/liftoff/CodeGroup.astro`)

Themed tabbed code group built atop OriginTabs.

- **Level**: `liftoff`
- **Category**: Documentation
- **Root Element**: `<div>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |


### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `tabs` | `SLOT` | `role="tab"` buttons. |
| `panels` | `SLOT` | `role="tabpanel"` code regions. |

---

## `DocsSidebar` — Level: `liftoff` (`@lsui/liftoff/DocsSidebar.astro`)

Themed nested documentation navigation landmark.

- **Level**: `liftoff`
- **Category**: Documentation
- **Root Element**: `<nav>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `label` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Nested list of links. |

---

## `PrevNext` — Level: `liftoff` (`@lsui/liftoff/PrevNext.astro`)

Themed previous/next documentation links.

- **Level**: `liftoff`
- **Category**: Documentation
- **Root Element**: `<nav>`
- **Hydration**: `none`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `previousHref` | `string` | — | No |  |
| `previousLabel` | `string` | — | No |  |
| `nextHref` | `string` | — | No |  |
| `nextLabel` | `string` | — | No |  |

### Slots

| Slot | Figma Mapping | Description |
| :--- | :--- | :--- |
| `default` | `SLOT` | Optional custom navigation content (e.g. a richer pager bar) |
