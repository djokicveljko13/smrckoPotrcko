import { suggestAddresses } from "@/lib/google/places";

// nodejs (ne edge): koristimo server env (GOOGLE_MAPS_API_KEY) i običan fetch.
export const runtime = "nodejs";

/**
 * Most između browsera i Google-a. Browser POST-uje { input }, mi Google-u
 * šaljemo zahtev sa ključem koji nikad ne napušta server, i vraćamo samo
 * [{ placeId, text }].
 *
 * Minimum 3 znaka i gornja granica dužine na serveru — da neko skriptom ne
 * napravi 10.000 poziva jednim reqom.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ suggestions: [] });
  }

  const input =
    body && typeof body === "object" && "input" in body
      ? (body as { input?: unknown }).input
      : null;

  if (typeof input !== "string") {
    return Response.json({ suggestions: [] });
  }

  const query = input.trim();
  if (query.length < 3 || query.length > 120) {
    return Response.json({ suggestions: [] });
  }

  const suggestions = await suggestAddresses(query);
  return Response.json({ suggestions });
}
