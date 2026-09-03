import { googleMapsApiKey } from "@/lib/google/env";
import { asFiniteNumber, asObject } from "@/lib/google/json";
import { PICKUP } from "@/lib/pricing";

const ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";

/**
 * Vozna razdaljina firma → kupac, u metrima.
 *
 * Kupac je `placeId` koji je izabrao iz Places liste — Routes ga sam pretvori u
 * koordinate, pa nam ne trebaju ni Geocoding ni koordinate kupca.
 *
 * Vraća null na SVAKI problem (nema ključa, Google greška, nema rute, timeout).
 * Pozivalac tada upiše porudžbinu sa `delivery_price = NULL` — bolje porudžbina
 * bez cene nego izgubljena porudžbina.
 */
export async function computeDistanceMeters(
  placeId: string,
): Promise<number | null> {
  const key = googleMapsApiKey();
  if (!key || !placeId) return null;

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        // Obavezno: bez FieldMask-a Routes vraća 400. Tražimo samo taj jedan broj.
        "X-Goog-FieldMask": "routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: PICKUP.latitude,
              longitude: PICKUP.longitude,
            },
          },
        },
        destination: { placeId },
        travelMode: "DRIVE",
        // TRAFFIC_UNAWARE = ne računaj gužvu → ostajemo u Essentials SKU-u.
        routingPreference: "TRAFFIC_UNAWARE",
        units: "METRIC",
      }),
      // Isti obrazac kao lib/telegram.ts: ne blokiraj slanje forme unedogled.
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Routes API failed", response.status, detail);
      return null;
    }

    const data: unknown = await response.json();
    return firstRouteDistanceMeters(data);
  } catch (error) {
    console.error("computeDistanceMeters failed", error);
    return null;
  }
}

/**
 * Google oblik:  { routes: [ { distanceMeters: 563 } ] }
 * Iščupa routes[0].distanceMeters, ili null ako bilo koji korak fali.
 */
function firstRouteDistanceMeters(data: unknown): number | null {
  const routes = asObject(data)?.routes;
  if (!Array.isArray(routes) || routes.length === 0) return null;

  return asFiniteNumber(asObject(routes[0])?.distanceMeters);
}
