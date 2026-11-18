// Copyright 2026 Tranxmart, Inc. All rights reserved.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'preview.spec.ts',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  workers: 1,
  retries: 0,
  outputDir: '/artifacts/results',
  reporter: [['list'], ['html', { outputFolder: '/artifacts/html', open: 'never' }]],
  use: {
    baseURL: process.env.KK_BASE_URL || 'http://viewer:8012',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 900 },
  },
});
