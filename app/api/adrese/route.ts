import { suggestAddresses } from "@/lib/google/places";
import { signOrderValue } from "@/lib/order-signing";

export const runtime = "nodejs";

/** Browser dobija Google predloge i dokaz da njihov ID i tekst dolaze od servera. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: "error", suggestions: [] }, { status: 400 });
  }
  const input = body && typeof body === "object" && "input" in body ? body.input : null;
  if (typeof input !== "string") {
    return Response.json({ status: "error", suggestions: [] }, { status: 400 });
  }
  const query = input.trim();
  if (query.length < 3 || query.length > 120) {
    return Response.json({ status: "ok", suggestions: [] });
  }
  try {
    const suggestions = await suggestAddresses(query);
    if (suggestions === null) throw new Error("Places unavailable");
    return Response.json({
      status: "ok",
      suggestions: suggestions.map((suggestion) => ({
        ...suggestion,
        proof: signOrderValue("place", suggestion),
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Address suggestions unavailable");
    return Response.json({ status: "error", suggestions: [] }, { status: 503 });
  }
}
