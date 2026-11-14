import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Separate real browser sessions should not share the per-instance test IP bucket.
test.beforeEach(async ({ context }, testInfo) => {
  await context.setExtraHTTPHeaders({
    "x-forwarded-for": `e2e-${testInfo.project.name}-${testInfo.workerIndex}`,
  });
});

test("landing, every builder step, and workout have no automated WCAG A/AA violations", async ({
  page,
}) => {
  test.setTimeout(60_000);
  // Check settled states, not the intentional 250 ms opacity transition between steps.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const audit = async (selector?: string) => {
    let scanner = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]);
    if (selector) scanner = scanner.include(selector);
    const results = await scanner.analyze();
    expect(results.violations).toEqual([]);
  };
  await audit();
  for (let step = 1; step < 5; step++) {
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await audit("#builder");
  }
  await page.getByRole("button", { name: "Generate My Workout", exact: true }).click();
  await page.waitForURL("**/workout");
  await audit();
  await page.getByRole("button", { name: "Start Workout", exact: true }).first().click();
  await page.getByRole("checkbox").first().check();
  await audit();
});
