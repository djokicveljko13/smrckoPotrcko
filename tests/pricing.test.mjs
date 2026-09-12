import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { deliveryPriceFromMeters, findShoppingStore, startFeeFromKm } = loadTypeScript("lib/pricing.ts");

test("start fee bands follow the agreed distance ranges", () => {
  assert.equal(startFeeFromKm(0), 100);
  assert.equal(startFeeFromKm(4.999), 100);
  assert.equal(startFeeFromKm(5), 200);
  assert.equal(startFeeFromKm(9.999), 200);
  assert.equal(startFeeFromKm(10), 300);
  assert.equal(startFeeFromKm(15), 300);
  assert.equal(startFeeFromKm(15.001), 400);
});

// Ulazi su metri iz Routes API-ja. Očekivanja su start + 80 × km.
const cases = [
  { meters: 0, expected: 100 },
  { meters: 1600, expected: 228 },
  { meters: 3700, expected: 396 },
  { meters: 4999, expected: 500 },
  { meters: 5000, expected: 600 },
  { meters: 5875, expected: 670 },
  { meters: 9999, expected: 1000 },
  { meters: 10000, expected: 1100 },
  { meters: 10875, expected: 1170 },
  { meters: 15000, expected: 1500 },
  { meters: 15001, expected: 1600 },
  { meters: 16000, expected: 1680 },
];

for (const { meters, expected } of cases) {
  test(`${meters} m -> ${expected} din`, () => {
    assert.equal(deliveryPriceFromMeters(meters), expected);
  });
}

test("shopping store prices are fixed by chain", () => {
  assert.equal(findShoppingStore("maxi")?.price, 500);
  assert.equal(findShoppingStore("lidl")?.price, 1000);
  assert.equal(findShoppingStore("unknown"), null);
});
