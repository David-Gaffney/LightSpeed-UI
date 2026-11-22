# LightSpeedUI Component Reference (`COMPONENTS.md`)

> Auto-generated from `.astro` ASTs via `pnpm sync:artifacts`. Do not hand-edit.

## `Button` (`@lsui/core/Button.astro`)

Triggers an in-page action, form submission, or declarative dialog/popover command. For URL navigation, use LinkButton instead.

- **Category**: Actions
- **Root Element**: `<button>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `variant` | `"primary" \| "secondary" \| "outline" \| "ghost" \| "danger"` | `"primary"` | No | Visual style token variant. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | No | Control height and padding scale. |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | No | Native button behavior (`"button"` by default so forms never submit accidentally). |
| `disabled` | `boolean` | — | No | Disables the button and removes it from tab order. Use `aria-disabled="true"` when focus must remain reachable. |
| `render` | `boolean` | `true` | No | Conditionally renders the component when `true` (omits markup when `false`). |
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

## `LinkButton` (`@lsui/core/LinkButton.astro`)

Navigates to a URL using a semantic `<a>` element styled to match Button variants. Never overrides link semantics with `role="button"`.

- **Category**: Actions
- **Root Element**: `<a>`
- **Hydration**: `optional`

### Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `variant` | `"primary" \| "secondary" \| "outline" \| "ghost" \| "danger"` | `"primary"` | No | Visual style token variant matching Button. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | No | Control height and padding scale. |
| `render` | `boolean` | `true` | No | Conditionally renders the component when `true` (omits markup when `false`). |
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
