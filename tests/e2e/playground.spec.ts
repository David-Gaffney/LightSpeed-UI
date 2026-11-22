import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("LightSpeedUI Playground (Zero-JS & WCAG 2.2 AA)", () => {
  test("renders semantic markup with zero client JS and zero axe a11y violations", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("http://localhost:4322/");

    await expect(
      page.getByRole("heading", { name: "LightSpeedUI Playground", level: 1 }),
    ).toBeVisible();
    await expect(page.locator("code")).toHaveText("@lsui/core");

    // Verify Zero-JS by default on static playground pages
    await expect(page.locator("script")).toHaveCount(0);
    expect(errors).toEqual([]);

    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(a11y.violations).toEqual([]);
  });
});

test.describe("Nimbus Docs <ComponentPreview> CSS Isolation", () => {
  test("reverts Tailwind Preflight inside [data-lsui-preview] and passes axe checks", async ({
    page,
  }) => {
    await page.goto("http://localhost:4321/");

    const previewButton = page.locator("[data-lsui-preview] button");
    await expect(previewButton).toBeVisible();

    // Tailwind v4 Preflight resets buttons to border-width: 0px and padding: 0px.
    // Inside [data-lsui-preview], @layer base `all: revert-layer` must restore native UA button styles.
    const styles = await previewButton.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderTopWidth: parseFloat(cs.borderTopWidth),
        paddingLeft: parseFloat(cs.paddingLeft),
      };
    });

    expect(styles.borderTopWidth).toBeGreaterThan(0);
    expect(styles.paddingLeft).toBeGreaterThan(0);
  });
});
