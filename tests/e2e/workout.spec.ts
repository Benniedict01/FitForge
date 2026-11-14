import { expect, test } from "@playwright/test";

// Separate real browser sessions should not share the per-instance test IP bucket.
test.beforeEach(async ({ context }, testInfo) => {
  await context.setExtraHTTPHeaders({
    "x-forwarded-for": `e2e-${testInfo.project.name}-${testInfo.workerIndex}`,
  });
});

test("bodyweight builder → rest timer → persisted progress → completion", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Build Your");
  await page.getByRole("link", { name: "Build My Workout", exact: true }).click();
  await page.getByRole("radio", { name: "Chest", exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "Bodyweight", exact: false }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "Beginner", exact: false }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "General Fitness", exact: false }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "15 minutes", exact: true }).check();
  await page.getByRole("button", { name: "Generate My Workout", exact: true }).click();
  await page.waitForURL("**/workout");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chest Foundations");
  expect(
    (await page.locator(".exercise-tags").allTextContents()).every(
      (text) => !/Dumbbells|Barbell|Machines|Cable/.test(text),
    ),
  ).toBe(true);
  await expect(page.locator(".workout-source")).toContainText("exercise library");
  await expect(page.getByRole("checkbox").first()).toBeDisabled();
  await page.getByRole("button", { name: "Start Workout", exact: true }).first().click();
  await page.getByRole("checkbox").first().check();
  await expect(page.getByRole("timer", { name: "Rest time remaining" })).toBeVisible();
  const firstTimer = await page.getByRole("timer").innerText();
  await page.getByRole("button", { name: "15 seconds", exact: false }).click();
  const addedTimer = await page.getByRole("timer").innerText();
  expect(addedTimer > firstTimer).toBe(true);
  await page.reload();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page.getByRole("button", { name: "Skip rest", exact: true }).click();
  await expect(page.getByRole("timer")).toHaveCount(0);
  const checkboxes = page.getByRole("checkbox");
  const count = await checkboxes.count();
  for (let index = 1; index < count - 1; index++) await checkboxes.nth(index).check();
  // The final checkbox unmounts immediately as the completion screen replaces it.
  // Click (rather than check's post-click checked-state assertion) verifies that transition.
  await checkboxes.last().click();
  await expect(page.getByRole("heading", { name: "Workout Complete", exact: false })).toBeVisible();
  await expect(page.locator(".completion-stats > div").nth(1).locator("strong")).toHaveText(
    String(count),
  );
  await page.reload();
  await expect(page.getByRole("heading", { name: "Workout Complete", exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Generate Another Workout", exact: false }).click();
  await expect(page.locator("#builder-title")).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("dumbbell selection, back navigation, and API validation", async ({ page, request }) => {
  await page.goto("/#builder");
  await page.getByRole("radio", { name: "Legs", exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "Dumbbells", exact: false }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Dumbbells", exact: false })).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "Intermediate", exact: false }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "Strength", exact: false }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "30 minutes", exact: true }).check();
  await page.getByRole("button", { name: "Generate My Workout", exact: true }).click();
  await page.waitForURL("**/workout");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Legs Strength Session");
  await expect(page.locator(".exercise-tags").first()).toContainText("Dumbbells");
  const workout = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fitforge:workout:v1") || "{}"),
  );
  expect(
    workout.exercises.every((e: { equipment: string }) =>
      ["Dumbbells", "Bodyweight"].includes(e.equipment),
    ),
  ).toBe(true);
  expect(workout.estimatedDuration).toBeLessThanOrEqual(30);
  const response = await request.post("/api/generate-workout", {
    data: { ...workout.preferences, equipment: "invented" },
  });
  expect(response.status()).toBe(400);
  const malformed = await request.post("/api/generate-workout", {
    headers: { "Content-Type": "application/json" },
    data: "not json",
  });
  expect(malformed.status()).toBe(400);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("empty state, menu, and every builder step fit a phone", async ({ page, isMobile }) => {
  await page.goto("/workout");
  await expect(page.getByRole("heading", { name: "Your next workout is waiting." })).toBeVisible();
  await page.getByRole("link", { name: "Build My Workout", exact: true }).click();
  for (let step = 0; step < 5; step++) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (step < 4) await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "How it works" })
      .click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
  }
});
