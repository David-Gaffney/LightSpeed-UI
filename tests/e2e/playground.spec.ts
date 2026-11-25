import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

function parseColor(value: string): [number, number, number] {
  const rgb = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(value);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];

  // Chromium serializes computed custom-property colors as oklch(); convert with
  // the same Oklab -> linear sRGB -> gamma sRGB math as @lsui/ast color.ts.
  const oklch = /^oklch\(\s*([\d.]+)(%)?\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)$/i.exec(
    value.trim(),
  );
  if (oklch) {
    const l = oklch[2] ? Number(oklch[1]) / 100 : Number(oklch[1]);
    const c = Number(oklch[3]);
    const h = (Number(oklch[4]) * Math.PI) / 180;
    const a = c * Math.cos(h);
    const b = c * Math.sin(h);
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;
    const l3 = l_ ** 3;
    const m3 = m_ ** 3;
    const s3 = s_ ** 3;
    const encode = (linear: number): number => {
      const v = Math.min(1, Math.max(0, linear));
      return (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255;
    };
    return [
      encode(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
      encode(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
      encode(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
    ];
  }
  const oklab = /^oklab\(\s*([\d.]+)(%)?\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\)$/i.exec(
    value.trim(),
  );
  if (oklab) {
    const l = oklab[2] ? Number(oklab[1]) / 100 : Number(oklab[1]);
    const a = Number(oklab[3]);
    const b = Number(oklab[4]);
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;
    const l3 = l_ ** 3;
    const m3 = m_ ** 3;
    const s3 = s_ ** 3;
    const encode = (linear: number): number => {
      const v = Math.min(1, Math.max(0, linear));
      return (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255;
    };
    return [
      encode(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
      encode(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
      encode(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
    ];
  }

  const srgb = /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/i.exec(
    value.trim(),
  );
  if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255];

  throw new Error(`Unsupported computed color: ${value}`);
}

function contrast(foreground: string, background: string): number {
  const luminance = ([r, g, b]: [number, number, number]): number => {
    const linear = (channel: number): number => {
      const c = channel / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  const a = luminance(parseColor(foreground));
  const b = luminance(parseColor(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

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

  test("inverse surfaces keep focus rings and disabled labels above WCAG contrast minimums", async ({
    page,
  }) => {
    await page.goto("http://localhost:4322/");

    const combos: [string, string][] = [
      ["nordic-inverse-light-panel", "nordic-inverse-light-btn"],
      ["nordic-inverse-dark-panel", "nordic-inverse-dark-btn"],
      ["editorial-inverse-light-panel", "editorial-inverse-light-btn"],
      ["editorial-inverse-dark-panel", "editorial-inverse-dark-btn"],
    ];

    for (const [panelId, buttonId] of combos) {
      const colors = await page.evaluate(
        ({ panelId, buttonId }) => {
          const panel = document.getElementById(panelId)!;
          const probe = document.createElement("div");
          panel.appendChild(probe);
          probe.style.backgroundColor = "var(--color-ring)";
          const ring = getComputedStyle(probe).backgroundColor;
          probe.style.backgroundColor = "var(--color-border)";
          const border = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return {
            surface: getComputedStyle(panel).backgroundColor,
            ring,
            border,
          };
        },
        { panelId, buttonId },
      );

      expect(contrast(colors.ring, colors.surface), `${panelId} focus ring`).toBeGreaterThanOrEqual(3);
      expect(contrast(colors.border, colors.surface), `${panelId} border`).toBeGreaterThanOrEqual(3);

      // Keyboard focus must actually use that remapped ring token.
      await page.keyboard.press("Tab");
      const button = page.locator(`#${buttonId}`);
      await button.focus();
      const focused = await button.evaluate((el) => ({
        visible: el.matches(":focus-visible"),
        outlineStyle: getComputedStyle(el).outlineStyle,
        outlineColor: getComputedStyle(el).outlineColor,
      }));
      expect(focused.visible, `${buttonId} focus-visible`).toBe(true);
      expect(focused.outlineStyle).toBe("solid");
      expect(
        contrast(focused.outlineColor, colors.surface),
        `${buttonId} outlined focus ring`,
      ).toBeGreaterThanOrEqual(3);
    }

    await page.goto("http://localhost:4322/triggers/");
    const disabled = await page.evaluate(() => {
      const button = document.getElementById("nordic-inverse-disabled")!;
      const panel = button.parentElement!;
      return {
        ariaDisabled: button.getAttribute("aria-disabled"),
        color: getComputedStyle(button).color,
        background: getComputedStyle(button).backgroundColor,
        surface: getComputedStyle(panel).backgroundColor,
        borderStyle: getComputedStyle(button).borderTopStyle,
        opacity: getComputedStyle(button).opacity,
      };
    });
    expect(disabled.ariaDisabled).toBe("true");
    expect(disabled.opacity).toBe("1");
    expect(disabled.borderStyle).toBe("dashed");
    expect(
      contrast(disabled.color, disabled.surface),
      "disabled label vs inverse surface",
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(disabled.color, disabled.background),
      "disabled label vs its own fill",
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("OriginTabs, OriginSelect and OriginInput keep native semantics", async ({ page }) => {
    await page.goto("http://localhost:4322/triggers/");
    await expect(page.locator("#tab-two")).toHaveAttribute("aria-selected", "false");
    await page.locator("#tab-two").click();
    await expect(page.locator("#tab-two")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#panel-two")).toBeVisible();
    await expect(page.locator("#panel-one")).toBeHidden();

    await expect(page.locator('label[for="origin-select"]')).toBeVisible();
    await expect(page.locator("#origin-select")).toHaveAttribute("aria-describedby", "origin-select-hint");
    await expect(page.locator('label[for="origin-input"]')).toBeVisible();
    await expect(page.locator("#origin-input")).toHaveAttribute("required", "");
    await expect(page.locator("#origin-input")).toHaveAttribute("aria-describedby", "origin-input-hint");
  });

  test("OriginDialog and OriginPopover rely on native overlay semantics", async ({ page }) => {
    await page.goto("http://localhost:4322/triggers/");
    const dialog = page.locator("#origin-dialog-demo");

    await page.locator("#origin-dialog-trigger").click();
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((el) => (el as HTMLDialogElement).matches(":modal"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator("#origin-dialog-trigger")).toBeFocused();

    const popover = page.locator("#origin-popover-demo");
    await page.locator("#origin-popover-trigger").click();
    await expect(popover).toBeVisible();
    await expect(popover).toHaveAttribute("data-lsui-popover", "");
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
  });

  test("custom focus trap cycles Tab and dismisses on Escape/outside", async ({ page }) => {
    await page.goto("http://localhost:4322/triggers/");
    const layer = page.locator("#custom-layer");

    await page.locator("#open-custom-layer").click();
    await expect(layer).toBeVisible();
    await expect(page.locator("#custom-layer-first")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#custom-layer-last")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#custom-layer-first")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(layer).toBeHidden();
    await expect(page.locator("#open-custom-layer")).toBeFocused();

    await page.locator("#open-custom-layer").click();
    await expect(layer).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(layer).toBeHidden();
  });

  test("computed semantics survive consumer prop overrides", async ({ page }) => {
    await page.goto("http://localhost:4322/triggers/");
    const result = await page.evaluate(() => {
      const pick = (id: string) => {
        const el = document.getElementById(id)!;
        return {
          tag: el.tagName,
          role: el.getAttribute("role"),
          tabindex: el.getAttribute("tabindex"),
          ariaDisabled: el.getAttribute("aria-disabled"),
          simulated: el.hasAttribute("data-lsui-simulated-button"),
          href: el.getAttribute("href"),
        };
      };
      return {
        native: pick("override-native-btn"),
        simulated: pick("override-btn"),
        disabled: pick("override-disabled-btn"),
        link: pick("override-link-btn"),
      };
    });

    // Native button: conflicting role/tabindex are removed, not applied.
    expect(result.native.tag).toBe("BUTTON");
    expect(result.native.role).toBeNull();
    expect(result.native.tabindex).toBeNull();

    // Simulated button: computed role/tabindex win over consumer overrides.
    expect(result.simulated.tag).toBe("SPAN");
    expect(result.simulated.role).toBe("button");
    expect(result.simulated.tabindex).toBe("0");
    expect(result.simulated.simulated).toBe(true);

    // Disabled simulated button keeps aria-disabled and is out of tab order.
    expect(result.disabled.role).toBe("button");
    expect(result.disabled.tabindex).toBe("-1");
    expect(result.disabled.ariaDisabled).toBe("true");

    // Disabled link never becomes a button or gains an href.
    expect(result.link.tag).toBe("A");
    expect(result.link.role).toBe("link");
    expect(result.link.ariaDisabled).toBe("true");
    expect(result.link.href).toBeNull();
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

    // Verify brand logo (`TheFrontmatter.svg`) renders in top navbar
    const brandLogoSvg = page.locator("header a svg").first();
    await expect(brandLogoSvg).toHaveAttribute("viewBox", "0 0 251 251");
    await expect(brandLogoSvg.locator("path").first()).toHaveAttribute("fill", "#EE46DD");

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

    // Overview sidebar should show Overview -> Introduction & Platform Levels
    const desktopSidebar = page.locator("#desktop-sidebar");
    await expect(desktopSidebar.locator("summary", { hasText: "Overview" })).toBeVisible();
    await expect(desktopSidebar.getByRole("link", { name: "Introduction" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(desktopSidebar.getByRole("link", { name: "Platform Levels" })).toBeVisible();

    // Click "Origin" in top header nav -> sidebar switches to Origin (Level 1) > Core Goals of Origin + Catalog > OriginButton & OriginLink
    await headerTabs.getByRole("link", { name: "Origin" }).click();
    await expect(page).toHaveURL(/\/origin\/$/);
    await expect(
      desktopSidebar.getByRole("link", { name: "Introduction" }),
    ).toHaveCount(0);
    await expect(
      desktopSidebar.locator("summary", { hasText: "Origin (Level 1)" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.getByRole("link", { name: "Overview" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      desktopSidebar.getByRole("link", { name: "Core Goals of Origin" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.locator("summary", { hasText: "Catalog" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.getByRole("link", { name: "OriginButton" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.getByRole("link", { name: "OriginLink" }),
    ).toBeVisible();

    // Navigate via sidebar Core Goals & OriginButton links
    await desktopSidebar.getByRole("link", { name: "Core Goals of Origin" }).click();
    await expect(
      page.getByRole("heading", { name: "Core Goals of Origin", level: 1 }),
    ).toBeVisible();
    await desktopSidebar.getByRole("link", { name: "OriginButton" }).click();
    await expect(
      page.getByRole("heading", { name: "OriginButton", level: 1 }),
    ).toBeVisible();

    // Click "Liftoff" in top header nav -> sidebar switches to Liftoff (Level 2) > Core Goals of Liftoff + Catalog > Button & LinkButton
    await headerTabs.getByRole("link", { name: "Liftoff" }).click();
    await expect(page).toHaveURL(/\/liftoff\/$/);
    await expect(
      desktopSidebar.locator("summary", { hasText: "Liftoff (Level 2)" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.getByRole("link", { name: "Core Goals of Liftoff" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.locator("summary", { hasText: "Catalog" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.getByRole("link", { name: "Button", exact: true }),
    ).toBeVisible();
    await expect(
      desktopSidebar.getByRole("link", { name: "LinkButton", exact: true }),
    ).toBeVisible();

    await desktopSidebar.getByRole("link", { name: "Button", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Button", level: 1 }),
    ).toBeVisible();
    await expect(
      page.locator('[data-lsui-preview][data-theme="nordic light"] button[data-variant="primary"]'),
    ).toBeVisible();

    // Verify Landing & Apogee sidebars also scope cleanly to their own level + Core Goals + Catalog
    await headerTabs.getByRole("link", { name: "Landing" }).click();
    await expect(
      desktopSidebar.locator("summary", { hasText: "Landing (Level 3)" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.getByRole("link", { name: "Core Goals of Landing" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.locator("summary", { hasText: "Catalog" }),
    ).toBeVisible();

    await headerTabs.getByRole("link", { name: "Apogee" }).click();
    await expect(
      desktopSidebar.locator("summary", { hasText: "Apogee (Level 4)" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.getByRole("link", { name: "Core Goals of Apogee" }),
    ).toBeVisible();
    await expect(
      desktopSidebar.locator("summary", { hasText: "Catalog" }),
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
