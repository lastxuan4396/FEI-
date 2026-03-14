#!/usr/bin/env node
const { chromium } = require('playwright');

const url = process.argv[2] || 'http://127.0.0.1:4173/index.html';

async function clickScore(page, score = 4) {
  const button = page.locator(`#qualityRow button[data-score=\"${score}\"]`).first();
  await button.waitFor({ state: 'visible', timeout: 3000 });
  await button.click();
}

async function fillAndNext(page, selector, value, score = 4) {
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: 3000 });
  await page.locator(selector).first().fill(value);
  await clickScore(page, score);
  await page.click('#nextBtn');
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.setDefaultTimeout(7000);

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    errors.push(String(err));
  });
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.locator('#startBtn').waitFor({ state: 'visible', timeout: 5000 });

    await page.click('#startBtn');
    await page.locator('#screenSession.active').waitFor({ state: 'visible', timeout: 5000 });

    // Step 1 -> Step 2
    await page.click('#nextBtn');

    // Step 2 A事实
    await fillAndNext(page, 'textarea[data-bind="factA"]', '昨晚我们约好沟通，但你较晚回复而且没有提前告知，我会紧张和不安。', 4);

    // Step 3 B复述 (故意给低分，验证改写建议)
    await fillAndNext(page, 'textarea[data-bind="reflectB"]', '我听到你在意的是晚回复和缺少提前说明。', 1);

    // Step 4 B事实
    await fillAndNext(page, 'textarea[data-bind="factB"]', '我当时在开会手机静音，结束后才看到消息，不是有意忽略你。', 4);

    // Step 5 A复述
    await fillAndNext(page, 'textarea[data-bind="reflectA"]', '我听到你不是故意不回，而是场景导致没法及时回复。', 4);

    // Step 6 感受与需要
    await page.locator('.chip[data-field="feelingsA"]').first().click();
    await page.locator('.chip[data-field="needsA"]').first().click();
    await page.locator('.chip[data-field="feelingsB"]').first().click();
    await page.locator('.chip[data-field="needsB"]').first().click();
    await clickScore(page, 4);
    await page.click('#nextBtn');

    // Step 7 双向请求
    await page.locator('textarea[data-bind="requestA"]').fill('如果你会晚于半小时，请先发一句在忙稍后回我。');
    await page.locator('textarea[data-bind="requestB"]').fill('如果你着急，可以先发看到后回复提醒，我会优先处理。');
    await clickScore(page, 4);
    await page.click('#nextBtn');

    // Step 8 收尾
    await page.locator('textarea[data-bind="peaceLine"]').fill('我们先把事实和感受对齐，再一起做今晚行动。');
    await page.locator('textarea[data-bind="tonightAction"]').fill('今晚23点前互发一句确认与感谢。');
    await clickScore(page, 4);
    await page.click('#nextBtn');

    await page.locator('#screenResult.active').waitFor({ state: 'visible', timeout: 5000 });
    const shareText = (await page.locator('#shareCardText').inputValue()).trim();
    if (!shareText.includes('12分钟和好记录')) {
      throw new Error('Result share card text missing expected marker');
    }

    const rewriteCount = await page.locator('#resultRewriteList [data-rewrite-index]').count();
    if (rewriteCount < 1) {
      throw new Error('Rewrite suggestion not generated for low-score step');
    }

    if (errors.length) {
      throw new Error(`Browser console/page errors:\n${errors.join('\n')}`);
    }

    console.log('PASS: Playwright smoke flow succeeded');
  } finally {
    await page.close({ runBeforeUnload: false }).catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

run().catch((err) => {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
});
