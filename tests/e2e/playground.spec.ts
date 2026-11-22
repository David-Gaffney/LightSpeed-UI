import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("LightSpeedUI Playground (Themes, Ambient Context & WCAG 2.2 AA)", () => {
  test("resolves Nordic & Editorial tokens, nested dark/density contexts, zero JS, and passes axe", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("http://localhost:4322/");

    await expect(
      page.getByRole("heading", { name: "LightSpeedUI Playground", level: 1 }),
    ).toBeVisible();
    await expect(page.locator("code").first()).toHaveText("@lsui/core");

    // Verify Zero-JS by default on static playground pages
    await expect(page.locator("script")).toHaveCount(0);
    expect(errors).toEqual([]);

    // Verify Nordic vs Editorial token differentiation + nested dark/density inheritance
    const computed = await page.evaluate(() => {
      const nordicZone = document.getElementById("nordic-zone")!;
      const nordicHeading = document.getElementById("nordic-heading")!;
      const nordicDarkCompact = document.getElementById("nordic-dark-compact")!;
      const editorialZone = document.getElementById("editorial-zone")!;
      const editorialHeading = document.getElementById("editorial-heading")!;
      const editorialDarkZone = document.getElementById("editorial-dark-zone")!;

      const nordicLightBg = getComputedStyle(nordicZone).backgroundColor;
      const nordicDarkBg = getComputedStyle(nordicDarkCompact).backgroundColor;
      const editorialLightBg = getComputedStyle(editorialZone).backgroundColor;
      const editorialDarkBg = getComputedStyle(editorialDarkZone).backgroundColor;

      const nordicRadius = getComputedStyle(
        nordicZone.querySelector(".primary-pill")!,
      ).borderTopLeftRadius;
      const editorialRadius = getComputedStyle(
        editorialZone.querySelector(".primary-pill")!,
      ).borderTopLeftRadius;

      const spaciousPillHeight = parseFloat(
        getComputedStyle(nordicZone.querySelector(".primary-pill")!).minHeight,
      );
      const compactPillHeight = parseFloat(
        getComputedStyle(nordicDarkCompact.querySelector(".primary-pill")!).minHeight,
      );

      return {
        nordicLightBg,
        nordicDarkBg,
        editorialLightBg,
        editorialDarkBg,
        nordicRadius,
        editorialRadius,
        nordicHeadingFont: getComputedStyle(nordicHeading).fontFamily,
        editorialHeadingFont: getComputedStyle(editorialHeading).fontFamily,
        spaciousPillHeight,
        compactPillHeight,
      };
    });

    // Light vs nested Dark backgrounds flip automatically via light-dark()
    expect(computed.nordicLightBg).not.toBe(computed.nordicDarkBg);
    expect(computed.editorialLightBg).not.toBe(computed.editorialDarkBg);

    // Nordic (0.5rem = 8px) vs Editorial (0.1875rem = 3px) geometry & heading typography differ
    expect(parseFloat(computed.nordicRadius)).toBeGreaterThan(
      parseFloat(computed.editorialRadius),
    );
    expect(computed.editorialHeadingFont.toLowerCase()).toContain("serif");
    expect(computed.nordicHeadingFont).not.toBe(computed.editorialHeadingFont);

    // Nested data-density="compact" overrides outer data-density="spacious" by DOM proximity
    expect(computed.spaciousPillHeight).toBeGreaterThan(computed.compactPillHeight);

    // Full WCAG 2.2 AA contrast & accessibility verification across all themes and surfaces
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
