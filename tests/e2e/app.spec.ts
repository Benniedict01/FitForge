import { expect, test } from "@playwright/test";
import sharp from "sharp";

async function syntheticBoardScreenshot() {
  const width = 320;
  const height = 480;
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;
      let rgb = [34, 39, 36];
      if (x >= 42 && x < 274 && y >= 113 && y < 345) {
        const file = Math.floor(((x - 42) / 232) * 8);
        const rank = Math.floor(((y - 113) / 232) * 8);
        rgb = (file + rank) % 2 === 0 ? [226, 218, 190] : [91, 124, 92];
      }
      raw[index] = rgb[0];
      raw[index + 1] = rgb[1];
      raw[index + 2] = rgb[2];
    }
  }
  return sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
}

test("landing page links into the analysis workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /See the board/i })).toBeVisible();
  await page.getByRole("link", { name: /Analyze a position/i }).click();
  await expect(page).toHaveURL(/\/analyze$/);
  await expect(page.getByRole("heading", { name: /Build the position/i })).toBeVisible();
});

test("sample position receives a real Stockfish analysis", async ({ page }) => {
  await page.goto("/analyze?sample=mate-in-one");
  const analyze = page.getByRole("button", { name: /Analyze position/i });
  await expect(analyze).toBeEnabled({ timeout: 5_000 });
  await analyze.click();
  await expect(page.getByText("BEST MOVE")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Stockfish 19 Lite WASM")).toBeVisible();
});

test("screenshot position requires explicit review before Stockfish analysis", async ({ page }) => {
  await page.goto("/analyze");
  await page.getByLabel("Choose a chess screenshot").setInputFiles({
    name: "board.png",
    mimeType: "image/png",
    buffer: await syntheticBoardScreenshot(),
  });
  await expect(page.getByText(/Board outline found/)).toBeVisible({ timeout: 10_000 });

  const confirm = page.getByRole("button", { name: /Confirm position/ });
  await expect(confirm).toBeDisabled();
  const board = page.getByRole("grid", { name: "Editable chess position" });
  await board.getByRole("button", { name: "h8, Empty" }).click();
  await page.getByRole("button", { name: "Black king" }).click();
  await board.getByRole("button", { name: "f6, Empty" }).click();
  await page.getByRole("button", { name: "White king" }).click();
  await board.getByRole("button", { name: "g6, Empty" }).click();
  await page.getByRole("button", { name: "White queen" }).click();

  await expect(confirm).toBeDisabled();
  await page.getByLabel(/I reviewed this position against the screenshot/).check();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  const analyze = page.getByRole("button", { name: /Analyze position/i });
  await expect(analyze).toBeEnabled();
  await analyze.click();
  await expect(page.getByText("BEST MOVE")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".move-san")).toHaveText("Qg7#");
});

test("mobile workspace has no horizontal page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/analyze?sample=opening");
  await expect(page.getByRole("heading", { name: /Build the position/i })).toBeVisible();
  const widths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});
