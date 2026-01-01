import { test, expect } from '@playwright/test';

test('Debug map rendering', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:3002');

  // Wait for app to load
  await page.waitForLoadState('networkidle');

  // Click on the first trip
  await page.click('text=Kyoto Cultural Experience');

  // Wait for trip detail to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Click on Map tab
  await page.click('text=Map');

  // Wait for map to potentially load
  await page.waitForTimeout(3000);

  // Take a screenshot
  await page.screenshot({ path: 'debug-map-screenshot.png', fullPage: true });

  // Check console errors
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
    }
  });

  // Log map canvas state
  const mapCanvas = await page.locator('.maplibregl-canvas').count();
  console.log('Map canvas count:', mapCanvas);

  if (mapCanvas > 0) {
    const canvasBox = await page.locator('.maplibregl-canvas').boundingBox();
    console.log('Canvas dimensions:', canvasBox);
  }

  // Check for map container
  const mapContainer = await page.locator('.maplibregl-map').count();
  console.log('Map container count:', mapContainer);
});
