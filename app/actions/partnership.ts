"use server";

import { sendPartnershipEmail } from "@/lib/email";

export type PartnershipState =
  | { status: "ok" }
  | { status: "error"; message: string }
  | null;

function readString(input: FormData, key: string): string {
  const value = input.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitPartnership(input: FormData): Promise<PartnershipState> {
  // Skriveno polje hvata jednostavne botove koji popunjavaju svako polje.
  if (readString(input, "website")) return { status: "ok" };

  const company = readString(input, "company");
  const phone = readString(input, "phone");
  const message = readString(input, "message");
  if (!company || company.length > 200) {
    return { status: "error", message: "Unesite naziv firme, do 200 znakova." };
  }
  if (phone.length < 6 || phone.length > 40) {
    return { status: "error", message: "Unesite telefon od 6 do 40 znakova." };
  }
  if (message.length > 1000) {
    return { status: "error", message: "Poruka može imati najviše 1000 znakova." };
  }

  const sent = await sendPartnershipEmail({ company, phone, message });
  return sent
    ? { status: "ok" }
    : { status: "error", message: "Slanje upita nije potvrđeno. Pokušajte ponovo ili nas pozovite." };
}
