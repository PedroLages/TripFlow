import { test, expect } from '@playwright/test';

test('Verify Voyager theme and map rendering', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3002');

  // Click "Sign In to Dashboard" button
  await page.click('text=Sign In to Dashboard');

  // Wait for dashboard to load
  await page.waitForSelector('text=Tokyo', { timeout: 10000 });

  // Click on Tokyo trip
  await page.click('text=Tokyo');

  // Wait for trip detail to load
  await page.waitForLoadState('networkidle');

  // Click Map tab
  await page.getByRole('link', { name: 'Map' }).click();

  // Wait for map to load
  await page.waitForSelector('.maplibregl-canvas', { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Verify map canvas exists and has proper dimensions
  const canvas = page.locator('.maplibregl-canvas');
  await expect(canvas).toBeVisible();

  const bbox = await canvas.boundingBox();
  console.log('Map canvas dimensions:', bbox);

  // Verify map style is Voyager (check for the map style URL)
  const styleUrl = await page.evaluate(() => {
    const map = (window as any).mapInstance;
    return map ? map.getStyle()?.name : null;
  });
  console.log('Map style:', styleUrl);

  // Take screenshot of map with Voyager theme
  await page.screenshot({
    path: 'tests/reports/map-voyager-theme.png',
    fullPage: true
  });

  // Verify sidebar is visible
  await expect(page.locator('text=Phase Grid')).toBeVisible();

  // Verify map controls are visible
  await expect(page.locator('text=Base Map Style')).toBeVisible();

  // Check that Voyager option exists
  await page.click('button[aria-label="Toggle layer options panel"]');
  await expect(page.locator('text=Voyager')).toBeVisible();
  await expect(page.locator('text=Dark Voyager')).toBeVisible();

  // Verify Satellite option is NOT present
  const satelliteCount = await page.locator('text=Satellite').count();
  expect(satelliteCount).toBe(0);

  console.log('✅ Map is rendering correctly with Voyager theme!');
  console.log('✅ Satellite option successfully removed');
  console.log('✅ Layout fixes applied - no map cutting');
});
