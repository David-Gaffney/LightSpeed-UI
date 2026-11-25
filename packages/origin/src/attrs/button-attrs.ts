import type { InvokerCommand } from "../contract.ts";

export interface ButtonAttrsOptions {
  as?: "button" | "span" | "div" | undefined;
  type?: "button" | "submit" | "reset" | undefined;
  disabled?: boolean | undefined;
  ariaDisabled?: boolean | "true" | "false" | undefined;
  commandfor?: string | undefined;
  command?: InvokerCommand | undefined;
  popovertarget?: string | undefined;
  popovertargetaction?: "toggle" | "show" | "hide" | undefined;
}

/**
 * Pure attribute helper for attaching `Origin` button semantics onto custom HTML markup.
 * Never allows `<a>` tags so native link roles are never overwritten by `role="button"`.
 */
export function buttonAttrs(
  options: ButtonAttrsOptions = {},
): Record<string, string | boolean | number | undefined> {
  const tag = options.as ?? "button";
  const isNativeButton = tag === "button";
  const isAriaDisabled =
    options.ariaDisabled === true || options.ariaDisabled === "true";

  const attrs: Record<string, string | boolean | number | undefined> = {};

  if (isNativeButton) {
    attrs.type = options.type ?? "button";
    // Explicitly clear anything that could override native <button> semantics.
    // undefined values remove the attribute when spread onto the element.
    attrs.role = undefined;
    attrs.tabindex = undefined;
    attrs["data-lsui-simulated-button"] = undefined;
    if (options.disabled) attrs.disabled = true;
    if (isAriaDisabled) attrs["aria-disabled"] = "true";
  } else {
    attrs.role = "button";
    attrs["data-lsui-simulated-button"] = "";
    if (options.disabled) {
      attrs["aria-disabled"] = "true";
      attrs.tabindex = -1;
    } else {
      attrs.tabindex = 0;
      if (isAriaDisabled) attrs["aria-disabled"] = "true";
    }
  }

  if (options.commandfor) {
    attrs.commandfor = options.commandfor;
    if (options.command) attrs.command = options.command;
  }
  if (options.popovertarget) {
    attrs.popovertarget = options.popovertarget;
    if (options.popovertargetaction) {
      attrs.popovertargetaction = options.popovertargetaction;
    }
  }

  return attrs;
}

export interface LinkAttrsOptions {
  href?: string | URL | undefined;
  disabled?: boolean | undefined;
  ariaDisabled?: boolean | "true" | "false" | undefined;
}

/**
 * Pure attribute helper for accessible `<a>` link primitives (never emits `role="button"`).
 */
export function linkAttrs(
  options: LinkAttrsOptions,
): Record<string, string | undefined> {
  const isDisabled =
    Boolean(options.disabled) ||
    options.ariaDisabled === true ||
    options.ariaDisabled === "true";

  if (isDisabled) {
    return {
      href: undefined,
      role: "link",
      "aria-disabled": "true",
      tabindex: undefined,
    };
  }

  return {
    href: options.href !== undefined ? String(options.href) : undefined,
    role: undefined,
    "aria-disabled": undefined,
    tabindex: undefined,
  };
}
