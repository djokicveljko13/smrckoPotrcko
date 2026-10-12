/**
 * Link koji otvara Google Maps na jednom mestu. Javni format, bez API ključa,
 * pa ne troši Places/Routes kvotu. Na telefonu otvara aplikaciju ako postoji.
 *
 * placeId ima prednost: Google koristi tekst samo ako ne nađe mesto po ID-u.
 * null = nema šta da se traži.
 */
export function googleMapsUrl(
  text: string,
  placeId?: string | null,
): string | null {
  const query = text.trim();
  if (!query) return null;

  const params = new URLSearchParams({ api: "1", query });
  const id = placeId?.trim();
  if (id) params.set("query_place_id", id);

  return `https://www.google.com/maps/search/?${params}`;
}
