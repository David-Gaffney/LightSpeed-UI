// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "../src/mount.ts";

const disposers: Array<() => void> = [];

async function flushMutations(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(async () => {
  while (disposers.length > 0) disposers.pop()?.();
  document.body.replaceChildren();
  await flushMutations();
});

describe("@lsui/origin — mount() lifecycle cleanup", () => {
  it("cleans up elements removed by ordinary DOM code, not just Astro swaps", async () => {
    document.body.innerHTML =
      '<div id="list"><button class="widget"></button><button class="widget"></button></div>';
    const cleanups = [vi.fn(), vi.fn()];
    let index = 0;
    disposers.push(mount(".widget", () => cleanups[index++]));

    const list = document.getElementById("list")!;
    const kept = list.lastElementChild!;
    list.replaceChildren(kept); // a single batched childList record
    await flushMutations();

    expect(cleanups[0]).toHaveBeenCalledTimes(1);
    expect(cleanups[1]).not.toHaveBeenCalled();
  });

  it("ignores a duplicate (selector, setup) registration", () => {
    document.body.innerHTML = '<button class="widget"></button>';
    const setup = vi.fn(() => vi.fn());
    disposers.push(mount(".widget", setup));
    disposers.push(mount(".widget", setup));

    expect(setup).toHaveBeenCalledTimes(1);
  });

  it("does not tear down a node that is reinserted in the same mutation batch", async () => {
    document.body.innerHTML =
      '<div id="list"><button class="widget"></button></div>';
    const cleanup = vi.fn();
    disposers.push(mount(".widget", () => cleanup));

    const list = document.getElementById("list")!;
    const button = list.firstElementChild!;
    list.replaceChildren();
    list.append(button); // moved, not permanently removed
    await flushMutations();

    expect(cleanup).not.toHaveBeenCalled();
  });
});
