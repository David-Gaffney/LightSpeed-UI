/**
 * Level 1 (Origin) — shared programmatic-motion preference helper.
 *
 * Implements F-036: JS behaviors must honour both the OS preference and the
 * nearest `[data-motion="reduced" | "none"]` subtree override.
 */

export function prefersReducedMotion(element?: Element | null): boolean {
  if (element?.closest('[data-motion="none"], [data-motion="reduced"]')) {
    return true;
  }
  if (typeof matchMedia !== "function") return false;
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function motionDuration(
  element: Element | null | undefined,
  normalMs: number,
  reducedMs = 0,
): number {
  return prefersReducedMotion(element) ? reducedMs : normalMs;
}

/**
 * Run a callback when motion finishes. When no animation exists (including all
 * reduced-motion cases), `getAnimations()` is empty and `transitionend` /
 * `animationend` never fire, so continue immediately.
 */
export function afterMotion(
  element: Element,
  callback: () => void,
): void {
  const animations = element.getAnimations?.() ?? [];
  if (animations.length === 0) {
    callback();
    return;
  }
  Promise.allSettled(animations.map((animation) => animation.finished)).then(
    () => callback(),
  );
}
