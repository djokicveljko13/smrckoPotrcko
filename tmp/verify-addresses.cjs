const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('../node_modules/typescript');
const { chromium } = require('C:/Users/Win11/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const compiled = ts.transpileModule(fs.readFileSync('lib/serbian-latin.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const scope = { exports: {} };
vm.runInNewContext(compiled.outputText, scope);
for (const [source, expected] of [
  ['Кнеза Милоша 24, Јагодина, Србија', 'Kneza Miloša 24, Jagodina, Srbija'],
  ['Љубљана, Његошева, Џорџа', 'Ljubljana, Njegoševa, Džordža'],
  ['ЊЕГОШЕВА, ЉУБЉАНА, ЏОРЏА', 'NJEGOŠEVA, LJUBLJANA, DŽORDŽA'],
  ['Đure Jakšića 12 / стан 2', 'Đure Jakšića 12 / stan 2'],
]) assert.equal(scope.exports.toSerbianLatin(source), expected);

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
    const pickup = page.getByLabel('Odakle preuzimamo?', { exact: true });
    const destination = page.getByLabel('Gde donosimo?', { exact: true });
    const suggestions = page.locator('form ul button');
    await pickup.fill('Kneza Milosa Jagodina');
    await suggestions.first().waitFor({ state: 'visible' });
    const pickupSuggestions = await suggestions.allTextContents();
    assert(pickupSuggestions.length > 0);
    assert(pickupSuggestions.every(text => !/\p{Script=Cyrillic}/u.test(text)));
    await page.screenshot({ path: 'tmp/pickup-addresses.png', fullPage: true });
    await suggestions.first().click();
    const chosenPickup = await pickup.inputValue();
    assert.equal(chosenPickup, pickupSuggestions[0]);
    assert.equal(await page.locator('input[name="place_id"]').count(), 1);
    assert.equal(await page.locator('input[name="place_id"]').inputValue(), '');

    await destination.fill('Његошева Јагодина');
    await suggestions.first().waitFor({ state: 'visible' });
    const destinationSuggestions = await suggestions.allTextContents();
    assert(destinationSuggestions.every(text => !/\p{Script=Cyrillic}/u.test(text)));
    await suggestions.first().click();
    assert.equal(await destination.inputValue(), destinationSuggestions[0]);
    assert.equal(await pickup.inputValue(), chosenPickup);
    const destinationId = await page.locator('input[name="place_id"]').inputValue();
    assert(destinationId.length > 0);
    await pickup.fill('Adresa preuzimanja po dogovoru');
    await page.getByLabel('Broj telefona', { exact: true }).focus();
    assert.equal(await page.locator('input[name="place_id"]').inputValue(), destinationId);
    await destination.fill('Nova adresa');
    assert.equal(await page.locator('input[name="place_id"]').inputValue(), '');

    await page.setViewportSize({ width: 390, height: 844 });
    await pickup.fill('Kneza Milosa Jagodina');
    await suggestions.first().waitFor({ state: 'visible' });
    await pickup.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tmp/mobile-addresses.png', fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await suggestions.first().click();
    assert.equal(await pickup.inputValue(), pickupSuggestions[0]);
    assert.equal(await page.locator('form ul').count(), 0);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({
      passed: ['transliteration', 'real Google pickup suggestions', 'Cyrillic query gives Latin suggestions', 'independent fields', 'one destination place_id', 'editing clears only destination ID', 'mobile choice and no overflow', 'no browser errors'],
      pickupSuggestions, destinationSuggestions,
    }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
