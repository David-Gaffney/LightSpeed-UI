import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.describe("Part 10.4 — docs chrome (semantic, Liftoff-dogfooded)", () => {
  test("axe-core WCAG 2.2 AA passes on the full docs chrome, not just previews", async ({
    page,
  }) => {
    await page.goto("http://localhost:4321/");
    await expect(page.locator("header nav[aria-label='Sections']").first()).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations).toEqual([]);
  });

  test("search dialog is a native modal with focus return", async ({ page }) => {
    await page.goto("http://localhost:4321/");
    const trigger = page.locator("[data-search-trigger]");
    const dialog = page.locator("dialog[data-search-dialog]");

    await expect(dialog).toBeHidden();
    await trigger.click();
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate((el) => (el as HTMLDialogElement).matches(":modal")),
    ).toBe(true);
    // Native dialogs supply focus containment and Escape dismissal; no
    // role="dialog" / aria-modal / manual focus trap should be added.
    expect(await dialog.getAttribute("role")).toBeNull();
    expect(await dialog.getAttribute("aria-modal")).toBeNull();

    const openA11y = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(openA11y.violations).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("mobile sidebar drawer is a native modal and restores focus", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto("http://localhost:4321/");

    const trigger = page.locator("[data-menu-btn]");
    const drawer = page.locator("dialog[data-mobile-sidebar]");
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(drawer).toBeVisible();
    expect(
      await drawer.evaluate((el) => (el as HTMLDialogElement).matches(":modal")),
    ).toBe(true);
    await expect(drawer.locator("[data-close-sidebar]")).toBeFocused();

    const a11y = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(a11y.violations).toEqual([]);

    await drawer.locator("[data-close-sidebar]").click();
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    await context.close();
  });

  test("TOC links and pager use Liftoff/docs semantics", async ({ page }) => {
    await page.goto("http://localhost:4321/liftoff/");

    // The desktop TOC is the scrollspy nav from Part 10.4.
    const toc = page.locator("[data-nb-toc]");
    if ((await toc.count()) > 0) {
      const links = page.locator("[data-nb-toc-link]");
      const count = await links.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute("href");
        expect(href).toMatch(/^#/);
        const slug = href!.slice(1);
        const target = page.locator(`[id="${slug}"]`);
        if ((await target.count()) > 0) {
          await expect(target.first()).toHaveAttribute("tabindex", "-1");
        }
      }
    }

    // Pager is wrapped by the dogfooded Liftoff PrevNext component.
    const pager = page.locator("nav[data-lsui-prev-next]");
    if ((await pager.count()) > 0) {
      await expect(pager).toHaveAttribute("aria-label", "Pagination");
      const prevNext = page.locator("[data-nb-pagination]");
      await expect(prevNext).toBeVisible();
    }
  });
});
