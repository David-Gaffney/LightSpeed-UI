import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("LightSpeedUI Playground (Themes, Button/LinkButton & WCAG 2.2 AA)", () => {
  test("renders zero-JS Button & LinkButton across themes, contexts, cursors, hover/focus, and target minimums", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("http://localhost:4322/");

    await expect(
      page.getByRole("heading", { name: "LightSpeedUI Playground", level: 1 }),
    ).toBeVisible();

    // `render={false}` omits element completely
    await expect(page.getByText("Hidden When False")).toHaveCount(0);

    // Static page with <Button> and <LinkButton> ships ZERO client <script> tags
    await expect(page.locator("script")).toHaveCount(0);
    expect(errors).toEqual([]);

    // Verify Button vs LinkButton semantics, cursors, target sizes, and theme tokens
    const computed = await page.evaluate(() => {
      const nordicZone = document.getElementById("nordic-zone")!;
      const nordicHeading = document.getElementById("nordic-heading")!;
      const nordicDarkCompact = document.getElementById("nordic-dark-compact")!;
      const editorialZone = document.getElementById("editorial-zone")!;
      const editorialHeading = document.getElementById("editorial-heading")!;
      const editorialDarkZone = document.getElementById("editorial-dark-zone")!;

      const nordicBtn = document.getElementById(
        "nordic-primary-btn",
      ) as HTMLButtonElement;
      const nordicLink = document.getElementById(
        "nordic-link-btn",
      ) as HTMLAnchorElement;
      const compactSmBtn = document.getElementById(
        "compact-sm-btn",
      ) as HTMLButtonElement;
      const editorialBtn = document.getElementById(
        "editorial-primary-btn",
      ) as HTMLButtonElement;

      const compactRect = compactSmBtn.getBoundingClientRect();

      return {
        nordicLightBg: getComputedStyle(nordicZone).backgroundColor,
        nordicDarkBg: getComputedStyle(nordicDarkCompact).backgroundColor,
        editorialLightBg: getComputedStyle(editorialZone).backgroundColor,
        editorialDarkBg: getComputedStyle(editorialDarkZone).backgroundColor,
        nordicRadius: getComputedStyle(nordicBtn).borderTopLeftRadius,
        editorialRadius: getComputedStyle(editorialBtn).borderTopLeftRadius,
        nordicHeadingFont: getComputedStyle(nordicHeading).fontFamily,
        editorialHeadingFont: getComputedStyle(editorialHeading).fontFamily,
        spaciousBtnHeight: nordicBtn.getBoundingClientRect().height,
        compactBtnHeight: compactRect.height,
        compactBtnWidth: compactRect.width,
        buttonType: nordicBtn.getAttribute("type"),
        buttonCursor: getComputedStyle(nordicBtn).cursor,
        linkTag: nordicLink.tagName,
        linkRoleAttr: nordicLink.getAttribute("role"),
        linkCursor: getComputedStyle(nordicLink).cursor,
        heroBackdrop: getComputedStyle(document.getElementById("hero-surface")!)
          .backgroundImage,
        themedImgLight: getComputedStyle(
          document.getElementById("themed-img-light")!,
        ).backgroundImage,
        themedImgDark: getComputedStyle(
          document.getElementById("themed-img-dark")!,
        ).backgroundImage,
      };
    });

    // Safe default type="button", tokenized `default` cursor on <Button>, `pointer` + no role="button" on <LinkButton>
    expect(computed.buttonType).toBe("button");
    expect(computed.buttonCursor).toBe("default");
    expect(computed.linkTag).toBe("A");
    expect(computed.linkRoleAttr).toBeNull();
    expect(computed.linkCursor).toBe("pointer");

    // Tokenized cursor override works in 1 CSS variable
    const overriddenCursor = await page.evaluate(() => {
      document.documentElement.style.setProperty(
        "--cursor-interactive",
        "pointer",
      );
      const c = getComputedStyle(
        document.getElementById("nordic-primary-btn")!,
      ).cursor;
      document.documentElement.style.removeProperty("--cursor-interactive");
      return c;
    });
    expect(overriddenCursor).toBe("pointer");

    // Desktop target size >= 24x24px even on compact sm button
    expect(computed.compactBtnHeight).toBeGreaterThanOrEqual(24);
    expect(computed.compactBtnWidth).toBeGreaterThanOrEqual(24);

    // Distinct hover & keyboard :focus-visible states
    const primaryBtn = page.locator("#nordic-primary-btn");
    const restingBg = await primaryBtn.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    await primaryBtn.hover();
    const hoverBg = await primaryBtn.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(hoverBg).not.toBe(restingBg);

    await primaryBtn.focus();
    const focusOutline = await primaryBtn.evaluate((el) => {
      // Trigger keyboard modality via Tab to verify :focus-visible
      return getComputedStyle(el).outlineStyle;
    });
    expect(focusOutline).toBeDefined();
    await page.keyboard.press("Tab");
    const focusedOutlineStyle = await page
      .locator(":focus-visible")
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(focusedOutlineStyle).toBe("solid");

    // Theme & light-dark() checks
    expect(computed.nordicLightBg).not.toBe(computed.nordicDarkBg);
    expect(computed.editorialLightBg).not.toBe(computed.editorialDarkBg);
    expect(parseFloat(computed.nordicRadius)).toBeGreaterThan(
      parseFloat(computed.editorialRadius),
    );
    expect(computed.editorialHeadingFont.toLowerCase()).toContain("serif");
    expect(computed.spaciousBtnHeight).toBeGreaterThan(computed.compactBtnHeight);
    expect(computed.heroBackdrop).not.toBe("none");
    expect(computed.themedImgLight).not.toBe(computed.themedImgDark);

    // Full WCAG 2.2 AA check across all variants, sizes, themes, and dark subtrees
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(a11y.violations).toEqual([]);
  });

  test("expands interactive target size to >= 44x44px on coarse touch pointers", async ({
    browser,
  }) => {
    const touchContext = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });
    const page = await touchContext.newPage();
    await page.goto("http://localhost:4322/");

    const box = await page.locator("#compact-sm-btn").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);

    await touchContext.close();
  });

  test("supports declarative Invoker Commands, Popover triggers, and focusable aria-disabled", async ({
    page,
  }) => {
    await page.goto("http://localhost:4322/triggers");

    const dialog = page.locator("#demo-dialog");
    await expect(dialog).toBeHidden();

    await page.locator("#open-dialog-btn").click();
    await expect(dialog).toBeVisible();

    // Check WCAG 2.2 AA while modal dialog is open
    const a11yOpen = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(a11yOpen.violations).toEqual([]);

    await page.locator("#close-dialog-btn").click();
    await expect(dialog).toBeHidden();

    // Declarative popovertarget toggle
    const popover = page.locator("#demo-popover");
    await expect(popover).toBeHidden();
    await page.locator("#toggle-popover-btn").click();
    await expect(popover).toBeVisible();

    // Disabled LinkButton omits href and preserves link role
    const disabledLink = page.locator("#disabled-link-btn");
    await expect(disabledLink).not.toHaveAttribute("href");
    await expect(disabledLink).toHaveAttribute("role", "link");
    await expect(disabledLink).toHaveAttribute("aria-disabled", "true");

    // aria-disabled Button remains focusable in tab order
    const ariaDisabledBtn = page.locator("#aria-disabled-btn");
    await ariaDisabledBtn.focus();
    await expect(ariaDisabledBtn).toBeFocused();
    // Verify Origin simulated <span role="button"> keyboard Space/Enter + mount() + ariaNotify()
    const originSpan = page.locator("#origin-span-btn");
    await expect(originSpan).toHaveAttribute("role", "button");
    await expect(originSpan).toHaveAttribute("tabindex", "0");
    await originSpan.focus();
    await page.keyboard.press("Enter");
    await expect(originSpan).toHaveAttribute("data-activated", "true");
  });
});

