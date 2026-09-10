"use client";

import { useRef, useState } from "react";
import { submitPartnership, type PartnershipState } from "@/app/actions/partnership";
import { DISPLAY_PHONE, TEL_URL } from "@/lib/contact";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";

export function PartnershipForm() {
  const [state, setState] = useState<PartnershipState>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  async function send(input: FormData) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setState(null);
    try {
      setState(await submitPartnership(input));
    } catch {
      setState({ status: "error", message: "Slanje upita nije potvrđeno. Pokušajte ponovo ili nas pozovite." });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  if (state?.status === "ok") {
    return (
      <p role="status" className="mt-6 rounded-xl border-2 border-zinc-200 bg-white px-4 py-5 font-semibold">
        Upit je poslat. Javićemo vam se na navedeni broj telefona.
      </p>
    );
  }

  return (
    <form className="mt-6" aria-busy={pending} onSubmit={(event) => {
      event.preventDefault();
      void send(new FormData(event.currentTarget));
    }}>
      <fieldset disabled={pending} className="space-y-5">
      <div hidden aria-hidden="true">
        <label htmlFor="partnership_website">Website</label>
        <input id="partnership_website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="company" className={labelClass}>
          Naziv firme
        </label>

        <input
          id="company"
          name="company"
          type="text"
          autoComplete="organization"
          required
          maxLength={200}
          className={fieldClass}
        />
      </div>
      <div>
  <label htmlFor="phone" className={labelClass}>
    Telefon
  </label>

  <input
    id="phone"
    name="phone"
    type="tel"
    autoComplete="tel"
    required
    minLength={6}
    maxLength={40}
    className={fieldClass}
  />
</div>
<div>
  <label htmlFor="message" className={labelClass}>
    Poruka (opciono)
  </label>

  <textarea
    id="message"
    name="message"
    rows={3}
    maxLength={1000}
    placeholder="Opišite ukratko šta vam je potrebno."
    className={fieldClass}
  />
</div>
{state?.status === "error" ? (
  <p role="alert" className="rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark">
    {state.message}{" "}<a href={TEL_URL} className="underline">{DISPLAY_PHONE}</a>
  </p>
) : null}
<button type="submit" disabled={pending} className={primaryButtonClass}>
  {pending ? "Šaljem…" : "Pošalji upit"}
</button>
      </fieldset>
    </form>
  );
}
