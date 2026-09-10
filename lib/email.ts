import "server-only";

export async function sendPartnershipEmail(input: {
  company: string;
  phone: string;
  message: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Šmrčko Potrčko <onboarding@resend.dev>";
  const to = process.env.PARTNERSHIP_EMAIL_TO?.trim();
  if (!apiKey || !to) {
    console.warn("Partnership email configuration is missing.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Upit za saradnju — ${input.company.replace(/[\r\n]/g, " ")}`,
        text: [
          `Firma: ${input.company}`,
          `Telefon: ${input.phone}`,
          "",
          `Poruka: ${input.message || "Nije navedena."}`,
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.warn("Resend rejected partnership email:", response.status);
      return false;
    }
    const result: unknown = await response.json();
    return typeof result === "object" && result !== null && "id" in result &&
      typeof result.id === "string" && result.id.length > 0;
  } catch {
    // Ne ispisujemo ključ ili lične podatke iz upita u log.
    console.warn("Partnership email request failed.");
    return false;
  }
}
