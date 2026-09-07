import { googleMapsApiKey } from "@/lib/google/env";
import { asObject, asText } from "@/lib/google/json";
import { PICKUP } from "@/lib/pricing";
import { toSerbianLatin } from "@/lib/serbian-latin";

const ENDPOINT = "https://places.googleapis.com/v1/places:autocomplete";

/** Jedan predlog adrese: ono što kupac vidi + ID koji šaljemo Routes-u. */
type GoogleSuggestion = {
  placeId: string;
  text: string;
};

/**
 * Prazna lista znači da nema rezultata; null znači da servis nije dostupan.
 *
 * `includedRegionCodes: ["rs"]` + `locationBias` krug ~30 km oko Jagodine: da se
 * prednost imaju lokalni rezultati (krug nije stroga granica pretrage).
 */
export async function suggestAddresses(
  input: string,
): Promise<GoogleSuggestion[] | null> {
  const key = googleMapsApiKey();
  const query = input.trim();
  if (!key) return null;
  if (query.length < 3) return [];

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        // Za autocomplete FieldMask nije obavezan, ali njime tražimo samo dva
        // polja umesto celog objekta (adresa, tipovi, jezik…).
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
      },
      body: JSON.stringify({
        input: query,
        includedRegionCodes: ["rs"],
        locationBias: {
          circle: {
            center: { latitude: PICKUP.latitude, longitude: PICKUP.longitude },
            radius: 30_000.0,
          },
        },
        languageCode: "sr-Latn",
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      console.error("Places autocomplete failed", response.status);
      return null;
    }

    const data: unknown = await response.json();
    return parseSuggestions(data);
  } catch (error) {
    console.error("suggestAddresses failed", error instanceof Error ? error.name : "unknown");
    return null;
  }
}

/**
 * Google oblik (proveravamo ga korak po korak, jer je JSON od tuđeg servera):
 *   { suggestions: [ { placePrediction: { placeId: "…", text: { text: "…" } } } ] }
 */
function parseSuggestions(data: unknown): GoogleSuggestion[] | null {
  const root = asObject(data);
  if (!root) return null;
  const list = root.suggestions;
  if (list === undefined) return [];
  if (!Array.isArray(list)) return null;

  const out: GoogleSuggestion[] = [];

  for (const item of list) {
    const prediction = asObject(asObject(item)?.placePrediction);
    if (!prediction) continue;

    const placeId = asText(prediction.placeId);
    const label = asText(asObject(prediction.text)?.text);

    if (placeId && label) {
      out.push({ placeId, text: toSerbianLatin(label) });
    }
  }

  return out;
}
