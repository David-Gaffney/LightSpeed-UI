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
| `default` | `SLOT` | Button label content. |
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
| `default` | `SLOT` | Link label content. |
| `icon-end` | `INSTANCE_SWAP` | Optional trailing icon content. |

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
| `default` | `SLOT` | Visible button label text. |
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
| `default` | `SLOT` | Visible link label text. |
| `icon-end` | `INSTANCE_SWAP` | Optional trailing decorative icon (`aria-hidden="true"` on SVGs). |