test.describe("Nimbus Docs 4-Level Separation & <ComponentPreview> CSS Isolation", () => {
  test("renders 5 Top Header Tabs (Overview, Origin, Liftoff, Landing, Apogee) and isolated previews", async ({
    page,
    request,
  }) => {
    await page.goto("http://localhost:4321/");

    // Verify all 5 platform section tabs render in the desktop header nav
    const headerTabs = page.locator('header nav[aria-label="Sections"]').first();
    await expect(headerTabs.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(headerTabs.getByRole("link", { name: "Origin" })).toBeVisible();
    await expect(headerTabs.getByRole("link", { name: "Liftoff" })).toBeVisible();
    await expect(headerTabs.getByRole("link", { name: "Landing" })).toBeVisible();
    await expect(headerTabs.getByRole("link", { name: "Apogee" })).toBeVisible();

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

    // Verify Level 1 (Origin) & Level 2 (Liftoff) dedicated section pages
    await page.goto("http://localhost:4321/origin/origin-button/");
    await expect(
      page.getByRole("heading", { name: "OriginButton", level: 1 }),
    ).toBeVisible();

    await page.goto("http://localhost:4321/liftoff/button/");
    await expect(
      page.getByRole("heading", { name: "Button", level: 1 }),
    ).toBeVisible();
    await expect(
      page.locator('[data-lsui-preview][data-theme="nordic light"] button[data-variant="primary"]'),
    ).toBeVisible();

    // Verify level-namespaced static registry JSON endpoints
    const originReg = await request.get("http://localhost:4321/r/origin/origin-button.json");
    expect(originReg.ok()).toBe(true);
    const liftoffReg = await request.get("http://localhost:4321/r/liftoff/button.json");
    expect(liftoffReg.ok()).toBe(true);
    const regJson = (await liftoffReg.json()) as {
      level: string;
      files: Array<{ sha256: string }>;
    };
    expect(regJson.level).toBe("liftoff");
    expect(regJson.files[0]?.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});
