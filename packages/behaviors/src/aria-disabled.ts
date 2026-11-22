/**
 * Installs a single delegated document guard that prevents pointer and keyboard
 * activation on `[aria-disabled="true"]` controls while keeping them focusable
 * in the tab order (per WCAG 4.1.2 / modern-web-guidance `accessibility`).
 */

let installed = false;

export function ensureAriaDisabledGuard(): void {
  if (typeof document === "undefined" || installed) return;
  installed = true;

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
