/**
 * Level 1 (Origin) — Focusable `aria-disabled` Guard & Non-Button Keyboard Activation
 *
 * 1. Prevents pointer and keyboard activation on `[aria-disabled="true"]` controls
 *    while keeping them reachable in the keyboard tab order (WCAG 4.1.2).
 * 2. When `Origin` `<Button as="span">` renders a non-native element (`[data-lsui-simulated-button]`),
 *    wires native button keyboard mechanics (`Enter` on `keydown`, `Space` on `keyup`).
 */

let disabledGuardInstalled = false;
let simulatedBtnInstalled = false;

export function ensureAriaDisabledGuard(): void {
  if (typeof document === "undefined" || disabledGuardInstalled) return;
  disabledGuardInstalled = true;

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest('[aria-disabled="true"]');
      if (control) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    { capture: true },
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest('[aria-disabled="true"]');
      if (control) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    { capture: true },
  );
}

export function ensureSimulatedButtonKeys(): void {
  if (typeof document === "undefined" || simulatedBtnInstalled) return;
  simulatedBtnInstalled = true;

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.hasAttribute("data-lsui-simulated-button")) return;
    if (target.getAttribute("aria-disabled") === "true") return;

    if (event.key === "Enter") {
      event.preventDefault();
      target.click();
    } else if (event.key === " ") {
      event.preventDefault();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key !== " ") return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.hasAttribute("data-lsui-simulated-button")) return;
    if (target.getAttribute("aria-disabled") === "true") return;

    event.preventDefault();
    target.click();
  });
}
