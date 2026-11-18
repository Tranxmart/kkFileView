// Copyright 2026 Tranxmart, Inc. All rights reserved.
import { mkdir } from 'node:fs/promises';
import { test, expect, type Locator } from '@playwright/test';

const fixtures = process.env.FIXTURE_BASE_URL || 'http://checks:18080';
const encoded = (url: string) => Buffer.from(url).toString('base64');

async function expectDrawnCanvas(canvas: Locator) {
  await expect(canvas).toBeVisible();
  await expect.poll(async () => canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement;
    if (!element.width || !element.height) return false;
    const pixels = element.getContext('2d')!.getImageData(0, 0, element.width, element.height).data;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 0 && pixels[i] < 200 && pixels[i + 1] < 200 && pixels[i + 2] < 200) return true;
    }
    return false;
  })).toBe(true);
}

test.beforeAll(async ({ request }) => {
  for (const suffix of ['pdf', 'docx', 'pptx', 'xlsx']) {
    await expect.poll(async () =>
      (await request.get(fixtures + '/txm.' + suffix)).status(),
    ).toBe(200);
  }
  await mkdir('/artifacts/screenshots', { recursive: true });
});

for (const suffix of ['pdf', 'docx', 'pptx']) {
  test(suffix + ': document bytes render in PDF.js', async ({ page }) => {
    const query = new URLSearchParams({
      url: encoded(fixtures + '/txm.' + suffix),
      officePreviewType: 'pdf',
    });
    await page.goto('/onlinePreview?' + query);
    const viewer = page.frameLocator('#pdfFrame');
    const text = viewer.locator('.textLayer').first();
    await expect(text).toContainText(suffix === 'pdf' ? 'TXM PDF fixture' : 'TXM packaging');
    if (suffix !== 'pdf') {
      await expect.poll(async () => (await text.innerText()).replace(/\s/g, ''))
        .toContain('中文文档预览');
    }
    const canvas = viewer.locator('.page canvas').first();
    await expectDrawnCanvas(canvas);
    await page.screenshot({ path: '/artifacts/screenshots/' + suffix + '.png' });
  });
}

test('xlsx: workbook cells load and the sheet is drawn', async ({ page }) => {
  await page.goto('/onlinePreview?' + new URLSearchParams({
    url: encoded(fixtures + '/txm.xlsx'),
  }));
  await expect(page.locator('#loading-overlay')).toBeHidden();
  await expect(page.locator('#error-message')).toBeHidden();
  await expect.poll(async () => page.evaluate(() => {
    const sheet = (window as any).luckysheet?.getAllSheets?.()[0];
    return [sheet?.data?.[0]?.[0]?.v, sheet?.data?.[0]?.[1]?.v, sheet?.data?.[1]?.[0]?.v];
  })).toEqual(['TXM packaging', '中文文档预览', '42']);
  await expectDrawnCanvas(page.locator('#luckysheetTableContent'));
  await page.screenshot({ path: '/artifacts/screenshots/xlsx.png' });
});

test('packaged defaults: uploads stay disabled and untrusted sources are rejected', async ({ request }) => {
  // Check the effective external configuration after rendering the documents.
  const upload = await request.post('/fileUpload', {
    multipart: { file: { name: 'disabled.txt', mimeType: 'text/plain', buffer: Buffer.from('owned test fixture') } },
  });
  expect(await upload.text()).toContain('文件上传接口已禁用');
  for (const path of [
    '/onlinePreview?url=' + encodeURIComponent(encoded('http://blocked.invalid/secret.pdf')),
    '/getCorsFile?urlPath=' + encodeURIComponent(encoded('http://blocked.invalid/secret.pdf')),
  ]) {
    expect(await (await request.get(path)).text()).toMatch(/不受信任|不信任/);
  }
  const health = await request.get('/actuator/health');
  expect(await health.json()).toEqual({ status: 'UP' });
  expect((await request.get('/actuator/env')).status()).toBe(404);
});
