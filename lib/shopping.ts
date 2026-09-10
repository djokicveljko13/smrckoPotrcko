/** Pravila liste za kupovinu — bez baze i bez potpisa. */

export const MAX_SHOPPING_ITEMS = 30;
export const MAX_ITEM_LEN = 120;
export const MAX_SHOPPING_NOTE = 500;
export const MAX_SHOPPING_TITLE = 500;

/** Ukloni prazne, skraćuj preko limita, zadrži redosled. */
export function normalizeItems(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const items: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") return null;
    const text = entry.trim();
    if (!text) continue;
    if (text.length > MAX_ITEM_LEN) return null;
    items.push(text);
  }
  if (items.length < 1 || items.length > MAX_SHOPPING_ITEMS) return null;
  return items;
}

/** Sažetak za orders.title — tabla i Telegram imaju jednu čitljivu liniju. */
export function buildShoppingTitle(items: string[]): string {
  const joined = items.join(", ");
  const head = `Kupovina (${items.length}): ${joined}`;
  if (head.length <= MAX_SHOPPING_TITLE) return head;
  return `${head.slice(0, MAX_SHOPPING_TITLE - 1)}…`;
}
