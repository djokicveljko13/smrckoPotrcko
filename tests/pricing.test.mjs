import assert from "node:assert/strict";
import test from "node:test";
import { deliveryPriceFromMeters } from "../lib/pricing.ts";

// Ulazi su metri iz Routes API-ja. Očekivanja su iz dogovorenog cenovnika.
const cases = [
  { meters: 0, rounded: 30, expected: 180 },
  { meters: 125, rounded: 40, expected: 180 },
  { meters: 126, rounded: 50, expected: 200 },
  { meters: 250, rounded: 50, expected: 200 },
  { meters: 251, rounded: 60, expected: 200 },
  { meters: 1500, rounded: 150, expected: 200 },
  { meters: 1501, rounded: 160, expected: 220 },
  { meters: 2125, rounded: 200, expected: 220 },
  { meters: 2126, rounded: 210, expected: 220 },
  { meters: 2375, rounded: 220, expected: 220 },
  { meters: 2376, rounded: 230, expected: 250 },
  { meters: 2625, rounded: 240, expected: 250 },
  { meters: 2750, rounded: 250, expected: 250 },
  { meters: 2751, rounded: 260, expected: 300 },
  { meters: 3700, rounded: 330, expected: 300 },
  { meters: 5875, rounded: 500, expected: 300 },
  { meters: 10875, rounded: 900, expected: 300 },
];

for (const { meters, rounded, expected } of cases) {
  test(`${meters} m: rounded basis ${rounded} -> final ${expected} din`, () => {
    assert.equal(deliveryPriceFromMeters(meters), expected);
  });
}
