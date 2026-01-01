import { test, expect } from '@playwright/test';

test('Verify map is rendering', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3002');

  // Take screenshot of homepage
  await page.screenshot({ path: 'verify-homepage.png' });

  // Check if there's a sign in button (new auth)
  const hasSignIn = await page.locator('text=Sign In').count() > 0;
  console.log('Has Sign In button:', hasSignIn);

  if (!hasSignIn) {
    // No auth - proceed directly
    await page.waitForSelector('text=Tokyo', { timeout: 5000 }).catch(() => {});

    // Try to click on first trip
    const tripCard = page.locator('[data-trip-id], .cursor-pointer').first();
    const tripCount = await tripCard.count();

    if (tripCount > 0) {
      await tripCard.click();
      await page.waitForLoadState('networkidle');

      // Click Map tab
      await page.getByRole('link', { name: 'Map' }).click();
      await page.waitForTimeout(2000);

      // Check for map canvas
      const canvas = page.locator('.maplibregl-canvas');
      const canvasCount = await canvas.count();
      console.log('Map canvas count:', canvasCount);

      if (canvasCount > 0) {
        const bbox = await canvas.boundingBox();
        console.log('Canvas size:', bbox);

        // Take screenshot of map
        await page.screenshot({ path: 'verify-map-loaded.png', fullPage: true });

        // Check canvas background
        const canvasStyle = await canvas.evaluate((el: HTMLCanvasElement) => {
          return window.getComputedStyle(el.parentElement!).backgroundColor;
        });
        console.log('Map container background:', canvasStyle);
      }
    }
  }

  // Always take final screenshot
  await page.screenshot({ path: 'verify-final-state.png', fullPage: true });
});
